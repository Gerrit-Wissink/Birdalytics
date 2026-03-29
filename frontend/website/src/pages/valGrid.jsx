import React, { useEffect, useState, useMemo } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import BirdBoxSelect from '../components/cameraSelect'
import FakeRecords from '../fake-data/birdbox_records.json'
import FakeBoxes from '../fake-data/birdboxes.json'

import styles from './valGrid.module.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

export default function ValGrid({ boxesData }){

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    // HELPER FUNCTIONS
    const capitalize = (str) => {
        if (!str) return '';
        return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const getConfidenceBg = (score) => {
        if (score === null || score === undefined) return 'transparent';
        const num = parseFloat(score);
        if (num < 0.5) return '#FFC572';
        if (num < 0.8) return '#FFE372';
        return 'transparent';
    };

    const formatConfidencePct = (score) => {
        if (score === null || score === undefined) return null;
        return `${Math.round(parseFloat(score) * 100)}%`;
    };

    //FILTER AND SORT -- Hoping to pull this out and make it it's own component across this and camera-table
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
    
    const SORT_FIELD_OPTIONS = [
        { label: 'Date', value: 'timestamp' },
        { label: 'Confidence Score', value: 'primary_guess_confidence' },
    ];
    
    const SORT_ORDER_OPTIONS = [
        { label: 'Ascending', value: 1 },
        { label: 'Descending', value: -1 },
    ];

    // const { birdboxes = [], birdbox_records = [] } = boxesData ?? {};  
    // UNCOMMENT ABOVE AND DELETE BELOW
        const birdboxes = FakeBoxes.birdboxes;
        const birdbox_records = FakeRecords.birdbox_records;

    // Camera sselect state, default to all selected
    const [selectedBoxNames, setSelectedBoxNames] = useState(
        () => birdboxes.map((b) => b.birdbox_name)
    );
    
    // Search + panel visibility
    const [globalFilter, setGlobalFilter] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    
    // Filter states (mirrors camera-table.jsx)
    const [birdFilter, setBirdFilter] = useState('all');
    const [dateRange, setDateRange] = useState(null);
    const [confidenceFilter, setConfidenceFilter] = useState('all');
    const [modifiedFilter, setModifiedFilter] = useState('all');
    
    // Sort states
    const [sortField, setSortField] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState(-1); // newest first by default

    //FLATTENING RECORDS

    // Map box IDs to their name for easier look-up
    const boxNameById = useMemo(() => {
        const map = {};
        birdboxes.forEach((b) => { map[b.birdbox_id] = b.birdbox_name; });
        return map;
    }, [birdboxes]);
    
    const allRecords = useMemo(() => {
    return birdbox_records
        .filter((boxRecord) => {
            const name = boxNameById[boxRecord.birdbox_id];
            return selectedBoxNames.includes(name);
        })
        .flatMap((boxRecord) =>
            (boxRecord.images ?? boxRecord.records ?? []).map((rec) => ({
                ...rec,
                image_url: rec.image_url ?? rec.photo_url,
                primary_guess: rec.primary_guess ?? rec.identified_result,
                primary_guess_confidence: rec.primary_guess_confidence ?? rec.confidence_score,
                birdbox_id: boxRecord.birdbox_id,
                birdbox_name: boxNameById[boxRecord.birdbox_id] ?? '—',
                _datetime: rec.timestamp
                    ? new Date(rec.timestamp)
                    : new Date(`${rec.date}T${rec.time}`),
            }))
        );
}, [birdbox_records, selectedBoxNames, boxNameById]);

    // Get species filter options from existing results
  const birdOptions = useMemo(() => {
    const unique = [...new Set(allRecords.map((r) => r.primary_guess).filter(Boolean))].sort();
    return [
      { label: 'All Species', value: 'all' },
      ...unique.map((b) => ({ label: capitalize(b), value: b })),
    ];
  }, [allRecords]);

    // FILTERS
  const filteredRecords = useMemo(() => {
    return allRecords.filter((row) => {
      // Global search (species and camera name)
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        const matchesSearch =
          (row.primary_guess ?? '').toLowerCase().includes(q) ||
          (row.birdbox_name ?? '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
 
      // Species
      if (birdFilter !== 'all' && row.primary_guess !== birdFilter) return false;
 
      // Date range
      if (dateRange !== null) {
        const [start, end] = dateRange;
        if (start && row._datetime < start) return false;
        if (end) {
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (row._datetime > endOfDay) return false;
        }
      }
 
      // Confidence
      const conf = row.primary_guess_confidence !== null ? parseFloat(row.primary_guess_confidence) : null;
      if (confidenceFilter === 'high' && (conf === null || conf < 0.8)) return false;
      if (confidenceFilter === 'medium' && (conf === null || conf < 0.5 || conf >= 0.8)) return false;
      if (confidenceFilter === 'low' && (conf === null || conf >= 0.5)) return false;
 
      // Modified
      if (modifiedFilter === 'modified' && !row.modified_bird) return false;
      if (modifiedFilter === 'unmodified' && row.modified_bird) return false;
 
      return true;
    });
  }, [allRecords, globalFilter, birdFilter, dateRange, confidenceFilter, modifiedFilter]);
 
    // SORTING
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'timestamp') {
        aVal = a._datetime;
        bVal = b._datetime;
      } else {
        aVal = a.primary_guess_confidence !== null ? parseFloat(a.primary_guess_confidence) : -1;
        bVal = b.primary_guess_confidence !== null ? parseFloat(b.primary_guess_confidence) : -1;
      }
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });
  }, [filteredRecords, sortField, sortOrder]);

    // COUNT ACTIVE FILTERS
  const activeFilterCount = [
    birdFilter !== 'all',
    dateRange !== null,
    confidenceFilter !== 'all',
    modifiedFilter !== 'all',
  ].filter(Boolean).length;
 
  const handleClearFilters = () => {
    setBirdFilter('all');
    setDateRange(null);
    setConfidenceFilter('all');
    setModifiedFilter('all');
  };

  // FILTER SORT AND SEARCH HEADER
  const header = (
    <div className={styles.header}>
 
      {/* Row 1: Camera selector, search,  filter/sort buttons */}
      <div className={styles.topRow}>
        <BirdBoxSelect
          boxes={birdboxes}
          selectedBoxNames={selectedBoxNames}
          setSelectedBoxNames={setSelectedBoxNames}
        />
 
        <div className={styles.searchAndActions}>
          <span className={styles.searchWrapper}>
            <SearchRoundedIcon className={styles.searchIcon} />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search"
              className={styles.searchInput}
            />
          </span>
 
          <button
            className={`${styles.actionButton} ${filterOpen ? styles.actionButtonActive : ''}`}
            onClick={() => setFilterOpen((p) => !p)}
          >
            <FilterListRoundedIcon style={{ fontSize: '1.25rem' }} />
            Filters
            {activeFilterCount > 0 && (
              <span className={styles.badge}>{activeFilterCount}</span>
            )}
          </button>

          <div className={styles.sortInline}>
            <span className={styles.sortLabel}>Sort by:</span>
            <Dropdown
              value={sortField}
              options={SORT_FIELD_OPTIONS}
              onChange={(e) => setSortField(e.value)}
              className={styles.sortDropdown}
            />
            <Dropdown
              value={sortOrder}
              options={SORT_ORDER_OPTIONS}
              onChange={(e) => setSortOrder(e.value)}
              className={styles.sortDropdown}
            />
          </div>
        </div>
      </div>
 
      {/* Row 2: Filter panel (when opened) */}
      {filterOpen && (
        <div className={styles.panelRow}>
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              value={birdFilter}
              options={birdOptions}
              onChange={(e) => setBirdFilter(e.value)}
              placeholder="Species"
              filter
            />
          </div>
 
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
              style={{ width: '220px' }}
            />
          </div>
 
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              value={confidenceFilter}
              options={CONFIDENCE_OPTIONS}
              onChange={(e) => setConfidenceFilter(e.value)}
              placeholder="Confidence"
            />
          </div>
 
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              value={modifiedFilter}
              options={MODIFIED_OPTIONS}
              onChange={(e) => setModifiedFilter(e.value)}
              placeholder="Modified"
            />
          </div>
 
          {activeFilterCount > 0 && (
            <button className={styles.clearAllButton} onClick={handleClearFilters}>
              Clear all
            </button>
          )}
        </div>
      )}
 
    </div>
  );
    
  // DATAVIEW CARD LAYOUT
    const cardTemplate = (record) => {
        console.log('IMAGE: ', record.image_url)
        const conf = record.primary_guess_confidence;
        const confBg = getConfidenceBg(conf);
        const confPct = formatConfidencePct(conf);
        const imageUrl = record.image_url
        ? record.image_url.startsWith('http')
            ? record.image_url
            : `https://birdalytics.webdev.gccis.rit.edu/api/${record.image_url}`
        : null;

        return (
        <div className={styles.cardCol} key={record.image_id ?? record.record_id}>
            <div className={styles.card}>

            {/* Top row: camera name + confidence badge */}
            <div className={styles.cardTop}>
                <span className={styles.cameraLabel}>
                <PhotoCameraOutlinedIcon style={{ fontSize: '1rem', marginRight: '4px', flexShrink: 0 }} />
                {record.birdbox_name}
                </span>
                {confPct && (
                <span
                    className={styles.confBadge}
                    style={{ background: confBg !== 'transparent' ? confBg : '#e8f5e9' }}
                >
                    {confPct}
                </span>
                )}
            </div>

            {/* Image */}
            <div className={styles.imageWrapper}>
                {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={record.primary_guess ?? 'Unknown  image'}
                    className={styles.cardImage}
                />
                ) : (
                <div className={styles.noImage}>No image</div>
                )}
            </div>

            {/* Species label */}
            <div className={styles.cardFooter}>
                <span className={styles.speciesLabel}>
                {record.primary_guess ? capitalize(record.primary_guess) : <span className={styles.noGuess}>Unidentified</span>}
                </span>
            </div>

            </div>
        </div>
        );
    };
 
    console.log('SORTED RECORDS: ', sortedRecords)
    return(
        <>
        <section id='container'>
            <h1>Validation Grid Page</h1>
            <div className={styles.wrapper}>
                <style>{PRIMEREACT_OVERRIDES}</style>
                <DataView
                    value={sortedRecords}
                    layout="grid"
                    header={header}
                    itemTemplate={cardTemplate}
                    paginator
                    rows={12}
                    rowsPerPageOptions={[12, 24, 48]}
                    emptyMessage="No images match your filters."
                />
            </div>
        </section>
        </>
    )
}

// ─── PrimeReact global overrides ─────────────────────────────────────────────
const PRIMEREACT_OVERRIDES = `
    .p-dataview .p-dataview-content {
        background: transparent !important;
    }
    .p-dataview-content > div {
        display: flex;
        flex-wrap: wrap;
        gap: 0;
    }
    .p-dataview-content > div > div {
        width: 25%;
        box-sizing: border-box;
    }
    @media (max-width: 1200px) { .p-dataview-content > div > div { width: 33.333%; } }
    @media (max-width: 800px)  { .p-dataview-content > div > div { width: 50%; } }
    @media (max-width: 480px)  { .p-dataview-content > div > div { width: 100%; } }
    .p-dropdown:not(.p-disabled).p-focus {
        border-color: #5b8dee !important;
        box-shadow: 0 0 0 2px #d0e0ff !important;
    }
    .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
        background: #B8CEEF !important;
        border-radius: 6px;
    }
`;