import { getProcessedData } from './data/preprocess'
import { initializeFilters, getFilteredData, updateFilters, getFilters } from './utils/stateManager'
import { initFilters, toggleFilterAvailability } from './components/Filters/Filters'
import { updateTimeSeries } from './components/TimeSeries'
import { updateHeatmap } from './components/Heatmap'
import './index.scss'
import { updatePCA } from './components/PCA'

const INITIAL_YEAR_RANGE = { min: 1985, max: 2020 }

async function startApp () {
  const data = await getProcessedData()

  // Отримуємо унікальні платформи та жанри
  const uniquePlatforms = [...new Set(data.map(d => d.Platform))].sort()
  const uniqueGenres = [...new Set(data.map(d => d.Genre))].sort()

  // Визначаємо топ-5 платформ та жанрів
  const platformTotals = {}
  const genreTotals = {}

  data.forEach(d => {
    platformTotals[d.Platform] = (platformTotals[d.Platform] || 0) + d.TotalSales
    genreTotals[d.Genre] = (genreTotals[d.Genre] || 0) + d.TotalSales
  })

  const oldPlatforms = ['NES', 'SNES', 'GB', 'GBA', 'PS1'] // Ручне додавання старих платформ
  const topPlatforms = Object.entries(platformTotals)
    .sort((a, b) => b[1] - a[1])
    .map(d => d[0])

  // **Якщо всі топові платформи починаються після 2000, додаємо старі**
  const selectedPlatforms = topPlatforms.some(p => parseInt(p.replace(/\D/g, '')) < 2000)
    ? topPlatforms.slice(0, 5) // Якщо є старі платформи, беремо топ-5
    : [...topPlatforms.slice(0, 3), ...oldPlatforms.slice(0, 2)] // Інакше додаємо ретро-платформи

  console.log('Updated Top Platforms:', selectedPlatforms)

  const topGenres = Object.entries(genreTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(d => d[0])

  initializeFilters(data, INITIAL_YEAR_RANGE)
  initFilters(uniquePlatforms, uniqueGenres, selectedPlatforms, topGenres)

  console.log('Applying top filters:', topPlatforms, topGenres)

  // **Оновлюємо рік перед тим, як оновлювати платформи та жанри**
  updateFilters({ year: INITIAL_YEAR_RANGE })

  setTimeout(() => {
    updateFilters({ platform: topPlatforms, genre: topGenres })
    console.log('Updated filters after top selection:', getFilters())
  }, 50) // Затримка, щоб гарантувати правильний порядок

  console.log(`Applied year range: ${getFilters().year.min} - ${getFilters().year.max}`)

  console.log(`Applied year range: ${getFilters().year.min} - ${getFilters().year.max}`)

  let selectedCategory = 'Genre'

  function updateCharts () {
    // initializeFilters(data, INITIAL_YEAR_RANGE)
    setTimeout(() => updateTimeSeries(selectedCategory), 100) // Додаємо коротку затримку для синхронізації

    updateHeatmap()
    updatePCA(selectedCategory)
  }

  document.getElementById('toggle-category').addEventListener('change', function () {
    selectedCategory = this.checked ? 'Platform' : 'Genre'
    document.getElementById('category-label').textContent = selectedCategory === 'Genre' ? 'Genres' : 'Platforms'
    toggleFilterAvailability(selectedCategory)
    updateCharts()

    // **Очищаємо попередній тренд продажів**
    document.getElementById('sales-trend').innerHTML = ''
  })

  document.getElementById('year-slider-min').addEventListener('input', () => { updateFilters({}); updateCharts() })
  document.getElementById('year-slider-max').addEventListener('input', () => { updateFilters({}); updateCharts() })
  document.getElementById('region').addEventListener('change', () => { updateFilters({ region: document.getElementById('region').value }); updateCharts() })
  document.getElementById('platforms').addEventListener('change', () => { updateFilters({}); updateCharts() })
  document.getElementById('genres').addEventListener('change', () => { updateFilters({}); updateCharts() })
  document.getElementById('reset').addEventListener('click', () => { updateFilters({}); updateCharts() })

  document.addEventListener('filtersUpdated', updateCharts)

  updateCharts()
}

startApp()
