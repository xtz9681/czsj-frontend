import { request } from './request'

// 拍照识食材（multipart 上传，直接传 filePath）
// 返回 { recognitionId, photoKey, signedPhotoUrl, mode, recognized, confidence, ageIngredients }
export function photoRecord(filePath, babyId) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: 'http://localhost:8080/meal/photo-record',
      filePath,
      name: 'photo',
      formData: { babyId: String(babyId) },
      header: { 'Authorization': 'Bearer ' + token },
      success(res) {
        if (res.statusCode === 200) {
          resolve(JSON.parse(res.data))
        } else if (res.statusCode === 402) {
          reject(new Error('今日拍照次数已用完，可以手动选择食材~'))
        } else {
          const body = JSON.parse(res.data)
          reject(new Error(body?.message || '识别遇到了点问题~'))
        }
      },
      fail() {
        reject(new Error('网络开小差了，请检查网络~'))
      }
    })
  })
}

// 获取 AI 周计划
export function getWeeklyPlan(babyId) {
  return request({ url: '/plan/generate', method: 'POST', data: { subjectType: 'BABY', subjectId: babyId } })
}

// 获取最新周计划
export function getLatestPlan(babyId) {
  return request({ url: '/plan/latest', data: { subjectId: babyId } })
}
