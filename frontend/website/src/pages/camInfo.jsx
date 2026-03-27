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
    const [selectedID, setSelectedID] = useState(-1);
    const [selectedCamera, setSelectedCamera] = useState({
        birdboxes: null,
        birdbox_records: null
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
    const selectedImageRef = useRef(null); //to keep track of the selected 'table row' (Image) in order to display info in the Species Identification box
    const [selectedImage, setSelectedImage] = useState(null); //in order to update the Species Identification window on new select
    //selectedImageRef.current?.identified_result or whatever you're trying to access should work

    const getSelectedIDFromHash = () => {
        const hashQuery = window.location.hash.includes('?')
            ? window.location.hash.split('?')[1]
            : '';
        return new URLSearchParams(hashQuery).get('selected') || -1;
    };

    const [selectedID, setSelectedID] = useState(getSelectedIDFromHash);

    useEffect(() => {
        const selected = new URLSearchParams(window.location.search).get('selected');
        if (selected) {
            setSelectedID(selected);
        }
    }, []);

    useEffect(() => {
        if (selectedID === -1) return;
        const selectedCam = boxesData.birdboxes.find(box => box.birdbox_id === parseInt(selectedID));
        const selectedRecords = boxesData.birdbox_records.filter(record => record.birdbox_id === parseInt(selectedID));
        setSelectedCamera({
            birdboxes: selectedCam,
            birdbox_records: selectedRecords
        });
    }, [selectedID, boxesData]);


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
                {boxesData.birdboxes && boxesData.birdboxes.map((camera) => (
                    <div
                        className={styles.cameraItem}
                        key={camera.birdbox_id}
                        onClick={() => setSelectedID(camera.birdbox_id)}
                        style={{
                            backgroundColor: camera.birdbox_id === parseInt(selectedID) ? '#B8CEEF' : undefined,
                            cursor: 'pointer'
                        }}
                    >
                        <p>{camera.location}</p>
                        <h3>{camera.birdbox_name}</h3>
                    </div>
                ))}
            </div>
            <div id={styles.cameraContent}>
                <h1 style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '7.5%'}} >
                    {selectedCamera.birdboxes?.birdbox_name}
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
                        <MiniPieChart kestrels={selectedCamera.birdbox_records?.total_kestrel_identified_photos || 0} otherBirds={selectedCamera.birdbox_records?.total_non_kestrel_identified_photos || 0} nonBirds={selectedCamera.birdbox_records?.total_captured_photos || 0 - (selectedCamera.birdbox_records?.total_kestrel_identified_photos || 0) - (selectedCamera.birdbox_records?.total_non_kestrel_identified_photos || 0)} />


                    </div>
                    <div id={styles.identifyBox}>
                        <h3 style={{margin: '5px 0px'}}>Species Identification</h3>
                    </div>
                </div>
                <div style={{margin: '1em 0px'}}>
                    <BirdboxImageTable 
                        box={selectedCamera}
                        onSelectRow={(row) => setSelectedRow(row)}
                        imageMap={imageMap}
                    />
                </div>
            </div>
        </section>
    </>
    );
}