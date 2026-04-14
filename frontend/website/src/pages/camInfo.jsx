import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { FiEdit } from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import BirdboxImageTable from '../components/camera-table';
import AddCameraModal from '../components/add-camera-modal';
import SpeciesIdentification from '../components/species-identification';
import EmptyState from '../components/emptyState';
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
    const [selectedRowId, setSelectedRowId] = useState(null); //in order to update the Species Identification window on new select
    const [imageMap, setImageMap] = useState({});

    const [showAddCameraModal, setShowAddCameraModal] = useState(false);
    const [showEditCameraModal, setShowEditCameraModal] = useState(false);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const [speciesOptions, setSpeciesOptions] = useState([]);
    const [speciesOverrideByRecordId, setSpeciesOverrideByRecordId] = useState({});

    const MOBILE_BREAKPOINT = 1024;

    const parsedID = selectedID != null ? parseInt(selectedID) : null;

    const selectedCamera =
        parsedID == null || parsedID === -1
            ? null
            : boxesData.find(box => box.birdbox_id === parsedID) || null;

    const selectedRowBase =
        selectedCamera?.records?.find(record => record.record_id === selectedRowId)
        || selectedCamera?.records?.[0]
        || null;

    const selectedRow = selectedRowBase
        ? {
            ...selectedRowBase,
            ...(speciesOverrideByRecordId[selectedRowBase.record_id] ?? {})
        }
        : null;

    // Function to navigate to next/previous record in the Species Identification view
    const navigateRecord = (direction) => {
        if (!selectedCamera?.records?.length) return;

        const currentIndex = selectedCamera.records.findIndex(
            r => r.record_id === selectedRow?.record_id
        );

        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % selectedCamera.records.length;
        } else {
            newIndex = (currentIndex - 1 + selectedCamera.records.length) % selectedCamera.records.length;
        }

        setSelectedRowId(selectedCamera.records[newIndex].record_id);
    };

    const fetchBoxesData = async () => {
        try {
            const response = await apiClient.get('/boxes/record');
            console.log('Fetch boxes data response:', response);
            if (response.status === 200) {
                const data = response.data.data;
                console.log('Boxes data:', data);
                setBoxesData(data);

                // Check for query parameter first (from hash-based routing)
                // In hash routing, query params are in the hash: #/path?param=value
                const hashParts = window.location.hash.split('?');
                const queryString = hashParts.length > 1 ? hashParts[1] : '';
                const selected = new URLSearchParams(queryString).get('selected');
                if (selected) {
                    console.log('Selecting camera from URL param:', selected);
                    setSelectedID(parseInt(selected, 10)); // Convert to number for consistent type
                } else if (data.length > 0) {
                    // Only auto-select first camera if no query param
                    console.log('No URL param, selecting first camera by default:', data[0].birdbox_id);
                    setSelectedID(data[0].birdbox_id);
                }
            } else {
                console.error('Failed to fetch boxes data:', response.status);
            }
        } catch (error) {
            console.error('Error fetching boxes data:', error);
        }
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
        setSelectedRowId(row?.record_id ?? null);
    }, []);

    /* commenting out
    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);
    */

    useEffect(() => {
        // Function declared above
        fetchBoxesData();
    }, []);

    useEffect(() => {
        const fetchSpeciesOptions = async () => {
            try {
                // TODO: Replace with actual API call to fetch species options
                const response = await apiClient.get('/species');
                if (response.status === 200) {
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

                for (const record of records) {
                    console.log(`Processing record ${record.record_id}, image_url: ${record.image_url}`);

                    if (!record.image_url) {
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

    const DESKTOP_VIEW = (
        <>
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '7.5%' }}>
                {selectedCamera?.birdbox_name ?? 'Select a Camera'}
                <FiEdit style={{ fontSize: '1.75rem', marginLeft: '0.5rem', cursor: 'pointer' }} onClick={() => setShowEditCameraModal(true)} />
            </h1>

            <div className={styles.sideBySide}>
                <CameraSummary selectedCamera={selectedCamera} />

                <div id={styles.identifyBox}>
                    <SpeciesIdentification
                        selectedRow={selectedRow}
                        imageMap={imageMap}
                        birdboxName={selectedCamera?.birdbox_name}
                        onSpeciesOverride={(species) => {
                            if (!selectedRowBase) return;

                            setSpeciesOverrideByRecordId(prev => ({
                                ...prev,
                                [selectedRowBase.record_id]: {
                                    primary_guess: species,
                                    primary_guess_confidence: null,
                                },
                            }));
                        }}
                        speciesOptions={speciesOptions}
                    />
                </div>
            </div>
            <div style={{ margin: '1em 0px' }}>
                <BirdboxImageTable
                    box={selectedCamera}
                    onSelectRow={handleSelectRow}
                    imageMap={imageMap}
                />
            </div>
        </>
    );

    const MOBILE_VIEW = (
        <>
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '7.5%' }}>
                {selectedCamera?.birdbox_name ?? 'Select a Camera'}
                <FiEdit style={{ fontSize: '1.5rem', marginLeft: '0.5rem', cursor: 'pointer' }} onClick={() => setShowEditCameraModal(true)} />
            </h1>

            <h2>Box Stats</h2>
            <CameraSummary selectedCamera={selectedCamera} />

            <div id={styles.identifyBox} {...handlers}>
                <SpeciesIdentification
                    selectedRow={selectedRow}
                    imageMap={imageMap}
                    birdboxName={selectedCamera?.birdbox_name}
                    onSpeciesOverride={(species) => {
                        if (!selectedRowBase) return;

                        setSpeciesOverrideByRecordId(prev => ({
                            ...prev,
                            [selectedRowBase.record_id]: {
                                primary_guess: species,
                                primary_guess_confidence: null,
                            },
                        }));
                    }}
                    speciesOptions={speciesOptions}
                />
            </div>

            <h2 style={{ marginTop: '1.5em', marginBottom: '1em' }}>Identified Results</h2>
            <div style={{ margin: '1em 0px' }}>
                <BirdboxImageTable
                    box={selectedCamera}
                    onSelectRow={handleSelectRow}
                    imageMap={imageMap}
                />
            </div>
        </>
    );

    const hasCameras = boxesData.length > 0;
    const hasSelectedCamera = !!selectedCamera;

    if (!hasCameras) {
        return (
            <section className={styles.camInfoContainer}>
                <h1>Cameras</h1>
                <EmptyState
                    title="No cameras yet"
                    description="Add a camera to start viewing summaries and images."
                    actionText="Add Camera"
                    onAction={() => setShowAddCameraModal(true)}
                />
            </section>
        );
    }

    if (!hasSelectedCamera) {
        return (
            <section className={styles.camInfoContainer}>
                <h1>Cameras</h1>
                <EmptyState
                    title="Select a Camera"
                    description="Choose a camera from the list to view details."
                />
            </section>
        );
    }

    return (
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
                <AddCameraModal setShowModal={setShowAddCameraModal} fetchBoxes={fetchBoxesData} />
            )}
            {showEditCameraModal && selectedCamera && (
                <AddCameraModal
                    setShowModal={setShowEditCameraModal}
                    fetchBoxes={fetchBoxesData}
                    selectedCamera={selectedCamera}
                />
            )}
        </>
    );
}
