import { useState, useRef } from "react"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import boxData from '../fake-data/birdboxes.json'
import boxRecords from '../fake-data/birdbox_records.json'
import styles from './overview-table.module.css'

const birdboxes = boxData.birdboxes
const birdboxRecords = boxRecords.birdbox_records

function formatDateTime(date, time) {
  if (!date || !time) return "—";
  const [y, m, d] = date.split("-");
  const shortYear = y.slice(2);
  const [hh, mm] = time.split(":");
  return `${m}/${d}/${shortYear} - ${hh}:${mm}`;
}

function toPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function kestrelFrequency(record) {
  if (!record || !record.total_photos_with_creatures) return "—";
  return toPercent(record.total_kestrel_identified_photos / record.total_photos_with_creatures);
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

export default function BirdboxTable() {
  const recordsMap = Object.fromEntries(birdboxRecords.map((r) => [r.birdbox_id, r]));
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
                const record = recordsMap[box.birdbox_id];
                return (
                  <tr key={box.birdbox_id} className={styles.row}>
                    <td className={styles.td}>{box.birdbox_name}</td>
                    <td className={styles.td}>
                      {formatDateTime(box.last_captured_image?.date, box.last_captured_image?.time)}
                    </td>
                    <td className={styles.td}>{record ? toPercent(record.usage_rate) : "—"}</td>
                    <td className={styles.td}>{kestrelFrequency(record)}</td>
                    <td className={styles.td}>
                      {formatDateTime(box.last_identified_kestrel?.date, box.last_identified_kestrel?.time)}
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