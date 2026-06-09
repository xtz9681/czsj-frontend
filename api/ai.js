import { request } from './request'

// 拍照识食材（multipart 上传，直接传 filePath）
// 返回 { recognitionId, photoKey, signedPhotoUrl, mode, recognized, confidence, ageIngredients }
export function photoRecord(filePath, babyId) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    console.log('📤 photoRecord 开始上传')
    console.log('  token:', token ? '✓ 存在' : '✗ 不存在')
    console.log('  babyId:', babyId)
    console.log('  filePath:', filePath)

    uni.uploadFile({
      url: 'http://localhost:8080/meal/photo-record',
      filePath,
      name: 'photo',
      formData: { babyId: String(babyId) },
      header: { 'Authorization': 'Bearer ' + token },
      success(res) {
        console.log('✅ uploadFile success, statusCode:', res.statusCode)
        console.log('  response data:', res.data)
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(res.data)
            console.log('✅ 解析成功:', parsed)
            resolve(parsed)
          } catch (e) {
            console.error('❌ JSON 解析失败:', e)
            reject(new Error('服务器返回格式错误'))
          }
        } else if (res.statusCode === 402) {
          reject(new Error('今日拍照次数已用完，可以手动选择食材~'))
        } else {
          try {
            const body = JSON.parse(res.data)
            reject(new Error(body?.message || '识别遇到了点问题~'))
          } catch (e) {
            reject(new Error('识别遇到了点问题~'))
          }
        }
      },
      fail(err) {
        console.error('❌ uploadFile fail:', err)
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
