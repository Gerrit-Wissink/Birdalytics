import Map from "../components/map.jsx";
import BirdPieChart from "../components/donut-chart.jsx";
import LineGraph from "../components/line-graph.jsx";
import ActiveBoxes from "../components/other-stats.jsx";
import {MostActiveBox} from "../components/other-stats.jsx";
import BirdboxTable from "../components/overview-table.jsx"; 
import './overview.css'

export default function Overview(){
    return(
        <>
        <section id="container">
            <h1>Overview Page</h1>
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