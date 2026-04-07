import { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import apiClient from '../utils/apiClient';

import styles from '../pages/camInfo.module.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

// TODO: CONNECT TO SPECIES LIST IN DATABASE, THEN DELETE THIS
const SPECIES_OPTIONS = [
    { label: 'Kestrel', value: 'kestrel' },
    { label: 'Magpie', value: 'magpie' },
    { label: 'Pigeon', value: 'pigeon' },
];

const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function SpeciesIdentification({ selectedRow, imageMap, birdboxName, onSpeciesOverride, speciesOptions = SPECIES_OPTIONS }) {
    // Tracks which option row is currently selected (index: 0 = primary, 1 = other[0], 2 = other[1])
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    // Tracks a manual species selection from the dropdown (null = nothing chosen yet)
    const [manualSpecies, setManualSpecies] = useState(null);

    // Reset selections whenever a new row is chosen from the table
    useEffect(() => {
        setSelectedOptionIndex(0);
        setManualSpecies(null);
    }, [selectedRow?.record_id]);

    if (!selectedRow) {
        return <p style={{ color: 'var(--text-muted, #888)', marginTop: '1em' }}>Select a row to view details.</p>;
    }

    const primaryConf = selectedRow.modified_bird ? 100 
        : selectedRow.primary_guess_confidence != null
        ? Math.round(selectedRow.primary_guess_confidence * 100)
        : null;

    // other_guesses is an array of strings; take the first two
    const otherGuesses = Array.isArray(selectedRow.other_guesses)
        ? selectedRow.other_guesses.slice(0, 2)
        : [];

    // Build option rows: primary first, then up to 2 other guesses
    // other_guesses are plain strings with no associated confidence score
    const options = [
            selectedRow.modified_bird 
            ? { species: selectedRow.modified_bird, confidence: 100 }
            : selectedRow.primary_guess
            ? { species: selectedRow.primary_guess, confidence: primaryConf }
            : null,
        // otherGuesses[0] ? { species: otherGuesses[0], confidence: null } : null,
        // otherGuesses[1] ? { species: otherGuesses[1], confidence: null } : null,
    ].filter(Boolean);

    const handleOptionClick = (index) => {
        setSelectedOptionIndex(index);
        setManualSpecies(null);
        // TODO: UPDATE RESULT IN BACKEND AND SET MODIFIED STATUS TO DATE
        onSpeciesOverride?.(options[index]?.species ?? null);
    };

    const handleManualSelect = (species) => {
        setManualSpecies(species);
        setSelectedOptionIndex(null);
        // TODO: UPDATE RESULT IN BACKEND AND SET MODIFIED STATUS TO DATE
        onSpeciesOverride?.(species);
    };

    const handleSaveChanges = async () => {
        try {
            if (!manualSpecies || manualSpecies.trim() === '') {
                console.warn('No manual species selected to save.');
                return;
            }

            const record_id = selectedRow.record_id;
            const response = await apiClient.put(`/record/manual/${record_id}`, { manual_bird: manualSpecies });

            if (response.status === 200) {
                console.log('Successfully saved manual species override:', response.data);
                // Optionally show a success message to the user
            } else {
                console.error('Failed to save manual species override:', response.status);
                // Optionally show an error message to the user
            }
        }catch (error) {
            console.error('Error saving changes:', error);
            // Optionally show an error message to the user
        }
    }

    return (
        <div id={styles.identificationRow}>

    {imageMap[selectedRow.record_id] ? (
        <img
            src={imageMap[selectedRow.record_id]}
            alt={birdboxName}
            className={styles.identifyImage}
        />
    ) : (
        <div className={styles.identifyImagePlaceholder}>
            Loading image...
        </div>
    )}

    {/* Right panel */}
        <div className={styles.identifyPanel}>
            <div className={styles.group}>
                <h1>Species Identification</h1>

                <div id={styles.selectOptions}>
                    {/* Options group — tightly spaced */}
                    <div className={styles.optionsGroup}>
                        {options.map((opt, i) => {
                            const isSelected = !manualSpecies && selectedOptionIndex === i;
                            return (
                                <div
                                    key={i}
                                    onClick={() => handleOptionClick(i)}
                                    className={`${styles.speciesOption} ${isSelected ? styles.speciesOptionSelected : ''}`}
                                >
                                    <span className={`${styles.speciesLabel} ${isSelected ? styles.speciesLabelSelected : ''}`}>
                                        {capitalize(opt.species) ?? 'Unknown'}
                                    </span>
                                    {opt.confidence != null && !(i === 0 && selectedRow.modified_date != null) && (
                                        <span className={`${styles.speciesConfidence} ${isSelected ? styles.speciesConfidenceSelected : ''}`}>
                                            {opt.confidence}%
                                        </span>
                                    )} 
                                    {/* hide confidence score of result if modified */}
                                </div>
                            );
                        })}
                    </div>
                </div>

                    {options.length === 0 && (
                        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>No identification data available.</p>
                    )}
                </div>
                

                {/* Manual ID*/}
               <div className={styles.manualDropdownWrapper}>
                    <style>{DROPDOWN_OVERRIDES}</style>
                    <Dropdown
                        value={manualSpecies}
                        options={speciesOptions}
                        onChange={(e) => handleManualSelect(e.value)}
                        placeholder="Manual ID"
                        editable
                        filterPlaceholder="Search species..."
                        className={`${styles.speciesDropdown} ${manualSpecies ? styles.speciesDropdownSelected : ''}`}
                        style={{ width: '100%' }}
                    />
                    {manualSpecies &&
                        <div>
                            <button onClick={handleSaveChanges} className={styles.saveButton} style={{ marginRight: '1em', padding: '.75em 1em', fontSize: '0.875rem', fontWeight: 500}}>
                                Save Changes
                            </button>
                            <button onClick={() => { setManualSpecies(null); }} className={styles.resetButton} style={{ padding: '.75em 1em', fontSize: '0.875rem', fontWeight: 500}}>
                                Reset
                            </button>
                        </div>
                    }
                </div>
        </div>

    </div>
    );
}

// ─── PrimeReact dropdown overrides for species selector ───────────────────────
const DROPDOWN_OVERRIDES = `
    .p-dropdown.p-component {
        border-radius: 8px !important;
        font-size: 0.875rem !important;
        border: 1.5px solid #e0e0e0 !important;
    }
    .p-dropdown:not(.p-disabled):hover {
        border-color: #9ca3af !important;
    }
    .p-dropdown:not(.p-disabled).p-focus {
        border-color: #4a7c3f !important;
        box-shadow: 0 0 0 2px #d4edcf !important;
    }
    .p-dropdown.speciesDropdownSelected,
    .p-dropdown.speciesDropdownSelected:not(.p-disabled):hover {
        border-color: #5f8f4f !important;
        background: #f2f8f0 !important;
    }
`;