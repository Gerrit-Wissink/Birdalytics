import React from 'react';
import '../pages/cameras.css';

export default function CameraCard({ camera, image }) {
    const hasRecords = (camera.records ?? []).length > 0;
    const hasCapturedImage = !!camera.last_captured_image;
    const hasAnyActivity = hasRecords || hasCapturedImage;

    return (
        <div
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
                ) : hasAnyActivity ? (
                    <div className="camera-loading-state">Loading image...</div>
                ) : (
                    <div className="camera-empty-state">
                        <p>No images yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
