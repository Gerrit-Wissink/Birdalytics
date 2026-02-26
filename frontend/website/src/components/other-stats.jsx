

export default function ActiveBoxes({ boxesData }) {

    const numBoxes = boxesData.birdboxes.length;

    return (
        <>
        <div className="stat-box">
            <h1 className="big-stat-highlight">{numBoxes}</h1>
            <p className="stat-label">Birdboxes <br/> Collecting Data</p>
        </div>
        </>
    )
}

export function MostActiveBox({ boxesData }) {

    const MostActiveBox = "Gosnell Big Woods Primary"

    return (
        <>
        <div className="stat-box">
            <h1 className="small-stat-highlight">{MostActiveBox}</h1>
            <p className="stat-label-small">Most Active Box</p>
        </div>
        </>
    )
}