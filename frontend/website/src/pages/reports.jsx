import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const data = [
  { date: "2026-01-01", camera: "Box 1", species: "American Kestrel", confidence: "98%", type: "Bird" },
  { date: "2026-01-01", camera: "Box 2", species: "Other Bird", confidence: "76%", type: "Bird" },
  { date: "2026-01-02", camera: "Box 1", species: "Non-Bird", confidence: "91%", type: "Non-Bird" },
  { date: "2026-01-03", camera: "Box 3", species: "American Kestrel", confidence: "88%", type: "Bird" },
  { date: "2026-01-04", camera: "Box 4", species: "Other Bird", confidence: "65%", type: "Bird" },
];

// CSV Export
function exportCSV(data) {
  const headers = ["Date", "Camera", "Species", "Confidence", "Type"];
  const rows = data.map((r) => [r.date, r.camera, r.species, r.confidence, r.type]);
  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "birdalytics-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Excel Export
function exportExcel(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bird Records");
  XLSX.writeFile(workbook, "birdalytics-report.xlsx");
}

// PDF Export
function exportPDF(data) {
  const doc = new jsPDF();
  doc.text("Birdalytics Report", 14, 16);
  autoTable(doc, {
    head: [["Date", "Camera", "Species", "Confidence", "Type"]],
    body: data.map((r) => [r.date, r.camera, r.species, r.confidence, r.type]),
    startY: 22,
  });
  doc.save("birdalytics-report.pdf");
}

export default function Reports() {
  const [records] = useState(data);

  return (
    <section style={{ padding: "2rem" }}>
      <h1>Reports</h1>

      {/* Export Buttons */}
      <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
        <button onClick={() => exportCSV(records)}>Export CSV</button>
        <button onClick={() => exportExcel(records)}>Export Excel</button>
        <button onClick={() => exportPDF(records)}>Export PDF</button>
      </div>

      {/* Table */}
      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Camera</th>
            <th>Species</th>
            <th>Confidence</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.camera}</td>
              <td>{r.species}</td>
              <td>{r.confidence}</td>
              <td>{r.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}