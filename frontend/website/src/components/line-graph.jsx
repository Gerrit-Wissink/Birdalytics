import React from 'react';
import { useState, useEffect } from 'react';

import {
  LineChart,
  areaElementClasses,
  lineElementClasses,
} from '@mui/x-charts/LineChart'

const checkContainsKestrel = (birdname) => {
    if (!birdname) return false;
    return birdname.toLowerCase().includes('kestrel');
}

const buildDateRange = (earliest, latest) => {
  const result = [];
  const current = new Date(earliest);
  current.setHours(0, 0, 0, 0);
  const end = new Date(latest);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    result.push({ date: `${current.getMonth() + 1}/${current.getDate()}`, value: 0 });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

const formatData = (boxesData = []) => {
  if (boxesData.length === 0) return [];
  // Create date range with the end being today and the start being 30 days before
  const today = new Date();
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() - 30);
  const latest = today;
  const chartData = buildDateRange(earliest, latest);

  // Build a date-string → index map for O(1) lookup
  const indexByDay = {};
  chartData.forEach((item, i) => { indexByDay[item.date] = i; });

  for (const box of boxesData) {
    for (const record of box.records ?? []) {
      if (checkContainsKestrel(record.modified_bird ?? record.primary_guess)) {
        const d = new Date(record.timestamp);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        if (indexByDay[key] !== undefined) chartData[indexByDay[key]].value += 1;
      }
    }
  }
  return chartData;
}

const areaColor = 'var(--gradient-green)'

export default function LineGraph({ boxesData = [] }) {

  const [chartData, setChartData] = useState([]);
  const [showLine, setShowLine] = useState(false);

  useEffect(() => {
      const serverData = formatData(boxesData);
      if (serverData.length === 0) {
        setChartData([]);
        setShowLine(false);
      } else {
        setChartData(serverData);
        setShowLine(true);
      }
  }, [boxesData.length]);

  const LINE_CHART = (
    <LineChart
      xAxis={[
        {
          data: chartData.map(item => item.date),
          scaleType: 'point',
          tickLabelInterval: (value, index) => index % 7 === 0, // Show label every 7 days
          height: 28,
        },
      ]}
      yAxis={[{ label: 'Number of Kestrels', width: 40 }]}
      series={[
        {
          data: chartData.map(item => item.value),
          label: 'Number of Kestrels',
          area: true,
          showMark: false,
          color: areaColor,
        },
      ]}
      height={300}
      sx={{
        [`& .${lineElementClasses.root}`]: { //applies custom stroke to the line
          strokeWidth: 2,
          strokeLinecap: 'round',
        },
        [`& .${areaElementClasses.root}`]: { //applies gradient to area under the line
          fill: 'url(#areaGradient)',
          filter: 'none',
        },
        '& .MuiChartsAxis-bottom .MuiChartsAxis-tickContainer text': {
          fontFamily: 'Lato',
        },
        '& .MuiChartsAxis-left .MuiChartsAxis-tickContainer text': {
          fontFamily: 'Lato',
        },
      }}
      hideLegend={true}
      style={{marginLeft: "-8px"}}
    >
      <defs>
        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={areaColor} stopOpacity={1} />
          <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
        </linearGradient>
      </defs>
    </LineChart>
  )

  return (
    <div className='stat-box-graph'>
      <p className='graph-header'>Kestrel Detections</p>
      {showLine ?
        LINE_CHART
        :
        <div className="empty-state-graph" style={{ textAlign: 'center', padding: '1em' }}>
          <p style={{marginTop: '0px'}}>No kestrel detections found</p>
        </div>
      }
    </div>
  )
}


export function LineGraphPicture({ boxesData = [] }) {

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
      const serverData = formatData(boxesData);
      setChartData(serverData);
  }, [boxesData.length]);


  return (
    <div className='stat-box-graph' style = {{backgroundColor: '#fff'}}>
      <LineChart
        xAxis={[
          {
            data: chartData.map(item => item.date),
            scaleType: 'point',
            tickLabelInterval: (value, index) => index % 7 === 0, // Show label every 7 days
            height: 28,
          },
        ]}
        yAxis={[{ label: 'Number of Kestrels', width: 50 }]}
        series={[
          {
            data: chartData.map(item => item.value),
            label: 'Number of Kestrels',
            area: true,
            showMark: false,
            color: areaColor,
          },
        ]}
        tooltip={{trigger: 'none'}}
        axisHighlight={{ x: 'none', y: 'none' }}
        height={300}
        sx={{
          [`& .${lineElementClasses.root}`]: {
            strokeWidth: 2,
            strokeLinecap: 'round',
          },
          [`& .${areaElementClasses.root}`]: {
            fill: 'url(#areaGradient)',
            filter: 'none',
          },
          '& .MuiChartsAxis-bottom .MuiChartsAxis-tickContainer text': {
            fontFamily: 'Lato',
          },
          '& .MuiChartsAxis-left .MuiChartsAxis-tickContainer text': {
            fontFamily: 'Lato',
          },
        }}
        hideLegend={true}
        style={{marginLeft: "-8px"}}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={areaColor} stopOpacity={1} />
            <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
          </linearGradient>
        </defs>
      </LineChart>

    </div>
  )
}