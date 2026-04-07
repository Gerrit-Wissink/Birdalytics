import * as React from 'react';
import html2canvas from 'html2canvas';
import { useEffect, useState, useRef } from 'react';
import apiClient from '../utils/apiClient';
import BirdBoxSelect from '../components/cameraSelect';
import {BoxesPieChart} from '../components/donut-chart';
import { LineGraphPicture } from '../components/line-graph';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabPanel from '@mui/lab/TabPanel';
import BuildPDF from '../reports/buildPDF';
import PDFPreview from '../reports/previewPDF';
import * as XLSX from "xlsx";

export default function Reports(){

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    const [boxesData, setBoxesData] = useState([]);
    const [selectedBoxNames, setSelectedBoxNames] = useState([]);

    useEffect(() => {
        const fetchBoxesData = async () => {
            try {
                const response = await apiClient.get('/boxes/record');
                if (response.status === 200) {
                    const data = response.data.data;
                    setBoxesData(data);
                    setSelectedBoxNames(data.map((b) => b.birdbox_name));
                }
            } catch (error) {
                console.error('Error fetching boxes data:', error);
            }
        };
        fetchBoxesData();
    }, []);

    const selectedBirdboxes = boxesData.filter(b =>
        selectedBoxNames.includes(b.birdbox_name)
    );

    const [value, setValue] = React.useState('PDF');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const prepareDataForCSVAndExcel = (birdboxes) => {
        const data = [];
        for (const box of birdboxes) {
            for (const record of box.records) {
                const formatted_record = {
                    date: new Date(record.timestamp).toLocaleString(),
                    box_name: box.birdbox_name,
                    species: record.modified_bird ?? record.primary_guess ?? 'Unknown',
                    confidence: record.modified_bird ? 'Manual' : record.primary_guess_confidence ? `${(record.primary_guess_confidence * 100).toFixed(0)}%` : 'N/A',
                    image_url: record.image_url ? `https://birdalytics.webdev.gccis.rit.edu/api/${record.image_url}` : 'N/A',
                    modified_date: record.modified_bird ? record.modified_date : 'N/A',
                };
                data.push(formatted_record);
            }
        }
        return data;
    };

    function exportCSV(data) {
        // CSV Export
        const headers = ["Date - Time", "Box Name", "Species", "Confidence", "Image URL", "Modified Date"];
        const rows = prepareDataForCSVAndExcel(data);

        const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "birdalytics-report.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    // Excel Export
    function exportExcel(data) {
        const preparedData = prepareDataForCSVAndExcel(data);

        const worksheet = XLSX.utils.json_to_sheet(preparedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bird Records");
        XLSX.writeFile(workbook, "birdalytics-report.xlsx");
    }

    const handleDownloadCSV = async () => {
        exportCSV(selectedBirdboxes);
    };
    const handleDownloadExcel = async () => {
        exportExcel(selectedBirdboxes);
    };

    // Ref for the hidden pie chart used by html2canvas
    const chartRef = useRef(null);
    const lineGraphRef = useRef(null);
 
    const handleDownload = async () => {
        const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
        const chartImage = canvas.toDataURL('image/png');
        const lineCanvas = await html2canvas(lineGraphRef.current, { backgroundColor: '#ffffff' });
        const lineGraphImage = lineCanvas.toDataURL('image/png');
        await BuildPDF(selectedBirdboxes, chartImage, lineGraphImage);
    };

    return(
        <>
        <section id="container">
            <h1>Reports Page</h1>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1em' }}>
                <BirdBoxSelect
                    boxes={boxesData}
                    selectedBoxNames={selectedBoxNames}
                    setSelectedBoxNames={setSelectedBoxNames}
                />
                <button
                    disabled={selectedBirdboxes.length === 0}
                    style={{
                        backgroundColor: selectedBirdboxes.length === 0 ? '#a0a0a0' : '#537F2C',
                        borderRadius: '8px',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '1em',
                        fontWeight: 400,
                        cursor: selectedBirdboxes.length === 0 ? 'not-allowed' : 'pointer',
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
                <p style={{fontStyle: 'italic', marginTop: '0px'}}> Please note that preview is not exact.</p>
                <PDFPreview boxesData={selectedBirdboxes} />
            </TabPanel>
            <TabPanel value="CSV">
                <h2>Export to CSV</h2>
                <button onClick={handleDownloadCSV}>Download CSV File</button>
            </TabPanel>
            <TabPanel value="EXCEL">
                <h2>Export to Excel</h2>
                <button onClick={handleDownloadExcel}>Download Excel File</button>
            </TabPanel>
        </TabContext>
        </section>

        {/* Hidden pie chart — rendered off-screen so html2canvas can capture it */}
        <div
            ref={chartRef}
            style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                backgroundColor: '#ffffff',
            }}
        >
            <BoxesPieChart birdboxes={selectedBirdboxes} photo = {true} />
        </div>

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

        </>
    )
}