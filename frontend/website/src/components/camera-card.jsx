import '../pages/cameras.css';


export default function CameraCard ({ camera, image }) {
    return (
        <div 
            key={camera.birdbox_id} 
            className="camera-box"
            onClick={() => window.location.href = `/#/camInfo?selected=${camera.birdbox_id}`}
            style={camera.placeholder === 'plus' ? { cursor: 'pointer' } : {}}
        >
            <div className="camera-header">
                <span className="camera-name">{camera.birdbox_name}</span>
                {camera.placeholder !== 'plus' && (
                    <button className="settings-btn" aria-label="Camera settings">
                        ⚙️
                    </button>
                )}
            </div>
            <div className="camera-image-area">
                {image ? (
                    <img src={image} alt={camera.birdbox_name} className="camera-image" />
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </div>
    );
}