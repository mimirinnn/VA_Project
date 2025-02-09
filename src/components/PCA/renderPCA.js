import * as d3 from 'd3'

/**
 * Візуалізація результатів PCA з фарбуванням точок за обраною категорією.
 * @param {Array} data - Масив об'єктів з результатами PCA (мають властивості pc1 та pc2).
 * @param {String} selectedCategory - 'Genre' або 'Platform'
 */
export function renderPCA (data, selectedCategory) {
  // Очищення контейнера графіка
  d3.select('#pca-chart').selectAll('*').remove()

  const margin = { top: 20, right: 150, bottom: 30, left: 40 }
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
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))

  svg.append('g')
    .call(d3.axisLeft(yScale))

  // Визначення унікальних категорій із даних для обраного атрибуту
  const categories = Array.from(new Set(data.map(d => d[selectedCategory])))

  // Колірна шкала, аналогічна до TimeSeries (використовуємо d3.schemeCategory10)
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(categories)

  // Побудова точок, де колір залежить від значення d[selectedCategory]
  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.pc1))
    .attr('cy', d => yScale(d.pc2))
    .attr('r', 3)
    .style('fill', d => colorScale(d[selectedCategory]))
    .style('opacity', 0.7)

  // Додаємо легенду (аналогічну до TimeSeries)
  const legend = svg.append('g')
    .attr('transform', `translate(${width + 20}, 20)`)

  categories.forEach((cat, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`)

    legendRow.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', colorScale(cat))

    legendRow.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .text(cat)
  })
}
