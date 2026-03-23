import styles from './camInfo.module.css'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { FiEdit } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import {MiniPieChart} from '../components/donut-chart';
import ProgressBar from '../components/progress-bar';
import BirdboxImageTable from '../components/camera-table';

import fakeRecord from '../fake-data/birdbox_records.json'

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

    const cameras = boxesData.birdboxes

    const getSelectedIDFromHash = () => {
        const hashQuery = window.location.hash.includes('?')
            ? window.location.hash.split('?')[1]
            : '';
        return new URLSearchParams(hashQuery).get('selected') || -1;
    };

    const [selectedID, setSelectedID] = useState(getSelectedIDFromHash);

    useEffect(() => {
        const onHashChange = () => setSelectedID(getSelectedIDFromHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const navigateToCamera = (id) => {
        const hashPath = window.location.hash.split('?')[0];
        window.location.hash = `${hashPath}?selected=${id}`;
    };

    const selectedCamera = {}
    selectedCamera.birdboxes = cameras.find((camera) => camera.birdbox_id === parseInt(selectedID)) || cameras[0];
    selectedCamera.birdbox_records = boxesData.birdbox_records.filter(record => record.birdbox_id === parseInt(selectedID));

    if (!selectedCamera.birdboxes) return null;

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
                    <div
                        className={styles.cameraItem}
                        key={camera.birdbox_id}
                        onClick={() => navigateToCamera(camera.birdbox_id)}
                        style={{
                            backgroundColor: camera.birdbox_id === parseInt(selectedID) ? '#B8CEEF' : undefined,
                            cursor: 'pointer'
                        }}
                    >
                        <p>{camera.birdbox_location}</p>
                        <h3>{camera.birdbox_name}</h3>
                    </div>
                ))}
            </div>
            <div id={styles.cameraContent}>
                <h1 style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}} >
                    {selectedCamera.birdboxes.birdbox_name}
                    <IoSettingsOutline />
                </h1>
                <div className = {styles.sideBySide}>
                    <div id={styles.cameraSummary}>
                        <h3 style={{margin: '5px 0px'}}>Camera Summary</h3>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <div className={styles.stackedStats}>
                                <p>Usage Rate</p>
                                <p className='small-stat-highlight'>85%</p>
                            </div>
                            <div className={styles.stackedStats}>
                                <p>Kestrel Frequency</p>
                                <p className='small-stat-highlight'>65%</p>
                            </div>
                        </div>
                        <p>Images Reviewed</p>
                            <ProgressBar totalImages={100} imagesReviewed={85} /> 
                            {/* TODO REPLACE WITH REFERENCES TO BOX DATA */}
                        <p>Species Overview</p>
                        <MiniPieChart kestrels={44} otherBirds={28} nonBirds={18} />


                    </div>
                    <div id={styles.identifyBox}>
                        <h3 style={{margin: '5px 0px'}}>Species Identification</h3>
                        
                    </div>
                </div>
                <div style={{margin: '1em 0px'}}>
                    <BirdboxImageTable 
                    birdboxRecord={fakeRecord.birdbox_records[0]}
                    //this should be whatever record actually stores the array of images
                    />
                </div>
            </div>
    </section>
    </>
    )
}