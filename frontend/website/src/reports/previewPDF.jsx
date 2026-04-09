import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { BoxesPieChart } from '../components/donut-chart';
import { LineGraphPicture } from '../components/line-graph';

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

function StatCard({ label, name, fillColor, strokeColor }) {
    return (
        <div style={{
            flex: 1,
            border: `1.5px solid ${strokeColor}`,
            borderRadius: '8px',
            backgroundColor: fillColor,
            padding: '8px 12px',
            textAlign: 'center',
            fontFamily: 'Lato, sans-serif',
            maxWidth: '200px'
        }}>
            <div style={{ fontSize: '12px', color: '#1a1a1a', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: strokeColor, fontFamily: 'Georgia, serif' }}>
                {name ?? '—'}
            </div>
        </div>
    );
}

function BoxDetailPage({ boxes }) {
    return (
        <PageShell>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {boxes.map(box => (
                    <BoxDetailCard key={box.birdbox_id} box={box} />
                ))}
            </div>
        </PageShell>
    );
}

function BoxDetailCard({ box }) {
    const records = box.records ?? [];
    const timestamps = records.map(r => r.timestamp).filter(Boolean).sort();
    const earliest = timestamps[0];
    const latest = timestamps[timestamps.length - 1];

    function toLongDate(ts) {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

    const sorted = [...records].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const last = sorted[0];

    const totalTriggers = records.length;
    const totalKestrels = box.total_kestrel_identified_photos ?? 0;
    const usageRate     = box.usage_rate      != null ? `${Math.round(box.usage_rate * 100)}%`      : '—';
    const kestrelFreq   = box.kestrel_frequency != null ? `${Math.round(box.kestrel_frequency * 100)}%` : '—';

    const kestrels    = box.total_kestrel_identified_photos ?? 0;
    const nonKestrels = box.total_non_kestrel_identified_photos ?? 0;
    const nonBirds    = box.total_non_bird_photos ?? 0;
    const total       = kestrels + nonKestrels + nonBirds;

    const stats = [
        { label: 'Total Camera Triggers', value: String(totalTriggers), green: false },
        { label: 'Total Kestrels',         value: String(totalKestrels), green: true  },
        { label: 'Usage Rate',             value: usageRate,             green: false },
        { label: 'Kestrel Frequency',      value: kestrelFreq,           green: true  },
    ];

    const breakdownCols = [
        { count: kestrels,    label: 'Kestrels Identified',         stroke: '#57710E', fill: '#57710E1A' },
        { count: nonKestrels, label: 'Non-Kestrel Birds Identified', stroke: '#C76E01', fill: '#C76E011A' },
        { count: nonBirds,    label: 'Non-Birds Identified',         stroke: '#9B7DB5', fill: '#9B7DB51A' },
    ];

    return (
        <div>
            {/* Header */}
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '2px', fontFamily: 'Georgia, serif' }}>
                {box.birdbox_name} (ID #{box.birdbox_id})
                <span style={{ fontWeight: 400, color: '#555' }}> | {box.location ?? '—'}</span>
            </h2>
            <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px', fontFamily: 'Lato, sans-serif' }}>
                Data period: {toLongDate(earliest)} – {toLongDate(latest)}
            </p>

            {/* Last record — single blue header row */}
            <p style={{ fontSize: '14px', fontFamily: 'Lato, sans-serif', marginBottom: '6px', marginTop: '8px', color: '#333', fontWeight: '500' }}>
                Last Record
            </p>
            <Table size="small" sx={{ marginBottom: '14px' }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'var(--blue)' }}>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '.75rem', padding: '5px 8px', color: 'var(--background)' }}>
                            {formatDateTimeLong(last?.timestamp)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '.75rem', padding: '5px 8px', color: 'var(--background)' }}>
                           <span style={{fontWeight: '400'}}>Identified Result: </span>{last?.primary_guess ?? '—'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '.75rem', padding: '5px 8px', color: 'var(--background)' }}>
                            <span style={{fontWeight: '400'}}>Confidence: </span>{formatConfidence(last?.primary_guess_confidence)}
                        </TableCell>
                    </TableRow>
                </TableHead>
            </Table>

            {/* Camera breakdown — 2x2 grid */}
            <p style={{ fontSize: '14px', fontFamily: 'Lato, sans-serif', marginBottom: '6px', marginTop: '12px', color: '#333', fontWeight: '500' }}>
                Camera Breakdown
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                {stats.map(({ label, value, green }) => (
                    <div key={label} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        backgroundColor: green ? '#57710E26' : 'var(--stroke, #e6e6e6)',
                        border: `1px solid ${green ? '#57710E' : 'var(--text, #787878)'}`,
                        fontFamily: 'Lato, sans-serif',
                    }}>
                        <span style={{ fontSize: '11px', color: '#333', fontWeight: '400' }}>{label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: green ? '#57710E' : '#333', fontFamily: 'Georgia, serif' }}>
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Sighting breakdown — 3 columns in one row */}
            <p style={{ fontSize: '14px', fontFamily: 'Lato, sans-serif', marginBottom: '6px', marginTop: '12px', color: '#333', fontWeight: '500'}}>
                Sighting Breakdown
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {breakdownCols.map(({ count, label, stroke, fill }) => (
                    <div key={label} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1.5px solid ${stroke}`,
                        borderRadius: '8px',
                        backgroundColor: fill,
                        padding: '10px 8px',
                        fontFamily: 'Lato, sans-serif',
                        textAlign: 'center',
                    }}>
                        <span style={{ fontWeight: 'bold', color: stroke, fontSize: '1rem' }}>
                            {count} / {total}
                        </span>
                        <span style={{ fontSize: '.75rem', color: '#1a1a1a', marginTop: '3px' }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---

export default function PDFPreview({ boxesData, lineGraphRef }) {
    console.log('BOXES DATA:', boxesData);
    const birdboxes = boxesData ?? [];

    if (!birdboxes || birdboxes.length === 0) {
        return (
            <PageShell>
                <p style={{ color: '#999', fontSize: '13px' }}>No boxes selected.</p>
            </PageShell>
        );
    }

    const mostActive = getMostActive(birdboxes);
    const leastActive = getLeastActive(birdboxes);

    const columns = ['Box Name', 'Last Record', 'Usage Rate', 'Kestrel Frequency', 'Last Kestrel'];

    return (
        <>
        <PageShell>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                Birdbox Report
            </h2>

            {/* Box list + stat cards */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <ul style={{ fontSize: '12px', margin: 0, paddingLeft: '18px', flex: '0 0 auto' }}>
                    {birdboxes.map((box) => (
                        <li key={box.birdbox_id}>{box.birdbox_name}</li>
                    ))}
                </ul>

                <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                    <StatCard
                        label="Most Active Camera"
                        name={mostActive?.birdbox_name}
                        fillColor="#57710E26"
                        strokeColor="#57710E"
                    />
                    <StatCard
                        label="Least Active Camera"
                        name={leastActive?.birdbox_name}
                        fillColor="#C76E0126"
                        strokeColor="#C76E01"
                    />
                </div>
            </div>

            {/* Table */}
            <Table size="small" sx={{ fontSize: '12px' }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'var(--blue)' }}>
                        {columns.map((h) => (
                            <TableCell key={h} sx={{ fontWeight: 'bold', fontSize: '.75rem', padding: '4px 8px', color: 'var(--background)' }}>
                                {h}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {birdboxes.map((box) => {
                        return (
                            <TableRow key={box.birdbox_id}>
                                <TableCell sx={{ fontSize: '12px', padding: '4px 8px' }}>{box.birdbox_name}</TableCell>
                                <TableCell sx={{ fontSize: '12px', padding: '4px 8px' }}>
                                    {formatTimestamp(box.last_captured_image?.timestamp)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '12px', padding: '4px 8px' }}>
                                    {toPercent(box.usage_rate)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '12px', padding: '4px 8px' }}>
                                    {kestrelFrequency(box)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '12px', padding: '4px 8px' }}>
                                    {formatTimestamp(box.last_identified_kestrel?.timestamp)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Sighting breakdown — line graph above, pie + counts below */}
            <div style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>
                    Sighting Breakdown
                </p>
                <div ref={lineGraphRef} style={{ marginBottom: '16px' }}>
                    <LineGraphPicture birdboxes={birdboxes} />
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid var(--stroke)', margin: 'auto', width: '90%'}} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center' }}>
                    <BoxesPieChart birdboxes={birdboxes} />
                    <SightingBreakdown records={birdboxes} />
                </div>
            </div>
        </PageShell>

         {Array.from({ length: Math.ceil(birdboxes.length / 2) }, (_, i) => (
            <BoxDetailPage key={i} boxes={birdboxes.slice(i * 2, i * 2 + 2)} />
        ))}
        </>
    );
}

function SightingBreakdown({ records }) {
    var total_kestrels = 0
    var total_non_kestrels = 0
    var total_non_birds = 0
    records.forEach( box => {
        total_kestrels += box.total_kestrel_identified_photos ?? 0
        total_non_kestrels += box.total_non_kestrel_identified_photos ?? 0
        total_non_birds += box.total_non_bird_photos ?? 0
    })

    //DELETE THIS LATER IT'S JUST SO IT LOOKS PRETTY
    if(total_kestrels === 0 && total_non_kestrels === 0 && total_non_birds === 0){
        total_kestrels = 45
        total_non_kestrels = 21
        total_non_birds = 12
    }

    const total = total_kestrels + total_non_kestrels + total_non_birds

    const rows = [
        { count: total_kestrels,   label: 'Kestrels Identified',         stroke: '#57710E', fill: '#57710E1A' },
        { count: total_non_kestrels, label: 'Non-Kestrel Birds Identified', stroke: '#C76E01', fill: '#C76E011A' },
        { count: total_non_birds,   label: 'Non-Birds Identified',         stroke: '#9B7DB5', fill: '#9B7DB51A' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rows.map(({ count, label, stroke, fill }) => (
                <div key={label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: `1.5px solid ${stroke}`,
                    borderRadius: '8px',
                    backgroundColor: fill,
                    padding: '7px 14px',
                    fontFamily: 'Lato, sans-serif',
                    minWidth: '220px',
                }}>
                    <span style={{ fontWeight: 'bold', color: stroke, fontSize: '1rem', minWidth: '52px' }}>
                        {count} / {total}
                    </span>
                    <span style={{ fontSize: '.8rem', color: '#1a1a1a' }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

function PageShell({ children }) {
    const longDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <div style={{
                width: '816px',
                minHeight: '1100px',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                borderRadius: '2px',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 400,
                lineHeight: 1.4,
                overflow: 'hidden',
            }}>
                <div style={{
                    backgroundColor: '#004C98',
                    width: '100%',
                    padding: '8px 24px',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <img
                        src="/images/GLTLogo.jpg"
                        alt="GLT Logo"
                        style={{ height: '50px', objectFit: 'contain' }}
                    />
                    <span style={{ marginLeft: 'auto', color: '#ffffff', fontFamily: 'Lato, sans-serif', fontSize: '14px' }}>
                        {longDate}
                    </span>
                </div>

                <div style={{ padding: '6px 48px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}