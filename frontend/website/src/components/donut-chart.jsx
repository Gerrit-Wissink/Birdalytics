import React from 'react'
import { PieChart } from '@mui/x-charts/PieChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';

const colors = ['var(--green-text)', 'var(--orange)', 'var(--purple)'];

const size = {
  width: 200,
  height: 200,
};

const StyledText = styled('text')(({ theme, textColor }) => ({
  fill: textColor || theme.palette.text.primary,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fontSize: 20,
}));

function PieCenterLabel({ percentage, title, textColor}) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <>
      <StyledText x={left + width / 2} y={top + height / 2 - 15} textColor={textColor} style={{ fontSize: '3rem', fontWeight: 'bold' }}>
        {percentage}%
      </StyledText>
      <StyledText x={left + width / 2} y={top + height / 2 + 20} style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text)' }}>
        {title}
      </StyledText>
      <StyledText x={left + width / 2} y={top + height / 2 + 40} style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text)' }}>
        frequency
      </StyledText>
    </>
  );
}

export default function BirdPieChart({ birdboxes = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [data, setData] = useState([
    { value: 0, label: 'American Kestrels', title: 'total kestrel' },
    { value: 0, label: 'Other Birds', title: 'other bird' },
    { value: 0, label: 'Non-Birds', title: 'non-bird' },
  ]);

  useEffect(() => {
    console.log('[BirdPieChart] effect running - birdboxes length:', birdboxes.length);
    var kestrels = birdboxes.reduce((sum, box) => sum + (box.total_kestrel_identified_photos ?? 0), 0);
    var otherBirds = birdboxes.reduce((sum, box) => sum + (box.total_non_kestrel_identified_photos ?? 0), 0);
    var nonBirds = birdboxes.reduce((sum, box) => sum + ((box.total_photos_with_creatures - box.total_kestrel_identified_photos - box.total_non_kestrel_identified_photos) ?? 0), 0);
    console.log('[BirdPieChart] calling setData');

    setData([
      { value: kestrels, label: 'American Kestrels', title: 'total kestrel' },
      { value: otherBirds, label: 'Other Birds', title: 'other bird' },
      { value: nonBirds, label: 'Non-Birds', title: 'non-bird' },
    ]);
  }, [birdboxes.length]); // Use birdboxes.length instead of birdboxes to avoid infinite loop with empty arrays

  const total = data.reduce((sum, item) => sum + (item.value ?? 0), 0);
  const percentage = total > 0 ? Math.round((data[hoveredIndex].value ?? 0) / total * 100) : 0;
  const currentColor = colors[hoveredIndex];
  const currentTitle = data[hoveredIndex].title;

  return (
    <div className='stat-box'>
      <PieChart
        series={[{ data, innerRadius: 80 }]}
        colors={colors}
        hideLegend
        {...size}
        slotProps={{ legend: { hidden: true } }}
        onItemClick={(event, d) => {
          setHoveredIndex(d.dataIndex);
        }}
      >
        <PieCenterLabel percentage={percentage} title={currentTitle} textColor={currentColor} />
      </PieChart>
    </div>
  );
}

export function BoxesPieChart({ birdboxes, photo = false }) {
  //THESE CAN ALSO BE CONSTS WHEN WE DELETE THE BELOW
  var kestrels = birdboxes.reduce((sum, box) => sum + (box.total_kestrel_identified_photos ?? 0), 0);
  var otherBirds = birdboxes.reduce((sum, box) => sum + (box.total_non_kestrel_identified_photos ?? 0), 0);
  var nonBirds = birdboxes.reduce((sum, box) => sum + ((box.total_photos_with_creatures - box.total_kestrel_identified_photos - box.total_non_kestrel_identified_photos) ?? 0), 0);

  //DELETE THIS LATER, IT'S JUST SO MY GRAPH LOOKS PRETTY TEEHEE
  if (kestrels === 0 || otherBirds === 0 || nonBirds === 0){
    kestrels = 45;
    otherBirds = 21;
    nonBirds = 12
  }

    const data = [
        { value: kestrels, label: 'American Kestrels' },
        { value: otherBirds, label: 'Other Birds' },
        { value: nonBirds, label: 'Non-Birds' },
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const percentage = total > 0 ? Math.round((kestrels / total) * 100) : 0;

    var weight = 'bold'

    if (photo){
      return(
        <div className='stat-box' style={{backgroundColor: '#FFF', maxWidth: 'fit-content'}}>
            <PieChart
                series={[{ data, innerRadius: 80, highlightScope: {}}]}
                colors={colors}
                hideLegend
                {...size}
                slotProps={{ legend: { hidden: true } }}
                tooltipItem={{trigger: 'none'}}
            >
                <PictureCenterLabel percentage={percentage} title="total kestrel" textColor="var(--green)"/>
            </PieChart>
        </div>
      )
    }
    return (
        <div className='stat-box' style={{backgroundColor: '#FFF', maxWidth: 'fit-content'}}>
            <PieChart
                series={[{ data, innerRadius: 80, highlightScope: {}}]}
                colors={colors}
                hideLegend
                {...size}
                slotProps={{ legend: { hidden: true } }}
                tooltipItem={{trigger: 'none'}}
            >
                <PieCenterLabel percentage={percentage} title="total kestrel" textColor="var(--green)"/>
            </PieChart>
        </div>
  );
}

const miniSize = {
  width: 100,
  height: 100,
};

export function MiniPieChart({ birdboxes }) {
  const [hoveredIndex, setHoveredIndex] = useState(0);

  const [data, setData] = useState([
    { value: 0, label: 'American Kestrels', title: 'total kestrel' },
    { value: 0, label: 'Other Birds', title: 'other bird' },
    { value: 0, label: 'Non-Birds', title: 'non-bird' },
  ]);

  useEffect(() => {
    console.log('[BirdPieChart] effect running - birdboxes length:', birdboxes.length);
    var kestrels = birdboxes.reduce((sum, box) => sum + (box.total_kestrel_identified_photos ?? 0), 0);
    var otherBirds = birdboxes.reduce((sum, box) => sum + (box.total_non_kestrel_identified_photos ?? 0), 0);
    var nonBirds = birdboxes.reduce((sum, box) => sum + ((box.total_photos_with_creatures - box.total_kestrel_identified_photos - box.total_non_kestrel_identified_photos) ?? 0), 0);
    console.log('[BirdPieChart] calling setData');

    setData([
      { value: kestrels, label: 'American Kestrels', title: 'total kestrel' },
      { value: otherBirds, label: 'Other Birds', title: 'other bird' },
      { value: nonBirds, label: 'Non-Birds', title: 'non-bird' },
    ]);
  }, [birdboxes.length]); // Use birdboxes.length instead of birdboxes to avoid infinite loop with empty arrays

  const total = data.reduce((sum, item) => sum + (item.value ?? 0), 0);

  return (
    <div style={{display: 'flex', alignItems:'center', justifyContent: 'space-between', gap: '1.5em'}}>
      <div className='stat-box' style={{padding: '0px'}}>
        <PieChart
          series={[{ data, innerRadius: 35 }]}
          colors={colors}
          hideLegend
          {...miniSize}
          slotProps={{ legend: { hidden: true } }}
          onItemClick={(event, d) => {
            setHoveredIndex(d.dataIndex);
          }}
        >
        </PieChart>
      </div>
      <div>
        <p className='small-stat-highlight'>{kestrels}/{total}</p>
        <p style={{marginTop:'0px', marginBottom: '0px'}}>Kestrels Identified</p>
      </div>
    </div>
  );
}


function PictureCenterLabel({ percentage, title, textColor}) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <>
      <StyledText x={left + width / 2} y={top + height / 2 - 15} textColor={textColor} style={{ fontSize: '3rem', fontWeight: '500' }}>
        {percentage}%
      </StyledText>
      <StyledText x={left + width / 2} y={top + height / 2 + 20} style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text)' }}>
        {title}
      </StyledText>
      <StyledText x={left + width / 2} y={top + height / 2 + 40} style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text)' }}>
        frequency
      </StyledText>
    </>
  );
}