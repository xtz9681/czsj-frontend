export function calcAgeMonths(birthday) {
  if (!birthday) return 0
  return Math.floor((Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.4))
}

export function formatAge(birthday) {
  if (!birthday) return ''
  const months = calcAgeMonths(birthday)
  if (months < 12) return months + ' 个月'
  const years = Math.floor(months / 12)
  const remainMonths = months % 12
  return remainMonths > 0 ? years + ' 岁 ' + remainMonths + ' 个月' : years + ' 岁'
}
