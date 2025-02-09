import { updateFilters, getFilters, resetFilters } from '../../utils/stateManager'

const MAX_SELECTION = 5 // Ліміт вибору фільтрів

// **Групи платформ**
const platformCategories = {
  Nintendo: ['3DS', 'DS', 'GB', 'GBA', 'GBC', 'GC', 'N64', 'NES', 'NS', 'Wii', 'WiiU', 'SNES'],
  PlayStation: ['PS', 'PS2', 'PS3', 'PS4', 'PS5', 'PSN', 'PSP', 'PSV'],
  Xbox: ['X360', 'XB', 'XOne'],
  Sega: ['DC', 'GEN', 'SAT', 'SCD'],
  PC: ['PC']
}

// **Функція перевірки ліміту вибору**
function checkSelectionLimit (container) {
  if (!container) return
  const checkboxes = container.querySelectorAll('input[type=checkbox]')
  const selectedCheckboxes = container.querySelectorAll('input[type=checkbox]:checked')

  checkboxes.forEach(checkbox => {
    checkbox.disabled = selectedCheckboxes.length >= MAX_SELECTION && !checkbox.checked
  })
}

// **Функція оновлення доступності фільтрів**
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

  checkSelectionLimit(platformContainer)
  checkSelectionLimit(genreContainer)
}

// **Функція створення чекбоксів для платформ та жанрів**
function populateCheckboxes (containerId, filterKey, options, topOptions) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Checkbox container with id="${containerId}" not found!`)
    return
  }

  container.innerHTML = ''

  // **Якщо фільтр - платформи, додаємо категорії**
  if (filterKey === 'platform') {
    Object.entries(platformCategories).forEach(([category, platforms]) => {
      const categoryLabel = document.createElement('div')
      categoryLabel.classList.add('checkbox-category')
      categoryLabel.innerText = category
      container.appendChild(categoryLabel)

      let row = document.createElement('div')
      row.classList.add('checkbox-row')

      platforms.forEach((platform, index) => {
        if (!options.includes(platform)) return // Пропускаємо платформи, яких немає у датасеті

        const label = document.createElement('label')
        label.classList.add('checkbox-item')

        label.innerHTML = `<input type="checkbox" value="${platform}" ${topOptions.includes(platform) ? 'checked' : ''}> ${platform}`
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
    })
  } else {
    // **Якщо фільтр - жанри, просто створюємо список**
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
  }

  // **Оновлення фільтрів при зміні чекбоксів**
  container.addEventListener('change', () => {
    const selectedValues = Array.from(container.querySelectorAll('input[type=checkbox]:checked'))
      .map(checkbox => checkbox.value)
    updateFilters({ [filterKey]: selectedValues })
    checkSelectionLimit(container)
  })

  checkSelectionLimit(container)
}

// **Функція створення повзунків років із текстовими полями**
function createYearSlider () {
  const filters = getFilters()
  const yearMin = filters.year.min
  const yearMax = Math.min(filters.year.max, 2020) // Максимальний рік обмежено до 2020

  const sliderMin = document.getElementById('year-slider-min')
  const sliderMax = document.getElementById('year-slider-max')
  const inputMin = document.getElementById('year-input-min')
  const inputMax = document.getElementById('year-input-max')

  sliderMin.min = yearMin
  sliderMin.max = yearMax
  sliderMin.value = yearMin

  sliderMax.min = yearMin
  sliderMax.max = yearMax
  sliderMax.value = yearMax

  inputMin.value = yearMin
  inputMax.value = yearMax

  function updateYearValues () {
    let minYear = Math.min(parseInt(sliderMin.value), parseInt(sliderMax.value))
    let maxYear = Math.max(parseInt(sliderMin.value), parseInt(sliderMax.value))

    // Гарантуємо, що minYear < maxYear
    if (minYear === maxYear) {
      if (maxYear < yearMax) {
        maxYear += 1
      } else {
        minYear -= 1
      }
    }

    // Оновлюємо значення у слайдерах і текстових полях
    sliderMin.value = minYear
    sliderMax.value = maxYear
    inputMin.value = minYear
    inputMax.value = maxYear

    // Оновлення фільтрів
    updateFilters({ year: { min: minYear, max: maxYear } })
  }

  function validateAndApplyInput (input, isMin) {
    let year = parseInt(input.value)

    // Якщо введено некоректне значення, повертаємо до дозволеного мін/макс значення
    if (isNaN(year)) {
      year = isMin ? yearMin : yearMax
    }

    if (isMin) {
      if (year < yearMin) year = yearMin
      if (year >= parseInt(inputMax.value)) year = Math.max(yearMin, parseInt(inputMax.value) - 1)
    } else {
      if (year > yearMax) year = yearMax
      if (year <= parseInt(inputMin.value)) year = Math.min(yearMax, parseInt(inputMin.value) + 1)
    }

    input.value = year

    // Оновлюємо слайдери відповідно до введеного значення
    sliderMin.value = parseInt(inputMin.value)
    sliderMax.value = parseInt(inputMax.value)

    // Оновлення фільтрів
    updateFilters({ year: { min: parseInt(inputMin.value), max: parseInt(inputMax.value) } })
  }

  // Додаємо обробники подій для оновлення значень
  sliderMin.addEventListener('input', updateYearValues)
  sliderMax.addEventListener('input', updateYearValues)

  inputMin.addEventListener('change', () => validateAndApplyInput(inputMin, true))
  inputMax.addEventListener('change', () => validateAndApplyInput(inputMax, false))

  inputMin.addEventListener('blur', () => validateAndApplyInput(inputMin, true))
  inputMax.addEventListener('blur', () => validateAndApplyInput(inputMax, false))
}

// **Функція скидання всіх фільтрів**
function resetAllFilters () {
  resetFilters()

  const filters = getFilters()
  const yearMin = filters.year.min
  const yearMax = Math.min(filters.year.max, 2020)

  const sliderMin = document.getElementById('year-slider-min')
  const sliderMax = document.getElementById('year-slider-max')
  const inputMin = document.getElementById('year-input-min')
  const inputMax = document.getElementById('year-input-max')

  sliderMin.value = yearMin
  sliderMax.value = yearMax
  inputMin.value = yearMin
  inputMax.value = yearMax

  updateFilters({ year: { min: yearMin, max: yearMax } })

  document.getElementById('region').value = 'all'
  document.querySelectorAll('.checkbox-container input[type=checkbox]').forEach(checkbox => {
    checkbox.checked = false
    checkbox.disabled = false
  })
}

// **Ініціалізація фільтрів**
export function initFilters (uniquePlatforms, uniqueGenres, topPlatforms, topGenres) {
  createYearSlider()
  populateCheckboxes('platforms', 'platform', uniquePlatforms, topPlatforms)
  populateCheckboxes('genres', 'genre', uniqueGenres, topGenres)
  document.getElementById('reset').addEventListener('click', resetAllFilters)

  toggleFilterAvailability('Genre')
}
