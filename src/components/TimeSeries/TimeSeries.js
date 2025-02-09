import * as d3 from 'd3'
import { updateTimeRange } from '../../utils/stateManager'

// **Змінні для збереження вибраного діапазону**
let selectedRange = null
let showGameNames = true // За замовчуванням не показувати назви ігор

document.getElementById('toggle-game-names').addEventListener('change', (event) => {
  showGameNames = event.target.checked
})

// **Функція агрегації даних по роках для обраної категорії (жанри або платформи)**
function aggregateData (data, category) {
  const aggregated = d3.rollups(
    data,
    v => ({
      totalSales: d3.sum(v, d => d.TotalSales),
      games: v.map(d => d.Name) // Додаємо назви ігор
    }),
    d => d3.timeYear(new Date(d.Year, 0, 1)), // Групування по роках як датах
    d => d[category] // Групування по обраній категорії (Genre або Platform)
  )

  return aggregated.map(([year, categories]) => ({
    year,
    categories: categories.map(([category, { totalSales, games }]) => ({ category, totalSales, games }))
  })).sort((a, b) => a.year - b.year) // Сортуємо за роками
}

// **Головна функція рендерингу графіка**
export function renderTimeSeries (data, selectedCategory = 'Genre') {
  d3.select('#time-series-chart').selectAll('*').remove()

  const margin = { top: 50, right: 170, bottom: 70, left: 80 }
  const width = 800 - margin.left - margin.right
  const height = 350 - margin.top - margin.bottom

  const svg = d3.select('#time-series-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const aggregatedData = aggregateData(data, selectedCategory)

  // **Визначаємо топ-5 категорій за загальними продажами**
  const categoryTotals = {}
  aggregatedData.forEach(d => {
    d.categories.forEach(c => {
      categoryTotals[c.category] = (categoryTotals[c.category] || 0) + c.totalSales
    })
  })

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(d => d[0])

  // **Фільтруємо тільки топ-5 категорій**
  const filteredData = aggregatedData.map(d => ({
    year: d.year,
    categories: d.categories.filter(c => topCategories.includes(c.category))
  }))

  // **Масштабування осей**
  const x = d3.scaleTime()
    .domain(d3.extent(filteredData, d => d.year))
    .range([0, width])

  const y = d3.scaleLinear()
    .domain([0, d3.max(filteredData.flatMap(d => d.categories.map(c => c.totalSales)))])
    .nice()
    .range([height, 0])

  // **Колірна шкала для категорій**
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(topCategories)

  // **Форматування підписів осі X**
  const tickInterval = filteredData.length > 30 ? d3.timeYear.every(5) : d3.timeYear.every(1)

  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(tickInterval).tickFormat(d3.timeFormat('%Y')))

  xAxis.selectAll('text')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')

  svg.append('g')
    .call(d3.axisLeft(y))

  // **Додаємо tooltip**
  const tooltip = d3.select('#root')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(255, 255, 255, 0.9)')
    .style('border', '1px solid #ccc')
    .style('padding', '10px')
    .style('border-radius', '5px')
    .style('box-shadow', '0px 0px 5px rgba(0, 0, 0, 0.2)')
    .style('pointer-events', 'none')

  // **Додаємо вертикальну лінію для наведення**
  const hoverLine = svg.append('line')
    .attr('stroke', '#aaa')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '5,5')
    .style('opacity', 0)

  // **Малюємо лінії**
  topCategories.forEach(category => {
    const categoryData = filteredData.map(d => ({
      year: d.year,
      sales: d.categories.find(c => c.category === category)?.totalSales || 0,
      games: d.categories.find(c => c.category === category)?.games || []
    }))

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.sales))

    svg.append('path')
      .datum(categoryData)
      .attr('fill', 'none')
      .attr('stroke', colorScale(category))
      .attr('stroke-width', 2)
      .attr('d', line)

    // **Додаємо точки**
    svg.selectAll(`.dot-${category}`)
      .data(categoryData)
      .enter()
      .append('circle')
      .attr('class', `dot-${category}`)
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.sales))
      .attr('r', 3) // **Зменшений розмір точок**
      .attr('fill', colorScale(category))
      .style('opacity', 0) // **Точки видно лише при наведенні**
  })

  // **Слухаємо рух миші**
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .style('opacity', 0)
    .on('mousemove', function (event) {
      const [mouseX] = d3.pointer(event)
      const hoveredYear = x.invert(mouseX)

      hoverLine
        .attr('x1', mouseX)
        .attr('x2', mouseX)
        .attr('y1', 0)
        .attr('y2', height)
        .style('opacity', 1)

      const hoveredData = filteredData.find(d =>
        Math.abs(d.year.getFullYear() - hoveredYear.getFullYear()) <= 1
      )

      // **Перевірка, чи є дані**
      if (!hoveredData || !hoveredData.categories || hoveredData.categories.length === 0) {
        tooltip.transition().duration(200).style('opacity', 0)
        return
      }

      // **Відображаємо точки**
      svg.selectAll('.tooltip-dot').remove()

      hoveredData.categories.forEach(categoryData => {
        svg.append('circle')
          .attr('class', 'tooltip-dot')
          .attr('cx', x(hoveredData.year))
          .attr('cy', y(categoryData.totalSales))
          .attr('r', 4)
          .attr('fill', colorScale(categoryData.category))
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
      })

      tooltip.transition().duration(200).style('opacity', 1)
      tooltip.html(`
        <strong>Year: ${d3.timeFormat('%Y')(hoveredData.year)}</strong><br>
        ${hoveredData.categories.map(c =>
          `<div style="color: ${colorScale(c.category)}">
            <strong>${c.category}</strong>: ${c.totalSales.toLocaleString()}
            ${showGameNames ? `<br>Games: ${c.games.slice(0, 3).join(', ')}...` : ''}
          </div>`
        ).join('')}
      `)

      // **Позиція tooltip**
      const tooltipWidth = tooltip.node().getBoundingClientRect().width
      const pageWidth = window.innerWidth
      let tooltipX = event.pageX + 10
      if (event.pageX + tooltipWidth > pageWidth) {
        tooltipX = event.pageX - tooltipWidth - 10
      }

      tooltip.style('left', `${tooltipX}px`)
        .style('top', `${event.pageY - 30}px`)
    })
    .on('mouseout', function () {
      tooltip.transition().duration(200).style('opacity', 0)
      hoverLine.style('opacity', 0)

      // Видалення точок при виході курсора з графіка
      svg.selectAll('.tooltip-dot').remove()
    })

  // **Слайсинг (переміщено вниз)**
  const brush = d3.brushX()
    .extent([[0, height + 20], [width, height + 40]])
    .on('end', function ({ selection }) {
      if (!selection) return
      const [x0, x1] = selection.map(x.invert)
      selectedRange = [x0, x1]

      console.log(`Selected range: ${d3.timeFormat('%Y')(x0)} - ${d3.timeFormat('%Y')(x1)}`)

      // **Оновлення глобального стану**
      updateTimeRange([x0.getFullYear(), x1.getFullYear()])
    })

  svg.append('g')
    .attr('class', 'brush')
    .call(brush)

  // **Додаємо підписи до осей**
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 50)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Year')

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Total Sales (Millions)')

  // **Додаємо легенду**
  const legend = svg.append('g')
    .attr('transform', `translate(${width + 20}, 0)`)

  topCategories.forEach((category, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`)

    legendRow.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', colorScale(category))

    legendRow.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .text(category)
  })
}

// **Експортуємо функцію**
export default renderTimeSeries
