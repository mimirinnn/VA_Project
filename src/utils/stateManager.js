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
export function initializeFilters (data) {
  const years = data.map(d => d.Year).filter(y => y !== null)
  state.filters.year.min = Math.min(...years)
  state.filters.year.max = Math.max(...years)
  state.filters.platform = [...new Set(data.map(d => d.Platform))]
  state.filters.genre = [...new Set(data.map(d => d.Genre))]

  state.originalData = data
  state.filteredData = [...data]
}

let selectedTimeRange = null

export function updateTimeRange (range) {
  selectedTimeRange = range
  document.dispatchEvent(new CustomEvent('timeRangeUpdated', { detail: range }))
}

export function getTimeRange () {
  return selectedTimeRange
}

// Оновлення стану фільтрів
export function updateFilters (newFilters) {
  state.filters = { ...state.filters, ...newFilters }
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
    year: { min: state.filters.year.min, max: state.filters.year.max },
    region: 'all',
    platform: [...new Set(state.originalData.map(d => d.Platform))],
    genre: [...new Set(state.originalData.map(d => d.Genre))]
  }
  applyFilters()
}

// Отримати відфільтровані дані
export function getFilteredData () {
  return state.filteredData
}

// Отримати поточні значення фільтрів
export function getFilters () {
  return state.filters
}
