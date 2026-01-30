import {
  LineChart,
  areaElementClasses,
  lineElementClasses,
} from '@mui/x-charts/LineChart'

const dailyData = [
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

// Extract dates and values
const dates = dailyData.map(item => item.date)
const values = dailyData.map(item => item.value)

const areaColor = 'var(--gradient-green)'

export default function LineGraph() {
  return (
    <div className='stat-box-graph'>
      <p className='graph-header'>Kestrel Detections/Month</p>
      <LineChart
        xAxis={[
          {
            data: dates,
            scaleType: 'point',
            tickLabelInterval: (value, index) => index % 7 === 0, // Show label every 7 days
            height: 28,
          },
        ]}
        yAxis={[{ label: 'Number of Kestrels', width: 40 }]}
        series={[
          {
            data: values,
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
            <stop offset="0%" stopColor={areaColor} stopOpacity={0.8} />
            <stop offset="100%" stopColor={areaColor} stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </LineChart>
    </div>
  )
}