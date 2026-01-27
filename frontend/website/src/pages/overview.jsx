import Map from "../components/map.jsx";
import BirdPieChart from "../components/donut-chart.jsx";

export default function Overview(){
    return(
        <>
        <section id= "container">
            <h1>Overview Page</h1>
            <Map />
            <BirdPieChart />
        </section>
        </>
    )
}