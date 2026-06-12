import { request } from './request'

export function deleteGrowthRecord(babyId, id) {
  return request({ url: '/baby/' + babyId + '/growth-records/' + id, method: 'DELETE' })
}

export function deleteWeightRecord(id) {
  return request({ url: '/mother/weight-records/' + id, method: 'DELETE' })
}
