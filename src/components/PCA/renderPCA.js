import * as d3 from 'd3'

/**
 * Візуалізація PCA з інтерактивним зумом через brush, обрізанням даних (clipPath)
 * та можливістю повернення на крок назад (undo zoom) за допомогою подвійного кліку.
 *
 * Точки відображаються наступним чином:
 *   - Форма точки (symbol) визначається за обраною категорією (Platform або Genre),
 *     що дозволяє розрізняти ці групи за формою.
 *   - Заливка точки кодує регіональний кластер (regionCluster) за допомогою кольору.
 *
 * Додаються:
 *   - Підписи до осей (PC1 та PC2).
 *   - Легенда для регіональних кластерів із назвами.
 *   - Легенда для обраної категорії (Platform або Genre) із символами.
 *   - Інтерактивна область (brush) для виділення області графіка та зуму.
 *   - Можливість повернутися «на крок назад» (undo zoom) при подвійному кліку.
 *
 * Під час зумування дані, що виходять за межі осей, обрізаються завдяки clipPath.
 *
 * @param {Array} data - Масив об'єктів з pc1, pc2, cluster та regionCluster.
 * @param {String} selectedCategory - 'Genre' або 'Platform'.
 */
export function renderPCA (data, selectedCategory) {
  // Очищення контейнера графіка
  d3.select('#pca-chart').selectAll('*').remove()

  // Встановлюємо відступи
  const margin = { top: 20, right: 220, bottom: 50, left: 60 }
  // Збільшуємо ширину графіка (900 пікселів загалом, з врахуванням відступів)
  const width = 900 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  // Створення SVG
  const svg = d3.select('#pca-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  // Додаємо clipPath для обрізання даних, що виходять за межі осей
  const defs = svg.append('defs')
  defs.append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height)

  // Група для всієї візуалізації (без осей)
  const chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Група для точок із застосованим clipPath
  const pointsGroup = chartGroup.append('g')
    .attr('class', 'points-group')
    .attr('clip-path', 'url(#clip)')

  // Створення лінійних шкал для осей
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc1))
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc2))
    .range([height, 0])

  // Зберігаємо початкові домени та ініціалізуємо історію зуму
  const zoomHistory = []
  zoomHistory.push({
    xDomain: xScale.domain(),
    yDomain: yScale.domain()
  })

  // Створення осей
  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale)

  // Малювання осей (вони не підпадають під clipPath)
  chartGroup.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)

  chartGroup.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)

  // Додавання назв осей
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

  // Шкала‑символів для категорій (Platform або Genre)
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

  // Малювання точок у групі pointsGroup
  pointsGroup.selectAll('path.pca-point')
    .data(data)
    .enter()
    .append('path')
    .attr('class', 'pca-point')
    .attr('transform', d => `translate(${xScale(d.pc1)}, ${yScale(d.pc2)})`)
    .attr('d', d => d3.symbol().type(symbolScale(d[selectedCategory])).size(64)())
    .style('fill', d => regionColorScale(d.regionCluster))
    .style('stroke', 'black')
    .style('stroke-width', 0.5)
    .style('opacity', 0.8)

  // Легенда для регіональних кластерів (назви зберігаються в легенді)
  const regionNames = ['NA Market', 'EU Market', 'JP Market', 'Global Hits']
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

  // Легенда для обраної категорії (Platform або Genre) – використання символів
  const categoryLegend = svg.append('g')
    .attr('transform', `translate(${width + margin.left + 40}, ${margin.top + regionClusters.length * 20 + 20})`)

  categories.forEach((cat, i) => {
    const legendRow = categoryLegend.append('g')
      .attr('transform', `translate(0, ${i * 20})`)

    legendRow.append('path')
      .attr('d', d3.symbol().type(symbolScale(cat)).size(64)())
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

  // Додаємо brush для зумування
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('end', brushed)

  pointsGroup.append('g')
    .attr('class', 'brush')
    .call(brush)

  // Функція, що викликається після завершення виділення brush
  function brushed ({ selection }) {
    if (!selection) return // Якщо нічого не виділено
    const [[x0, y0], [x1, y1]] = selection

    // Оновлюємо домени шкал за виділеною областю
    xScale.domain([xScale.invert(x0), xScale.invert(x1)])
    yScale.domain([yScale.invert(y1), yScale.invert(y0)]) // y-вісь "перевернута"

    // Додаємо новий стан зуму в історію
    zoomHistory.push({
      xDomain: xScale.domain(),
      yDomain: yScale.domain()
    })

    // Оновлюємо осі та позиції точок із плавною анімацією
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

    // Видаляємо виділення brush
    pointsGroup.select('.brush').call(brush.move, null)
  }

  // Подвійний клік повертає на крок назад (undo останнє зумування)
  svg.on('dblclick', stepBackZoom)

  function stepBackZoom () {
    if (zoomHistory.length > 1) {
      // Видаляємо поточний стан зуму
      zoomHistory.pop()
      // Отримуємо попередній стан
      const prevState = zoomHistory[zoomHistory.length - 1]
      xScale.domain(prevState.xDomain)
      yScale.domain(prevState.yDomain)

      // Перемальовуємо осі та точки із плавною анімацією
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
    }
  }
}
