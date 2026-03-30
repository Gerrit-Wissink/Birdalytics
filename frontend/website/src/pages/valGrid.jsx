import React, { useEffect, useState, useMemo } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import BirdBoxSelect from '../components/cameraSelect'
import FakeRecords from '../fake-data/birdbox_records.json'
import FakeBoxes from '../fake-data/birdboxes.json'
import useFilters from '../components/useFilters'; 
import FilterPanel from '../components/filterPanel';

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

    //SORTS 
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
    
    // Sort states
    const [sortField, setSortField] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState(-1); // newest first by default

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

    // TODO: CONNECT TO SPECIES LIST IN DATABASE
    const SPECIES_OPTIONS = [
        { label: 'Kestrel', value: 'kestrel' },
        { label: 'Magpie', value: 'magpie' },
        { label: 'Pigeon', value: 'pigeon' },
    ];

    // Tracks user-selected species corrections keyed by record id
    const [speciesCorrections, setSpeciesCorrections] = useState({});

    const handleSpeciesCorrection = (recordId, newSpecies) => {
        setSpeciesCorrections((prev) => ({ ...prev, [recordId]: newSpecies }));
        // TODO: UPDATE IDENTIFICATION IN BACKEND
        //should rerender the species identification on change, and be sure to set the modification status to the date
    };

//all filters for useFilters hook
    const {
        birdFilter, setBirdFilter,
        dateRange, setDateRange,
        confidenceFilter, setConfidenceFilter,
        modifiedFilter, setModifiedFilter,
        birdOptions, filteredRows, activeFilterCount, handleClearFilters,
    } = useFilters(allRecords, { modifiedKey: 'modified_bird' });
 
    // SORTING
  const sortedRecords = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
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
  }, [filteredRows, sortField, sortOrder]);

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
    
  // DATAVIEW CARD LAYOUT
    const cardTemplate = (record) => {
        console.log('IMAGE: ', record.image_url)
        const recordId = record.image_id ?? record.record_id;
        const conf = record.primary_guess_confidence;
        const confBg = getConfidenceBg(conf);
        const confPct = formatConfidencePct(conf);
        const imageUrl = record.image_url
        ? record.image_url.startsWith('http')
            ? record.image_url
            : `https://birdalytics.webdev.gccis.rit.edu/api/${record.image_url}`
        : null;

        // Use corrected species if the user has picked one, otherwise fall back to the model's guess
        const displaySpecies = speciesCorrections[recordId] ?? record.primary_guess;

        return (
        <div className={styles.cardCol} key={recordId}>
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
                    style={{ background: confBg !== 'transparent' ? confBg : '#bae098' }}
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

            {/* Species label — reflects correction if one has been selected */}
            <div className={styles.cardFooter}>
                <span className={styles.speciesLabel}>
                {displaySpecies ? capitalize(displaySpecies) : <span className={styles.noGuess}>Unidentified</span>}
                </span>

                {/* Correction dropdown — editable prop enables free-text search */}
                <div style={{width: '100%'}}>
                    <p className={styles.dropdownLabel}>Update Identification Result:</p>
                </div>
                <Dropdown
                    value={speciesCorrections[recordId] ?? record.primary_guess ?? null}
                    options={SPECIES_OPTIONS}
                    onChange={(e) => handleSpeciesCorrection(recordId, e.value)}
                    placeholder="Correct species..."
                    editable
                    className={styles.correctionDropdown}
                    showClear={!!speciesCorrections[recordId]}
                />
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
    /* Correction dropdown inside cards */
    .p-dropdown.p-component {
        border-radius: 8px !important;
        font-size: 0.825rem !important;
    }
    .p-dropdown:not(.p-disabled):hover {
        border-color: #9ca3af !important;
    }
`;