import React from 'react'

export default function ActiveBoxes({ boxesData }) {

    const numBoxes = boxesData.length;

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

    const MostActiveBox = boxesData.reduce((best, box) => {
        return (box.usage_rate ?? -Infinity) > (best?.usage_rate ?? -Infinity) ? box : best;
    }, null)?.birdbox_name ?? '—';

    return (
        <>
        <div className="stat-box">
            <h1 className="small-stat-highlight">{MostActiveBox}</h1>
            <p className="stat-label-small">Most Active Box</p>
        </div>
        </>
    )
}