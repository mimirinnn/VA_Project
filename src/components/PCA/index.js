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
    const rawData = getFilteredData()
    console.log('📊 Отримані дані для PCA:', rawData)

    if (!rawData || rawData.length === 0) {
      console.warn('⚠ Немає даних для PCA.')
      return
    }

    // Обчислення PCA, PCA-based кластеризації та кластеризації за даними продажів
    const pcaData = applyPCA(rawData)
    console.log('📊 Дані після PCA і кластеризації:', pcaData)

    // Візуалізація, яка показує дані із регіональною кластеризацією
    renderPCA(pcaData, selectedCategory)
  } catch (error) {
    console.error('Помилка при оновленні PCA:', error)
  }
}
