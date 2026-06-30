// 基础请求封装
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * 自定义错误类，包含错误类型、状态码和原始数据
 */
class ApiError extends Error {
  constructor(message, statusCode, errorCode, rawData, traceId) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorCode = errorCode // 后端 code 字段（FEATURE_DENIED、VALIDATION_ERROR 等）
    this.rawData = rawData // 完整的后端响应
    this.traceId = traceId // 链路追踪 ID，用于 grep 后端日志
  }
}

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
        // 从响应头捕获链路追踪 ID（后端 TraceFilter 设置）
        const traceId = res.header?.['X-Trace-Id'] || res.data?.traceId || null

        // 新格式：所有响应都是 HTTP 200，通过 response.code 判断成功/失败
        // 成功：code=0（数字），失败：code="ERROR_CODE"（字符串）
        if (res.statusCode === 200 || res.statusCode === 204) {
          const response = res.data

          // 成功响应：code 为数字 0
          if (response?.code === 0) {
            resolve(response.data)
            return
          }

          // 失败响应：code 为字符串，message 为错误提示
          if (typeof response?.code === 'string') {
            const errorCode = response.code
            const message = response.message || '请求失败，请稍后重试'

            // 根据错误代码判断 HTTP 等价状态码
            let statusCode = 400
            if (errorCode === 'FEATURE_DENIED') statusCode = 402
            else if (errorCode === 'UNAUTHORIZED') statusCode = 401
            else if (errorCode === 'FORBIDDEN') statusCode = 403
            else if (errorCode === 'NOT_FOUND') statusCode = 404
            else if (errorCode === 'SERVER_ERROR') statusCode = 500

            // 401 特殊处理：登出并跳转登录页
            if (errorCode === 'UNAUTHORIZED') {
              uni.removeStorageSync('token')
              uni.reLaunch({ url: '/pages/login/index' })
            }

            const error = new ApiError(message, statusCode, errorCode, response, traceId)
            console.error(`[API Error] ${message} | traceId: ${traceId || 'N/A'}`)
            reject(error)
            return
          }

          // 异常：返回既不是成功也不是失败格式
          reject(new ApiError('响应格式异常', 500, 'INVALID_RESPONSE', response, traceId))
        } else {
          // HTTP 非 200 响应（理论上新格式不会出现）
          const message = res.data?.message || '请求出错了，稍后再试~'
          const error = new ApiError(message, res.statusCode, res.data?.code || 'HTTP_ERROR', res.data, traceId)
          console.error(`[API Error] ${message} | traceId: ${traceId || 'N/A'}`)
          reject(error)
        }
      },
      fail(err) {
        reject(new ApiError('网络开小差了，请检查网络~', 0, 'NETWORK_ERROR', err))
      }
    })
  })
}

export { BASE_URL, ApiError }
