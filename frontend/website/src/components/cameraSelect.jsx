import { useState, useEffect } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

export default function BirdBoxSelect({ boxes, selectedBoxNames, setSelectedBoxNames }) {
    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 350,
            },
        },
    };

    const allSelected = boxes.length > 0 && selectedBoxNames.length === boxes.length;

    const handleChange = (event) => {
        const { target: { value } } = event;

        if (value.includes('select-all')) {
            setSelectedBoxNames(allSelected ? [] : boxes.map((b) => b.birdbox_name));
            return;
        }

        setSelectedBoxNames(typeof value === 'string' ? value.split(',') : value);
    };

    return (
        <div style={{maxWidth: 'fit-content'}}>
            <FormControl sx={{ m: 1, width: 500 }}>
                <InputLabel id="birdbox-select-label">Camera</InputLabel>
                <Select
                    defaultChecked={allSelected}
                    labelId="birdbox-select-label"
                    id="birdbox-select"
                    multiple
                    value={selectedBoxNames}
                    onChange={handleChange}
                    input={<OutlinedInput label="Camera" />}
                    renderValue={(selected) =>
                        selected.length === boxes.length && boxes.length > 0
                            ? 'All Cameras'
                            : selected.join(', ')
                    }
                    MenuProps={MenuProps}
                >
                    {/* Select All toggle */}
                    <MenuItem value="select-all">
                        {allSelected
                            ? <CheckBoxIcon fontSize="small" style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }} />
                            : <CheckBoxOutlineBlankIcon fontSize="small" style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }} />
                        }
                        <ListItemText primary="Select All" />
                    </MenuItem>

                    {boxes.map((box) => {
                        const isSelected = selectedBoxNames.includes(box.birdbox_name);
                        const SelectionIcon = isSelected ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

                        return (
                            <MenuItem key={box.birdbox_id} value={box.birdbox_name}>
                                <SelectionIcon
                                    fontSize="small"
                                    style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }}
                                />
                                <ListItemText primary={box.birdbox_name} />
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        </div>
    );
}