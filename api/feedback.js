import { request, BASE_URL } from './request'

// 上传反馈图片
export function uploadFeedbackImage(filePath) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: BASE_URL + '/feedback/image',
      filePath,
      name: 'image',
      header: { 'Authorization': 'Bearer ' + token },
      success(res) {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(res.data)
            // 成功：code=0，解包 data 字段
            if (parsed.code === 0) {
              resolve(parsed.data.imageKey)
            } else {
              // 业务错误：UNAUTHORIZED 时清 token 并跳登录页
              if (parsed.code === 'UNAUTHORIZED') {
                uni.removeStorageSync('token')
                uni.reLaunch({ url: '/pages/login/index' })
              }
              reject(new Error(parsed.message || '图片上传遇到了点问题~'))
            }
          } catch (e) {
            reject(new Error('服务器返回格式错误'))
          }
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/login/index' })
        } else {
          reject(new Error('图片上传遇到了点问题~'))
        }
      },
      fail(err) {
        reject(new Error('网络开小差了，请检查网络~'))
      }
    })
  })
}

// 提交反馈
export function submitFeedback(data) {
  return request({ url: '/feedback', method: 'POST', data })
}
