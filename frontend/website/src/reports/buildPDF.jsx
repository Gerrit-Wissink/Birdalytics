import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    return toPercent(record.total_kestrel_identified_photos / record.total_photos_with_creatures);
}

function getMostActive(birdboxes, recordsMap) {
    return birdboxes.reduce((best, box) => {
        const rate = recordsMap[box.birdbox_id]?.usage_rate ?? -Infinity;
        const bestRate = recordsMap[best?.birdbox_id]?.usage_rate ?? -Infinity;
        return rate > bestRate ? box : best;
    }, null);
}

function getLeastActive(birdboxes, recordsMap) {
    //DELETE THIS LATER - override to test with 3rd box
    const override = birdboxes[2] ?? null;
    if (override) return override;

    return birdboxes.reduce((least, box) => {
        const rate = recordsMap[box.birdbox_id]?.usage_rate ?? Infinity;
        const leastRate = recordsMap[least?.birdbox_id]?.usage_rate ?? Infinity;
        return rate < leastRate ? box : least;
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

function drawSightingBreakdown(doc, birdbox_records, x, y, w) {
    var total_kestrels = 0;
    var total_non_kestrels = 0;
    var total_non_birds = 0;
    birdbox_records.forEach(box => {
        total_kestrels += box.total_kestrel_identified_photos;
        total_non_kestrels += box.total_non_kestrel_identified_photos;
        total_non_birds += (box.total_photos_with_creatures - (box.total_kestrel_identified_photos + box.total_non_kestrel_identified_photos));
    });

    //DELETE THIS LATER IT'S JUST SO IT LOOKS PRETTY
    if (total_kestrels || total_non_kestrels || total_non_birds == 0) {
        total_kestrels = 45;
        total_non_kestrels = 21;
        total_non_birds = 12;
    }

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

//BUILD PDF

export default async function BuildPDF(boxesData, chartImage, lineGraphImage) {
    const { birdboxes, birdbox_records } = boxesData;
    const recordsMap = Object.fromEntries(birdbox_records.map((r) => [r.birdbox_id, r]));

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    //Rectangle header
    doc.setFillColor(0, 76, 152);
    doc.rect(0, 0, pageWidth, 20, 'F');
    //header logo
    const logo = await loadImageAsBase64('/images/GLTLogo.jpg');
    if (logo) {
        doc.addImage(logo, 'PNG', 4, 3, 0, 14); // x, y, width (0 = auto), height
    }

    let y = 30;

    //Title
    doc.setFontSize(16);
    doc.setFont('NotoSerif-Bold', 'normal');
    doc.text("Birdbox Report", 14, y);
    y += 8;

    //Box list
    doc.setFontSize(11);
    doc.setFont('Lato-Regular', 'normal');
    birdboxes.forEach((box) => {
        doc.text(`• ${box.birdbox_name}`, 18, y);
        y += 6;
    });

    autoTable(doc, {
        startY: y + 4,
        head: [['Box Name', 'Location', 'Last Captured', 'Last Kestrel']],
        headStyles:{
            fillColor: [0, 76, 152]
        },
        body: birdboxes.map((box) => [
            box.birdbox_name,
            box.location,
            box.last_captured_image?.timestamp
                ? new Date(box.last_captured_image.timestamp).toLocaleString().replace(', ', '\n')
                : 'N/A',
            box.last_identified_kestrel?.timestamp
                ? new Date(box.last_identified_kestrel.timestamp).toLocaleString().replace(', ', '\n')
                : 'N/A',
        ]),
    });

    doc.save('report.pdf');
}

//helper func to convert the image to base64 for embedding in PDF
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
        console.error('Failed to load logo:', err);
        return null;
    }
}
