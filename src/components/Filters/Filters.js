import { updateFilters, getFilters, resetFilters } from '../../utils/stateManager'

const MAX_SELECTION = 5 // Ліміт вибору фільтрів

// Функція перевірки ліміту вибору
function checkSelectionLimit (container) {
  if (!container) return
  const checkboxes = container.querySelectorAll('input[type=checkbox]')
  const selectedCheckboxes = container.querySelectorAll('input[type=checkbox]:checked')

  // Якщо вибрано `MAX_SELECTION`, блокуємо інші чекбокси
  checkboxes.forEach(checkbox => {
    checkbox.disabled = selectedCheckboxes.length >= MAX_SELECTION && !checkbox.checked
  })
}

// Функція оновлення доступності фільтрів
export function toggleFilterAvailability (selectedCategory) {
  const platformContainer = document.getElementById('platforms')
  const genreContainer = document.getElementById('genres')

  if (selectedCategory === 'Platform') {
    platformContainer.classList.remove('disabled')
    genreContainer.classList.add('disabled')

    platformContainer.querySelectorAll('input[type=checkbox]').forEach(input => input.disabled = false)
    genreContainer.querySelectorAll('input[type=checkbox]').forEach(input => input.disabled = true)
  } else {
    platformContainer.classList.add('disabled')
    genreContainer.classList.remove('disabled')

    platformContainer.querySelectorAll('input[type=checkbox]').forEach(input => input.disabled = true)
    genreContainer.querySelectorAll('input[type=checkbox]').forEach(input => input.disabled = false)
  }

  // Перевіряємо, щоб зайві фільтри залишалися вимкненими навіть після перемикання
  checkSelectionLimit(platformContainer)
  checkSelectionLimit(genreContainer)
}

// Функція створення чекбоксів для платформ та жанрів
function populateCheckboxes (containerId, filterKey, options, topOptions) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Checkbox container with id="${containerId}" not found!`)
    return
  }

  container.innerHTML = '' // Очищаємо перед заповненням

  let row = document.createElement('div')
  row.classList.add('checkbox-row')

  options.forEach((option, index) => {
    const label = document.createElement('label')
    label.classList.add('checkbox-item')

    label.innerHTML = `<input type="checkbox" value="${option}" ${topOptions.includes(option) ? 'checked' : ''}> ${option}`
    row.appendChild(label)

    if ((index + 1) % 5 === 0) {
      container.appendChild(row)
      row = document.createElement('div')
      row.classList.add('checkbox-row')
    }
  })

  if (row.children.length > 0) {
    container.appendChild(row)
  }

  container.addEventListener('change', () => {
    const selectedValues = Array.from(container.querySelectorAll('input[type=checkbox]:checked'))
      .map(checkbox => checkbox.value)
    updateFilters({ [filterKey]: selectedValues })
    checkSelectionLimit(container)
  })

  checkSelectionLimit(container)
}

// Функція створення повзунків років
function createYearSlider () {
  const filters = getFilters()
  const yearMin = filters.year.min
  const yearMax = filters.year.max

  const sliderMin = document.getElementById('year-slider-min')
  const sliderMax = document.getElementById('year-slider-max')
  const yearRange = document.getElementById('year-range')

  sliderMin.min = yearMin
  sliderMin.max = yearMax
  sliderMin.value = yearMin

  sliderMax.min = yearMin
  sliderMax.max = yearMax
  sliderMax.value = yearMax

  function updateYearValues () {
    const minYear = Math.min(parseInt(sliderMin.value), parseInt(sliderMax.value))
    const maxYear = Math.max(parseInt(sliderMin.value), parseInt(sliderMax.value))

    yearRange.textContent = `${minYear} - ${maxYear}`
    updateFilters({ year: { min: minYear, max: maxYear } })
  }

  sliderMin.addEventListener('input', updateYearValues)
  sliderMax.addEventListener('input', updateYearValues)
}

// Функція скидання всіх фільтрів
function resetAllFilters () {
  resetFilters()
  createYearSlider()
  document.getElementById('region').value = 'all'
  document.querySelectorAll('.checkbox-container input[type=checkbox]').forEach(checkbox => {
    checkbox.checked = false
    checkbox.disabled = false
  })
}

// Ініціалізація фільтрів
export function initFilters (uniquePlatforms, uniqueGenres, topPlatforms, topGenres) {
  createYearSlider()
  populateCheckboxes('platforms', 'platform', uniquePlatforms, topPlatforms)
  populateCheckboxes('genres', 'genre', uniqueGenres, topGenres)
  document.getElementById('reset').addEventListener('click', resetAllFilters)

  // Блокуємо неправильні чекбокси на старті
  toggleFilterAvailability('Genre')
}
