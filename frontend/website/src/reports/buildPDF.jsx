import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import "../fonts/Lato-Regular-normal.js";
import "../fonts/NotoSerif-Bold-normal.js";
import "../fonts/NotoSerif-Regular-normal.js";

// HELPERS

function formatTimestamp(timestamp) {
    if (!timestamp) return "—";
    const [datePart, timePart] = timestamp.split("T");
    const [y, m, d] = datePart.split("-");
    const shortYear = y.slice(2);
    const [hh, mm] = timePart.split(":");
    return `${m}/${d}/${shortYear} - ${hh}:${mm}`;
}

function toPercent(value) {
    return `${Math.round(value * 100)}%`;
}

function kestrelFrequency(record) {
    if (!record || !record.total_photos_with_creatures) return "—";
    return toPercent(record.kestrel_frequency ?? record.total_kestrel_identified_photos / (record.total_photos_with_creatures ?? 1));
}

function getMostActive(birdboxes) {
    return birdboxes.reduce((best, box) => {
        return (box.usage_rate ?? -Infinity) > (best?.usage_rate ?? -Infinity) ? box : best;
    }, null);
}

function getLeastActive(birdboxes) {
    return birdboxes.reduce((least, box) => {
        return (box.usage_rate ?? Infinity) < (least?.usage_rate ?? Infinity) ? box : least;
    }, null);
}

function wrapName(name, maxLen = 20) {
    if (!name || name.length <= maxLen) return [name ?? '—'];
    const breakAt = name.lastIndexOf(' ', maxLen);
    if (breakAt === -1) return [name];
    return [name.slice(0, breakAt), name.slice(breakAt + 1)];
}

function drawStatCard(doc, x, y, w, h, label, nameLines, color) {
    doc.setFillColor(...color);
    doc.setGState(doc.GState({ opacity: .15 }));
    doc.roundedRect(x, y, w, h, 4, 4, 'F');

    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setDrawColor(...color);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, y, w, h, 4, 4, 'S');

    doc.setFontSize(10);
    doc.setFont('Lato-Regular', 'normal');
    doc.setTextColor(20, 20, 20);

    if (nameLines.length > 1) {
        doc.text(label, x + w / 2, y + h / 2 - 7, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('NotoSerif-Bold', 'normal');
        doc.setTextColor(...color);
        doc.text(nameLines[0], x + w / 2, y + h / 2 + 1, { align: 'center' });
        doc.text(nameLines[1], x + w / 2, y + h / 2 + 8, { align: 'center' });
    } else {
        doc.text(label, x + w / 2, y + h / 2 - 2, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('NotoSerif-Bold', 'normal');
        doc.setTextColor(...color);
        doc.text(nameLines[0], x + w / 2, y + h / 2 + 5, { align: 'center' });
    }

    doc.setTextColor(0, 0, 0);
}

function drawSightingBreakdown(doc, birdboxes, x, y, w) {
    var total_kestrels = 0;
    var total_non_kestrels = 0;
    var total_non_birds = 0;
    birdboxes.forEach(box => {
        total_kestrels += box.total_kestrel_identified_photos ?? 0;
        total_non_kestrels += box.total_non_kestrel_identified_photos ?? 0;
        total_non_birds += box.total_non_bird_photos ?? 0;
    });

    const total = total_kestrels + total_non_kestrels + total_non_birds;

    const rows = [
        { count: total_kestrels,     label: 'Kestrels Identified',         color: [87, 113, 14] },
        { count: total_non_kestrels, label: 'Non-Kestrel Birds Identified', color: [199, 110, 1] },
        { count: total_non_birds,    label: 'Non-Birds Identified',         color: [155, 125, 181] },
    ];

    const rowH = 16;
    const rowGap = 4;

    rows.forEach(({ count, label, color }, i) => {
        const ry = y + i * (rowH + rowGap);

        doc.setFillColor(...color);
        doc.setGState(doc.GState({ opacity: 0.1 }));
        doc.roundedRect(x, ry, w, rowH, 2, 2, 'F');

        doc.setGState(doc.GState({ opacity: 1 }));
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, ry, w, rowH, 2, 2, 'S');

        doc.setFontSize(14);
        doc.setFont('NotoSerif-Bold', 'normal');
        doc.setTextColor(...color);
        const countStr = `${count} / ${total}`;
        doc.text(countStr, x + 4, ry + rowH / 2 + 2);

        const countWidth = doc.getTextWidth(countStr);
        doc.setFont('Lato-Regular', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        doc.text(label, x + 4 + countWidth + 3, ry + rowH / 2 + 2);

        doc.setTextColor(0, 0, 0);
    });
}

function drawBoxCard(doc, box, startY) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = startY;

    // Helpers
    function toLongDate(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    function formatDateTimeLong(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `${date} – ${time}`;
    }
    function formatConfidence(val) {
        if (val == null) return '—';
        const num = parseFloat(val);
        return isNaN(num) ? val : `${Math.round(num * 100)}%`;
    }

    const records = box.records ?? [];
    const timestamps = records.map(r => r.timestamp).filter(Boolean).sort();
    const earliest = timestamps[0];
    const latest = timestamps[timestamps.length - 1];
    const sorted = [...records].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const last = sorted[0];

    // ── Name / ID / Location ─────────────────────────────────────────────────
    doc.setFontSize(13);
    doc.setFont('NotoSerif-Bold', 'normal');
    doc.setTextColor(20, 20, 20);
    const boldPart = `${box.birdbox_name} (ID #${box.birdbox_id})  |  `;
    doc.text(boldPart, margin, y);
    const boldPartWidth = doc.getTextWidth(boldPart);
    doc.setFont('NotoSerif-Regular', 'normal');
    doc.text(box.location ?? '—', margin + boldPartWidth, y);
    y += 6;

    // ── Data period ──────────────────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont('Lato-Regular', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Data period: ${toLongDate(earliest)} – ${toLongDate(latest)}`, margin, y);
    y += 7;

    // ── Last Record label ────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('Lato-Regular', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text('Last Record', margin, y);
    y += 3;

    // ── Last record — single blue header row ─────────────────────────────────
    autoTable(doc, {
        startY: y,
        head: [[
            formatDateTimeLong(last?.timestamp),
            last?.primary_guess ?? '—',
            formatConfidence(last?.primary_guess_confidence),
        ]],
        headStyles: { fillColor: [0, 76, 152], fontSize: 9 },
        body: [],
        margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── Camera Breakdown label ───────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('Lato-Regular', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text('Camera Breakdown', margin, y);
    y += 4;

    // ── 2x2 stat grid ────────────────────────────────────────────────────────
    const totalTriggers = records.length;
    const totalKestrels = box.total_kestrel_identified_photos ?? 0;
    const usageRate     = box.usage_rate        != null ? `${Math.round(box.usage_rate * 100)}%`        : '—';
    const kestrelFreq   = box.kestrel_frequency != null ? `${Math.round(box.kestrel_frequency * 100)}%` : '—';

    const stats = [
        { label: 'Total Camera Triggers', value: String(totalTriggers), green: false },
        { label: 'Total Kestrels',         value: String(totalKestrels), green: true  },
        { label: 'Usage Rate',             value: usageRate,             green: false },
        { label: 'Kestrel Frequency',      value: kestrelFreq,           green: true  },
    ];

    const gridW = (pageWidth - margin * 2 - 4) / 2;
    const gridH = 12;
    const gridGapX = 4;
    const gridGapY = 4;
    const greenColor  = [87, 113, 14];
    const grayFill    = [230, 230, 230];
    const grayStroke  = [120, 120, 120];

    stats.forEach(({ label, value, green }, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = margin + col * (gridW + gridGapX);
        const cy = y + row * (gridH + gridGapY);

        if (green) {
            doc.setFillColor(...greenColor);
            doc.setGState(doc.GState({ opacity: 0.15 }));
            doc.roundedRect(cx, cy, gridW, gridH, 2, 2, 'F');
            doc.setGState(doc.GState({ opacity: 1 }));
            doc.setDrawColor(...greenColor);
        } else {
            doc.setFillColor(...grayFill);
            doc.setGState(doc.GState({ opacity: 1 }));
            doc.roundedRect(cx, cy, gridW, gridH, 2, 2, 'F');
            doc.setDrawColor(...grayStroke);
        }
        doc.setLineWidth(0.4);
        doc.roundedRect(cx, cy, gridW, gridH, 2, 2, 'S');

        doc.setFontSize(9);
        doc.setFont('Lato-Regular', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(label, cx + 4, cy + gridH / 2 + 1.5);

        doc.setFont('NotoSerif-Bold', 'normal');
        doc.setTextColor(...(green ? greenColor : [40, 40, 40]));
        doc.text(value, cx + gridW - 4, cy + gridH / 2 + 1.5, { align: 'right' });

        doc.setTextColor(0, 0, 0);
    });

    y += 2 * (gridH + gridGapY) + 4;

    // ── Sighting Breakdown label ─────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('Lato-Regular', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text('Sighting Breakdown', margin, y);
    y += 4;

    // ── 3-column breakdown row ───────────────────────────────────────────────
    const kestrels    = box.total_kestrel_identified_photos ?? 0;
    const nonKestrels = box.total_non_kestrel_identified_photos ?? 0;
    const nonBirds    = box.total_non_bird_photos ?? 0;
    const bdTotal     = kestrels + nonKestrels + nonBirds;

    const bdCols = [
        { count: kestrels,    label: 'Kestrels Identified',          color: [87, 113, 14]   },
        { count: nonKestrels, label: 'Non-Kestrel Birds Identified',  color: [199, 110, 1]   },
        { count: nonBirds,    label: 'Non-Birds Identified',          color: [155, 125, 181] },
    ];

    const colW = (pageWidth - margin * 2 - 8) / 3;
    const colH = 20;
    const colGap = 4;

    bdCols.forEach(({ count, label, color }, i) => {
        const cx = margin + i * (colW + colGap);

        doc.setFillColor(...color);
        doc.setGState(doc.GState({ opacity: 0.1 }));
        doc.roundedRect(cx, y, colW, colH, 2, 2, 'F');

        doc.setGState(doc.GState({ opacity: 1 }));
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.roundedRect(cx, y, colW, colH, 2, 2, 'S');

        doc.setFontSize(14);
        doc.setFont('NotoSerif-Bold', 'normal');
        doc.setTextColor(...color);
        doc.text(`${count} / ${bdTotal}`, cx + colW / 2, y + colH / 2 - 1, { align: 'center' });

        doc.setFont('Lato-Regular', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        doc.text(label, cx + colW / 2, y + colH / 2 + 6, { align: 'center' });

        doc.setTextColor(0, 0, 0);
    });

    return y + colH; // return bottom edge for spacing
}

function drawBoxPages(doc, birdboxes) {
    for (let i = 0; i < birdboxes.length; i += 2) {
        doc.addPage();
        const pageHeight = doc.internal.pageSize.getHeight();
        const slotH = (pageHeight - 28) / 2; // two equal slots, 14px top + 14px mid padding

        drawBoxCard(doc, birdboxes[i], 16);

        if (birdboxes[i + 1]) {
            // Divider line
            const divY = slotH;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(14, divY, doc.internal.pageSize.getWidth() - 14, divY );

            drawBoxCard(doc, birdboxes[i + 1], divY + 16);
        }
    }
}

//BUILD PDF

export default async function BuildPDF(birdboxes, chartImage, lineGraphImage, includeOverview = true) {

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const now = new Date();
    const fileName = `Birdalytics_Report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const longDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (includeOverview) {
    // Rectangle header
    doc.setFillColor(0, 76, 152);
    doc.rect(0, 0, pageWidth, 20, 'F');

    // Header logo
    const logo = await loadImageAsBase64('/images/GLTLogo.jpg');
    if (logo) {
        doc.addImage(logo, 'PNG', 4, 3, 0, 14);
    }

    // Header date
    doc.setFontSize(10);
    doc.setFont('Lato-Regular', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(longDate, pageWidth - margin, 12, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    let y = 30;

    // Title
    doc.setFontSize(16);
    doc.setFont('NotoSerif-Bold', 'normal');
    doc.text("Birdbox Report", margin, y);
    y += 8;

    // Box list
    const listStartY = y;
    const lineHeight = 6;

    doc.setFontSize(11);
    doc.setFont('Lato-Regular', 'normal');
    birdboxes.forEach((box) => {
        doc.text(`• ${box.birdbox_name}`, 18, y);
        y += lineHeight;
    });

    const listEndY = y;
    const listHeight = listEndY - listStartY;

    // Stat cards
    const mostActive = getMostActive(birdboxes);
    const leastActive = getLeastActive(birdboxes);

    const mostActiveLines = wrapName(mostActive?.birdbox_name);
    const leastActiveLines = wrapName(leastActive?.birdbox_name);

    const cardW = 50;
    const cardH = (mostActiveLines.length > 1 || leastActiveLines.length > 1) ? 28 : 20;
    const cardGap = 5;
    const cardsX = pageWidth - margin - cardW * 2 - cardGap;
    const cardsY = listStartY + (listHeight - cardH) / 2 - 3;

    drawStatCard(doc, cardsX, cardsY, cardW, cardH, 'Most Active Camera', mostActiveLines, [87, 113, 14]);
    drawStatCard(doc, cardsX + cardW + cardGap, cardsY, cardW, cardH, 'Least Active Camera', leastActiveLines, [199, 110, 1]);

    y = Math.max(listEndY, cardsY + cardH) + 4;

    // Table
    autoTable(doc, {
        startY: y,
        head: [['Box Name', 'Last Record', 'Usage Rate', 'Kestrel Frequency', 'Last Kestrel']],
        headStyles: {
            fillColor: [0, 76, 152],
        },
        body: birdboxes.map((box) => {
            return [
                box.birdbox_name,
                formatTimestamp(box.last_captured_image?.timestamp),
                toPercent(box.usage_rate),
                kestrelFrequency(box),
                formatTimestamp(box.last_identified_kestrel?.timestamp),
            ];
        }),
    });

    // Sighting breakdown section — placed below the table
    {
        const afterTable = doc.lastAutoTable.finalY + 10;
        const lineGraphW = pageWidth - margin * 2;
        const lineGraphH = lineGraphW * (300 / 900);
        const chartSize = 70;
        const sectionH = (lineGraphImage ? lineGraphH + 8 : 0) + chartSize;

        let sectionY;
        if (afterTable + sectionH > pageHeight - margin) {
            doc.addPage();
            sectionY = 20;
        } else {
            sectionY = afterTable;
        }

        // Section title
        doc.setFontSize(14);
        doc.setFont('NotoSerif-Bold', 'normal');
        doc.text("Sighting Breakdown", margin, sectionY);
        sectionY += 6;

        // Line graph — full width, above the pie chart
        if (lineGraphImage) {
            doc.addImage(lineGraphImage, 'PNG', margin, sectionY, lineGraphW, lineGraphH);
            sectionY += lineGraphH + 8;
        }

        // Pie chart + breakdown boxes side by side
        if (chartImage) {
            doc.addImage(chartImage, 'PNG', margin, sectionY, chartSize, chartSize);

            const boxX = margin + chartSize + 10;
            const boxW = pageWidth - boxX - margin;
            const rowH = 16;
            const rowGap = 6;
            const rowCount = 3;
            const blockH = rowCount * rowH + (rowCount - 1) * rowGap;
            const breakdownY = sectionY + (chartSize - blockH) / 2;
            drawSightingBreakdown(doc, birdboxes, boxX, breakdownY, boxW);
        }
    }
    } // end includeOverview

    // Individual box pages — 2 per page
    drawBoxPages(doc, birdboxes);

    doc.save(`${fileName}.pdf`);
}

async function loadImageAsBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error('Failed to load:', err);
        return null;
    }
}