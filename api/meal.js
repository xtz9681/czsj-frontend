import { request } from './request'

// 记录一餐（单档案或多档案）
// 入参 subjectIdList（档案 ID 列表），返回单档案时为对象，多档案时为列表
export function record(data) {
  return request({ url: '/meal/record', method: 'POST', data })
}

// 多主体记录前的 suitability 检查（检查 nursing 孩子警告）
export function checkMultiRecordWarning(data) {
  return request({ url: '/meal/check-multi-record-warning', method: 'POST', data })
}

// 食材库查询（全年龄段通用食材库，可按分类过滤）
export function getIngredients(category = null) {
  const params = {}
  if (category) params.category = category
  return request({ url: '/meal/ingredients', method: 'GET', data: params })
}

// 餐次历史列表
export function getMealList(babyId, page = 0, size = 20, date = null) {
  const data = { babyId, page, size }
  if (date) data.date = date
  return request({ url: '/meal/list', method: 'GET', data })
}

// 今日营养统计
export function getDailySummary(subjectId, subjectType) {
  return request({ url: '/meal/daily-summary', data: { subjectId, subjectType } })
}

// 周营养统计
export function getWeekSummary(subjectId, subjectType) {
  return request({ url: '/meal/week-summary', data: { subjectId, subjectType } })
}

// 删除餐食记录
export function deleteMeal(mealId) {
  return request({ url: '/meal/' + mealId, method: 'DELETE' })
}

// 编辑餐食记录
export function updateMeal(mealId, data) {
  return request({ url: '/meal/' + mealId, method: 'PUT', data })
}

// 常吃食材统计
export function getFrequentIngredients(subjectId, subjectType) {
  return request({ url: '/meal/frequent-ingredients', data: { subjectId, subjectType, days: 14 } })
}

// 营养趋势数据（近 N 天的每日评分）
export function getNutritionTrend(params) {
  return request({ url: '/meal/nutrition-trend', method: 'GET', data: params })
}

// 获取单条餐食记录
export function getMealById(mealId) {
  return request({ url: '/meal/' + mealId, method: 'GET' })
}

