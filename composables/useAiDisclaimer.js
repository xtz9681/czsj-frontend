import { ref } from 'vue'

export function useAiDisclaimer() {
  const aiDisclaimerConfirmed = ref(uni.getStorageSync('ai_disclaimer_confirmed') || false)

  async function showAiDisclaimer() {
    if (aiDisclaimerConfirmed.value) return true
    return new Promise((resolve) => {
      uni.showModal({
        title: 'AI 使用须知',
        content: 'AI 识别与营养建议仅供参考，不构成医疗诊断或治疗建议。如有健康问题，请咨询专业医生或营养师。',
        confirmText: '我知道了',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.setStorageSync('ai_disclaimer_confirmed', true)
            aiDisclaimerConfirmed.value = true
            resolve(true)
          } else {
            resolve(false)
          }
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }

  return {
    showAiDisclaimer
  }
}
