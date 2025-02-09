import * as d3 from 'd3'
import { getFilteredData, getTimeRange, getFilters } from '../../utils/stateManager.js'

// Функція для створення теплової карти
export function renderHeatmap () {
  d3.select('#heatmap-chart').selectAll('*').remove() // Очистка перед рендерингом

  let data = getFilteredData()

  // **Отримуємо вибраний діапазон років із Time-Series**
  const timeRange = getTimeRange()
  if (timeRange) {
    const [minYear, maxYear] = timeRange
    data = data.filter(d => d.Year >= minYear && d.Year <= maxYear)
  }

  const regions = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales']
  const activeFilters = getFilters()
  const genres = activeFilters.genre.length > 0
    ? activeFilters.genre
    : [...new Set(data.map(d => d.Genre))].sort()

  console.log('Heatmap received filters:', getFilters())

  const salesData = genres.map(genre => ({
    genre,
    sales: regions.map(region => ({
      region,
      value: d3.sum(data.filter(d => d.Genre === genre), d => d[region])
    }))
  }))

  const margin = { top: 30, right: 80, bottom: 80, left: 120 }
  const width = 500 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  const svg = d3.select('#heatmap-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleBand().domain(regions).range([0, width]).padding(0.05)
  const yScale = d3.scaleBand().domain(genres).range([height, 0]).padding(0.05)

  const maxSales = d3.max(salesData.flatMap(d => d.sales.map(s => s.value)))
  const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, maxSales])

  // Додавання tooltip
  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(0, 0, 0, 0.75)')
    .style('color', '#fff')
    .style('padding', '5px 10px')
    .style('border-radius', '5px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')

  svg.selectAll()
    .data(salesData.flatMap(d => d.sales.map(s => ({ genre: d.genre, ...s }))))
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.region))
    .attr('y', d => yScale(d.genre))
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .style('fill', d => colorScale(d.value))
    .style('stroke', '#fff')
    .on('mouseover', function (event, d) {
      tooltip.style('visibility', 'visible')
        .html(`<strong>${d.genre}</strong><br>${d.region}: ${d.value.toFixed(2)}M`)

      d3.select(this)
        .style('stroke', 'black')
        .style('stroke-width', 2)
    })
    .on('mousemove', (event) => {
      tooltip.style('top', `${event.pageY - 30}px`)
        .style('left', `${event.pageX + 10}px`)
    })
    .on('mouseout', function () {
      tooltip.style('visibility', 'hidden')

      d3.select(this)
        .style('stroke', '#fff')
        .style('stroke-width', 1)
    })
    .on('click', function (event, d) {
      // **Обчислення відсоткової частки продажів**
      const totalSales = d3.sum(salesData.flatMap(d => d.sales.map(s => s.value)))
      const percentage = ((d.value / totalSales) * 100).toFixed(2)

      // Видаляємо старий текст перед додаванням нового
      d3.select('#analytics-box').remove()

      // Відображення результату у вигляді тексту на графіку
      svg.append('text')
        .attr('id', 'analytics-box')
        .attr('x', width / 2)
        .attr('y', height + 60)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', 'darkred')
        .text(`📊 ${d.genre} sales in ${d.region}: ${percentage}% of total sales`)
    })

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))

  svg.append('g')
    .call(d3.axisLeft(yScale))

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 40)
    .attr('text-anchor', 'middle')
    .text('Regions')

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 15)
    .attr('text-anchor', 'middle')
    .text('Genres')

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text('Regional Sales Heatmap')

  // Додавання легенди
  const legendHeight = 200
  const legendWidth = 20
  const legendSvg = svg.append('g')
    .attr('transform', `translate(${width + 20}, 0)`)

  const legendScale = d3.scaleLinear()
    .domain([0, maxSales])
    .range([legendHeight, 0])

  const legendAxis = d3.axisRight(legendScale)
    .ticks(5)
    .tickFormat(d3.format('.2s'))

  legendSvg.append('g')
    .attr('transform', `translate(${legendWidth}, 0)`)
    .call(legendAxis)

  const gradient = legendSvg.append('defs')
    .append('linearGradient')
    .attr('id', 'legend-gradient')
    .attr('x1', '0%')
    .attr('y1', '100%')
    .attr('x2', '0%')
    .attr('y2', '0%')

  const numStops = 10
  const step = 1 / (numStops - 1)

  for (let i = 0; i < numStops; i++) {
    gradient.append('stop')
      .attr('offset', `${i * step * 100}%`)
      .attr('stop-color', colorScale(i * maxSales * step))
  }

  legendSvg.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#legend-gradient)')
    .style('cursor', 'pointer')
    .on('click', function (event) {
      const yPos = event.offsetY
      const clickedValue = legendScale.invert(yPos)

      filterHeatmap(clickedValue)
    })

  legendSvg.append('text')
    .attr('x', 0)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Sales (M)')

  function filterHeatmap (threshold) {
    svg.selectAll('rect')
      .style('opacity', d => d && d.value >= threshold ? 1 : 0.4)
      .style('stroke-width', d => d && d.value >= threshold ? 2 : 1)
  }
}

document.addEventListener('timeRangeUpdated', () => {
  console.log('Heatmap is updating due to time range change')
  renderHeatmap()
})
