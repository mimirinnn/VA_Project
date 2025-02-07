import { getFilteredData } from '../../utils/stateManager.js'
import renderTimeSeries from './TimeSeries'

export function updateTimeSeries (selectedCategory = 'Genre') {
  const data = getFilteredData()
  renderTimeSeries(data, selectedCategory)
}
