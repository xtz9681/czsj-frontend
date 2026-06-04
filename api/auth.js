import { request } from './request'

export function wxLogin(code) {
  return request({ url: '/auth/wx-login', method: 'POST', data: { code } })
}

export function getUserInfo() {
  return request({ url: '/auth/me' })
}
