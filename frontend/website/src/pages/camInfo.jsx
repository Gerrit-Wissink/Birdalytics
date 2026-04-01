import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { IoSettingsOutline } from "react-icons/io5";
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import BirdboxImageTable from '../components/camera-table';
import AddCameraModal from '../components/add-camera-modal';
import SpeciesIdentification from '../components/species-identification';
import CameraSummary from '../components/camera-summary';
import CameraSidebar from '../components/camera-sidebar';
import { useSwipeable } from 'react-swipeable';

import styles from './camInfo.module.css'

const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function CamInfo() {

    const [boxesData, setBoxesData] = useState([]);

    // Tracks which birdbox_id is currently selected — null until fetch resolves
    const [selectedID, setSelectedID] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null); //in order to update the Species Identification window on new select
    const [selectedCamera, setSelectedCamera] = useState(null);

    const [imageMap, setImageMap] = useState({});

    const [showAddCameraModal, setShowAddCameraModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const [speciesOptions, setSpeciesOptions] = useState([]);

    const MOBILE_BREAKPOINT = 1024;

    // Function to navigate to next/previous record in the Species Identification view
    const navigateRecord = (direction) => {
        if (!selectedCamera?.records || selectedCamera.records.length === 0) return;
        
        const currentIndex = selectedCamera.records.findIndex(
            r => r.record_id === selectedRow?.record_id
        );
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % selectedCamera.records.length;
        } else {
            newIndex = (currentIndex - 1 + selectedCamera.records.length) % selectedCamera.records.length;
        }
        
        setSelectedRow(selectedCamera.records[newIndex]);
    };
    
    //Mobile swipe handlers for navigating between records in the Species Identification view
    const handlers = useSwipeable({
        onSwipedLeft: () => navigateRecord('next'),
        onSwipedRight: () => navigateRecord('prev'),
        trackMouse: true // enables mouse drag too
    });
    

    // Handle window resize for responsive layout
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Memoize onSelectRow callback to prevent infinite loop in BirdboxImageTable effect
    const handleSelectRow = useCallback((row) => {
        setSelectedRow(row);
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

    useEffect(() => {
        const fetchSpeciesOptions = async () => {
            try {
                // TODO: Replace with actual API call to fetch species options
                const response = await apiClient.get('/species');
                if(response.status === 200) {
                    const optionsFromAPI = response.data.data.map(species => ({
                        label: capitalize(species.species_name),
                        value: species.species_name
                    }));
                    setSpeciesOptions(optionsFromAPI);
                } else {
                    console.error('Failed to fetch species options:', response.status);
                }
            } catch (error) {
                console.error('Error fetching species options:', error);
            }
        };

        fetchSpeciesOptions();
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
        console.log('[camInfo] imageMap effect running - selectedCamera:', selectedCamera?.birdbox_id);
        let isMounted = true;
        
        const fetchImagesForBox = async () => {
            try {
                const records = selectedCamera?.records || [];
                console.log('Records found:', records.length, records);
                
                if (records.length === 0) {
                    console.log('No records to fetch images for');
                    if (isMounted) setImageMap({});
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
                if (isMounted) setImageMap(newImageMap);
            } catch (error) {
                console.error('Error in fetchImagesForBox:', error);
            }
        }

        fetchImagesForBox();

        return () => {
            isMounted = false;
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