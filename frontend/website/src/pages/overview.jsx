import Map from "../components/map.jsx";
import BirdPieChart from "../components/donut-chart.jsx";
import LineGraph from "../components/line-graph.jsx";
import ActiveBoxes from "../components/other-stats.jsx";
import {MostActiveBox} from "../components/other-stats.jsx";
import BirdboxTable from "../components/overview-table.jsx"; 
import './overview.css'
import { useEffect, useState } from "react";
import apiClient from "../utils/apiClient.jsx";

export default function Overview(){
    const user = localStorage.getItem('user');
    const [boxesData, setBoxesData] = useState([]);

    useEffect(() => {
        document.title = "Home - Birdalytics";
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
                const response = await apiClient.get('/boxes/records');
                console.log('Fetch boxes data response:', response);
                if (response.status === 200) {
                    const data = response.data.data;
                    console.log('Boxes data:', data);
                    setBoxesData(data); // Assuming the boxes data is in the 'data' property
                } else {
                    console.error('Failed to fetch boxes data:', response.status);
                }
            } catch (error) {
                console.error('Error fetching boxes data:', error);
            }
        }

        fetchBoxesData();
    }, []);

    return(
        <>
        <section id="container">
            <h1>Welcome back, {user && JSON.parse(user).username}</h1>
            <div id="overview-grid">
                <div className="column-left">
                    <Map boxesData={boxesData} />
                    <div className="table-placeholder">
                        <BirdboxTable boxesData={boxesData} />
                    </div>
                </div>
                
                <div className="column-right">
                    <div>
                        <BirdPieChart boxesData={boxesData} />
                    </div>

                    <div>
                        <ActiveBoxes boxesData={boxesData}/>
                    </div>
                    
                    <div>
                        <LineGraph boxesData={boxesData}/>
                    </div>
                    
                    <div>
                        <MostActiveBox boxesData={boxesData}/>
                    </div>
                </div>
            </div>
            
        </section>
        </>
    )
}