import { useState, useMemo } from 'react';

export const CONFIDENCE_OPTIONS = [
  { label: 'All Confidence Scores', value: 'all' },
  { label: '80%+', value: 'high' },
  { label: '50–79%', value: 'medium' },
  { label: 'Below 50%', value: 'low' },
];

export const MODIFIED_OPTIONS = [
  { label: 'All Modified Statuses', value: 'all' },
  { label: 'Modified only', value: 'modified' },
  { label: 'Unmodified only', value: 'unmodified' },
];


// rows         — the full array of records to filter
// modifiedKey  — the field name used to check modified status.
//                camera-table uses 'modified_date', valGrid uses 'modified_bird'

export default function useFilters(rows, { modifiedKey = 'modified_bird' } = {}) {

  const [birdFilter, setBirdFilter]           = useState('all');
  const [dateRange, setDateRange]             = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [modifiedFilter, setModifiedFilter]   = useState('all');

  // Get unique species options from the current set of data
  const birdOptions = useMemo(() => {
    const unique = [
      ...new Set(rows.map((r) => r.primary_guess).filter(Boolean)),
    ].sort();
    return [
      { label: 'All Species', value: 'all' },
      ...unique.map((b) => ({ label: capitalize(b), value: b })),
    ];
  }, [rows]);

  // Apply all active filters
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const species = row.modified_bird ?? row.primary_guess;

      // Species
      if (birdFilter !== 'all' && species !== birdFilter) return false;

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
      // If _confidence is pre-computed, use it; otherwise calculate from raw fields
      let conf = row._confidence;
      if (conf === undefined || conf === null) {
        conf = row.modified_bird ? 1
          : row.primary_guess_confidence != null
          ? parseFloat(row.primary_guess_confidence)
          : null;
      }
      if (confidenceFilter === 'high'   && (conf === null || conf < 0.8))                   return false;
      if (confidenceFilter === 'medium' && (conf === null || conf < 0.5 || conf >= 0.8))    return false;
      if (confidenceFilter === 'low'    && (conf >= 0.5))                                   return false;

      // Modified — uses whichever field the parent specifies
      const isModified = !!row[modifiedKey];
      if (modifiedFilter === 'modified'   && !isModified) return false;
      if (modifiedFilter === 'unmodified' &&  isModified) return false;

      return true;
    });
  }, [rows, birdFilter, dateRange, confidenceFilter, modifiedFilter, modifiedKey]);

  // Count active (non-default) filters
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

  return {
    // State + setters (passed to BirdFilterPanel)
    birdFilter,    setBirdFilter,
    dateRange,     setDateRange,
    confidenceFilter, setConfidenceFilter,
    modifiedFilter,   setModifiedFilter,
    // Derived
    birdOptions,
    filteredRows,
    activeFilterCount,
    handleClearFilters,
  };
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}