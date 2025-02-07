import { getProcessedData } from './data/preprocess'
import { initializeFilters, getFilteredData, updateFilters } from './utils/stateManager'
import { initFilters, toggleFilterAvailability } from './components/Filters/Filters'
import { updateTimeSeries } from './components/TimeSeries'
import './index.scss'

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

  const topPlatforms = Object.entries(platformTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(d => d[0])

  const topGenres = Object.entries(genreTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(d => d[0])

  // Ініціалізація фільтрів з урахуванням топ-5 категорій
  initializeFilters(data)
  initFilters(uniquePlatforms, uniqueGenres, topPlatforms, topGenres)

  let selectedCategory = 'Genre' // За замовчуванням - жанри

  function updateChart () {
    updateTimeSeries(selectedCategory)
  }

  // Додаємо обробник для toggle перемикача
  document.getElementById('toggle-category').addEventListener('change', function () {
    selectedCategory = this.checked ? 'Platform' : 'Genre'
    document.getElementById('category-label').textContent = selectedCategory === 'Genre' ? 'Genres' : 'Platforms'
    toggleFilterAvailability(selectedCategory)
    updateChart()
  })

  // Додаємо слухачі подій для оновлення графіка при зміні фільтрів
  document.getElementById('year-slider-min').addEventListener('input', () => { updateFilters({}); updateChart() })
  document.getElementById('year-slider-max').addEventListener('input', () => { updateFilters({}); updateChart() })
  document.getElementById('region').addEventListener('change', () => { updateFilters({ region: document.getElementById('region').value }); updateChart() })
  document.getElementById('platforms').addEventListener('change', () => { updateFilters({}); updateChart() })
  document.getElementById('genres').addEventListener('change', () => { updateFilters({}); updateChart() })
  document.getElementById('reset').addEventListener('click', () => { updateFilters({}); updateChart() })

  document.addEventListener('filtersUpdated', updateChart)

  // Початковий рендер графіка
  updateChart()
}

startApp()
