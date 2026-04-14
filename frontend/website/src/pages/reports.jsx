import * as React from 'react';
import { SelectButton } from 'primereact/selectbutton';
import { Dropdown } from 'primereact/dropdown';
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
import CSVPreview from '../reports/previewCSV';
import ExcelPreview from '../reports/previewExcel';
import EmptyState from '../components/emptyState';
import "./reports.css";
import * as XLSX from "xlsx";

export default function Reports() {

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

    const [selectedTab, setSelectedTab] = React.useState('PDF');
    const [includeOverview, setIncludeOverview] = React.useState('Include');
    const overviewOptions = ['Include', 'Exclude'];

    const handleChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const dateToFileString = (date) => {
        // Format date as YYYY-MM-DD for filename
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const prepareDataForCSVAndExcel = (birdboxes) => {
        const data = [];
        for (const box of birdboxes) {
            for (const record of box.records) {
                const date = new Date(record.timestamp);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(', ', ' ');
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const formatted_record = {
                    date: `${dateStr} - ${timeStr}`,
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

        // Convert objects to arrays in the order of headers
        const rowArrays = rows.map((row) => [
            row.date,
            row.box_name,
            row.species,
            row.confidence,
            row.image_url,
            row.modified_date
        ]);

        const csvContent = [headers, ...rowArrays].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `birdalytics-report-${dateToFileString(new Date())}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Excel Export
    function exportExcel(data) {
        const preparedData = prepareDataForCSVAndExcel(data);

        const worksheet = XLSX.utils.json_to_sheet(preparedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bird Records");
        XLSX.writeFile(workbook, `birdalytics-report-${dateToFileString(new Date())}.xlsx`);
    }

    // Ref for the hidden pie chart used by html2canvas
    const chartRef = useRef(null);
    const lineGraphRef = useRef(null);

    const exportPDF = async () => {
        const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
        const chartImage = canvas.toDataURL('image/png');
        const lineCanvas = await html2canvas(lineGraphRef.current, { backgroundColor: '#ffffff' });
        const lineGraphImage = lineCanvas.toDataURL('image/png');
        await BuildPDF(selectedBirdboxes, chartImage, lineGraphImage, includeOverview === 'Include');
    };

    const handleDownload = () => {
        if (selectedTab === 'PDF') {
            exportPDF();
        } else if (selectedTab === 'CSV') {
            exportCSV(selectedBirdboxes);
        } else if (selectedTab === 'EXCEL') {
            exportExcel(selectedBirdboxes);
        }
    }

    const hasAnyBoxes = boxesData.length > 0;
    const hasAnyRecords = boxesData.some((box) => (box.records ?? []).length > 0);
    const hasReportData = hasAnyBoxes || hasAnyRecords;
    const hasSelectedBoxes = selectedBirdboxes.length > 0;

    if (!hasReportData) {
        return (
            <section id="container" style={{ width: '100vw' }}>
                <h1>Reports</h1>

                <EmptyState
                    title="No report data yet"
                    description="Upload images or add birdboxes before generating reports."
                    actionText="Upload Data"
                    onAction={() => (window.location.href = "/#/upload")}
                />
            </section>
        );
    }

    const EMPTY_TAB_CONTENT = (
        <div className="empty-state stat-empty-state">
            <h2>No cameras selected</h2>
            <p>Select one or more cameras to preview and download a report.</p>
        </div>
    );

    return (
        <>
            <section id="container">
                <h1>Reports</h1>
                <div id="report-filters">
                    <div id="report-row">
                        <div className="camera-select-wrapper">
                            <BirdBoxSelect
                                boxes={boxesData}
                                selectedBoxNames={selectedBoxNames}
                                setSelectedBoxNames={setSelectedBoxNames}
                            />
                        </div>
                        {selectedTab === 'PDF' && (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '50px' }}>
                                <span style={{ fontSize: '0.8em', fontWeight: 500, color: '#444' }}>Overview in PDF</span>
                                <SelectButton
                                    value={includeOverview}
                                    onChange={(e) => setIncludeOverview(e.value)}
                                    options={overviewOptions}
                                    pt={{
                                        button: ({ context }) => ({
                                            style: {
                                                padding: '4px 12px',
                                                fontSize: '0.8em',
                                                backgroundColor: context.selected ? '#537F2C' : 'transparent',
                                                color: context.selected ? '#ffffff' : '#444',
                                                border: '1px solid #537F2C',
                                            }
                                        })
                                    }}
                                />
                            </div>
                        )}
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
                                marginLeft: 'auto',
                            }}
                            onClick={handleDownload}
                        >
                            Download Report
                        </button>
                    </div>
                </div>

                {/* Mobile: dropdown format selector */}
                <div className="report-format-dropdown">
                    <Dropdown
                        value={selectedTab}
                        options={['PDF', 'CSV', 'EXCEL']}
                        onChange={(e) => setSelectedTab(e.value)}
                        placeholder="Select format"
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Desktop: tab selector + previews */}
                <TabContext value={selectedTab}>
                    <Box className="report-tabs-box" sx={{ width: '100%', marginTop: '1em', borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={selectedTab}
                            onChange={(event, newValue) => setSelectedTab(newValue)}
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
                                <PDFPreview boxesData={selectedBirdboxes} includeOverview={includeOverview === 'Include'} />
                            </>
                        ) : (
                            EMPTY_TAB_CONTENT
                        )}
                    </TabPanel>
                    <TabPanel value="CSV">
                        {hasSelectedBoxes ? (
                            <>
                                <p style={{ fontStyle: 'italic', marginTop: '0px' }}>
                                    Please note that preview is not exact.
                                </p>
                                <CSVPreview rows={prepareDataForCSVAndExcel(selectedBirdboxes)} />
                            </>
                        ) : (
                            EMPTY_TAB_CONTENT
                        )}
                    </TabPanel>
                    <TabPanel value="EXCEL">
                        {hasSelectedBoxes ? (
                            <>
                                <p style={{ fontStyle: 'italic', marginTop: '0px' }}>
                                    Please note that preview is not exact.
                                </p>
                                <ExcelPreview rows={prepareDataForCSVAndExcel(selectedBirdboxes)} />
                            </>
                        ) : (
                            EMPTY_TAB_CONTENT
                        )}
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
