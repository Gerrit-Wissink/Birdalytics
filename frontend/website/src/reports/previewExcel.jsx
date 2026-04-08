// ExcelPreview.jsx
export default function ExcelPreview({ rows }) {
    const headers = ["Date - Time", "Box Name", "Species", "Confidence", "Image URL", "Modified Date"];
    
    return (
        <div style={{ padding: '24px' }}>
            <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                backgroundColor: '#fff',
                borderRadius: '4px'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#004C98' }}>
                        {headers.map(h => (
                            <th key={h} style={{ 
                                color: 'white', 
                                padding: '8px',
                                textAlign: 'left',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{row.date}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{row.box_name}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{row.species}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{row.confidence}</td>
                            <td style={{ padding: '8px', fontSize: '12px', wordBreak: 'break-all' }}>{row.image_url}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{row.modified_date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}