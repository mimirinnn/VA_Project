import { renderTSNE } from './TSNE'
import { fetchChartData } from '../../utils/api'

/**
 * Оновлення графіку T-SNE при зміні фільтрів
 * @param {Object} filters - Фільтри для оновлення
 */
export async function updateTSNE (filters) {
  const data = await fetchChartData(filters)
  console.log('📊 Дані для T-SNE:', data)

  if (data.length > 0) {
    renderTSNE(data)
  } else {
    console.warn('⚠ Немає даних для T-SNE.')
  }
}
