import { getFilteredData } from '../../utils/stateManager'
import { applyPCA } from './PCA'
import { renderPCA } from './renderPCA'

/**
 * Оновлення графіку PCA з урахуванням обраної категорії (Genre або Platform).
 * Обчислюється PCA (разом із двома типами кластеризації) і візуалізуються дані.
 * @param {String} selectedCategory - 'Genre' або 'Platform'.
 */
export function updatePCA (selectedCategory) {
  try {
    let rawData = getFilteredData()
    console.log('📊 Отримані дані для PCA перед фільтрацією:', rawData)

    if (!rawData || rawData.length === 0) {
      console.warn('⚠ Немає даних для PCA.')
      return
    }

    // **Фільтруємо тільки топ-5 платформ або жанрів**
    const categoryKey = selectedCategory === 'Platform' ? 'Platform' : 'Genre'
    const categoryTotals = {}

    rawData.forEach(d => {
      categoryTotals[d[categoryKey]] = (categoryTotals[d[categoryKey]] || 0) + d.TotalSales
    })

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(d => d[0])

    rawData = rawData.filter(d => topCategories.includes(d[categoryKey]))
    console.log('📊 Відфільтровані дані для PCA (Топ-5):', rawData)

    // Обчислення PCA, PCA-based кластеризації та кластеризації за даними продажів
    const pcaData = applyPCA(rawData)
    console.log('📊 Дані після PCA і кластеризації:', pcaData)

    // Візуалізація PCA
    renderPCA(pcaData, selectedCategory)
  } catch (error) {
    console.error('Помилка при оновленні PCA:', error)
  }
}
