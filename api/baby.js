import { request } from './request'

export function getBabyList() {
  return request({ url: '/baby' })
}

export function createBaby(data) {
  return request({ url: '/baby', method: 'POST', data })
}

export function updateBaby(id, data) {
  return request({ url: `/baby/${id}`, method: 'PUT', data })
}

export function deleteBaby(id) {
  return request({ url: `/baby/${id}`, method: 'DELETE' })
}

// 查询宝宝生长记录
export function getGrowthRecords(babyId) {
  return request({ url: '/baby/' + babyId + '/growth-records' })
}

// 新增宝宝生长记录
export function addGrowthRecord(babyId, data) {
  return request({ url: '/baby/' + babyId + '/growth-records', method: 'POST', data })
}

