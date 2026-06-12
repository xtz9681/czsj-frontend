import { request } from './request'

export function deleteGrowthRecord(id) {
  return request({ url: '/growth-record/' + id, method: 'DELETE' })
}

export function deleteWeightRecord(id) {
  return request({ url: '/weight-record/' + id, method: 'DELETE' })
}
