import Map from "../components/map.jsx";
import BirdPieChart from "../components/donut-chart.jsx";
import LineGraph from "../components/line-graph.jsx";
import ActiveBoxes from "../components/other-stats.jsx";
import {MostActiveBox} from "../components/other-stats.jsx";
import BirdboxTable from "../components/overview-table.jsx"; 
import './overview.css'
import { useEffect } from "react";

export default function Overview(){
    const user = localStorage.getItem('user');

    useEffect(() => {
        document.title = "Home - Birdalytics";
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, [])

    return(
        <>
        <section id="container">
            <h1>Welcome back, {user && JSON.parse(user).username}</h1>
            <div id="overview-grid">
                <div className="column-left">
                    <Map />
                    <div className="table-placeholder">
                        <BirdboxTable />
                    </div>
                </div>
                
                <div className="column-right">
                    <div>
                        <BirdPieChart />
                    </div>

                    <div>
                        <ActiveBoxes/>
                    </div>
                    
                    <div>
                        <LineGraph/>
                    </div>
                    
                    <div>
                        <MostActiveBox/>
                    </div>
                </div>
            </div>
            
        </section>
        </>
    )
}