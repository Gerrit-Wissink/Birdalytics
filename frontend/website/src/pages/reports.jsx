import * as React from 'react';
import html2canvas from 'html2canvas';
import { useEffect, useState, useRef } from 'react';
import apiClient from '../utils/apiClient';
import BirdBoxSelect from '../components/cameraSelect';
import {BoxesPieChart} from '../components/donut-chart';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabPanel from '@mui/lab/TabPanel';
import BuildPDF from '../reports/buildPDF';
import PDFPreview from '../reports/previewPDF';

export default function Reports(){

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    const [boxes, setBoxes] = useState([]);
    const [selectedBoxNames, setSelectedBoxNames] = useState([]);

    const selectedBoxes = boxes.filter(b => selectedBoxNames.includes(b.birdbox_name));
        useEffect(() => {
            const fetchBoxesData = async () => {
                try {
                    const response = await apiClient.get('/boxes/record');
                    if (response.status === 200) {
                        const fetchedBoxes = response.data.data.birdboxes;
                        setBoxes(fetchedBoxes);
                        console.log(fetchedBoxes)
                    } else {
                        console.error('Failed to fetch boxes data:', response.status);
                    }
                } catch (error) {
                    console.error('Error fetching boxes data:', error);
                }
            };
            fetchBoxesData();;
        }, []);

    const [value, setValue] = React.useState('PDF');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    //to capture my hidden graph with html2canvas
    const chartRef = useRef(null);
    const handleDownload = async () => {
        const canvas = await html2canvas(chartRef.current);
        const chartImage = canvas.toDataURL('image/png');
        await BuildPDF(selectedBoxes, chartImage);
    };

    return(
        <>
        <section id="container">
            <h1>Reports Page</h1>
            <div style= {{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1em'}}>
                <BirdBoxSelect
                    boxes={boxes}
                    setBoxes={setBoxes}
                    selectedBoxNames={selectedBoxNames}
                    setSelectedBoxNames={setSelectedBoxNames}
                />
                    <button 
                    disabled={selectedBoxes.length === 0}
                    style={{
                        backgroundColor: selectedBoxes.length === 0 ? '#a0a0a0' : '#537F2C',
                        borderRadius: '8px',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '1em',
                        fontWeight: 400,
                        cursor: selectedBoxes.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                        onClick={async () => {
                            console.log('birdboxes:', selectedBoxes);
                            await BuildPDF(selectedBoxes)}
                        }>Download PDF
                    </button>
            </div>

        <TabContext value={value}>
            <Box sx={{ width: '100%', marginTop: '1em', borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{'& .MuiTabs-indicator': {
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
                    <PDFPreview birdboxes={selectedBoxes} />
                </TabPanel>
                <TabPanel value="CSV">Item Two</TabPanel>
                <TabPanel value="EXCEL">Item Three</TabPanel>
        </TabContext>
        </section>
        <div ref={chartRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            {/* <BoxesPieChart birdboxes={selectedBoxes} /> */}
        </div>
        </>
    )
}