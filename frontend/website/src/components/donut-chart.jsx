import { PieChart } from '@mui/x-charts/PieChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';
import { useState } from 'react';

const data = [
  { value: 44, label: 'American Kestrels', title: 'total kestrel' },
  { value: 28, label: 'Other Birds', title: 'other bird' },
  { value: 18, label: 'Non-Birds', title: 'non-bird' },
];

const colors = ['var(--green-text)', 'var(--orange)', 'var(--purple)'];

const total = data.reduce((sum, item) => sum + item.value, 0);

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

function PieCenterLabel({ percentage, title, textColor }) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <>
      <StyledText x={left + width / 2} y={top + height / 2 - 15} textColor={textColor} style ={{ fontSize: '3rem', fontWeight: 'bold' }}>
        {percentage}%
      </StyledText>
      <StyledText x={left + width / 2} y={top + height / 2 + 20} style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text)'}}>
        {title}
      </StyledText>
      <StyledText x={left + width / 2} y={top + height / 2 + 40} style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text)'}}>
        frequency
      </StyledText>
    </>
  );
}

export default function BirdPieChart({ boxesData }) {
  const [hoveredIndex, setHoveredIndex] = useState(0);

  const percentage = Math.round((data[hoveredIndex].value / total) * 100);
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
