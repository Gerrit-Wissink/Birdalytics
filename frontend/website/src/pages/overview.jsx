import Map from "../components/map.jsx";
import BirdPieChart from "../components/donut-chart.jsx";
import OverviewTable from "../components/overview-table.jsx";
import './overview.css'

export default function Overview(){
    return(
        <>
        <section id="overview-container">
            <h1>Overview Page</h1>
            <div id="overview-grid">
                <div className="column-left">
                    <Map />
                    <div className="table-placeholder">Table Placeholder</div>
                </div>
                
                <div className="column-right">
                    <div>
                        <BirdPieChart />
                    </div>
                    <div className="overview-section">Section 2</div>
                    <div>
                        <OverviewTable/>
                    </div>
                    <div className="overview-section">Section 4</div>
                </div>
            </div>
            
        </section>
        </>
    )
}