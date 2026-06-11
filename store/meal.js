import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMealStore = defineStore('meal', () => {
  const pendingMeal = ref(null)

  function setPendingMeal(data) {
    pendingMeal.value = data
  }

  function clearPendingMeal() {
    const data = pendingMeal.value
    pendingMeal.value = null
    return data
  }

  return { pendingMeal, setPendingMeal, clearPendingMeal }
})
