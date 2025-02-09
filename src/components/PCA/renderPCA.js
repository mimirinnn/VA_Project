import * as d3 from 'd3'

/**
 * Візуалізація результатів PCA.
 * @param {Array} data - Масив об'єктів, що містять властивості pc1 та pc2.
 */
export function renderPCA (data) {
  // Очищення контейнера графіка
  d3.select('#pca-chart').selectAll('*').remove()

  const margin = { top: 20, right: 20, bottom: 30, left: 40 }
  const width = 600 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  const svg = d3.select('#pca-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Масштаби для осей (використовуємо значення pc1 та pc2)
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc1))
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc2))
    .range([height, 0])

  // Додавання осей
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))

  svg.append('g')
    .call(d3.axisLeft(yScale))

  // Побудова точок
  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.pc1))
    .attr('cy', d => yScale(d.pc2))
    .attr('r', 3)
    .attr('fill', '#4682b4')
    .attr('opacity', 0.7)
}
