import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {

  // ── 状态 ─────────────────────────────────────
  const token = ref(uni.getStorageSync('token') || '')
  const userId = ref(uni.getStorageSync('userId') || null)
  const babies = ref(uni.getStorageSync('babies') || [])
  const currentBabyId = ref(uni.getStorageSync('currentBabyId') || null)
  const mother = ref(uni.getStorageSync('mother') || null)
  const allergyList = ref(uni.getStorageSync('allergyList') || [])

  // ── 计算属性 ──────────────────────────────────
  const currentBaby = computed(() =>
    babies.value.find(b => b.id === currentBabyId.value) || babies.value[0] || null
  )

  const isLoggedIn = computed(() => !!token.value)

  const currentBabyAgeMonths = computed(() => {
    if (!currentBaby.value?.birthday) return 0
    const birth = new Date(currentBaby.value.birthday)
    return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.4))
  })

  // ── Actions ───────────────────────────────────

  function setLoginResult(res) {
    token.value = res.token
    userId.value = res.userId
    babies.value = res.babies || []
    mother.value = res.mother || null
    currentBabyId.value = res.babies?.length > 0 ? res.babies[0].id : null

    uni.setStorageSync('token', token.value)
    uni.setStorageSync('userId', userId.value)
    uni.setStorageSync('babies', babies.value)
    uni.setStorageSync('mother', mother.value)
    uni.setStorageSync('currentBabyId', currentBabyId.value)
  }

  function switchBaby(id) {
    currentBabyId.value = id
    uni.setStorageSync('currentBabyId', id)
  }

  function addBaby(baby) {
    babies.value.push(baby)
    currentBabyId.value = baby.id
    uni.setStorageSync('babies', babies.value)
    uni.setStorageSync('currentBabyId', baby.id)
  }

  function updateBaby(updatedBaby) {
    const idx = babies.value.findIndex(b => b.id === updatedBaby.id)
    if (idx !== -1) babies.value[idx] = updatedBaby
    uni.setStorageSync('babies', babies.value)
  }

  function setMother(m) {
    mother.value = m
    uni.setStorageSync('mother', m)
  }

  function logout() {
    token.value = ''
    userId.value = null
    babies.value = []
    currentBabyId.value = null
    mother.value = null
    allergyList.value = []
    uni.removeStorageSync('token')
    uni.removeStorageSync('userId')
    uni.removeStorageSync('babies')
    uni.removeStorageSync('currentBabyId')
    uni.removeStorageSync('mother')
    uni.removeStorageSync('allergyList')
  }

  async function loadAllergyList() {
    try {
      const { default: request } = await import('@/api/request.js')
      const list = await request({ url: '/allergy/list', method: 'GET' })
      allergyList.value = list || []
      uni.setStorageSync('allergyList', allergyList.value)
    } catch (e) {
      allergyList.value = uni.getStorageSync('allergyList') || []
    }
  }

  function initFromStorage() {
    token.value = uni.getStorageSync('token') || ''
    userId.value = uni.getStorageSync('userId') || null
    babies.value = uni.getStorageSync('babies') || []
    currentBabyId.value = uni.getStorageSync('currentBabyId') || null
    mother.value = uni.getStorageSync('mother') || null
    allergyList.value = uni.getStorageSync('allergyList') || []
  }

  return {
    token, userId, babies, currentBabyId, mother, allergyList,
    currentBaby, isLoggedIn, currentBabyAgeMonths,
    setLoginResult, switchBaby, addBaby, updateBaby, setMother, logout, loadAllergyList, initFromStorage
  }
})
