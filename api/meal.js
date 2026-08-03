import { request } from './request'

// 记录一餐（单档案或多档案）
// 入参 subjectIdList（档案 ID 列表），返回单档案时为对象，多档案时为列表
export function record(data) {
  return request({ url: '/meal/record', method: 'POST', data })
}

// AI 文字拆食材（识别不入库，用户确认后调 record）
export function parseFoodText(description) {
  return request({ url: '/meal/parse-text', method: 'POST', data: { description } })
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

// 用户自定义食材入库（先入库再加入清单，确保首页统计时能查到 category）
export function createIngredient(name, category) {
  return request({ url: '/meal/ingredients', method: 'POST', data: { name, category } })
}

// 餐次历史列表
export function getMealList(subjectId, subjectType, page = 0, size = 20, startDate = null, endDate = null) {
  const data = { subjectId, subjectType, page, size }
  if (startDate) data.startDate = startDate
  if (endDate) data.endDate = endDate
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

