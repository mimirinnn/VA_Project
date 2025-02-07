import { loadCSVData } from './csvLoader'

let cachedData = null // Кешування для швидшого доступу

export async function getProcessedData () {
  if (!cachedData) {
    let data = await loadCSVData()

    // Заповнення відсутніх значень для року
    data = data.map(d => ({
      ...d,
      Year: d.Year || 2000, // Якщо немає значення, ставимо середній рік
      TotalSales: d.NA_Sales + d.EU_Sales + d.JP_Sales + d.Other_Sales
    }))

    cachedData = data // Зберігаємо кешовану версію
  }

  return cachedData
}
