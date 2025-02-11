import * as d3 from 'd3'

const state = {
  filters: {
    year: { min: null, max: null },
    region: 'all',
    platform: [],
    genre: []
  },
  originalData: [],
  filteredData: []
}

// Ініціалізація фільтрів на основі датасету
export function initializeFilters (data, initialYearRange) {
  const years = data.map(d => d.Year).filter(y => y !== null)
  const minYear = Math.max(Math.min(...years), initialYearRange.min)
  const maxYear = Math.min(Math.max(...years), initialYearRange.max)

  state.filters.year = { min: minYear, max: maxYear }
  console.log(`Filters initialized (Fixed!): ${state.filters.year.min} - ${state.filters.year.max}`)

  state.filters.platform = [...new Set(data.map(d => d.Platform))]
  state.filters.genre = [...new Set(data.map(d => d.Genre))]

  state.originalData = data
  state.filteredData = [...data]

  console.log(`Filters initialized: ${state.filters.year.min} - ${state.filters.year.max}`)
}

let selectedTimeRange = null

export function updateTimeRange (range) {
  selectedTimeRange = range
  document.dispatchEvent(new CustomEvent('timeRangeUpdated', { detail: range }))
}

export function getTimeRange () {
  return selectedTimeRange
}

export function updateFilters (newFilters) {
  console.log('Before updateFilters:', state.filters)

  // **Спочатку оновлюємо рік**
  if (newFilters.year !== undefined) {
    state.filters.year = newFilters.year
  }

  // **Оновлюємо платформу, якщо вона є**
  if (newFilters.platform !== undefined) {
    state.filters.platform = newFilters.platform.length > 0 ? newFilters.platform : state.filters.platform
  }

  // **Оновлюємо жанри, якщо вони є**
  if (newFilters.genre !== undefined) {
    state.filters.genre = newFilters.genre.length > 0 ? newFilters.genre : state.filters.genre
  }

  // **Оновлюємо регіон**
  if (newFilters.region !== undefined) {
    state.filters.region = newFilters.region
  }

  console.log('After updateFilters:', state.filters)
  applyFilters()
}

// Фільтрація даних
function applyFilters () {
  state.filteredData = state.originalData.filter(d =>
    (d.Year >= state.filters.year.min && d.Year <= state.filters.year.max) &&
        (state.filters.region === 'all' || d[`${state.filters.region}_Sales`] > 0) &&
        (state.filters.platform.length === 0 || state.filters.platform.includes(d.Platform)) &&
        (state.filters.genre.length === 0 || state.filters.genre.includes(d.Genre))
  )

  // Додаємо примусове оновлення графіка після зміни регіону
  document.dispatchEvent(new Event('filtersUpdated'))
}

// Функція скидання всіх фільтрів
export function resetFilters () {
  state.filters = {
    year: { min: Math.min(...state.originalData.map(d => d.Year)), max: 2020 }, // Завжди повертаємося до 1985-2020
    region: 'all',
    platform: [...new Set(state.originalData.map(d => d.Platform))],
    genre: [...new Set(state.originalData.map(d => d.Genre))]
  }
  console.log(`Reset Filters - Years: ${state.filters.year.min} - ${state.filters.year.max}`)
  applyFilters()
}

// Отримати відфільтровані дані
export function getFilteredData () {
  console.log('getFilteredData - Checking filters:', state.filters.year.min, '-', state.filters.year.max)

  const availableYears = state.originalData.map(d => d.Year)
  console.log('Available years before filtering:', Math.min(...availableYears), '-', Math.max(...availableYears))

  // **Крок 1: Фільтрація за роками**
  let filteredData = state.originalData.filter(d => d.Year >= state.filters.year.min && d.Year <= state.filters.year.max)
  console.log('After year filter:', d3.min(filteredData, d => d.Year), '-', d3.max(filteredData, d => d.Year), 'Count:', filteredData.length)

  // **Крок 2: Фільтрація за платформами**
  filteredData = filteredData.filter(d => state.filters.platform.length === 0 || state.filters.platform.includes(d.Platform))
  console.log('After platform filter:', d3.min(filteredData, d => d.Year), '-', d3.max(filteredData, d => d.Year), 'Count:', filteredData.length)

  // **Крок 3: Фільтрація за жанрами**
  filteredData = filteredData.filter(d => state.filters.genre.length === 0 || state.filters.genre.includes(d.Genre))
  console.log('After genre filter:', d3.min(filteredData, d => d.Year), '-', d3.max(filteredData, d => d.Year), 'Count:', filteredData.length)

  // **Крок 4: Фільтрація за регіоном**
  filteredData = filteredData.filter(d => state.filters.region === 'all' || d[`${state.filters.region}_Sales`] > 0)
  console.log('After region filter:', d3.min(filteredData, d => d.Year), '-', d3.max(filteredData, d => d.Year), 'Count:', filteredData.length)

  return filteredData
}

// Отримати поточні значення фільтрів
export function getFilters () {
  return state.filters
}
