import { getProcessedData } from '../data/preprocess'

export async function fetchChartData (filters) {
  const data = await getProcessedData()

  return data.filter(d =>
    (filters.year ? d.Year >= filters.year.min && d.Year <= filters.year.max : true) &&
        (filters.region ? d[`${filters.region}_Sales`] > 0 : true) &&
        (filters.platform ? filters.platform.includes(d.Platform) : true) &&
        (filters.genre ? filters.genre.includes(d.Genre) : true)
  )
}
