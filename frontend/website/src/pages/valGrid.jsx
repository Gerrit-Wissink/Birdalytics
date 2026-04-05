import React, { useEffect, useState, useMemo } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import BirdBoxSelect from '../components/cameraSelect'
import useFilters from '../components/useFilters'; 
import FilterPanel from '../components/filterPanel';
import apiClient from '../utils/apiClient';

import styles from './valGrid.module.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

export default function ValGrid(){

    const [boxesData, setBoxesData] = useState([]);

    // Camera select state, default to all selected
    const [selectedBoxNames, setSelectedBoxNames] = useState([]);
    
    // Search + panel visibility
    const [globalFilter, setGlobalFilter] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    
    // Sort states
    const [sortField, setSortField] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState(-1); // newest first by default

    // Tracks user-selected species corrections keyed by record id
    const [speciesCorrections, setSpeciesCorrections] = useState({});
    const [speciesOptions, setSpeciesOptions] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);


    useEffect(() => {
        const fetchBoxesData = async () => {
            try {
                const response = await apiClient.get('/boxes/record');
                console.log('Fetch boxes data response:', response);
                if (response.status === 200) {
                    const data = response.data.data;
                    console.log('Boxes data:', data);
                    setBoxesData(data);
                } else {
                    console.error('Failed to fetch boxes data:', response.status);
                }
            } catch (error) {
                console.error('Error fetching boxes data:', error);
            }
        };

        fetchBoxesData();
    }, []);

    useEffect(() => {
        setSelectedBoxNames(boxesData.map((b) => b.birdbox_name)); // Select all by default
    }, [boxesData]);

    // Map box IDs to their name for easier look-up
    const boxNameById = useMemo(() => {
        const map = {};
        boxesData.forEach((b) => { map[b.birdbox_id] = b.birdbox_name; });
        return map;
    }, [boxesData]);
    
    const allRecords = useMemo(() => {
        return boxesData
            .flatMap((box) =>
                (box.records ?? []).map((rec) => ({
                    ...rec,
                    birdbox_id: box.birdbox_id,
                    birdbox_name: box.birdbox_name,
                    _datetime: rec.timestamp
                        ? new Date(rec.timestamp)
                        : new Date(),
                }))
            )
            .filter((rec) => selectedBoxNames.includes(rec.birdbox_name));
    }, [boxesData, selectedBoxNames]);

    const handleSaveChanges = async () => {
        try {
            let result;
            for(const [record_id, newSpecies] of Object.entries(speciesCorrections)) {
                if (!newSpecies || newSpecies === '') continue; // Skip if cleared
                result = await apiClient.put(`/record/manual/${record_id}`, { manual_bird: newSpecies });
                if (result.status !== 200) {
                    console.error(`Failed to update record ${record_id}:`, result);
                }
            }
        }catch (error) {
            console.error('Error saving changes:', error);
            // Optionally show an error message to the user
        }
    }

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

    // TODO: CONNECT TO SPECIES LIST IN DATABASE
    const SPECIES_OPTIONS = [
        { label: 'Kestrel', value: 'kestrel' },
        { label: 'Magpie', value: 'magpie' },
        { label: 'Pigeon', value: 'pigeon' },
    ];

    const [speciesOptions, setSpeciesOptions] = useState([]);
    useEffect(() => {
        const fetchSpeciesOptions = async () => {
            try {
                // TODO: Replace with actual API call to fetch species options
                const response = await apiClient.get('/species');
                if(response.status === 200) {
                    const optionsFromAPI = response.data.data.map(species => ({
                        label: capitalize(species.species_name),
                        value: species.species_name
                    }));
                    setSpeciesOptions(optionsFromAPI);
                } else {
                    console.error('Failed to fetch species options:', response.status);
                    setSpeciesOptions(SPECIES_OPTIONS); // Fallback to hardcoded options
                }
            } catch (error) {
                console.error('Error fetching species options:', error);
            }
        };

        fetchSpeciesOptions();
    }, []);

    const handleSpeciesCorrection = (recordId, newSpecies) => {
        setSpeciesCorrections((prev) => ({ ...prev, [recordId]: newSpecies }));
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
        aVal = a.modified_bird ? 1 : a.primary_guess_confidence !== null ? parseFloat(a.primary_guess_confidence) : -1;
        bVal = b.modified_bird ? 1 : b.primary_guess_confidence !== null ? parseFloat(b.primary_guess_confidence) : -1;
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
          boxes={boxesData}
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
            birdOptions={speciesOptions ?? birdOptions}
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
        const conf = record.modified_bird ? 1 : record.primary_guess_confidence;
        const confBg = getConfidenceBg(conf);
        const confPct = formatConfidencePct(conf);
        const imageUrl = record.image_url
        ? record.image_url.startsWith('http')
            ? record.image_url
            : `https://birdalytics.webdev.gccis.rit.edu/api/${record.image_url}`
        : null;

        // Use corrected species if the user has picked one, otherwise fall back to the model's guess
        const displaySpecies = speciesCorrections[recordId] ?? record.modified_bird ?? record.primary_guess;

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
                    alt={record.modified_bird ?? record.primary_guess ?? 'Unknown  image'}
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
                    options={speciesOptions}
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
                    rows={12}
                    rowsPerPageOptions={[12, 24, 48]}
                    emptyMessage="No images match your filters."
                    style={{marginBottom: '5%'}}
                />
            {Object.keys(speciesCorrections).length > 0 &&
                <div id={styles.saveBanner}onClick={handleSaveChanges}>
                    Click to save all changes
                </div>
            }
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