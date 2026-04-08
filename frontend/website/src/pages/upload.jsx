import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import UploadModal from '../components/upload-modal';
import './upload.css'

const DEFAULT_BOX_OPTION = '-- Please Select a Location';

export default function Upload() {
    const [files, setFiles] = useState([]);
    const [selectedBox, setSelectedBox] = useState(DEFAULT_BOX_OPTION);
    const [urlValue, setUrlValue] = useState('');
    const [notification, setNotification] = useState('');
    const [notificationType, setNotificationType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [birdboxes, setBirdboxes] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        document.title = 'Upload - Birdalytics';
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    useEffect(() => {
        const fetchBirdboxes = async () => {
            try {
                const response = await apiClient.get('/boxes');
                console.log('Fetch birdboxes response:', response);
                if (response.status === 200) {
                    const data = response.data.data;
                    console.log('Birdboxes data:', data);
                    setBirdboxes([DEFAULT_BOX_OPTION, ...data.map(box => box.name)]); // Assuming the birdboxes are in the 'data' property
                } else {
                    console.error('Failed to fetch birdboxes:', response.status);
                }
            } catch (error) {
                console.error('Error fetching birdboxes:', error);
                setNotificationType('error');
                setNotification('Failed to load locations.');
            }
        };

        fetchBirdboxes();
    }, []);

    const clearNotificationLater = () => {
        setTimeout(() => setNotification(''), 4000);
    };

    const isBoxValid = selectedBox !== DEFAULT_BOX_OPTION;
    const hasUploadSource = files.length > 0 || !!urlValue.trim();

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
        setSelectedBox(DEFAULT_BOX_OPTION);
        setUrlValue('');
        setShowConfirmModal(false);
        const input = document.getElementById('file-input');
        if (input) input.value = '';
    };

    const validateBeforeUpload = () => {
        if (!isBoxValid) {
            setNotificationType('error');
            setNotification('Please select a location to upload to.');
            clearNotificationLater();
            return false;
        }

        if (!hasUploadSource) {
            setNotificationType('error');
            setNotification('Please select files or enter a URL to import.');
            clearNotificationLater();
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateBeforeUpload()) return;

        setShowConfirmModal(true);
    };

    const handleConfirmUpload = async () => {
        setIsLoading(true);

        try {
            const formData = new FormData();

            files.forEach((file) => {
                formData.append('files', file);
            });

            formData.append('boxName', selectedBox);

            if (urlValue.trim()) {
                formData.append('imageUrl', urlValue.trim());
            }

            const response = await apiClient.post('/images', formData);

            if (response.status === 201) {
                const fileCount = files.length;
                const sourceText =
                    fileCount > 0
                        ? `${fileCount} file${fileCount !== 1 ? 's' : ''}`
                        : 'URL image';

                setNotificationType('success');
                setNotification(`Successfully uploaded ${sourceText} to ${selectedBox}!`);

                setFiles([]);
                setSelectedBox(DEFAULT_BOX_OPTION);
                setUrlValue('');
                setShowConfirmModal(false);

                const input = document.getElementById('file-input');
                if (input) input.value = '';

                clearNotificationLater();
            } else {
                setNotificationType('error');
                setNotification(`Upload failed: ${response.status}. Please try again.`);
                clearNotificationLater();
            }
        } catch (error) {
            console.error('Upload error:', error);
            setNotificationType('error');
            setNotification(`Upload failed: ${error.message}. Please try again.`);
            clearNotificationLater();
        } finally {
            setIsLoading(false);
        }
    };

    const fileCount = files.length;
    const fileText = `${fileCount} file${fileCount !== 1 ? 's' : ''} selected`;

    return (
        <>
            {notification && (
                <div className={`notification-banner notification-${notificationType}`}>
                    <div className="notification-content">
                        <span className="notification-icon">
                            {notificationType === 'success' ? '✓' : '✕'}
                        </span>
                        <span className="notification-text">{notification}</span>
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <UploadModal
                    isLoading={isLoading}
                    selectedBox={selectedBox}
                    fileText={fileText}
                    urlValue={urlValue}
                    setShowConfirmModal={setShowConfirmModal}
                    handleConfirmUpload={handleConfirmUpload}
                />
            )}

            <section id="upload-container">
                <div id="upload-logo"></div>

                <div id="upload-box">
                    <div id="upload-header">
                        <h2>Birdalytics</h2>
                        <img
                            src="./images/GLT_birding.png"
                            alt="Bird Icon"
                            style={{ width: '50px', height: '50px' }}
                        />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-box">
                            <label htmlFor="box-name">Box Name</label>
                            <select
                                id="box-name"
                                value={selectedBox}
                                onChange={(e) => setSelectedBox(e.target.value)}
                            >
                                {birdboxes.map((box, index) => (
                                    <option
                                        key={index}
                                        value={box}
                                        disabled={box === DEFAULT_BOX_OPTION}
                                    >
                                        {box}
                                    </option>
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
                            <p>
                                Drag & Drop or{' '}
                                <label htmlFor="file-input" className="choose-link">
                                    Choose files
                                </label>{' '}
                                to upload
                            </p>
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

                        <div className="button-group">
                            <button type="button" className="cancel-btn" onClick={handleReset}>
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="import-btn"
                                disabled={isLoading}
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
                <div id="space-to-scroll"></div>
            </section>
        </>
    );
}
