import React from 'react'

import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import CameraCard from '../components/camera-card';
import AddCameraModal from '../components/add-camera-modal';
import './cameras.css'

export default function Cameras(){
    // TODO: Replace with GET request to fetch cameras from backend
    const [showModal, setShowModal] = useState(false);
    const [boxesData, setBoxesData] = useState([]);

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
                    setBoxesData(data);
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
        if (boxesData.length === 0) return;
        
        console.log("Fetching images for birdboxes...");
        const fetchImagesForBoxes = async () => {
            try {
                const newImageMap = {};
                
                for(const box of boxesData) {
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

    const cameras = boxesData

    const handleCancelModal = () => {
        setShowModal(false);
    };

    return(
        <>
        <section id="container">
            <h1>Cameras</h1>
            <div className="cameras-grid">
                {cameras.map((camera) => (
                    <CameraCard key={camera.birdbox_id} camera={camera} image={imageMap[camera.birdbox_id] ?? null} />
                ))}
                <div 
                    className="camera-box"
                    onClick={() => setShowModal(true)} //ADD CAMERA TO DATABASE, ENTER WHATEVER INFO IN A POPUP
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
            <AddCameraModal handleCancelModal={handleCancelModal} />
        )}
        </>
    )
}