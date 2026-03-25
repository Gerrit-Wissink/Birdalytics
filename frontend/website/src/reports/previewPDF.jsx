import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export default function PDFPreview({ birdboxes }) {
    if (!birdboxes || birdboxes.length === 0) {
        return (
            <PageShell>
                <p style={{ color: '#999', fontSize: '13px' }}>No boxes selected.</p>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                Birdbox Report
            </h2>

            <ul style={{ fontSize: '11px', marginBottom: '16px', paddingLeft: '18px' }}>
                {birdboxes.map((box) => (
                    <li key={box.birdbox_id}>{box.birdbox_name}</li>
                ))}
            </ul>

            <Table size="small" sx={{ fontSize: '10px' }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                        {['Box Name', 'Location', 'Last Captured', 'Last Kestrel'].map((h) => (
                            <TableCell key={h} sx={{ fontWeight: 'bold', fontSize: '10px', padding: '4px 8px' }}>
                                {h}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {birdboxes.map((box) => (
                        <TableRow key={box.birdbox_id}>
                            <TableCell sx={{ fontSize: '10px', padding: '4px 8px' }}>{box.birdbox_name}</TableCell>
                            <TableCell sx={{ fontSize: '10px', padding: '4px 8px' }}>{box.location}</TableCell>
                            <TableCell sx={{ fontSize: '10px', padding: '4px 8px' }}>
                                {box.last_captured_image?.timestamp
                                    ? new Date(box.last_captured_image.timestamp).toLocaleString()
                                    : 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '10px', padding: '4px 8px' }}>
                                {box.last_identified_kestrel?.timestamp
                                    ? new Date(box.last_identified_kestrel.timestamp).toLocaleString()
                                    : 'N/A'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </PageShell>
    );
}

// The white "page" shell with shadow — reusable as you add more sections
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