import { request } from './request'

// 订阅提醒（用户授权后调用）
export function subscribeReminder(data) {
  return request({ url: '/reminder/subscribe', method: 'POST', data })
}

// 获取我的提醒列表
export function getReminderList() {
  return request({ url: '/reminder/list' })
}

// 开关提醒
export function toggleReminder(id, enabled) {
  return request({ url: '/reminder/' + id + '/toggle', method: 'PUT', data: { enabled } })
}

// 删除提醒
export function deleteReminder(id) {
  return request({ url: '/reminder/' + id, method: 'DELETE' })
}
