import * as d3 from 'd3'

/**
 * Візуалізація PCA з інтерактивним зумом (через brush), обрізанням (clipPath),
 * undo (подвійний клік), пандінгом (переміщення графіка правою кнопкою миші) та hover‑ефектом.
 *
 * При наведенні:
 * - Елемент піднімається на передній план,
 * - Збільшується до 2.5-кратного базового розміру,
 * - Заповнення затемнюється (darker(2)),
 * - Контур стає чорним із товщиною 3,
 * - З'являється tooltip із назвою гри та її продажами (значення продажів відображаються з суфіксом "M").
 *
 * До легенди також інтегровано область статистики.
 *
 * @param {Array} data - Масив об'єктів з полями pc1, pc2, cluster, regionCluster, Name (або Game), NA_Sales, EU_Sales, JP_Sales, Other_Sales.
 * @param {String} selectedCategory - 'Genre' або 'Platform'.
 */
export function renderPCA (data, selectedCategory) {
  // Очищення контейнера графіка
  d3.select('#pca-chart').selectAll('*').remove()

  const margin = { top: 20, right: 220, bottom: 50, left: 60 }
  const width = 900 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  // Базовий розмір символу та розмір при hover (2.5-кратний)
  const baseSymbolSize = 64
  const hoverSymbolSize = baseSymbolSize * 2.5

  // Масив з іменами полів продажів (порядок відповідає регіональним кластерам)
  const regionSalesFields = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales']
  const regionNames = ['NA Market', 'EU Market', 'JP Market', 'Other Regions']

  // Створення SVG
  const svg = d3.select('#pca-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  // Відключаємо стандартне контекстне меню (для пандінгу)
  svg.on('contextmenu', event => event.preventDefault())

  // Додаємо clipPath для обрізання даних
  const defs = svg.append('defs')
  defs.append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height)

  // Група для всієї візуалізації
  const chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Група для точок із застосованим clipPath
  const pointsGroup = chartGroup.append('g')
    .attr('class', 'points-group')
    .attr('clip-path', 'url(#clip)')

  // Створення лінійних шкал
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc1))
    .range([0, width])
  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc2))
    .range([height, 0])

  // Історія зуму
  const zoomHistory = []
  zoomHistory.push({
    xDomain: xScale.domain(),
    yDomain: yScale.domain()
  })

  // Створення осей
  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale)
  chartGroup.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
  chartGroup.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)

  // Назви осей
  chartGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .style('font-size', '14px')
    .text('PC1')
  chartGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(-40, ${height / 2}) rotate(-90)`)
    .style('font-size', '14px')
    .text('PC2')

  // Отримання унікальних регіональних кластерів та категорій
  const regionClusters = Array.from(new Set(data.map(d => d.regionCluster))).sort((a, b) => a - b)
  const categories = Array.from(new Set(data.map(d => d[selectedCategory])))

  // Колірна шкала для регіональних кластерів
  const regionColorScale = d3.scaleOrdinal(d3.schemeSet2)
    .domain(regionClusters)
  // Шкала символів для категорій
  const symbolScale = d3.scaleOrdinal()
    .domain(categories)
    .range([
      d3.symbolCircle,
      d3.symbolSquare,
      d3.symbolDiamond,
      d3.symbolTriangle,
      d3.symbolStar,
      d3.symbolCross,
      d3.symbolWye
    ])

  // Створення tooltip як групи з прямокутником та текстом
  const tooltipGroup = svg.append('g')
    .attr('class', 'tooltip-group')
    .style('visibility', 'hidden')
  const tooltipRect = tooltipGroup.append('rect')
    .attr('fill', 'white')
  const tooltipText = tooltipGroup.append('text')
    .attr('font-size', '12px')
    .attr('font-family', 'sans-serif')
    .attr('fill', 'black')

  // Функція для оновлення атрибутів точки (без hover)
  function updatePointAttributes (selection) {
    selection
      .attr('transform', d => `translate(${xScale(d.pc1)}, ${yScale(d.pc2)})`)
      .attr('d', d => d3.symbol().type(symbolScale(d[selectedCategory])).size(baseSymbolSize)())
  }

  // Початкове малювання точок
  const points = pointsGroup.selectAll('path.pca-point')
    .data(data)
    .enter()
    .append('path')
    .attr('class', 'pca-point')
    .attr('transform', d => `translate(${xScale(d.pc1)}, ${yScale(d.pc2)})`)
    .attr('d', d => d3.symbol().type(symbolScale(d[selectedCategory])).size(baseSymbolSize)())
    .style('fill', d => regionColorScale(d.regionCluster))
    .style('stroke', 'black')
    .style('stroke-width', 0.5)
    .style('opacity', 0.8)

  // Додаємо hover-ефект: підняття елемента, збільшення, затемнення та додавання чорного контуру
  points
    .on('mouseover', function (event, d) {
      // Переміщення елемента на передній план
      this.parentNode.appendChild(this)
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', d3.symbol().type(symbolScale(d[selectedCategory])).size(hoverSymbolSize)())
        .style('fill', d3.color(regionColorScale(d.regionCluster)).darker(2))
        .style('stroke', 'black')
        .style('stroke-width', 3)

      // Отримуємо координати миші відносно SVG
      const [x, y] = d3.pointer(event, svg.node())

      // Отримуємо назву гри (d.Name або d.Game)
      const gameName = d.Name || d.Game || 'Unknown Game'
      // Визначаємо індекс регіону та відповідне поле продажів
      const regionIndex = d.regionCluster // припускаємо, що це число (0,1,2,3)
      const salesField = regionSalesFields[regionIndex] || ''
      const salesValue = d[salesField] !== undefined ? d[salesField] : 'N/A'

      tooltipText.text(`Game: ${gameName}, Sales: ${salesValue}M`)

      // Отримуємо розміри тексту
      const bbox = tooltipText.node().getBBox()
      tooltipRect
        .attr('x', bbox.x - 2)
        .attr('y', bbox.y - 2)
        .attr('width', bbox.width + 4)
        .attr('height', bbox.height + 4)

      // Використовуємо просту логіку: якщо координата x більше половини SVG, відображаємо tooltip зліва
      const svgWidth = +svg.attr('width')
      const offsetX = x > svgWidth / 2 ? -bbox.width - 10 : 10

      tooltipGroup
        .style('visibility', 'visible')
        .attr('transform', `translate(${x + offsetX}, ${y - 10})`)
    })
    .on('mousemove', function (event) {
      const [x, y] = d3.pointer(event, svg.node())
      const bbox = tooltipText.node().getBBox()
      const svgWidth = +svg.attr('width')
      const offsetX = x > svgWidth / 2 ? -bbox.width - 10 : 10
      tooltipGroup.attr('transform', `translate(${x + offsetX}, ${y - 10})`)
    })
    .on('mouseout', function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', d3.symbol().type(symbolScale(d[selectedCategory])).size(baseSymbolSize)())
        .style('fill', regionColorScale(d.regionColor || d.regionCluster))
        .style('fill', regionColorScale(d.regionCluster))
        .style('stroke', 'black')
        .style('stroke-width', 0.5)
      tooltipGroup.style('visibility', 'hidden')
    })

  // Легенда для регіональних кластерів
  const regionLegend = svg.append('g')
    .attr('transform', `translate(${width + margin.left + 40}, ${margin.top})`)
  regionClusters.forEach((rc, i) => {
    const legendRow = regionLegend.append('g')
      .attr('transform', `translate(0, ${i * 20})`)
    legendRow.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', regionColorScale(rc))
    legendRow.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .text(regionNames[rc] || `Region ${rc}`)
  })

  // Легенда для категорій (Platform або Genre)
  const categoryLegend = svg.append('g')
    .attr('transform', `translate(${width + margin.left + 40}, ${margin.top + regionClusters.length * 20 + 20})`)
  categories.forEach((cat, i) => {
    const legendRow = categoryLegend.append('g')
      .attr('transform', `translate(0, ${i * 20})`)
    legendRow.append('path')
      .attr('d', d3.symbol().type(symbolScale(cat)).size(baseSymbolSize)())
      .attr('transform', 'translate(6, 6)')
      .style('fill', '#666')
      .style('stroke', 'black')
      .style('stroke-width', 0.5)
    legendRow.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .text(cat)
  })

  // Легенда для статистики, інтегрована у легенду
  const statsLegend = svg.append('g')
    .attr('transform', `translate(${width + margin.left + 40}, ${margin.top + regionClusters.length * 20 + 20 + categories.length * 20 + 20})`)
  function updateStats () {
    const currentXDomain = xScale.domain()
    const currentYDomain = yScale.domain()
    const visibleData = data.filter(d =>
      d.pc1 >= currentXDomain[0] &&
      d.pc1 <= currentXDomain[1] &&
      d.pc2 >= currentYDomain[0] &&
      d.pc2 <= currentYDomain[1]
    )
    const avgPC1 = d3.mean(visibleData, d => d.pc1)
    const avgPC2 = d3.mean(visibleData, d => d.pc2)
    statsLegend.selectAll('*').remove()
    statsLegend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Stats:')
    statsLegend.append('text')
      .attr('x', 0)
      .attr('y', 15)
      .style('font-size', '12px')
      .text(`Visible: ${visibleData.length}`)
    statsLegend.append('text')
      .attr('x', 0)
      .attr('y', 30)
      .style('font-size', '12px')
      .text(`Avg PC1: ${avgPC1 ? avgPC1.toFixed(2) : 'N/A'}`)
    statsLegend.append('text')
      .attr('x', 0)
      .attr('y', 45)
      .style('font-size', '12px')
      .text(`Avg PC2: ${avgPC2 ? avgPC2.toFixed(2) : 'N/A'}`)
  }
  updateStats()

  // Додаємо brush для зумування (група brush вставляється позаду точок)
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('end', brushed)
  pointsGroup.insert('g', ':first-child')
    .attr('class', 'brush')
    .call(brush)

  function brushed ({ selection }) {
    if (!selection) return
    const [[x0, y0], [x1, y1]] = selection
    xScale.domain([xScale.invert(x0), xScale.invert(x1)])
    yScale.domain([yScale.invert(y1), yScale.invert(y0)])
    zoomHistory.push({
      xDomain: xScale.domain(),
      yDomain: yScale.domain()
    })
    chartGroup.select('.x-axis')
      .transition()
      .duration(750)
      .call(xAxis)
    chartGroup.select('.y-axis')
      .transition()
      .duration(750)
      .call(yAxis)
    pointsGroup.selectAll('path.pca-point')
      .transition()
      .duration(750)
      .attr('transform', d => `translate(${xScale(d.pc1)}, ${yScale(d.pc2)})`)
      .on('end', updateStats)
    pointsGroup.select('.brush').call(brush.move, null)
  }

  // Подвійний клік для undo зумування
  svg.on('dblclick', stepBackZoom)
  function stepBackZoom () {
    if (zoomHistory.length > 1) {
      zoomHistory.pop()
      const prevState = zoomHistory[zoomHistory.length - 1]
      xScale.domain(prevState.xDomain)
      yScale.domain(prevState.yDomain)
      chartGroup.select('.x-axis')
        .transition()
        .duration(750)
        .call(xAxis)
      chartGroup.select('.y-axis')
        .transition()
        .duration(750)
        .call(yAxis)
      pointsGroup.selectAll('path.pca-point')
        .transition()
        .duration(750)
        .attr('transform', d => `translate(${xScale(d.pc1)}, ${yScale(d.pc2)})`)
        .on('end', updateStats)
    }
  }

  // Пандінг за допомогою правої кнопки миші
  svg.call(
    d3.drag()
      .filter(event => event.button === 2)
      .on('drag', dragged)
  )
  function dragged (event) {
    const currentXDomain = xScale.domain()
    const currentYDomain = yScale.domain()
    const shiftX = event.dx * (currentXDomain[1] - currentXDomain[0]) / width
    const newXDomain = [currentXDomain[0] - shiftX, currentXDomain[1] - shiftX]
    const shiftY = event.dy * (currentYDomain[1] - currentYDomain[0]) / height
    const newYDomain = [currentYDomain[0] + shiftY, currentYDomain[1] + shiftY]
    xScale.domain(newXDomain)
    yScale.domain(newYDomain)
    chartGroup.select('.x-axis').call(xAxis)
    chartGroup.select('.y-axis').call(yAxis)
    pointsGroup.selectAll('path.pca-point')
      .attr('transform', d => `translate(${xScale(d.pc1)}, ${yScale(d.pc2)})`)
    updateStats()
  }
}
