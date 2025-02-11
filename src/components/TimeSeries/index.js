import { getFilteredData } from '../../utils/stateManager.js'
import renderTimeSeries from './TimeSeries'
import * as d3 from 'd3'

export function updateTimeSeries (selectedCategory = 'Genre') {
  setTimeout(() => {
    const data = getFilteredData()
    console.log('updateTimeSeries - Data range received:', d3.min(data, d => d.Year), '-', d3.max(data, d => d.Year))
    renderTimeSeries(data, selectedCategory)
  }, 50) // Невелика затримка, щоб дочекатися оновлення фільтрів
}
