import { getFilteredData } from '../../utils/stateManager' // Використовуємо відфільтровані дані
import { applyPCA } from './pca'
import { renderPCA } from './renderPCA'

/**
 * Функція нормалізації даних (при необхідності змініть реалізацію)
 * @param {Array} data - Вхідний масив даних.
 * @returns {Array} - Нормалізований масив даних.
 */
function normalizeData (data) {
  // За замовчуванням повертаємо дані без змін.
  return data
}

/**
 * Оновлення графіку PCA з урахуванням обраної категорії (Genre або Platform).
 * @param {String} selectedCategory - 'Genre' або 'Platform'
 */
export function updatePCA (selectedCategory) {
  try {
    // Отримуємо відфільтровані дані (всі налаштування фільтрів застосовані через stateManager)
    const rawData = getFilteredData()
    console.log('📊 Отримані дані для PCA:', rawData)

    if (!rawData || rawData.length === 0) {
      console.warn('⚠ Немає даних для PCA.')
      return
    }

    // 1. Нормалізація даних (якщо потрібно)
    const normalizedData = normalizeData(rawData)

    // 2. Обчислення PCA (додаються властивості pc1 та pc2 до кожного об’єкта)
    const pcaData = applyPCA(normalizedData)

    // 3. Візуалізація результатів з використанням обраної категорії для фарбування
    renderPCA(pcaData, selectedCategory)
  } catch (error) {
    console.error('Помилка при оновленні PCA:', error)
  }
}
