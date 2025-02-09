import numeric from 'numeric'

/**
 * Виконує PCA та кластеризацію.
 * Обчислюється PCA для зведення даних до двох вимірів та виконується K-Means
 * кластеризація на основі PCA. Додатково виконується кластеризація за даними
 * продажів по регіонах (NA, EU, JP, Other). Результат повертається з полями:
 *   - pc1, pc2 (координати після PCA),
 *   - cluster (кластер PCA),
 *   - regionCluster (кластер за продажами).
 * @param {Array} data - Масив об'єктів із даними.
 * @returns {Array} - Дані з доданими pc1, pc2, cluster та regionCluster.
 */
export function applyPCA (data) {
  if (!data || data.length === 0) {
    console.warn('⚠ Недостатньо даних для PCA.')
    return []
  }

  // 1. Формування числового набору (продажі)
  const features = data.map(d => [
    parseFloat(d.NA_Sales) || 0,
    parseFloat(d.EU_Sales) || 0,
    parseFloat(d.JP_Sales) || 0,
    parseFloat(d.Other_Sales) || 0,
    parseFloat(d.Global_Sales) || 0
  ])

  const numFeatures = features[0].length

  // 2. Обчислення середніх значень
  const means = new Array(numFeatures).fill(0)
  features.forEach(row => row.forEach((val, j) => means[j] += val))
  means.forEach((sum, j) => means[j] /= features.length)

  // 3. Центрування даних (віднімання середнього)
  const standardized = features.map(row => row.map((val, j) => val - means[j]))

  // 4. Обчислення коваріаційної матриці
  const covMatrix = numeric.dot(numeric.transpose(standardized), standardized)
  const eig = numeric.eig(covMatrix)

  // 5. Вибір двох головних компонент
  const indices = eig.lambda.x.map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
  const pc1Vector = eig.E.x.map(row => row[indices[0].index])
  const pc2Vector = eig.E.x.map(row => row[indices[1].index])

  // 6. Проекція даних на PC1 та PC2
  const pcaScores = standardized.map(row => ({
    pc1: numeric.dot(row, pc1Vector),
    pc2: numeric.dot(row, pc2Vector)
  }))

  let finalData = data.map((d, i) => ({
    ...d,
    pc1: pcaScores[i].pc1,
    pc2: pcaScores[i].pc2
  }))

  // 🔥 Кластеризація на основі PCA (використовує pc1 та pc2)
  finalData = applyKMeans(finalData, 4)

  // 🔥 Додаткова кластеризація за даними продажів по регіонах (NA, EU, JP, Other)
  finalData = applyKMeansOnSalesData(finalData, 4)

  return finalData
}

/**
 * Виконує K-Means кластеризацію для PCA-даних.
 * @param {Array} data - Дані з полями pc1 та pc2.
 * @param {number} k - Кількість кластерів.
 * @returns {Array} - Дані з доданим полем cluster.
 */
function applyKMeans (data, k = 4) {
  const points = data.map(d => [d.pc1, d.pc2])

  const centroids = points.slice(0, k)
  let prevAssignments = new Array(points.length).fill(-1)
  let changed = true

  while (changed) {
    const assignments = points.map(p =>
      centroids.map(c => numeric.norm2(numeric.sub(p, c)))
        .reduce((iMin, d, i, arr) => d < arr[iMin] ? i : iMin, 0)
    )

    changed = assignments.some((a, i) => a !== prevAssignments[i])
    prevAssignments = [...assignments]

    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i)
      if (clusterPoints.length > 0) {
        centroids[i] = clusterPoints
          .reduce((sum, p) => numeric.add(sum, p), new Array(2).fill(0))
          .map(x => x / clusterPoints.length)
      }
    }
  }

  return data.map((d, i) => ({ ...d, cluster: prevAssignments[i] }))
}

/**
 * Виконує K-Means кластеризацію за даними продажів по регіонах.
 * Для кластеризації використовуються дані: NA_Sales, EU_Sales, JP_Sales, Other_Sales.
 * @param {Array} data - Дані з полями продажів.
 * @param {number} k - Кількість кластерів.
 * @returns {Array} - Дані з доданим полем regionCluster.
 */
function applyKMeansOnSalesData (data, k = 4) {
  // Формування числового набору для регіональних продажів
  const points = data.map(d => [
    parseFloat(d.NA_Sales) || 0,
    parseFloat(d.EU_Sales) || 0,
    parseFloat(d.JP_Sales) || 0,
    parseFloat(d.Other_Sales) || 0
  ])

  const centroids = points.slice(0, k)
  let prevAssignments = new Array(points.length).fill(-1)
  let changed = true

  while (changed) {
    const assignments = points.map(p =>
      centroids.map(c => numeric.norm2(numeric.sub(p, c)))
        .reduce((iMin, d, i, arr) => d < arr[iMin] ? i : iMin, 0)
    )

    changed = assignments.some((a, i) => a !== prevAssignments[i])
    prevAssignments = [...assignments]

    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i)
      if (clusterPoints.length > 0) {
        centroids[i] = clusterPoints
          .reduce((sum, p) => numeric.add(sum, p), new Array(4).fill(0))
          .map(x => x / clusterPoints.length)
      }
    }
  }

  return data.map((d, i) => ({
    ...d,
    regionCluster: prevAssignments[i]
  }))
}
