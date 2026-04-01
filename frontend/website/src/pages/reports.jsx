import * as React from 'react';
import html2canvas from 'html2canvas';
import { useEffect, useState, useRef } from 'react';
import apiClient from '../utils/apiClient';
import BirdBoxSelect from '../components/cameraSelect';
import { BoxesPieChart } from '../components/donut-chart';
import { LineGraphPicture } from '../components/line-graph';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabPanel from '@mui/lab/TabPanel';
import BuildPDF from '../reports/buildPDF';
import PDFPreview from '../reports/previewPDF';

export default function Reports() {

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    const [boxesData, setBoxesData] = useState({ birdboxes: [], birdbox_records: [] });
    const [selectedBoxNames, setSelectedBoxNames] = useState([]);

    useEffect(() => {
        const fetchBoxesData = async () => {
            try {
                const response = await apiClient.get('/boxes/record');
                if (response.status === 200) {
                    const data = response.data.data;
                    setBoxesData(data);
                    setSelectedBoxNames(data.birdboxes.map((b) => b.birdbox_name));
                }
            } catch (error) {
                console.error('Error fetching boxes data:', error);
            }
        };
        fetchBoxesData();
    }, []);

    const selectedBirdboxes = boxesData.birdboxes.filter(b =>
        selectedBoxNames.includes(b.birdbox_name)
    );
    const selectedIds = new Set(selectedBirdboxes.map(b => b.birdbox_id));
    const selectedBoxesData = {
        birdboxes: selectedBirdboxes,
        birdbox_records: boxesData.birdbox_records.filter(r => selectedIds.has(r.birdbox_id)),
    };

    const [value, setValue] = React.useState('PDF');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    // Ref for the hidden pie chart used by html2canvas
    const chartRef = useRef(null);
    const lineGraphRef = useRef(null);

    const handleDownload = async () => {
        const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
        const chartImage = canvas.toDataURL('image/png');
        const lineCanvas = await html2canvas(lineGraphRef.current, { backgroundColor: '#ffffff' });
        const lineGraphImage = lineCanvas.toDataURL('image/png');
        await BuildPDF(selectedBoxesData, chartImage, lineGraphImage);
    };

    const hasAnyBoxes = boxesData.birdboxes.length > 0;
    const hasAnyRecords = boxesData.birdbox_records.length > 0;
    const hasReportData = hasAnyBoxes || hasAnyRecords;
    const hasSelectedBoxes = selectedBirdboxes.length > 0;

    if (!hasReportData) {
        return (
            <section id="container">
                <h1>Reports Page</h1>
                <div className="empty-state">
                    <h2>No report data yet</h2>
                    <p>Upload images or add birdboxes before generating reports.</p>
                </div>
            </section>
        );
    }

    return (
        <>
            <section id="container">
                <h1>Reports Page</h1>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1em' }}>
                    <BirdBoxSelect
                        boxes={boxesData.birdboxes}
                        selectedBoxNames={selectedBoxNames}
                        setSelectedBoxNames={setSelectedBoxNames}
                    />
                    <button
                        disabled={!hasSelectedBoxes}
                        style={{
                            backgroundColor: !hasSelectedBoxes ? '#a0a0a0' : '#537F2C',
                            borderRadius: '8px',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            fontSize: '1em',
                            fontWeight: 400,
                            cursor: !hasSelectedBoxes ? 'not-allowed' : 'pointer',
                        }}
                        onClick={handleDownload}
                    >
                        Download Report
                    </button>
                </div>

                <TabContext value={value}>
                    <Box sx={{ width: '100%', marginTop: '1em', borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            indicatorColor="primary"
                            textColor="primary"
                            sx={{
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#004C98',
                                    height: '3px',
                                    zIndex: 1000,
                                },
                                '& .MuiTab-root.Mui-selected': {
                                    color: '#004C98',
                                },
                            }}
                            aria-label="secondary tabs example"
                            variant="fullWidth"
                        >
                            <Tab value="PDF" label="PDF" />
                            <Tab value="CSV" label="CSV" />
                            <Tab value="EXCEL" label="EXCEL" />
                        </Tabs>
                    </Box>
                    <TabPanel value="PDF">
                        {hasSelectedBoxes ? (
                            <>
                                <p style={{ fontStyle: 'italic', marginTop: '0px' }}>
                                    Please note that preview is not exact.
                                </p>
                                <PDFPreview boxesData={selectedBoxesData} />
                            </>
                        ) : (
                            <div className="empty-state stat-empty-state">
                                <h2>No cameras selected</h2>
                                <p>Select one or more cameras to preview and download a report.</p>
                            </div>
                        )}
                    </TabPanel>
                    <TabPanel value="CSV">
                        <div className="empty-state stat-empty-state">
                            <h2>No CSV preview available</h2>
                            <p>CSV export is supported through the Download Report button.</p>
                        </div>
                    </TabPanel>
                    <TabPanel value="EXCEL">
                        <div className="empty-state stat-empty-state">
                            <h2>No Excel preview available</h2>
                            <p>Excel export is supported through the Download Report button.</p>
                        </div>
                    </TabPanel>
                </TabContext>
            </section>

            {/* Hidden pie chart — rendered off-screen so html2canvas can capture it */}
            {hasSelectedBoxes && (
                <div
                    ref={chartRef}
                    style={{
                        position: 'absolute',
                        left: '-9999px',
                        top: '-9999px',
                        backgroundColor: '#ffffff',
                    }}
                >
                    <BoxesPieChart birdboxes={selectedBirdboxes} photo={true} />
                </div>
            )}

            {hasSelectedBoxes && (
                <div
                    ref={lineGraphRef}
                    style={{
                        position: 'absolute',
                        left: '-9999px',
                        top: '-9999px',
                        backgroundColor: '#ffffff',
                        width: '900px',
                    }}
                >
                    <LineGraphPicture birdboxes={selectedBirdboxes} />
                </div>
            )}

        </>
    )
}
