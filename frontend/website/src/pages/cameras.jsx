import './cameras.css'
import { useState, useEffect } from 'react';
import boxData from '../fake-data/birdboxes.json'
import apiClient from '../utils/apiClient';

export default function Cameras(){
    // TODO: Replace with GET request to fetch cameras from backend
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        cameraName: '',
        location: '',
        installationDate: '',
        coordinates: ''
    });
    const [boxesData, setBoxesData] = useState({
        birdboxes: [],
        birdbox_records: []
    });
    const [imageMap, setImageMap] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    useEffect(() => {
        const fetchBoxesData = async () => {
            try {
                const response = await apiClient.get('/boxes/record');
                console.log('Fetch boxes data response:', response);
                if (response.status === 200) {
                    const data = response.data.data;
                    console.log('Boxes data:', data);
                    setBoxesData(data); // Assuming the boxes data is in the 'data' property
                } else {
                    console.error('Failed to fetch boxes data:', response.status);
                }
            } catch (error) {
                console.error('Error fetching boxes data:', error);
            }
        }

        fetchBoxesData();
    }, []);

    useEffect(() => {
        if (boxesData.birdboxes.length === 0) return;
        
        console.log("Fetching images for birdboxes...");
        const fetchImagesForBoxes = async () => {
            try {
                const newImageMap = {};
                
                for(const box of boxesData.birdboxes) {
                    if(!box.last_captured_image) {
                        console.log("No image to fetch for box:", box.birdbox_name);
                        continue;
                    }
                    
                    const url = box.last_captured_image.photo_url;
                    const response = await apiClient.get(url, {
                        responseType: 'blob' // Important: get binary data as blob
                    });
                    
                    // Create object URL from blob
                    const imageUrl = URL.createObjectURL(response.data);
                    newImageMap[box.birdbox_id] = imageUrl;
                    
                    console.log(`Fetched image for box ${box.birdbox_name}`);
                }
                
                setImageMap(newImageMap);
            } catch (error) {
                console.error('Error fetching images for boxes:', error);
            }
        };
        
        fetchImagesForBoxes();
        
        // Cleanup: revoke object URLs when component unmounts
        return () => {
            Object.values(imageMap).forEach(url => URL.revokeObjectURL(url));
        };
    }, [boxesData]);

    const cameras = boxesData.birdboxes

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
                            {imageMap[camera.birdbox_id] ? (
                                <img src={imageMap[camera.birdbox_id]} alt={camera.birdbox_name} className="camera-image" />
                            ) : (
                                <div>Loading...</div>
                            )}
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