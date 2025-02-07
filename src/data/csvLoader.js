import * as d3 from 'd3'

export async function loadCSVData () {
  try {
    const data = await d3.csv('dataset.csv', (d) => ({
      Rank: +d.Rank,
      Name: d.Name,
      Platform: d.Platform,
      Year: d.Year ? +d.Year : null, // Додаємо перевірку на відсутні роки
      Genre: d.Genre,
      Publisher: d.Publisher,
      NA_Sales: +d.NA_Sales || 0,
      EU_Sales: +d.EU_Sales || 0,
      JP_Sales: +d.JP_Sales || 0,
      Other_Sales: +d.Other_Sales || 0,
      Global_Sales: +d.Global_Sales || 0
    }))

    console.log('CSV Data Loaded:', data.slice(0, 5)) // Вивід перших 5 рядків у консоль
    return data
  } catch (error) {
    console.error('Error loading CSV:', error)
    return []
  }
}
