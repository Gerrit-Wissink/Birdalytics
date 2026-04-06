import React from 'react'

import '../pages/cameras.css';
import apiClient from '../utils/apiClient';
import { useState } from 'react';


export default function AddCameraModal({ setShowModal }) {
    const [formData, setFormData] = useState({
        cameraName: '',
        location: '',
        latitude: '',
        longitude: ''
    });
    const [error, setError] = useState("");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleAddCamera = (e) => {
        e.preventDefault();
        setError("");
        try {
            if(!formData.cameraName || formData.cameraName.trim() === ""
             || !formData.location || formData.location.trim() === ""
             || !formData.latitude || formData.latitude.trim() === ""
             || !formData.longitude || formData.longitude.trim() === "") {
                setError("All fields are required");
                return;
            }
            console.log('Adding camera:', formData);
            const result = apiClient.post('/boxes', formData);

            if(result.status === 201) {
                console.log('Camera added successfully:', result.data);
                setShowModal(false);
                setFormData({
                    cameraName: '',
                    location: '',
                    latitude: '',
                    longitude: ''
                });
            } else {
                console.error('Failed to add camera:', result.status);
                setError("Failed to add camera. Please try again.");
            }
        } catch (error) {
            console.error('Error adding camera:', error);
            setError("Failed to add camera. Please try again.");
        }
    };

    const handleCancelModal = () => {
        setShowModal(false);
        setFormData({
            cameraName: '',
            location: '',
            latitude: '',
            longitude: ''
        });
    };


    return (
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
                        <label htmlFor="coordinates">Camera Coordinates</label>
                        <input 
                            type="text" 
                            id="latitude" 
                            name="latitude"
                            placeholder="Latitude"
                            value={formData.latitude}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="longitude">Camera Longitude</label>
                        <input 
                            type="text" 
                            id="longitude" 
                            name="longitude"
                            placeholder="Longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                        />
                    </div>

                    {error && <span style={{ color: 'red' }}>{error}</span>}
                    <div className="modal-buttons">
                        <button type="button" className="cancel-btn" onClick={handleCancelModal}>Cancel</button>
                        <button type="submit" className="add-btn">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
}