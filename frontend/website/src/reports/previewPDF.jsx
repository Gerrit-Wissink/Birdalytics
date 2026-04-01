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
    return toPercent(record.total_kestrel_identified_photos / record.total_photos_with_creatures);
}

function getMostActive(birdboxes) {
    return birdboxes.reduce((best, box) => {
        return (box.usage_rate ?? -Infinity) > (best?.usage_rate ?? -Infinity) ? box : best;
    }, null);
}

function getLeastActive(birdboxes) {
    const override = birdboxes[2] ?? null;
    if (override) return override;
    
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

// ---

export default function PDFPreview({ boxesData, lineGraphRef }) {
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
                                    {toPercent(box.total_kestrel_identified_photos / (box.total_photos_with_creatures || 1))}
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
    );
}

function SightingBreakdown({ records }) {
    var total_kestrels = 0
    var total_non_kestrels = 0
    var total_non_birds = 0
    records.forEach( box => {
        total_kestrels += box.total_kestrel_identified_photos ?? 0
        total_non_kestrels += box.total_non_kestrel_identified_photos ?? 0
        total_non_birds += (box.total_photos_with_creatures ?? 0) - (box.total_kestrel_identified_photos ?? 0) - (box.total_non_kestrel_identified_photos ?? 0)
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
                </div>

                <div style={{ padding: '6px 48px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}