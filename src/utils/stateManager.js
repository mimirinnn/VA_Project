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

  console.log(`Initialized year range: ${state.filters.year.min} - ${state.filters.year.max}`)

  state.filters.platform = [...new Set(data.map(d => d.Platform))]
  state.filters.genre = [...new Set(data.map(d => d.Genre))]

  state.originalData = data
  state.filteredData = [...data]

  // **Примусово оновлюємо фільтри після ініціалізації**
  updateFilters({ year: { min: minYear, max: maxYear } })

  console.log(`Initialized year range: ${state.filters.year.min} - ${state.filters.year.max}`)
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
  state.filters = { ...state.filters, ...newFilters }
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
    year: { min: state.filters.year.min, max: state.filters.year.max },
    region: 'all',
    platform: [...new Set(state.originalData.map(d => d.Platform))],
    genre: [...new Set(state.originalData.map(d => d.Genre))]
  }
  applyFilters()
}

// Отримати відфільтровані дані
export function getFilteredData () {
  console.log('getFilteredData - Current filters:', state.filters)

  return state.originalData.filter(d =>
    d.Year >= state.filters.year.min && d.Year <= state.filters.year.max &&
    (state.filters.genre.length === 0 || state.filters.genre.includes(d.Genre)) &&
    (state.filters.region === 'all' || d[`${state.filters.region}_Sales`] > 0)
  )
}

// Отримати поточні значення фільтрів
export function getFilters () {
  return state.filters
}
