import { request, BASE_URL } from './request'

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

// 上传宝宝头像
export function uploadBabyAvatar(babyId, filePath) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: BASE_URL + '/baby/' + babyId + '/avatar',
      filePath,
      name: 'file',
      header: { 'Authorization': 'Bearer ' + token },
      success(res) {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(res.data)
            // 成功：code=0，解包 data 字段
            if (parsed.code === 0) {
              resolve(parsed.data)
            } else {
              // 业务错误：UNAUTHORIZED 时清 token 并跳登录页
              if (parsed.code === 'UNAUTHORIZED') {
                uni.removeStorageSync('token')
                uni.reLaunch({ url: '/pages/login/index' })
              }
              reject(new Error(parsed.message || '上传头像遇到了点问题~'))
            }
          } catch (e) {
            reject(new Error('服务器返回格式错误'))
          }
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/login/index' })
        } else {
          reject(new Error('上传头像遇到了点问题~'))
        }
      },
      fail(err) {
        reject(new Error('网络开小差了，请检查网络~'))
      }
    })
  })
}
