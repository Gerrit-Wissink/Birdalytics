import Map from "../components/map.jsx";
import BirdPieChart from "../components/donut-chart.jsx";
import LineGraph from "../components/line-graph.jsx";
import ActiveBoxes, { MostActiveBox } from "../components/other-stats.jsx";
import BirdboxTable from "../components/overview-table.jsx";
import "./overview.css";
import { useEffect, useState } from "react";
import apiClient from "../utils/apiClient.jsx";
import EmptyState from "../components/emptyState.jsx";

export default function Overview() {
    const user = localStorage.getItem("user");
    const rawUsername = user ? JSON.parse(user).username : "user";
    //capitalizing the username
    const username = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);
    const [isLoading, setIsLoading] = useState(true);
    const [boxesData, setBoxesData] = useState([]);
    const [overviewData, setOverviewData] = useState(null);

    useEffect(() => {
        document.title = "Home - Birdalytics";
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const tokenExpiry = localStorage.getItem("tokenExpiry");
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = "/#/login";
        }
    }, []);

    useEffect(() => {
        const fetchBoxesData = async () => {
            try {
                setIsLoading(true);
                const response = await apiClient.get("/boxes/record");
                if (response.status === 200) {
                    const data = response.data.data;
                    setOverviewData(data);
                    console.log('Boxes data:', data);
                    setBoxesData(data);
                } else {
                    console.error("Failed to fetch boxes data:", response.status);
                    setOverviewData(null);
                }
            } catch (error) {
                console.error("Error fetching boxes data:", error);
                setOverviewData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoxesData();
    }, []);

    const hasOverviewData = boxesData.length > 0;

    if (isLoading) {
        return (
            <section id="container">
                <h1>Welcome back, {username}</h1>
                <div className="loadingState">Loading overview...</div>
            </section>
        );
    }

    if (!isLoading && !hasOverviewData) {
        return (
            <section id="container">
                <h1>Welcome back, {username}</h1>

                <EmptyState
                    title="No overview data yet"
                    description="Upload images or add birdboxes to start seeing map, table, and activity data."
                    actionText="Upload Data"
                    onAction={() => (window.location.href = "/#/upload")}
                />
            </section>
        );
    }

    return (
        <section id="container">
            <h1>Welcome back, {username}</h1>

            <div id="overview-grid">
                <div className="column-left">
                    <Map boxesData={boxesData} />
                    <div className="table-placeholder">
                        <BirdboxTable boxesData={boxesData} />
                    </div>
                </div>

                <div className="column-right">
                    <div>
                        <BirdPieChart birdboxes={boxesData} />
                    </div>

                    <div>
                        <ActiveBoxes boxesData={boxesData} />
                    </div>

                    <div>
                        <LineGraph boxesData={boxesData} />
                    </div>

                    <div>
                        <MostActiveBox boxesData={boxesData} />
                    </div>
                </div>
            </div>
        </section>
    );
}
