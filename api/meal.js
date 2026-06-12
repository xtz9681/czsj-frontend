import { request } from './request'

// 快速记录一餐（手动勾选或拍照确认后调用）
export function quickRecord(data) {
  return request({ url: '/meal/quick-record', method: 'POST', data })
}

// 多主体记录前的 suitability 检查（检查 nursing 孩子警告）
export function checkMultiRecordWarning(data) {
  return request({ url: '/meal/check-multi-record-warning', method: 'POST', data })
}

// 多主体记录（一次记录到多个档案）
export function recordMultiple(data) {
  return request({ url: '/meal/record-multiple', method: 'POST', data })
}

// 餐次历史列表
export function getMealList(babyId, page = 0, size = 20) {
  return request({ url: '/meal/list', data: { babyId, page, size } })
}

// 月龄食材库
export function getIngredientsByAge(babyId) {
  return request({ url: '/meal/ingredients/by-age', data: { babyId } })
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
  return request({ url: '/meal/nutrition-trend', method: 'get', data: params })
}

// 获取单条餐食记录
export function getMealById(mealId) {
  return request({ url: '/meal/' + mealId, method: 'GET' })
}

