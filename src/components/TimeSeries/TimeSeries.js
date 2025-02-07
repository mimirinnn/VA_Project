import * as d3 from 'd3'

// **Змінні для збереження вибраного діапазону**
let selectedRange = null

// **Функція агрегації даних по роках для обраної категорії (жанри або платформи)**
function aggregateData (data, category) {
  const aggregated = d3.rollups(
    data,
    v => d3.sum(v, d => d.TotalSales),
    d => d3.timeYear(new Date(d.Year, 0, 1)), // Групування по роках як датах
    d => d[category] // Групування по обраній категорії (Genre або Platform)
  )

  return aggregated.map(([year, categories]) => ({
    year,
    categories: categories.map(([category, sales]) => ({ category, sales }))
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
      categoryTotals[c.category] = (categoryTotals[c.category] || 0) + c.sales
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
    .domain([0, d3.max(filteredData.flatMap(d => d.categories.map(c => c.sales)))])
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

  // **Обертання підписів осі X**
  xAxis.selectAll('text')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')

  svg.append('g')
    .call(d3.axisLeft(y))

  // **Малюємо лінії**
  topCategories.forEach(category => {
    const categoryData = filteredData.map(d => ({
      year: d.year,
      sales: d.categories.find(c => c.category === category)?.sales || 0
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
  })

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

  // **Додаємо слайсинг без зуму**
  const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on('end', function ({ selection }) {
      if (!selection) return

      // **Конвертуємо координати у роки**
      const [x0, x1] = selection.map(x.invert)
      selectedRange = [x0, x1]

      console.log(`Selected range: ${d3.timeFormat('%Y')(x0)} - ${d3.timeFormat('%Y')(x1)}`)

      // **Фільтруємо дані у слайсі та виводимо у консоль**
      const selectedGames = data.filter(d => d.Year >= x0.getFullYear() && d.Year <= x1.getFullYear())
      console.log('Selected games:', selectedGames)
    })

  svg.append('g')
    .attr('class', 'brush')
    .call(brush)

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

  // **Додаємо заголовок**
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(`Time-Series Graph: Top 5 ${selectedCategory}s`)
}

// **Експортуємо функцію**
export default renderTimeSeries
