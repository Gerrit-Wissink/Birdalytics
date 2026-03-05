import styles from './camInfo.module.css'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { FiEdit } from "react-icons/fi";
import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';


export default function CamInfo(){

    const [boxesData, setBoxesData] = useState({
        birdboxes: [],
        birdbox_records: []
    });
    
    const [imageMap, setImageMap] = useState({});
    const [selectedBox, setSelectedBox] = useState(null);

    useEffect(() => {
        document.title = "Camera Info - Birdalytics";
    }, []);

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
            Object.values(newImageMap).forEach(url => URL.revokeObjectURL(url));
        };
    }, [boxesData]);

    useEffect(() => {
        if (boxesData.birdboxes.length === 0) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const selectedID = parseInt(urlParams.get('selected'));
        
        if (selectedID) {
            const selected_box = boxesData.birdboxes.find(box => box.birdbox_id === selectedID);
            const selected_record = boxesData.birdbox_records.find(record => record.birdbox_id === selectedID);
            const selected_combined = {
                ...selected_box,
                ...selected_record
            };
            setSelectedBox(selected_combined);
            
            console.log("Selected box:", selected_combined);
        }
    }, [boxesData]);

    function changeSelectedBox(box_id) {
        const selected_box = boxesData.birdboxes.find(box => box.birdbox_id === box_id);
        const selected_record = boxesData.birdbox_records.find(record => record.birdbox_id === box_id);
        const selected_combined = {
            ...selected_box,
            ...selected_record
        };
        setSelectedBox(selected_combined);
        
        console.log("Selected box:", selected_combined);
    }

    const cameras = boxesData.birdboxes;

    return(
    <>
    <section id={styles.camInfoContainer}>
            <div id={styles.cameraSidebar}>
                <div className={styles.titleSpan}>
                    <h2>Cameras</h2>
                    <span>
                        <SearchRoundedIcon style={{fontSize: '1.5rem', color:'var(--text)' }} />
                        <FiEdit style={{color: 'var(--text)', fontSize: '1.5rem', marginLeft: '0.5rem' }} />
                    </span>
                </div>
                {cameras.map((camera) => (
                    <div className={styles.cameraItem} key={camera.birdbox_id} onClick={() => changeSelectedBox(camera.birdbox_id)}>
                        <p>{camera.birdbox_location}</p>
                        <h3>{camera.birdbox_name}</h3>
                    </div>
                ))}
            </div>
            <div id={styles.cameraContent}>
                <h1>{selectedBox?.birdbox_name || "Select a Camera"}</h1>
                <div className = {styles.sideBySide}>
                    <div id={styles.cameraSummary}>
                        <h3>Camera Summary</h3>
                        <p>Usage Rate: {selectedBox?.usage_rate || "N/A"}</p>
                    </div>
                    <div id={styles.identifyBox}>
                        <h3>Species Identification</h3>
                    </div>
                </div>
                <div>
                    <p>table</p>
                </div>
            </div>
    </section>
    </>
    )
}