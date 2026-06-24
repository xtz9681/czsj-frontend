import { request } from './request'

export function wxLogin(code, nickName, avatarUrl) {
  return request({ url: '/auth/wx-login', method: 'POST', data: { code, nickName, avatarUrl } })
}

export function getUserInfo() {
  return request({ url: '/auth/me' })
}
