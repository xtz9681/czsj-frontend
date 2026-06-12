// 基础请求封装
const BASE_URL = 'http://localhost:8080'

export function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(options.header || {})
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('请重新登录'))
        } else {
          const err = new Error(res.data?.message || '请求出错了，稍后再试~')
          err.statusCode = res.statusCode
          reject(err)
        }
      },
      fail(err) {
        reject(new Error('网络开小差了，请检查网络~'))
      }
    })
  })
}

export { BASE_URL }
