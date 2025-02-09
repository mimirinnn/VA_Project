import { applyPCA } from './PCA'
import { renderPCA } from './renderPCA'
import { fetchChartData } from '../../utils/api'

/**
 * Приклад функції нормалізації даних.
 * Якщо у вас є інша реалізація – замініть її.
 * @param {Array} data - Масив вхідних даних.
 * @returns {Array} - Нормалізований масив даних.
 */
function normalizeData (data) {
  // Для прикладу повертаємо дані без змін.
  return data
}

/**
 * Функція оновлення графіка PCA.
 * Завантажує дані, нормалізує їх, застосовує PCA і відображає результат.
 * @param {Object} filters - Фільтри для завантаження даних.
 */
export async function updatePCA (filters) {
  try {
    const rawData = await fetchChartData(filters)
    console.log('📊 Отримані дані для PCA:', rawData)

    if (!rawData || rawData.length === 0) {
      console.warn('⚠ Немає даних для PCA.')
      return
    }

    // 1. Нормалізація даних (якщо потрібно)
    const normalizedData = normalizeData(rawData)

    // 2. Обчислення PCA
    const pcaData = applyPCA(normalizedData)

    // 3. Візуалізація результатів за допомогою D3.js
    renderPCA(pcaData)
  } catch (error) {
    console.error('Помилка при оновленні PCA:', error)
  }
}
