import React from 'react'
import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import './upload.css'

export default function Upload() {
    const [files, setFiles] = useState([]);
    const [selectedBox, setSelectedBox] = useState('Gosnell Big Woods');
    const [urlValue, setUrlValue] = useState('');
    const [notification, setNotification] = useState('');
    const [notificationType, setNotificationType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [birdboxes, setBirdboxes] = useState([]);

    useEffect(() => {
        document.title = 'Upload - Birdalytics';
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    useEffect(() => {
        try {
            const fetchBirdboxes = async () => {
                const response = await apiClient.get('/boxes');
                console.log('Fetch birdboxes response:', response);
                if (response.status === 200) {
                    const data = response.data.data;
                    console.log('Birdboxes data:', data);
                    setBirdboxes(['-- Please Select a Location', ...data.map(box => box.name)]); // Assuming the birdboxes are in the 'data' property
                } else {
                    console.error('Failed to fetch birdboxes:', response.status);
                }
            };

            fetchBirdboxes();
        } catch (error) {
            console.error('Error fetching birdboxes:', error);
        }
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleReset = (e) => {
        e.preventDefault();
        setFiles([]);
        setUrlValue('');
        document.getElementById('file-input').value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        //Validate that a box is selected
        if (selectedBox === '-- Please Select a Location') {
            setNotificationType('error');
            setNotification('Please select a location to upload to.');
            setTimeout(() => setNotification(''), 4000);
            return;
        }

        // Validate that either files are selected or URL is provided
        if (files.length === 0 && !urlValue.trim()) {
            setNotificationType('error');
            setNotification('Please select files or enter a URL to import.');
            setTimeout(() => setNotification(''), 4000);
            return;
        }

        setIsLoading(true);

        try {
            console.log('=== UPLOAD DEBUG START ===');
            console.log('Files array:', files);
            console.log('Files length:', files.length);
            console.log('Selected box:', selectedBox);
            console.log('URL value:', urlValue);
            
            const formData = new FormData();

            // Add selected files to FormData
            console.log('Adding files to FormData...');
            files.forEach((file, index) => {
                console.log(`File ${index}:`, {
                    name: file.name,
                    size: file.size,
                    type: file.type
                });
                formData.append('files', file);
            });

            // Add other form data
            formData.append('boxName', selectedBox);
            if (urlValue) {
                formData.append('imageUrl', urlValue);
            }

            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            console.log('Sending upload request...');
            const response = await apiClient.post('/images', formData);
            console.log('Response received:', response);

            if (response.status === 201) {
                const fileCount = files.length;
                setNotificationType('success');
                setNotification(`Successfully uploaded ${fileCount} file${fileCount !== 1 ? 's' : ''} to ${selectedBox}!`);

                // Reset form only on successful submission
                setFiles([]);
                setUrlValue('');
                document.getElementById('file-input').value = '';
                setTimeout(() => setNotification(''), 4000);
            } else {
                setNotificationType('error');
                setNotification('Upload failed: ' + response.status + '. Please try again.');
                setTimeout(() => setNotification(''), 4000);
            }
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error response:', error.response);
            setNotificationType('error');
            setNotification('Upload failed: ' + error.message + '. Please try again.');
            setTimeout(() => setNotification(''), 4000);
        } finally {
            console.log('=== UPLOAD DEBUG END ===');
            setIsLoading(false);
        }
    };

    return (
        <>
            {notification && (
                <div className={`notification-banner notification-${notificationType}`}>
                    <div className="notification-content">
                        <span className="notification-icon">{notificationType === 'success' ? '✓' : '✕'}</span>
                        <span className="notification-text">{notification}</span>
                    </div>
                </div>
            )}
            <section id="upload-container">
                <div id="upload-logo">
                    {/* <img src="./images/GLTLogo.jpg" alt="Genesee Land Trust Logo" /> */}
                </div>
                <div id="upload-box">
                    <div id="upload-header">
                        <h2>Birdalytics</h2>
                        <img src="./images/GLT_birding.png" alt="Bird Icon" style={{ width: "50px", height: "50px" }} />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="input-box">
                            <label htmlFor="box-name">Box Name</label>
                            <select id="box-name" value={selectedBox} onChange={(e) => setSelectedBox(e.target.value)}>
                                {birdboxes.map((box, index) => (
                                    <option key={index} value={box}>{box}</option>
                                ))}
                            </select>
                        </div>

                        <div
                            className="drag-drop-area"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="drag-drop-icon">📁</div>
                            <p>Drag & Drop or <label htmlFor="file-input" className="choose-link">Choose files</label> to upload</p>
                            <p className="file-format">JPG, JPEG</p>
                            {files.length > 0 && (
                                <div className="selected-files">
                                    <p className="file-count">{files.length} file(s) selected</p>
                                </div>
                            )}
                            <input
                                type="file"
                                id="file-input"
                                className="file-input"
                                accept=".jpg,.jpeg"
                                onChange={handleFileChange}
                                multiple
                            />
                        </div>

                        <div className="divider">OR</div>

                        <div className="url-section">
                            <label htmlFor="url-input">Import from URL</label>
                            <input
                                type="text"
                                id="url-input"
                                placeholder="Add file URL"
                                value={urlValue}
                                onChange={(e) => setUrlValue(e.target.value)}
                            />
                        </div>

                        <div className="button-group">
                            <button type="button" className="cancel-btn" onClick={handleReset} style={{ fontFamily: "Lato, sans-serif" }}>Reset</button>
                            <button type="submit" className="import-btn" style={{ fontFamily: "Lato, sans-serif" }}>Submit</button>
                        </div>
                    </form>
                </div>

            </section> 
            {/* PLACE EVERYTHING INSIDE THIS SECTION */}
       </>
    )
}