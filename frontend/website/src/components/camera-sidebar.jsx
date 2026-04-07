import React from 'react';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';import styles from '../pages/camInfo.module.css';

export default function CameraSidebar({ boxesData, selectedID, setSelectedID, setShowAddCameraModal, setSidebarOpen, sidebarOpen }) {
    return (
        <div id={styles.cameraSidebar} className={sidebarOpen ? styles.sidebarOpen : ''}>
            <div className={styles.titleSpan}>
                <h2>Cameras</h2>
                <span style={{ display: 'flex', gap: '1em', alignItems: 'center', cursor: 'pointer' }}>
                    <AddCircleOutlineRoundedIcon style={{ color: 'var(--text)', fontSize: '1.75rem', marginLeft: '0.5rem' }}
                        onClick={() => setShowAddCameraModal(true)} />
                </span>
            </div>

            {boxesData.map((camera) => (
                <div
                    className={styles.cameraItem}
                    key={camera.birdbox_id}
                    onClick={() => { setSelectedID(camera.birdbox_id); setSidebarOpen(false); }}
                    style={{
                        backgroundColor: camera.birdbox_id === selectedID ? '#B8CEEF' : undefined,
                        cursor: 'pointer'
                    }}
                >
                    <p>{camera.location}</p>
                    <h3>{camera.birdbox_name}</h3>
                </div>
            ))}
        </div>
    );
}