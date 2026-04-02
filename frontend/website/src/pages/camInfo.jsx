import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { FiEdit } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { MiniPieChart } from '../components/donut-chart';
import ProgressBar from '../components/progress-bar';
import BirdboxImageTable from '../components/camera-table';
import AddCameraModal from '../components/add-camera-modal';
import SpeciesIdentification from '../components/species-identification';

import styles from './camInfo.module.css'


export default function CamInfo() {

    const [boxesData, setBoxesData] = useState([]);

    // Tracks which birdbox_id is currently selected — null until fetch resolves
    const [selectedID, setSelectedID] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null); //in order to update the Species Identification window on new select
    const [selectedCamera, setSelectedCamera] = useState(null);

    const [imageMap, setImageMap] = useState({});

    const [showAddCameraModal, setShowAddCameraModal] = useState(false);
    

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
                    if (data.length > 0) {
                        setSelectedID(data[0].birdbox_id);
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
        if (selectedID === null || selectedID === -1) {
            setSelectedCamera(null);
            return;
        }
        const selectedCam = boxesData.find(box => box.birdbox_id === parseInt(selectedID));
        setSelectedCamera(selectedCam || null);
    }, [selectedID, boxesData]);

    useEffect(() => {
        console.log('Selected camera updated:', selectedCamera);
        const fetchImagesForBox = async () => {
            try {
                const records = selectedCamera?.records || [];
                console.log('Records found:', records.length, records);
                
                if (records.length === 0) {
                    console.log('No records to fetch images for');
                    setImageMap({});
                    return;
                }
                
                const newImageMap = {};
                
                for(const record of records) {
                    console.log(`Processing record ${record.record_id}, image_url: ${record.image_url}`);
                    
                    if(!record.image_url) {
                        console.log("No image_url for record:", record.record_id);
                        continue;
                    }
                    
                    try {
                        console.log(`Fetching image from: ${record.image_url}`);
                        const response = await apiClient.get(record.image_url, {
                            responseType: 'blob'
                        });

                        if (response.status === 200) {
                            const imageUrl = URL.createObjectURL(response.data);
                            newImageMap[record.record_id] = imageUrl;
                            console.log(`✓ Successfully fetched image for record ${record.record_id}`);
                        }
                    } catch (err) {
                        console.error(`✗ Failed to fetch image for record ${record.record_id}:`, err.message);
                    }
                }

                console.log('Setting imageMap with', Object.keys(newImageMap).length, 'images');
                setImageMap(newImageMap);
            } catch (error) {
                console.error('Error in fetchImagesForBox:', error);
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
                        <FiEdit style={{ color: 'var(--text)', fontSize: '1.5rem', marginLeft: '0.5rem' }} 
                            onClick={() => setShowAddCameraModal(true)} />
                    </span>
                </div>

                {boxesData.map((camera) => (
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
                    {selectedCamera?.birdbox_name ?? 'Select a Camera'}
                    <IoSettingsOutline />
                </h1>

                <div className={styles.sideBySide}>
                    <div id={styles.cameraSummary}>
                        <h3 style={{ margin: '5px 0px' }}>Camera Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className={styles.stackedStats}>
                                <p>Usage Rate</p>
                                <p className='small-stat-highlight'>{(selectedCamera?.usage_rate || 0).toFixed(2)}%</p>
                            </div>
                            <div className={styles.stackedStats}>
                                <p>Kestrel Frequency</p>
                                <p className='small-stat-highlight'>
                                    {(((selectedCamera?.total_kestrel_identified_photos / selectedCamera?.total_photos_with_creatures) || 0) * 100).toFixed(2)}%
                                </p>
                            </div>
                        </div>

                        <p>Images Reviewed</p>
                        <ProgressBar totalImages={100} imagesReviewed={85} />
                        {/* TODO REPLACE WITH REFERENCES TO BOX DATA: TOTAL IMAGES WITH LOW CONFIDENCE AND TOTAL MODIFIED WITH LOW CONFIDENCE??? */}

                        <p>Species Overview</p>
                        <MiniPieChart 
                            kestrels={selectedCamera?.total_kestrel_identified_photos || 0}
                            otherBirds={selectedCamera?.total_non_kestrel_identified_photos || 0} 
                            nonBirds={(selectedCamera?.total_captured_photos || 0) - (selectedCamera?.total_kestrel_identified_photos || 0) - (selectedCamera?.total_non_kestrel_identified_photos || 0)} 
                        />


                    </div>

                    <div id={styles.identifyBox}>
                        <SpeciesIdentification
                            selectedRow={selectedRow}
                            imageMap={imageMap}
                            birdboxName={selectedCamera?.birdbox_name}
                            onSpeciesOverride={(species) => {
                                // Rerender the table row with the overridden species
                                if (selectedRow) {
                                    setSelectedRow({ ...selectedRow, primary_guess: species });
                                }
                            }}
                        />
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
        {showAddCameraModal && (
            <AddCameraModal setShowModal={setShowAddCameraModal} />
        )}
    </>
    );
}