import React from 'react';
import { useState, useEffect } from 'react';

import {
  LineChart,
  areaElementClasses,
  lineElementClasses,
} from '@mui/x-charts/LineChart'

const checkDateInCurrentMonth = (date) => {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

const checkContainsKestrel = (birdname) => {
    if (!birdname) return false;
    const lowerName = birdname.toLowerCase();
    return lowerName.includes('kestrel');
}

const month_day_counts = [
  31,
  28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];

const createEmptyChartData = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const isFebruary = month === 1;
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonth = month_day_counts[month] + (isFebruary && isLeapYear ? 1 : 0);

  return Array.fill(0, daysInMonth).map((_, index) => ({
    date: `${month + 1}/${index + 1}`,
    value: 0,
  }));
}

const fake_data = [
  { date: '10/1', value: 2 },
  { date: '10/2', value: 1 },
  { date: '10/3', value: 3 },
  { date: '10/4', value: 8 },
  { date: '10/5', value: 7 },
  { date: '10/6', value: 9 },
  { date: '10/7', value: 5 },
  { date: '10/8', value: 5 },
  { date: '10/9', value: 4 },
  { date: '10/10', value: 6 },
  { date: '10/11', value: 3 },
  { date: '10/12', value: 9 },
  { date: '10/13', value: 7 },
  { date: '10/14', value: 8 },
  { date: '10/15', value: 2 },
  { date: '10/16', value: 4 },
  { date: '10/17', value: 6 },
  { date: '10/18', value: 5 },
  { date: '10/19', value: 7 },
  { date: '10/20', value: 9 },
  { date: '10/21', value: 6 },
  { date: '10/22', value: 8},
//   { date: '10/23', value: 3 },
//   { date: '10/24', value: 2 },
//   { date: '10/25', value: 4 },
//   { date: '10/26', value: 6 },
//   { date: '10/27', value: 5 },
//   { date: '10/28', value: 7 },
//   { date: '10/29', value: 1 },
//   { date: '10/30', value: 3 },
//   { date: '10/31', value: 5 },
]

const areaColor = 'var(--gradient-green)'

export default function LineGraph({ boxesData }) {

  const [chartData, setChartData] = useState(createEmptyChartData());

  const formatData = (boxesData) => {
    // I want to loop through all of the boxes in boxes data
    // For each box I want to loop through all of the records
    // For each record if the timestamp is in the current month I want to add it to an array
    // Then I want to loop through this array and if the record has an identified kestrel, I want to add 1 to the value of that day in the chart data)
    if (!chartData || chartData.length === 0) setChartData(createEmptyChartData());
    const updatedChartData = [...chartData];
    for (const box of boxesData) {
        for (const record of box.records ?? []) {
            if (checkDateInCurrentMonth(new Date(record.timestamp))) {
                const day = new Date(record.timestamp).getDate();
                if(day < 1 || day > updatedChartData.length) continue; //safety check to make sure day is within bounds of current month
                if (checkContainsKestrel(record.primary_guess) || checkContainsKestrel(record.modified_bird)) {
                    updatedChartData[day - 1].value += 1
                }
            }
        }
    }
    return updatedChartData;
  }
  
  
  useEffect(() => {
      // This is where you would fetch the data and update the chartData state
      // For now, we'll just use some dummy data
      setChartData(createEmptyChartData());
      const serverData = formatData(boxesData);
      const totalKestrels = serverData.reduce((sum, item) => sum + item.value, 0);
      if (totalKestrels === 0) {
        // If there are no kestrels detected, use the dummy data to make the graph look nice
        setChartData(fake_data);
      } else {
        setChartData(serverData);
      }


  }, [boxesData]);

  return (
    <div className='stat-box-graph'>
      <p className='graph-header'>Kestrel Detections/Month</p>
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
    </div>
  )
}


export function LineGraphPicture({ boxesData }) {
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