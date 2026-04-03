import React from 'react';
import styles from '../pages/camInfo.module.css';
import ProgressBar from './progress-bar';
import MiniPieChart from './donut-chart';

export default function CameraSummary({ selectedCamera }) {
    return (
        <div id={styles.cameraSummary}>
            <h3 style={{ margin: '5px 0px' }}>Camera Summary</h3>
            <div className={styles.statsRow} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className={styles.stackedStats}>
                    <p>Usage Rate</p>
                    <p className='small-stat-highlight'>{(selectedCamera?.usage_rate || 0).toFixed(0)}%</p>
                </div>
                <div className={styles.stackedStats}>
                    <p>Kestrel Frequency</p>
                    <p className='small-stat-highlight'>
                        {((selectedCamera?.total_photos_with_creatures && selectedCamera?.total_photos_with_creatures > 0 ? ((selectedCamera?.total_kestrel_identified_photos / selectedCamera?.total_photos_with_creatures) * 100) : 0).toFixed(0))}%
                    </p>
                </div>
            </div>

            <div id={styles.progressSection}>
                <p>Images Reviewed</p>
                <ProgressBar box_records={selectedCamera?.records || []} />
                {/* TODO REPLACE WITH REFERENCES TO BOX DATA: TOTAL IMAGES WITH LOW CONFIDENCE AND TOTAL MODIFIED WITH LOW CONFIDENCE??? */}
            </div>

            <div className={styles.speciesOverviewGroup}>
                <p>Species Overview</p>
                <MiniPieChart
                    kestrels={selectedCamera?.total_kestrel_identified_photos || 0}
                    otherBirds={selectedCamera?.total_non_kestrel_identified_photos || 0}
                    nonBirds={Math.max(0, (selectedCamera?.total_captured_photos || 0) - (selectedCamera?.total_kestrel_identified_photos || 0) - (selectedCamera?.total_non_kestrel_identified_photos || 0))}
                />
            </div>


        </div>
    );
}