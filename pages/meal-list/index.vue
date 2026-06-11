<template>
  <view class="page-container">
    <!-- 日历/筛选栏 -->
    <view class="filter-bar">
      <view
        v-for="f in filterOptions"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @tap="activeFilter = f.value"
      >
        {{ f.label }}
      </view>
    </view>

    <!-- 周营养概览（条件展示） -->
    <view v-if="activeFilter === 'week'" class="week-summary card" style="margin: 0 40rpx 24rpx;">
      <text class="ws-title">本周营养覆盖</text>
      <view class="ws-row">
        <view class="ws-item" v-for="n in weekNutrition" :key="n.key">
          <view class="ws-circle" :class="n.ok ? 'ok' : 'miss'">
            <text>{{ n.icon }}</text>
          </view>
          <text class="ws-label">{{ n.name }}</text>
          <text class="ws-days" :class="n.ok ? 'ok' : 'miss'">{{ n.days }}天</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="mealsLoading" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>
    <view v-else-if="mealGroups.length === 0" class="empty-state">
      <image src="/static/empty/no-meals.png" class="empty-img" mode="aspectFit" />
      <text class="empty-text">还没有记录，去记第一餐吧~</text>
      <view class="empty-btn" @tap="goRecord">开始记录</view>
    </view>

    <!-- 按日期分组的餐次列表 -->
    <view v-else class="meal-groups">
      <view v-for="group in mealGroups" :key="group.date" class="date-group">
        <!-- 日期行 -->
        <view class="date-row">
          <view class="date-badge">
            <text class="date-day">{{ group.displayDay }}</text>
            <text class="date-month">{{ group.displayMonth }}</text>
          </view>
          <view class="date-info">
            <text class="date-label">{{ group.dateLabel }}</text>
            <text class="date-count">{{ group.meals.length }} 餐 · {{ group.totalIngredients }} 种食材</text>
          </view>
          <view v-if="group.avgScore" class="date-score" :class="getScoreClass(group.avgScore)">
            {{ group.avgScore }}分
          </view>
        </view>

        <!-- 餐次卡片 -->
        <view class="meal-cards" style="padding: 0 40rpx;">
          <view
            class="meal-card card"
            v-for="meal in group.meals"
            :key="meal.id"
            @tap="goDetail(meal.id)"
          >
            <view class="mc-header">
              <text class="mc-type">{{ getMealTypeLabel(meal.mealType) }}</text>
              <text class="mc-time">{{ meal.time }}</text>
              <view v-if="meal.score" class="mc-score" :class="getScoreClass(meal.score)">
                {{ meal.score }}分
              </view>
              <view class="mc-menu" @tap.stop="showMealMenu(meal)">···</view>
            </view>

            <!-- 食材标签 -->
            <view class="mc-ingredients">
              <view
                v-for="ing in meal.ingredients"
                :key="ing.id"
                class="mc-ing-chip"
                :class="{ 'allergy-chip': ing.isAllergy }"
              >
                <text v-if="ing.isAllergy">⚠️ </text>
                <text>{{ ing.name }}</text>
              </view>
            </view>

            <!-- 图片 -->
            <image v-if="meal.photo" :src="meal.photo" class="mc-photo" mode="aspectFill" />

            <!-- AI 评分简述 -->
            <view v-if="meal.suggestion" class="mc-suggestion">
              <text>💡 </text>
              <text>{{ meal.suggestion }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部留白 -->
    <view style="height: 120rpx;"></view>

    <!-- 悬浮记录按钮 -->
    <wd-fab icon="camera-fill" @click="goCamera" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { getMealList, getWeekSummary, deleteMeal } from '@/api/meal.js'

const activeFilter = ref('week')
const filterOptions = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
]

const allMeals = ref([])
const mealsLoading = ref(false)

const weekNutrition = ref([])

async function loadMeals() {
  const baby = useUserStore().currentBaby
  if (!baby?.id) return
  mealsLoading.value = true
  try {
    const list = await getMealList(baby.id, 0, 100)
    allMeals.value = (list || []).map(m => ({
      id: m.id,
      date: m.mealTime ? m.mealTime.split('T')[0] : getTodayStr(),
      mealType: (m.mealType || 'BREAKFAST').toLowerCase(),
      time: m.mealTime ? m.mealTime.substring(11, 16) : '',
      score: m.aiScore || null,
      photo: m.signedPhotoUrl || '',
      suggestion: m.aiFeedback ? m.aiFeedback.substring(0, 30) + '...' : null,
      ingredients: (m.ingredients || []).map(i => ({ id: i.name, name: i.name, isAllergy: false }))
    }))
  } catch (e) {
    uni.showToast({ title: '加载记录失败，请稍后再试~', icon: 'none' })
  } finally {
    mealsLoading.value = false
  }
}

async function loadWeekSummary() {
  const userStore = useUserStore()
  const baby = userStore.currentBaby
  if (!baby?.id) return
  try {
    const res = await getWeekSummary(baby.id, 'BABY')
    weekNutrition.value = (res.nutritionItems || []).map(item => ({
      key: item.name,
      icon: getNutritionIcon(item.name),
      name: item.name,
      days: item.days,
      ok: item.ok
    }))
  } catch (e) {
    uni.showToast({ title: '加载周统计失败', icon: 'none' })
  }
}

function getNutritionIcon(name) {
  const iconMap = {
    '蛋白质': '🥩', '铁': '🔴', '钙': '🦴', '锌': '💊',
    '维生素A': '🥕', '维生素C': '🍊', '维生素D': '☀️', 'DHA': '🐟',
    '碳水化合物': '🌾', '膳食纤维': '🥦', '叶酸': '💚', '碘': '🧂'
  }
  return iconMap[name] || '🔘'
}

onShow(() => {
  loadMeals()
  loadWeekSummary()
})

const filteredMeals = computed(() => {
  const today = getTodayStr()
  if (activeFilter.value === 'today') {
    return allMeals.value.filter(m => m.date === today)
  }
  if (activeFilter.value === 'week') {
    const weekAgo = getDateStr(-7)
    return allMeals.value.filter(m => m.date >= weekAgo)
  }
  if (activeFilter.value === 'month') {
    const monthAgo = getDateStr(-30)
    return allMeals.value.filter(m => m.date >= monthAgo)
  }
  return allMeals.value
})

const mealGroups = computed(() => {
  const map = {}
  filteredMeals.value.forEach(m => {
    if (!map[m.date]) map[m.date] = []
    map[m.date].push(m)
  })
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const meals = map[date]
      const scores = meals.filter(m => m.score).map(m => m.score)
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      const d = new Date(date)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      let dateLabel = date
      if (date === getTodayStr()) dateLabel = '今天'
      else if (date === getDateStr(-1)) dateLabel = '昨天'
      return {
        date,
        displayDay: d.getDate(),
        displayMonth: (d.getMonth() + 1) + '月',
        dateLabel,
        meals,
        avgScore,
        totalIngredients: [...new Set(meals.flatMap(m => m.ingredients.map(i => i.name)))].length
      }
    })
})

function getMealTypeLabel(type) {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
  return map[type] || type
}

function getScoreClass(score) {
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-ok'
  return 'score-low'
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/meal-record/index?id=${id}` })
}

function goRecord() {
  uni.navigateTo({ url: '/pages/meal-record/index' })
}

function goCamera() {
  uni.navigateTo({ url: '/pages/camera/index' })
}

function showMealMenu(meal) {
  uni.showActionSheet({
    itemList: ['删除此记录'],
    success: (res) => {
      if (res.tapIndex === 0) {
        confirmDeleteMeal(meal)
      }
    }
  })
}

function confirmDeleteMeal(meal) {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这条记录吗？',
    confirmText: '删除',
    confirmColor: '#E07A5F',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteMeal(meal.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadMeals()
          loadWeekSummary()
        } catch (e) {
          uni.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      }
    }
  })
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getDateStr(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 0;
  padding: 24rpx 40rpx 16rpx;
  background: #FAF7F2;
}

.filter-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  font-size: 28rpx;
  color: #999;
  border-bottom: 4rpx solid transparent;

  &.active {
    color: #F5A85B;
    font-weight: 700;
    border-bottom-color: #F5A85B;
  }
}

/* 周营养摘要 */
.week-summary { margin: 0 40rpx 24rpx; }

.ws-title { display: block; font-size: 28rpx; font-weight: 700; color: #3D3935; margin-bottom: 24rpx; }

.ws-row { display: flex; justify-content: space-between; }

.ws-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }

.ws-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;

  &.ok { background: #E8F8EE; }
  &.miss { background: #F5F5F5; }
}

.ws-label { font-size: 22rpx; color: #999; }
.ws-days { font-size: 22rpx; font-weight: 700; &.ok { color: #5CB87A; } &.miss { color: #C8C8C8; } }

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.empty-img {
  width: 320rpx;
  height: 320rpx;
  margin-bottom: 24rpx;
}

.empty-text { font-size: 28rpx; color: #999; margin-bottom: 40rpx; }
.empty-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 48rpx;
  padding: 18rpx 56rpx;
  font-size: 30rpx;
  font-weight: 600;
}

/* 日期分组 */
.date-group { margin-bottom: 8rpx; }

.date-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 40rpx;
}

.date-badge {
  width: 80rpx;
  height: 80rpx;
  background: #F5A85B;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.date-day { font-size: 36rpx; font-weight: 700; color: #FFFFFF; line-height: 1; }
.date-month { font-size: 20rpx; color: rgba(255,255,255,0.8); }

.date-info { flex: 1; }
.date-label { display: block; font-size: 30rpx; font-weight: 700; color: #3D3935; margin-bottom: 4rpx; }
.date-count { font-size: 24rpx; color: #999; }

.date-score {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 700;

  &.score-good { background: #E8F8EE; color: #5CB87A; }
  &.score-ok { background: #FFF3E6; color: #F5A85B; }
  &.score-low { background: #FDEEE9; color: #E07A5F; }
}

.meal-cards { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 24rpx; }

.meal-card { padding: 24rpx; }

.mc-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.mc-type { font-size: 28rpx; font-weight: 700; color: #3D3935; }
.mc-time { font-size: 24rpx; color: #999; flex: 1; }

.mc-score {
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 700;

  &.score-good { background: #E8F8EE; color: #5CB87A; }
  &.score-ok { background: #FFF3E6; color: #F5A85B; }
  &.score-low { background: #FDEEE9; color: #E07A5F; }
}

.mc-menu { font-size: 32rpx; color: #999; padding: 8rpx 16rpx; letter-spacing: 4rpx; }

.mc-ingredients {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.mc-ing-chip {
  background: #F5F5F5;
  border-radius: 20rpx;
  padding: 6rpx 16rpx;
  font-size: 24rpx;
  color: #555;

  &.allergy-chip {
    background: #FDEEE9;
    color: #E07A5F;
    font-weight: 600;
  }
}

.mc-photo {
  width: 100%;
  height: 180rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.mc-suggestion {
  background: #F5F9FF;
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
  font-size: 24rpx;
  color: #555;
  line-height: 1.6;
}

/* 悬浮按钮 */
.fab {
  position: fixed;
  bottom: 120rpx;
  right: 48rpx;
  width: 112rpx;
  height: 112rpx;
  background: #F5A85B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(245, 168, 91, 0.4);
  z-index: 100;
}

.fab-icon { font-size: 52rpx; }

/* Loading 状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
