import { request } from './request'

// 快速记录一餐（手动勾选或拍照确认后调用）
export function quickRecord(data) {
  return request({ url: '/meal/quick-record', method: 'POST', data })
}

// 餐次历史列表
export function getMealList(babyId, page = 0, size = 20) {
  return request({ url: '/meal/list', data: { babyId, page, size } })
}

// 月龄食材库
export function getIngredientsByAge(babyId) {
  return request({ url: '/meal/ingredients/by-age', data: { babyId } })
}
