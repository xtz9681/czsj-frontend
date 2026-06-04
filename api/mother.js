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
