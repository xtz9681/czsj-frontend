import { request } from './request'

export function getMother() {
  return request({ url: '/mother' })
}

export function createMother(data) {
  return request({ url: '/mother', method: 'POST', data })
}

export function updateMother(data) {
  return request({ url: '/mother', method: 'PUT', data })
}

// 查询妈妈体重记录
export function getWeightRecords() {
  return request({ url: '/mother/weight-records' })
}

// 新增妈妈体重记录
export function addWeightRecord(data) {
  return request({ url: '/mother/weight-records', method: 'POST', data })
}

