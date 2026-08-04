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
        // 后端统一返回 ApiResponse 包装格式 {code, message, data, timestamp, path, traceId}
        // 成功：code=0（数字），失败：code=字符串错误码（如 FEATURE_DENIED）
        // 所有响应都是 HTTP 200，业务错误通过 body.code 区分（与 request.js 处理一致）
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(res.data)
            // 成功：解包 data 字段，resolve 内层业务对象
            if (parsed.code === 0 && parsed.data) {
              resolve(parsed.data)
            } else if (parsed.code === 0) {
              // 成功但 data 为空（理论上不会出现，兼容处理）
              resolve(parsed.data)
            } else {
              // 业务错误：与 request.js 对齐，UNAUTHORIZED 时清 token 并跳登录页
              if (parsed.code === 'UNAUTHORIZED') {
                uni.removeStorageSync('token')
                uni.reLaunch({ url: '/pages/login/index' })
              }
              reject(new Error(parsed.message || '识别遇到了点问题~'))
            }
          } catch (e) {
            reject(new Error('服务器返回格式错误'))
          }
        } else if (res.statusCode === 401) {
          // 兼容：理论上不会出现（后端统一 200），保留兜底
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('请重新登录'))
        } else {
          // HTTP 非 200 兜底
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
// subjectType: 'baby' | 'user'（'user' 时 subjectId 传 userId）
export function getWeeklyPlan(subjectType, subjectId) {
  return request({ url: '/plan/generate', method: 'POST', data: { subjectType, subjectId } })
}

// 获取最新周计划
// subjectType: 'baby' | 'user'（'user' 时 subjectId 传 userId）
export function getLatestPlan(subjectType, subjectId) {
  return request({ url: '/plan/latest', data: { subjectType, subjectId } })
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
