import styles from './camInfo.module.css'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { FiEdit } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { MiniPieChart } from '../components/donut-chart';
import ProgressBar from '../components/progress-bar';
import BirdboxImageTable from '../components/camera-table';
import FakeRecord from '../fake-data/birdbox_records.json'

export default function CamInfo() {

    const [boxesData, setBoxesData] = useState({
        birdboxes: [],
        birdbox_records: []
    });

    // Tracks which birdbox_id is currently selected — null until fetch resolves
    const [selectedID, setSelectedID] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null); //in order to update the Species Identification window on new select
    const [selectedCamera, setSelectedCamera] = useState({
        birdbox: {},
        birdbox_records: {}
    });

    const [imageMap, setImageMap] = useState({});

    useEffect(() => {
        const fetchBoxesData = async () => {
            try {
                const response = await apiClient.get('/boxes/record');
                console.log('Fetch boxes data response:', response);
                if (response.status === 200) {
                    const data = response.data.data;
                    console.log('Boxes data:', data);
                    setBoxesData(data);

                    // Auto-select the first camera as soon as data arrives since no longer through cameras page
                    if (data.birdboxes.length > 0) {
                        setSelectedID(data.birdboxes[0].birdbox_id);
                    }
                } else {
                    console.error('Failed to fetch boxes data:', response.status);
                }
            } catch (error) {
                console.error('Error fetching boxes data:', error);
            }
        };

        fetchBoxesData();
    }, []);
    //selectedImageRow.current?.identified_result or whatever you're trying to access should work

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

    useEffect(() => {
        console.log('Selected camera updated:', selectedCamera);
        setSelectedRow(null); // Reset selected row when camera changes
        const fetchImagesForBox = async () => {
            try {
                const records = selectedCamera.birdbox_records.records || [];
                const newImageMap = {};
                
                for(const record of records) {
                    if(!record.image_url) {
                        console.log("No image to fetch for record:", record.record_id);
                        continue;
                    }
                    
                    const url = record.image_url;
                    const response = await apiClient.get(url, {
                        responseType: 'blob' // Important: get binary data as blob
                    });

                    // Create object URL from blob
                    const imageUrl = URL.createObjectURL(response.data);
                    newImageMap[record.record_id] = imageUrl;
                    
                    console.log(`Fetched image for record ${record.record_id}`);
                }

                setImageMap(newImageMap);
            }catch (error) {
                console.error('Error fetching images for box:', error);
            }
        }

        fetchImagesForBox();

        // Cleanup: revoke object URLs when component unmounts
        return () => {
            Object.values(imageMap).forEach(url => URL.revokeObjectURL(url));
        };

    }, [selectedCamera]);



    return(
    <>
    <section id={styles.camInfoContainer}>
            <div id={styles.cameraSidebar}>
                <div className={styles.titleSpan}>
                    <h2>Cameras</h2>
                    <span style={{ display: 'flex', gap: '1em', alignItems: 'center', cursor: 'pointer' }}>
                        <SearchRoundedIcon style={{ fontSize: '1.5rem', color: 'var(--text)' }} />
                        <FiEdit style={{ color: 'var(--text)', fontSize: '1.5rem', marginLeft: '0.5rem' }} />
                    </span>
                </div>

                {boxesData.birdboxes.map((camera) => (
                    <div
                        className={styles.cameraItem}
                        key={camera.birdbox_id}
                        onClick={() => setSelectedID(camera.birdbox_id)}
                        style={{
                            backgroundColor: camera.birdbox_id === selectedID ? '#B8CEEF' : undefined,
                            cursor: 'pointer'
                        }}
                    >
                        <p>{camera.location}</p>
                        <h3>{camera.birdbox_name}</h3>
                    </div>
                ))}
            </div>

            <div id={styles.cameraContent}>
                <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '7.5%' }}>
                    {selectedCamera.birdbox?.birdbox_name ?? 'Select a Camera'}
                    <IoSettingsOutline />
                </h1>

                <div className={styles.sideBySide}>
                    <div id={styles.cameraSummary}>
                        <h3 style={{ margin: '5px 0px' }}>Camera Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className={styles.stackedStats}>
                                <p>Usage Rate</p>
                                <p className='small-stat-highlight'>{selectedCamera.birdbox_records?.usage_rate || 0}%</p>
                            </div>
                            <div className={styles.stackedStats}>
                                <p>Kestrel Frequency</p>
                                <p className='small-stat-highlight'>{selectedCamera.birdbox_records?.kestrel_frequency || 0}%</p>
                            </div>
                        </div>

                        <p>Images Reviewed</p>
                        <ProgressBar totalImages={100} imagesReviewed={85} />
                        {/* TODO REPLACE WITH REFERENCES TO BOX DATA: TOTAL IMAGES WITH LOW CONFIDENCE AND TOTAL MODIFIED WITH LOW CONFIDENCE??? */}

                        <p>Species Overview</p>
                        <MiniPieChart 
                            kestrels={selectedCamera.birdbox_records?.total_kestrel_identified_photos || 0}
                            otherBirds={selectedCamera.birdbox_records?.total_non_kestrel_identified_photos || 0} 
                            nonBirds={selectedCamera.birdbox_records?.total_captured_photos || 0 - (selectedCamera.birdbox_records?.total_kestrel_identified_photos || 0) - (selectedCamera.birdbox_records?.total_non_kestrel_identified_photos || 0)} 
                        />


                    </div>

                    <div id={styles.identifyBox}>
                        <h3 style={{margin: '5px 0px'}}>Species Identification</h3>
                        {selectedRow && (
                            <div>
                                <div>
                                    <img src={imageMap[selectedRow.record_id]} alt={camera.birdbox_name} className="camera-image" />
                                </div>
                                <div>
                                    <p>{selectedRow.primary_guess ?? 'N/A'}</p>
                                    <p>Confidence: {Math.round(selectedRow.primary_guess_confidence * 100)}%</p>
                                    <hr/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{margin: '1em 0px'}}>
                    <BirdboxImageTable 
                        box={selectedCamera.birdbox_records[0]}
                        onSelectRow={(row) => setSelectedRow(row)}
                        imageMap={imageMap}
                    />
                </div>
            </div>
        </section>
    </>
    );
}