import React from 'react'
import { useState, useRef } from "react"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import styles from './overview-table.module.css'

function formatTimestamp(timestamp) {
  if (!timestamp) return "—";
  const [datePart, timePart] = timestamp.split("T");
  const [y, m, d] = datePart.split("-");
  const shortYear = y.slice(2);
  const [hh, mm] = timePart.split(":");
  return `${m}/${d}/${shortYear} - ${hh}:${mm}`;
}

function toPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function kestrelFrequency(record) {
  if (!record || !record.total_photos_with_creatures) return "—";
  return toPercent(record.kestrel_frequency ?? record.total_kestrel_identified_photos / record.total_photos_with_creatures);
}

function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setVisible(true), 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <span className={styles.tooltipWrapper} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <InfoOutlinedIcon style={{ fontSize: 16, color: "#888", verticalAlign: "middle" }} />
      {visible && (
        <span className={styles.tooltip}>
          {text}
          <span className={styles.tooltipArrow} />
        </span>
      )}
    </span>
  );
}

export default function BirdboxTable({ boxesData = [] }) {
  const birdboxes = boxesData
  const colWidths = ["30%", "22%", "15%", "18%", "15%"];

  const colGroup = (
    <colgroup>
      {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.heading}>Box Location and Status</div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          {colGroup}
          <thead>
            <tr>
              <th className={styles.th}>Box Name</th>
              <th className={styles.th}>Last Record</th>
              <th className={styles.thNoWrap}>
                Usage Rate
                <InfoTooltip text="Lorem Ipsum Dolor sit Amet" />
              </th>
              <th className={styles.th}>Kestrel Frequency</th>
              <th className={styles.th}>Last Kestrel</th>
            </tr>
          </thead>
        </table>
        <div className={styles.scrollBody}>
          <table className={styles.table}>
            {colGroup}
            <tbody>
              {birdboxes.map((box) => {
                return (
                  <tr key={box.birdbox_id} className={styles.row}>
                    <td className={styles.td} data-title="Box Name">{box.birdbox_name}</td>
                    <td className={styles.td} data-title="Last Record">
                      {formatTimestamp(box.last_captured_image?.timestamp)}
                    </td>
                    <td className={styles.td} data-title="Usage Rate">{toPercent(box.usage_rate)}</td>
                    <td className={styles.td} data-title="Kestrel Frequency">{kestrelFrequency(box)}</td>
                    <td className={styles.td} data-title="Usage Rate">{toPercent(box.usage_rate)}</td>
                    <td className={styles.td} data-title="Kestrel Frequency">{kestrelFrequency(box)}</td>
                    <td className={styles.td} data-title="Last Kestrel">
                      {formatTimestamp(box.last_identified_kestrel?.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}