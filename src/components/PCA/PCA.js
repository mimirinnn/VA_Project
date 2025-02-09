// src/PCA/pca.js
import numeric from 'numeric'

/**
 * Застосування PCA до даних.
 * @param {Array} data - Масив об'єктів з даними. Приклад об'єкта:
 *   {
 *     Rank: 1,
 *     Name: 'Wii Sports',
 *     Platform: 'Wii',
 *     Year: 2006,
 *     Genre: 'Sports',
 *     Publisher: 'Nintendo',
 *     NA_Sales: 41.36,
 *     EU_Sales: 29.02,
 *     JP_Sales: 3.77,
 *     Other_Sales: 8.51,
 *     Global_Sales: 82.65
 *   }
 * @returns {Array} - Масив об'єктів з доданими властивостями pc1 та pc2.
 */
export function applyPCA (data) {
  // 1. Вибір числових властивостей для аналізу (продажі)
  const features = data.map(d => [
    parseFloat(d.NA_Sales),
    parseFloat(d.EU_Sales),
    parseFloat(d.JP_Sales),
    parseFloat(d.Other_Sales),
    parseFloat(d.Global_Sales)
  ])

  const numFeatures = features[0].length

  // 2. Обчислення середніх значень для кожного стовпця
  const means = new Array(numFeatures).fill(0)
  features.forEach(row => {
    row.forEach((val, j) => {
      means[j] += val
    })
  })
  for (let j = 0; j < numFeatures; j++) {
    means[j] /= features.length
  }

  // 3. Стандартизація даних (віднімання середнього)
  const standardized = features.map(row =>
    row.map((val, j) => val - means[j])
  )

  // 4. Обчислення коваріаційної матриці
  const covMatrix = []
  for (let i = 0; i < numFeatures; i++) {
    covMatrix[i] = []
    for (let j = 0; j < numFeatures; j++) {
      let sum = 0
      for (let k = 0; k < standardized.length; k++) {
        sum += standardized[k][i] * standardized[k][j]
      }
      covMatrix[i][j] = sum / (standardized.length - 1)
    }
  }

  // 5. Обчислення власних значень та власних векторів за допомогою numeric.js
  const eig = numeric.eig(covMatrix)
  const eigenvalues = eig.lambda.x // отримуємо реальні значення
  // ВАЖЛИВО: отримуємо власні вектори з властивості .x, а не безпосередньо з eig.E
  const eigenvectors = eig.E.x

  // 6. Сортування власних значень за спаданням та отримання їх індексів
  const indices = eigenvalues.map((value, index) => ({ value, index }))
  indices.sort((a, b) => b.value - a.value)

  // Функція для отримання стовпця (власного вектора) з матриці eigenvectors
  function getEigenvector (colIndex) {
    return eigenvectors.map(row => row[colIndex])
  }

  // 7. Отримання перших двох головних компонент (власних векторів)
  const pc1Vector = getEigenvector(indices[0].index)
  const pc2Vector = getEigenvector(indices[1].index)

  // 8. Проекція даних на перші дві головні компоненти
  const pcaScores = standardized.map(row => {
    const score1 = numeric.dot(row, pc1Vector)
    const score2 = numeric.dot(row, pc2Vector)
    return { pc1: score1, pc2: score2 }
  })

  // 9. Додаємо результати PCA до оригінальних даних
  const finalData = data.map((d, i) => ({
    ...d,
    pc1: pcaScores[i].pc1,
    pc2: pcaScores[i].pc2
  }))

  return finalData
}
