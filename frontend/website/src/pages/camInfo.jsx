import styles from './camInfo.module.css'
import boxData from '../fake-data/birdboxes.json'
import boxReports from '../fake-data/birdbox_records.json'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { FiEdit } from "react-icons/fi";


export default function CamInfo(){

    const cameras = boxData.birdboxes

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
                    <div className={styles.cameraItem} key={camera.birdbox_id}>
                        <p>{camera.birdbox_location}</p>
                        <h3>{camera.birdbox_name}</h3>
                    </div>
                ))}
            </div>
            <div id={styles.cameraContent}>
                <h1>Camera Name</h1>
                <div className = {styles.sideBySide}>
                    <div id={styles.cameraSummary}>
                        <h3>Camera Summary</h3>
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