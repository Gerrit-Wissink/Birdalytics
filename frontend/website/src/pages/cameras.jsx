import './cameras.css'
import { useState } from 'react';
import boxData from '../fake-data/birdboxes.json'

export default function Cameras(){
    // TODO: Replace with GET request to fetch cameras from backend
    const cameras = boxData.birdboxes

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        cameraName: '',
        location: '',
        installationDate: '',
        coordinates: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddCamera = (e) => {
        e.preventDefault();
        // TODO: Send formData to backend
        console.log('Adding camera:', formData);
        setShowModal(false);
        setFormData({
            cameraName: '',
            location: '',
            installationDate: '',
            coordinates: ''
        });
    };

    const handleCancelModal = () => {
        setShowModal(false);
        setFormData({
            cameraName: '',
            location: '',
            installationDate: '',
            coordinates: ''
        });
    };

    return(
        <>
        <section id="container">
            <h1>Cameras</h1>
            <div className="cameras-grid">
                {cameras.map((camera) => (
                    <div 
                        key={camera.birdbox_id} 
                        className="camera-box"
                        onClick={camera.placeholder === 'plus' ? () => setShowModal(true) : undefined}
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
                                <img src={camera.last_captured_image.photo_url} alt={camera.birdbox_name} className="camera-image" />                           
                        </div>
                    </div>
                ))}
                <div 
                    className="camera-box"
                    onClick={null} //ADD CAMERA TO DATABASE, ENTER WHATEVER INFO IN A POPUP
                    style={null}
                    >
                        <div className="camera-header">
                            <span className="camera-name">Add Camera</span>
                                <button className="settings-btn" aria-label="Camera settings">
                                    ⚙️
                                </button>
                        </div>
                        <div className="camera-image-area">
                            <div className="placeholder-plus">+</div>
                        </div>
                    </div>
            </div>
        </section>

        {showModal && (
            <div className="modal-overlay" onClick={handleCancelModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Add Camera</h2>
                        <button className="modal-close" onClick={handleCancelModal}>✕</button>
                    </div>
                    <form onSubmit={handleAddCamera}>
                        <div className="form-group">
                            <label htmlFor="cameraName">Camera Name <span className="required">*</span></label>
                            <input 
                                type="text" 
                                id="cameraName" 
                                name="cameraName"
                                placeholder="New Camera 1..."
                                value={formData.cameraName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Camera Location <span className="required">*</span></label>
                            <input 
                                type="text" 
                                id="location" 
                                name="location"
                                placeholder="MacKay Wildlife Reserve"
                                value={formData.location}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="installationDate">Installation Date</label>
                            <input 
                                type="text" 
                                id="installationDate" 
                                name="installationDate"
                                placeholder="YYYY-MM-DD (Ex. 2025-12-31)"
                                value={formData.installationDate}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="coordinates">Camera Coordinates</label>
                            <input 
                                type="text" 
                                id="coordinates" 
                                name="coordinates"
                                placeholder="12.345,-98.765"
                                value={formData.coordinates}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="modal-buttons">
                            <button type="button" className="cancel-btn" onClick={handleCancelModal}>Cancel</button>
                            <button type="submit" className="add-btn">Add</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    )
}