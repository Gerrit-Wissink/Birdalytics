import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { IoSettingsOutline } from "react-icons/io5";
import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import BirdboxImageTable from '../components/camera-table';
import AddCameraModal from '../components/add-camera-modal';
import SpeciesIdentification from '../components/species-identification';
import CameraSummary from '../components/camera-summary';
import CameraSidebar from '../components/camera-sidebar';
import { useSwipeable } from 'react-swipeable';

import styles from './camInfo.module.css'


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
            setSelectedRow(null);
            return;
        }
        const selectedCam = boxesData.find(box => box.birdbox_id === parseInt(selectedID));
        setSelectedCamera(selectedCam || null);
        // Initialize selectedRow to first record when camera changes
        if (selectedCam?.records && selectedCam.records.length > 0) {
            setSelectedRow(selectedCam.records[0]);
        } else {
            setSelectedRow(null);
        }
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
                setImageMap(prevImageMap => {
                    // Cleanup old URLs that are no longer needed
                    Object.entries(prevImageMap).forEach(([recordId, url]) => {
                        if (!newImageMap[recordId]) {
                            URL.revokeObjectURL(url);
                        }
                    });
                    return newImageMap;
                });
            } catch (error) {
                console.error('Error in fetchImagesForBox:', error);
            }
        }

        fetchImagesForBox();

        // Cleanup: revoke all object URLs when component unmounts
        return () => {
            Object.values(imageMap).forEach(url => URL.revokeObjectURL(url));
        };

    }, [selectedCamera]);

    const DESKTOP_VIEW = (
        <>
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '7.5%' }}>
                {selectedCamera?.birdbox_name ?? 'Select a Camera'}
                <IoSettingsOutline />
            </h1>

            <div className={styles.sideBySide}>
                <CameraSummary selectedCamera={selectedCamera} />

                <div id={styles.identifyBox}>
                    <SpeciesIdentification
                        selectedRow={selectedRow}
                        imageMap={imageMap}
                        birdboxName={selectedCamera?.birdbox_name}
                        onSpeciesOverride={(species) => {
                            // Rerender the table row with the overridden species
                            if (selectedRow) {
                                setSelectedRow({ ...selectedRow, primary_guess: species, primary_guess_confidence: null });
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
        </>
    );

    const MOBILE_VIEW = (
        <>
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '7.5%' }}>
                {selectedCamera?.birdbox_name ?? 'Select a Camera'}
                <IoSettingsOutline />
            </h1>

            <div id={styles.identifyBox} {...handlers}>
                <SpeciesIdentification
                    selectedRow={selectedRow}
                    imageMap={imageMap}
                    birdboxName={selectedCamera?.birdbox_name}
                    onSpeciesOverride={(species) => {
                        // Rerender the table row with the overridden species
                        if (selectedRow) {
                            setSelectedRow({ ...selectedRow, primary_guess: species, primary_guess_confidence: null }); // Set confidence to 100% on manual override
                        }
                    }}
                />
            </div>

            <h2>Box Stats</h2>
            <CameraSummary selectedCamera={selectedCamera} />
        </>
    );



    return(
    <>
        <section id={styles.camInfoContainer}>
            <button
                className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleOpen : ''}`}
                onClick={() => setSidebarOpen(prev => !prev)}
                aria-label={sidebarOpen ? 'Close camera menu' : 'Open camera menu'}
            >
                {sidebarOpen ? <ChevronLeftRoundedIcon /> : <ChevronRightRoundedIcon />}
            </button>

            {sidebarOpen && (
                <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
            )}

            <CameraSidebar
                boxesData={boxesData}
                selectedID={selectedID}
                setSelectedID={setSelectedID}
                setShowAddCameraModal={setShowAddCameraModal}
                setSidebarOpen={setSidebarOpen}
                sidebarOpen={sidebarOpen}
            />

            <div id={styles.cameraContent}>
                {windowWidth >= MOBILE_BREAKPOINT ? DESKTOP_VIEW : MOBILE_VIEW}
            </div>
        </section>
        {showAddCameraModal && (
            <AddCameraModal setShowModal={setShowAddCameraModal} />
        )}
    </>
    );
}