import { request, BASE_URL } from './request'

// 拍照识食材（multipart 上传，直接传 filePath）
// 返回 { recognitionId, photoKey, signedPhotoUrl, mode, recognized, confidence, ageIngredients }
export function photoRecord(filePath, babyId) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    // babyId 可选：有宝宝时传，无宝宝（纯妈妈用户）时不传，后端 required=false 接收 null
    const formData = {}
    if (babyId) {
      formData.babyId = String(babyId)
    }

    uni.uploadFile({
      url: BASE_URL + '/meal/photo-record',
      filePath,
      name: 'photo',
      formData,
      header: { 'Authorization': 'Bearer ' + token },
      success(res) {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(res.data)
            resolve(parsed)
          } catch (e) {
            reject(new Error('服务器返回格式错误'))
          }
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/login/index' })
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
        reject(new Error('网络开小差了，请检查网络~'))
      }
    })
  })
}

// 获取 AI 周计划
export function getWeeklyPlan(babyId) {
  return request({ url: '/plan/generate', method: 'POST', data: { subjectType: 'baby', subjectId: babyId } })
}

// 获取最新周计划
export function getLatestPlan(babyId) {
  return request({ url: '/plan/latest', data: { subjectId: babyId } })
}

// AI 即时问答
export function askAi(data) {
  return request({ url: '/ai/ask', method: 'POST', data })
}

// 获取 AI 问答对话历史（最近 5 轮）
export function getChatHistory() {
  return request({ url: '/ai/history', method: 'GET' })
}

// 清空对话历史（开启新对话）
export function clearChatHistory() {
  return request({ url: '/ai/history', method: 'DELETE' })
}
