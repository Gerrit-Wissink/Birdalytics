import Map from "../components/map.jsx";
import BirdPieChart from "../components/donut-chart.jsx";
import LineGraph from "../components/line-graph.jsx";
import ActiveBoxes, { MostActiveBox } from "../components/other-stats.jsx";
import BirdboxTable from "../components/overview-table.jsx";
import "./overview.css";
import { useEffect, useState } from "react";
import apiClient from "../utils/apiClient.jsx";

export default function Overview() {
    const user = localStorage.getItem("user");
    const username = user ? JSON.parse(user).username : "user";

    const [boxesData, setBoxesData] = useState({
        birdboxes: [],
        birdbox_records: [],
    });
    const [isLoading, setIsLoading] = useState(true);

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
                const response = await apiClient.get("/boxes/record");
                if (response.status === 200) {
                    setBoxesData(response.data.data);
                } else {
                    console.error("Failed to fetch boxes data:", response.status);
                }
            } catch (error) {
                console.error("Error fetching boxes data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoxesData();
    }, []);

    const boxes = boxesData.birdboxes ?? [];
    const records = boxesData.birdbox_records ?? [];
    const hasOverviewData = boxes.length > 0 || records.length > 0;

    if (!isLoading && !hasOverviewData) {
        return (
            <section id="container">
                <h1>Welcome back, {username}</h1>
                <div className="overview-empty-state">
                    <h2>No overview data yet</h2>
                    <p>
                        Upload images or add birdboxes to start seeing map, table, and activity data.
                    </p>

                    <button
                        className="cta-button"
                        onClick={() => window.location.href = "/#/upload"}
                    >
                        Upload Data
                    </button>
                </div>
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
                        {records.length > 0 ? (
                            <BirdPieChart kestrels={44} otherBirds={28} nonBirds={18} />
                        ) : (
                            <div className="empty-state stat-empty-state">
                                <p>No species data yet</p>
                            </div>
                        )}
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
