import { ApiError } from '../api/request.js'

/**
 * 统一的错误处理 Hook
 * 用法：
 *   const { handleError, showError } = useErrorHandler()
 *   try { ... } catch (e) { handleError(e) }
 */
export function useErrorHandler() {
  /**
   * 根据错误类型显示对应的提示
   * @param {Error|ApiError} error - 错误对象
   * @param {Object} options - 配置选项
   * @param {boolean} options.showDetails - 是否显示详细信息（默认 true）
   * @param {string} options.fallback - 降级提示文案
   */
  function handleError(error, options = {}) {
    const { showDetails = true, fallback = '操作失败，请稍后重试' } = options

    // 网络错误或非 API 错误
    if (!(error instanceof ApiError)) {
      const message = error?.message || fallback
      showError(message)
      console.error('[Error]', error)
      return
    }

    // 根据错误类型分类处理
    const message = getErrorMessage(error, showDetails, fallback)
    showError(message, error)

    // 记录日志
    console.error('[ApiError]', {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
      rawData: error.rawData
    })
  }

  /**
   * 获取适合显示的错误信息
   */
  function getErrorMessage(error, showDetails, fallback) {
    const { statusCode, errorCode, message } = error

    // 401: 自动跳转登录，这里不显示（request.js 已处理）
    if (statusCode === 401) {
      return null // 不显示提示，已经 reLaunch 到登录页
    }

    // 402: 配额不足或付费功能
    if (statusCode === 402) {
      if (errorCode === 'FEATURE_DENIED') {
        return message || '功能使用次数已达上限，升级会员继续使用'
      }
      return message || '该功能需要升级会员'
    }

    // 403: 权限错误
    if (statusCode === 403) {
      return message || '无权操作该资源'
    }

    // 404: 资源不存在
    if (statusCode === 404) {
      return message || '请求的资源不存在'
    }

    // 400: 业务逻辑错误
    if (statusCode === 400) {
      if (errorCode === 'VALIDATION_ERROR') {
        // JSR 303 校验错误，显示详细信息
        return showDetails ? message : '请求参数有误'
      }
      // 业务规则违反（如"6个月以下宝宝不能吃辅食"）
      return message || '操作不合规，请检查输入'
    }

    // 5xx: 服务端错误
    if (statusCode >= 500) {
      return message || '服务器开小差了，请稍后重试~'
    }

    // 网络错误
    if (statusCode === 0) {
      return message || '网络开小差了，请检查网络~'
    }

    // 其他未预期的错误
    return message || fallback
  }

  /**
   * 显示错误提示
   * @param {string} msg - 提示信息
   * @param {ApiError} error - 错误对象（可选）
   */
  function showError(msg, error) {
    if (!msg) return // 如果没有信息就不显示

    // 特殊处理：某些错误直接 toast，某些需要弹窗
    if (error?.statusCode === 402) {
      // 配额错误用 modal 确认，便于引导升级
      uni.showModal({
        title: '提示',
        content: msg,
        confirmText: '升级会员',
        cancelText: '取消',
        success(res) {
          if (res.confirm) {
            // TODO: 跳转到会员升级页
            uni.showToast({ title: '会员功能开发中', icon: 'none' })
          }
        }
      })
    } else {
      // 其他错误用 toast（快速提示）
      uni.showToast({
        title: msg,
        icon: 'none',
        duration: 2000
      })
    }
  }

  /**
   * 检查错误类型（供页面判断是否需要特殊处理）
   */
  function isFeatureDenied(error) {
    return error instanceof ApiError && error.statusCode === 402
  }

  function isValidationError(error) {
    return error instanceof ApiError && error.statusCode === 400 && error.errorCode === 'VALIDATION_ERROR'
  }

  function isNetworkError(error) {
    return error instanceof ApiError && error.statusCode === 0
  }

  return {
    handleError,
    showError,
    isFeatureDenied,
    isValidationError,
    isNetworkError
  }
}
