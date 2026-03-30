import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { CONFIDENCE_OPTIONS, MODIFIED_OPTIONS } from './useFilters';
import styles from './FilterPanel.module.css';

// Renders the four filter controls and a "Clear all" button.
//
// Required props:
//   birdFilter, setBirdFilter
//   dateRange, setDateRange
//   confidenceFilter, setConfidenceFilter
//   modifiedFilter, setModifiedFilter
//   birdOptions         — taken from useFilter
//   activeFilterCount   — taken from useFilter
//   handleClearFilters  — taken from useFilter

export default function FilterPanel({
  birdFilter,    setBirdFilter,
  dateRange,     setDateRange,
  confidenceFilter, setConfidenceFilter,
  modifiedFilter,   setModifiedFilter,
  birdOptions,
  activeFilterCount,
  handleClearFilters,
}) {
  return (
    <div className={styles.panelRow}>

      {/* Species */}
      <div onClick={(e) => e.stopPropagation()}>
        <Dropdown
          value={birdFilter}
          options={birdOptions}
          onChange={(e) => setBirdFilter(e.value)}
          placeholder="Species"
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
          style={{ width: '220px' }}
        />
      </div>

      {/* Confidence score */}
      <div onClick={(e) => e.stopPropagation()}>
        <Dropdown
          value={confidenceFilter}
          options={CONFIDENCE_OPTIONS}
          onChange={(e) => setConfidenceFilter(e.value)}
          placeholder="Confidence"
        />
      </div>

      {/* Modified status */}
      <div onClick={(e) => e.stopPropagation()}>
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
  );
}