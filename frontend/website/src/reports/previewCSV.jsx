// CSVPreview.jsx
export default function CSVPreview({ rows }) {
    const headers = ["Date - Time", "Box Name", "Species", "Confidence", "Image URL", "Modified Date"];
    
    return (
        <div style={{ 
            fontFamily: 'monospace', 
            padding: '24px', 
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
            maxHeight: '600px',
            overflow: 'auto',
            textAlign: 'left'
        }}>
            {[headers, ...rows.map(r => [r.date, r.box_name, r.species, r.confidence, r.image_url, r.modified_date])].map((line, idx) => (
                <div key={idx} style={{ padding: '4px 0', fontSize: '12px' }}>
                    {line.join(",")}
                </div>
            ))}
        </div>
    );
}