import * as d3 from 'd3'

/**
 * Візуалізація PCA з кластеризацією.
 * Точки відображаються наступним чином:
 *   - Основна геометрична фігура (symbol) визначається за категорією (Platform або Genre),
 *     що дозволяє розрізняти платформи/жанри за формою.
 *   - Заливка точки кодує регіональний кластер (regionCluster) за допомогою кольору.
 *
 * Додаються:
 *   - Підписи до осей (PC1 та PC2).
 *   - Легенда для регіональних кластерів із назвами регіонів.
 *   - Легенда для обраної категорії (Platform або Genre) із символами.
 *
 * @param {Array} data - Масив об'єктів з pc1, pc2, cluster та regionCluster.
 * @param {String} selectedCategory - 'Genre' або 'Platform'.
 */
export function renderPCA (data, selectedCategory) {
  // Очищення контейнера графіка
  d3.select('#pca-chart').selectAll('*').remove()

  const margin = { top: 20, right: 220, bottom: 50, left: 60 }
  const width = 600 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  const svg = d3.select('#pca-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Масштабування осей для pc1 та pc2
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc1))
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc2))
    .range([height, 0])

  // Додаємо осі
  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale)

  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)

  svg.append('g')
    .call(yAxis)

  // Додаємо назви осей
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .style('font-size', '14px')
    .text('PC1')

  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(-40, ${height / 2}) rotate(-90)`)
    .style('font-size', '14px')
    .text('PC2')

  // Отримання унікальних регіональних кластерів (для кольорування) та категорій (для символів)
  const regionClusters = Array.from(new Set(data.map(d => d.regionCluster))).sort((a, b) => a - b)
  const categories = Array.from(new Set(data.map(d => d[selectedCategory])))

  // Колірна шкала для регіональних кластерів
  const regionColorScale = d3.scaleOrdinal(d3.schemeSet2)
    .domain(regionClusters)

  // Створення шкали‑символів для категорій (Platform або Genre)
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

  // Побудова точок із використанням символів:
  // Геометричний символ визначається значенням d[selectedCategory] через symbolScale,
  // а заливка задається кольором регіонального кластера.
  svg.selectAll('path.pca-point')
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

  // Видалено блок додавання текстових підписів з назвами регіонів безпосередньо на графіку.

  // Легенда для регіональних кластерів з назвами (назви регіонів зберігаються в легенді)
  const regionNames = ['NA Market', 'EU Market', 'JP Market', 'Global Hits']
  const regionLegend = svg.append('g')
    .attr('transform', `translate(${width + 60}, 20)`)

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
    .attr('transform', `translate(${width + 60}, ${regionClusters.length * 20 + 40})`)

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
}
