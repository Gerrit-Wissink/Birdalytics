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
import styles from './camera-table.module.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

// ─── Helper functions ────────────────────────────────────────────────────────

const capitalize = (str) => {
  if (!str) return '';
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const formatDateDisplay = (dateStr, timeStr) => {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' - ' + (timeStr || '00:00:00');
};

const formatModifiedDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const parseImages = (birdboxRecord) => {
  if (!birdboxRecord?.images) return [];
  return birdboxRecord.images.map((img) => ({
    ...img,
    _datetime: new Date(`${img.date}T${img.time}`),
  }));
};

const getConfidenceBg = (score) => {
  if (score < 0.5) return '#FFC572';
  if (score < 0.8) return '#FFE372';
  return 'transparent';
};

// ─── Filter option constants ─────────────────────────────────────────────────

const CONFIDENCE_OPTIONS = [
  { label: 'All Confidence Scores', value: 'all' },
  { label: '80%+', value: 'high' },
  { label: '50–79%', value: 'medium' },
  { label: 'Below 50%', value: 'low' },
];

const MODIFIED_OPTIONS = [
  { label: 'All Modified Statuses', value: 'all' },
  { label: 'Modified only', value: 'modified' },
  { label: 'Unmodified only', value: 'unmodified' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BirdboxImageTable({ birdboxRecord, selectedImageRef }) {
  console.log('PASSED IN RECORD: ', birdboxRecord);

  const rows = useMemo(() => parseImages(birdboxRecord), [birdboxRecord]);

  // Selection — auto-initialize to first row
  const [selectedImage, setSelectedImage] = useState(() => rows[0] ?? null);

  // Search + filter visibility
  const [globalFilter, setGlobalFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter states
  const [birdFilter, setBirdFilter] = useState('all');
  const [dateRange, setDateRange] = useState((null));
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [modifiedFilter, setModifiedFilter] = useState('all');

  // Derive unique bird options from the data
  const birdOptions = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.identified_result))].sort();
    return [
      { label: 'All Species', value: 'all' },
      ...unique.map((b) => ({ label: capitalize(b), value: b })),
    ];
  }, [rows]);

  // Apply all active filters
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (birdFilter !== 'all' && row.identified_result !== birdFilter) return false;

    if (dateRange !== null) {
        const [start, end] = dateRange;
        if (start && row._datetime < start) return false;
        if (end) {
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            if (row._datetime > endOfDay) return false;
        }
    }

      if (confidenceFilter === 'high' && row.confidence_score < 0.8) return false;
      if (confidenceFilter === 'medium' && (row.confidence_score < 0.5 || row.confidence_score >= 0.8)) return false;
      if (confidenceFilter === 'low' && row.confidence_score >= 0.5) return false;

      if (modifiedFilter === 'modified' && !row.modified_date) return false;
      if (modifiedFilter === 'unmodified' && row.modified_date) return false;

      return true;
    });
  }, [rows, birdFilter, dateRange, confidenceFilter, modifiedFilter]);

  // Count active (non-default) filters for the badge
  const activeFilterCount = [
    birdFilter !== 'all',
    dateRange !== null,
    confidenceFilter !== 'all',
    modifiedFilter !== 'all',
  ].filter(Boolean).length;

  // Keep ref in sync for parent access
  useEffect(() => {
    if (selectedImageRef) selectedImageRef.current = selectedImage;
  }, [selectedImage, selectedImageRef]);

  // Reset to first row when birdbox changes
  useEffect(() => {
    const first = rows[0] ?? null;
    setSelectedImage(first);
    if (selectedImageRef) selectedImageRef.current = first;
  }, [birdboxRecord.birdbox_id]);

  const handleRowSelect = (e) => {
    setSelectedImage(e.value);
    if (selectedImageRef) selectedImageRef.current = e.value;
  };

  const handleClearFilters = () => {
    setBirdFilter('all');
    setDateRange(null);
    setConfidenceFilter('all');
    setModifiedFilter('all');
  };

  // ─── Column templates ──────────────────────────────────────────────────────

  const dateTimeTemplate = (row) => (
    <span className={styles.dateCell}>{formatDateDisplay(row.date, row.time)}</span>
  );

  const birdTemplate = (row) => {
    if (row.identified_result === 'kestrel') {
      return <span className={styles.kestrelBadge}>{capitalize(row.identified_result)}</span>;
    }
    return <span className={styles.birdPlain}>{capitalize(row.identified_result)}</span>;
  };

  const confidenceTemplate = (row) => {
    const pct = Math.round(row.confidence_score * 100);
    const bg = getConfidenceBg(row.confidence_score);
    return (
      <span
        className={bg !== 'transparent' ? styles.confidenceHighlight : styles.confidencePlain}
        style={bg !== 'transparent' ? { background: bg } : undefined}
      >
        {pct}%
      </span>
    );
  };

  const viewImageTemplate = () => (
    <span className={styles.viewImageCell}>
      <PhotoOutlinedIcon style={{ fontSize: '1.7rem' }} />
    </span>
  );

  const modifiedTemplate = (row) => {
    const display = formatModifiedDate(row.modified_date);
    return display
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
        <div className={styles.filterRow}>

          {/* Bird type */}
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              value={birdFilter}
              options={birdOptions}
              onChange={(e) => setBirdFilter(e.value)}
              placeholder="Bird type"
              filter
            />
          </div>

          {/* Date range */}
          <div onClick={(e) => e.stopPropagation()}>
            <Calendar
              value={dateRange}
              onChange={(e) => setDateRange(e.value ?? null)}
              selectionMode="range"
              readOnlyInput
              placeholder="Date range"
              showButtonBar
              hideOnRangeSelection
              appendTo="self"
              style={{width: '220px', color: '#4b5563'}}
              onClick={(e) => {
                e.stopPropagation();
                console.log("DATES:", e.value)
            }}
                
            />
          </div>

          {/* Confidence score */}
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              value={confidenceFilter}
              options={CONFIDENCE_OPTIONS}
              onChange={(e) => setConfidenceFilter(e.value)}
              placeholder="Confidence"
              style={{
                fontSize: '1em'
              }}
            />
          </div>

          {/* Modified status */}
          <div className={styles.filterChip}  onClick={(e) => e.stopPropagation()}>
            <Dropdown
              value={modifiedFilter}
              options={MODIFIED_OPTIONS}
              onChange={(e) => setModifiedFilter(e.value)}
              placeholder="Modified"
            />
          </div>

          {/* Clear all — only shown when filters are active */}
          {activeFilterCount > 0 && (
            <button className={styles.clearAllButton} onClick={handleClearFilters}>
              Clear all
            </button>
          )}

        </div>
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
        selection={selectedImage}
        onSelectionChange={handleRowSelect}
        dataKey="image_id"
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