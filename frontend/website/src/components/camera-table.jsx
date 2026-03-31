import React, { useState, useMemo, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import PhotoOutlinedIcon from '@mui/icons-material/PhotoOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import useFilters from '../components/useFilters'; 
import FilterPanel from '../components/filterPanel';

import styles from './camera-table.module.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

// ─── Helper functions ────────────────────────────────────────────────────────

const capitalize = (str) => {
  if (!str) return '';
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const formatModifiedDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const parseImages = (box) => {
  if (!box?.records) return [];
  return box.records.map((record) => ({
    ...record,
    _datetime: new Date(`${record.timestamp}`),
  }));
};

const getConfidenceBg = (score) => {
  if (score < 0.5) return '#FFC572';
  if (score < 0.8) return '#FFE372';
  return 'transparent';
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BirdboxImageTable({ box, onSelectRow }) {
  const rows = useMemo(() => parseImages(box), [box]);

  // Selection — auto-initialize to first row
  const [selectedRow, setSelectedRow] = useState(() => rows[0] ?? null);

  // Search + filter visibility
  const [globalFilter, setGlobalFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  //all filters for useFilters hook
  const {
    birdFilter, setBirdFilter,
    dateRange, setDateRange,
    confidenceFilter, setConfidenceFilter,
    modifiedFilter, setModifiedFilter,
    birdOptions, filteredRows, activeFilterCount, handleClearFilters,
  } = useFilters(rows, { modifiedKey: 'modified_date' });

  // Reset to first row when birdbox ID changes
  useEffect(() => {
    const first = rows[0] ?? null;
    setSelectedRow(first);
    if (onSelectRow) onSelectRow(first);
  }, [box?.birdbox_id]);

  const handleRowSelect = (e) => {
    setSelectedRow(e.value);
    if (onSelectRow) onSelectRow(e.value);
  };

  // ─── Column templates ──────────────────────────────────────────────────────

  const dateTimeTemplate = (row) => {
    if (!row.timestamp) return <span className={styles.dateCell}>—</span>;
    const date = new Date(row.timestamp);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return <span className={styles.dateCell}>{dateStr} - {timeStr}</span>;
  };

  const birdTemplate = (row) => {
    console.log(row);
    if(!row.primary_guess) {
      return <span className={styles.noBird}>None</span>;
    }
    if (row.primary_guess.includes('kestrel')) {
      return <span className={styles.kestrelBadge}>{capitalize(row.primary_guess)}</span>;
    }
    return <span className={styles.birdPlain}>{capitalize(row.primary_guess)}</span>;
  };

  const confidenceTemplate = (row) => {
    if(!row.primary_guess_confidence) {
      return <span className={styles.noConfidence}>—</span>;
    }
    const pctNum = parseFloat(row.primary_guess_confidence);
    const pct = Math.round(pctNum * 100);
    const bg = getConfidenceBg(pctNum);
    return (
      <span
        className={bg !== 'transparent' ? styles.confidenceHighlight : styles.confidencePlain}
        style={bg !== 'transparent' ? { background: bg } : undefined}
      >
        {pct}%
      </span>
    );
  };

  const viewImageTemplate = (row) => (
    <span 
      className={styles.viewImageCell}
      onClick={() => {
        e.stopPropagation(); // Prevent row selection when clicking the icon
        const imageUrl = `https://birdalytics.webdev.gccis.rit.edu/api/${row.image_url}`;
        if (imageUrl) {
          window.open(imageUrl, '_blank');
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <PhotoOutlinedIcon style={{ fontSize: '1.7rem' }} />
    </span>
  );

  const modifiedTemplate = (row) => {
    // RIGHT NOW THIS WILL ALWAYS RETURN FALSE
    const display = formatModifiedDate(row.modified_date ?? '-');
    return row.modified_bird
      ? <span className={styles.modifiedDate}>{display}</span>
      : <span className={styles.modifiedDash}>—</span>;
  };

  // ─── Table header: search bar + filters toggle + inline filter row ─────────

  const tableHeader = (
    <div className={styles.tableHeader}>

      {/* Row 1: search + filters button */}
      <div className={styles.searchRow}>
        <span className={styles.searchWrapper}>
          <SearchRoundedIcon className={styles.searchIcon} />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search table"
            className={styles.searchInput}
          />
        </span>

        <Button
          onClick={() => setFilterOpen((prev) => !prev)}
          className={`${styles.filtersButton} ${filterOpen ? styles.filtersButtonActive : ''}`}
        >
          <FilterListRoundedIcon style={{ fontSize: '1.5rem' }} />
          Filters
          {activeFilterCount > 0 && (
            <span className={styles.filtersBadge}>{activeFilterCount}</span>
          )}
        </Button>
      </div>

      {/* Row 2: inline filter dropdowns — visible when filterOpen */}
      {filterOpen && (
        <FilterPanel
          birdFilter={birdFilter}         setBirdFilter={setBirdFilter}
          dateRange={dateRange}           setDateRange={setDateRange}
          confidenceFilter={confidenceFilter} setConfidenceFilter={setConfidenceFilter}
          modifiedFilter={modifiedFilter} setModifiedFilter={setModifiedFilter}
          birdOptions={birdOptions}
          activeFilterCount={activeFilterCount}
          handleClearFilters={handleClearFilters}
        />
      )}
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.tableWrapper}>
      <style>{PRIMEREACT_OVERRIDES}</style>

      <DataTable
        value={filteredRows}
        header={tableHeader}
        selectionMode="single"
        selection={selectedRow}
        onSelectionChange={handleRowSelect}
        dataKey="record_id"
        globalFilter={globalFilter}
        globalFilterFields={['identified_result', 'date', 'time']}
        sortMode="single"
        removableSort
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No images match your filters."
        style={{ background: 'transparent' }}
        pt={{
          root: { style: { background: 'transparent', border: 'none' } },
          wrapper: { style: { background: '#fff', borderRadius: '12px', border: '1.5px solid #e8e8e8', padding: '.5em .75em' } },
          table: { style: { borderCollapse: 'separate', borderSpacing: 0 } },
          thead: { style: { background: 'transparent' } },
          headerRow: { style: { background: 'transparent' } },
          headerCell: {
            style: {
              background: '#fff',
              borderBottom: '2px solid #e8e8e8',
              color: '#1a1a1a',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '14px 20px',
            },
          },
          bodyRow: { style: { cursor: 'pointer', transition: 'background 0.15s', borderRadius: '12px' } },
          bodyCell: {
            style: {
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 20px',
              verticalAlign: 'middle',
            },
          },
          paginator: { style: { background: 'transparent', border: 'none', paddingTop: '14px' } },
        }}
      >
        <Column field="date" header="Date - Time" sortable sortField="_datetime" body={dateTimeTemplate} style={{ minWidth: '210px' }} />
        <Column field="identified_result" header="Identified Result" sortable body={birdTemplate} style={{ minWidth: '160px' }} />
        <Column field="confidence_score" header="Confidence" sortable body={confidenceTemplate} style={{ minWidth: '120px' }} headerStyle={{ textAlign: 'center' }} />
        <Column header="View Image" body={viewImageTemplate} style={{ minWidth: '110px' }} headerStyle={{ textAlign: 'center' }} />
        <Column field="modified_date" header="Modified" body={modifiedTemplate} style={{ minWidth: '100px' }} headerStyle={{ textAlign: 'center' }} />
      </DataTable>
    </div>
  );
}

// ─── PrimeReact global overrides ─────────────────────────────────────────────

const PRIMEREACT_OVERRIDES = `
.p-datatable .p-datatable-tbody > tr:hover > td {
    background: #eef3ff !important;
}
.p-datatable .p-datatable-tbody > tr.p-highlight > td {
    background: #dde8ff !important;
    color: var(--text) !important;
}
.p-datatable .p-datatable-tbody > tr.p-highlight:hover > td {
    background: #ccd9ff !important;
}
.p-datatable td{
    color: var(--text) !important;
}
.p-datatable .p-sortable-column.p-highlight .p-sortable-column-icon {
    color: #5b8dee !important;
}
.p-datatable .p-sortable-column:hover {
    background: #f5f7ff !important;
    color: inherit !important;
}
.p-column-title {
    padding-right: .5em;
}
.p-column-header-content {
    font-weight: 600;
}

.p-selectable-row > td:first-child {
    padding-left: .5em;
    border-radius: 8px 0px 0px 8px;
}
.p-selectable-row > td:last-child {
    border-radius: 0px 8px 8px 0px;
}
.p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
    background: #B8CEEF !important;
    border-radius: 6px;
}
.p-paginator-pages * {
    font-size: 1rem;
    padding: .5em;
    color: var(--text);
}
.p-dropdown:not(.p-disabled).p-focus {
    border-color: #5b8dee !important;
    box-shadow: 0 0 0 2px #d0e0ff !important;
}
.p-dropdown-items-wrapper {
    background-color: var(--background);
    padding: .25em .5em;
    border: 1px solid var(--stroke);
    border-radius: 8px;
}
.p-dropdown-item {
    padding-bottom: 4px;
}
.p-datepicker{
    background-color: var(--background);
    border: 1px solid var(--stroke);
    padding: .5em;
    border-radius: 8px;
}
`;
