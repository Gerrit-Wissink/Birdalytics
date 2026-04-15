import React from 'react'

import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import CameraCard from '../components/camera-card';
import AddCameraModal from '../components/add-camera-modal';
import EmptyState from '../components/emptyState';
import './cameras.css'

export default function Cameras() {
    // TODO: Replace with GET request to fetch cameras from backend
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [boxesData, setBoxesData] = useState([]);

    const [imageMap, setImageMap] = useState({});

    /* commenting out
    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);
    */

    useEffect(() => {
        const fetchBoxesData = async () => {
            try {
                const response = await apiClient.get('/boxes/record');
                if (response.status === 200) {
                    const data = response.data.data;
                    setBoxesData(data);
                } else {
                    console.error('Failed to fetch boxes data:', response.status);
                }
            } catch (error) {
                console.error('Error fetching boxes data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchBoxesData();
    }, []);

    useEffect(() => {
        if (boxesData.length === 0) return;

        const newImageMap = {};
        const fetchImagesForBoxes = async () => {
            try {

                for (const box of boxesData) {
                    if (!box.last_captured_image) {
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
                }

                setImageMap(newImageMap);
            } catch (error) {
                console.error('Error fetching images for boxes:', error);
            }
        };

        fetchImagesForBoxes();

        // Cleanup: revoke object URLs when component unmounts
        return () => {
            Object.values(newImageMap).forEach(url => URL.revokeObjectURL(url));
        };
    }, [boxesData]);

    const cameras = boxesData;
    const hasCameras = cameras.length > 0;

    const handleCancelModal = () => {
        setShowModal(false);
    };

    if (isLoading) {
        return (
            <section id="container">
                <h1>Cameras</h1>
                <div className="empty-state">
                    <p>Loading cameras...</p>
                </div>
            </section>
        );
    }

    if (!hasCameras) {
        return (
            <section id="container">
                <h1>Cameras</h1>
                <EmptyState
                    title="No cameras yet"
                    description="Add your first birdbox to start tracking activity."
                    actionText="Add Camera"
                    onAction={() => setShowModal(true)}
                />
            </section>
        );
    }

    return (
        <>
            <section id="container">
                <h1>Cameras</h1>
                <div className="cameras-grid">
                    {cameras.map((camera) => (
                        <CameraCard
                            key={camera.birdbox_id}
                            camera={camera}
                            image={imageMap[camera.birdbox_id] ?? null}
                        />
                    ))}

                    <div
                        className="camera-box"
                        onClick={() => setShowModal(true)}
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
    );
}
