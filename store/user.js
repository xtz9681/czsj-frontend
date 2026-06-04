import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {

  // ── 状态 ─────────────────────────────────────
  const token = ref(uni.getStorageSync('token') || '')
  const userId = ref(uni.getStorageSync('userId') || null)
  const babies = ref(uni.getStorageSync('babies') || [])
  const currentBabyId = ref(uni.getStorageSync('currentBabyId') || null)
  const mother = ref(uni.getStorageSync('mother') || null)

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
    uni.removeStorageSync('token')
    uni.removeStorageSync('userId')
    uni.removeStorageSync('babies')
    uni.removeStorageSync('currentBabyId')
    uni.removeStorageSync('mother')
  }

  return {
    token, userId, babies, currentBabyId, mother,
    currentBaby, isLoggedIn, currentBabyAgeMonths,
    setLoginResult, switchBaby, addBaby, updateBaby, setMother, logout
  }
})
