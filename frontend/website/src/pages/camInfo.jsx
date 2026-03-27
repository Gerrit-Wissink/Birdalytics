import styles from './camInfo.module.css'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { FiEdit } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
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

    // Ref + state for the selected table row image (NEEDS TO BE SET UP)
    const selectedImageRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);

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

    // selected birdbox and record taken from boxesData + selectedID.
    const selectedCamera = {
        birdbox: boxesData.birdboxes.find(b => b.birdbox_id === selectedID) ?? null,
        record: boxesData.birdbox_records.find(r => r.birdbox_id === selectedID) ?? null,
    };

    return (
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
                    {selectedCamera.birdbox?.birdbox_name}
                    <IoSettingsOutline />
                </h1>

                <div className={styles.sideBySide}>
                    <div id={styles.cameraSummary}>
                        <h3 style={{ margin: '5px 0px' }}>Camera Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                        {/* TODO REPLACE WITH REFERENCES TO BOX DATA: TOTAL IMAGES WITH LOW CONFIDENCE AND TOTAL MODIFIED WITH LOW CONFIDENCE??? */}

                        <p>Species Overview</p>
                        {selectedCamera.record && (
                            <MiniPieChart
                                kestrels={selectedCamera.record.total_kestrel_identified_photos}
                                otherBirds={selectedCamera.record.total_non_kestrel_identified_photos}
                                nonBirds={
                                    selectedCamera.record.total_captured_photos -
                                    (selectedCamera.record.total_kestrel_identified_photos +
                                     selectedCamera.record.total_non_kestrel_identified_photos)
                                }
                            />
                        )}
                    </div>

                    <div id={styles.identifyBox}>
                        <h3 style={{ margin: '5px 0px' }}>Species Identification</h3>
                        {/* selectedImage updates on every row click, triggering a re-render here */}
                        {console.log("Selected Image: ", selectedImage?.photo_url)}
                        {selectedImage && (
                            <p>{selectedImage.identified_result}</p>
                        )}
                    </div>
                </div>

                <div style={{ margin: '1em 0px' }}>
                    {selectedCamera.record && (
                        <BirdboxImageTable
                            birdboxRecord={FakeRecord.birdbox_records[0]}
                            //TODO REPLACE THIS WITH REFERENCE TO ACTUAL BOX DATA selectedCamera.record
                            selectedImageRef={selectedImageRef}
                            onSelectImage={(img) => {
                                setSelectedImage(img)
                            }}
                        />
                    )}
                </div>
            </div>
        </section>
        </>
    );
}