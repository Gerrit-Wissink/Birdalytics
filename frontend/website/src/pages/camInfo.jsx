import styles from './camInfo.module.css'
import boxData from '../fake-data/birdboxes.json'
import boxReports from '../fake-data/birdbox_records.json'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { FiEdit } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';



export default function CamInfo(){

    const [boxesData, setBoxesData] = useState({
        birdboxes: [],
        birdbox_records: []
    });

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

    const cameras = boxesData.birdboxes

    const urlParams = new URLSearchParams(window.location.search);
    const selectedID = urlParams.get('selected') || -1;

    const selectedCamera = {}
    selectedCamera.birdboxes = cameras.find((camera) => camera.birdbox_id === parseInt(selectedID)) || cameras[0];
    selectedCamera.birdbox_records = boxesData.birdbox_records.filter(record => record.birdbox_id === parseInt(selectedID));

    return(
    <>
    <section id={styles.camInfoContainer}>
            <div id={styles.cameraSidebar}>
                <div className={styles.titleSpan}>
                    <h2>Cameras</h2>
                    <span style={{display: 'flex', gap: '1em', alignItems: 'center', cursor: 'pointer'}}>
                        <SearchRoundedIcon style={{fontSize: '1.5rem', color:'var(--text)' }} />
                        <FiEdit style={{color: 'var(--text)', fontSize: '1.5rem', marginLeft: '0.5rem' }} />
                    </span>
                </div>
                {cameras.map((camera) => (
                    <div className={styles.cameraItem} key={camera.birdbox_id}>
                        <p>{camera.birdbox_location}</p>
                        <h3>{camera.birdbox_name}</h3>
                    </div>
                ))}
            </div>
            <div id={styles.cameraContent}>
                <h1 style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '7.5%'}} >
                    {selectedCamera.birdbox_name}
                    <IoSettingsOutline />
                </h1>
                <div className = {styles.sideBySide}>
                    <div id={styles.cameraSummary}>
                        <h3>Camera Summary</h3>
                        <div className={styles.stackedStats}>
                            <p>Usage Rate</p>
                            <p className={styles.smallStatHighlight}>{}</p>
                        </div>
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