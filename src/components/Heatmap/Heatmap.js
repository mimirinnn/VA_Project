import * as d3 from 'd3';
import { getFilteredData } from '../../utils/stateManager.js';

// Функція для створення теплової карти
export function renderHeatmap() {
    d3.select('#heatmap-chart').selectAll('*').remove(); // Очистка перед рендерингом

    const data = getFilteredData();

    const regions = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales'];
    const genres = [...new Set(data.map(d => d.Genre))].sort();

    const salesData = genres.map(genre => ({
        genre,
        sales: regions.map(region => ({
            region,
            value: d3.sum(data.filter(d => d.Genre === genre), d => d[region])
        }))
    }));

    const margin = { top: 30, right: 40, bottom: 60, left: 120 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#heatmap-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(regions).range([0, width]).padding(0.05);
    const yScale = d3.scaleBand().domain(genres).range([height, 0]).padding(0.05);

    const maxSales = d3.max(salesData.flatMap(d => d.sales.map(s => s.value)));
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxSales]);

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
        .style('pointer-events', 'none');

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
                .html(`<strong>${d.genre}</strong><br>${d.region}: ${d.value.toFixed(2)}M`);
            
            d3.select(this)
                .style('stroke', 'black')
                .style('stroke-width', 2);
        })
        .on('mousemove', (event) => {
            tooltip.style('top', `${event.pageY - 30}px`)
                   .style('left', `${event.pageX + 10}px`);
        })
        .on('mouseout', function () {
            tooltip.style('visibility', 'hidden');
            
            d3.select(this)
                .style('stroke', '#fff')
                .style('stroke-width', 1);
        });

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .call(d3.axisLeft(yScale));

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .text('Regions');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .text('Genres');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Regional Sales Heatmap');
}
