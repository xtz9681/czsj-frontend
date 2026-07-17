<template>
  <scroll-view class="page-container" scroll-y @scrolltolower="onReachBottom">
    <!-- 自定义导航栏 + 安全区 -->
    <view class="header-area" :style="{ paddingTop: safeTop }">
      <text class="header-title">记录</text>
    </view>

    <!-- 主体选择器：水平滚动 chip -->
    <scroll-view scroll-x class="subject-selector" :show-scrollbar="false">
      <view class="subject-chips">
        <view
          v-for="item in subjectList"
          :key="item.type + '-' + item.id"
          class="subject-chip"
          :class="{ active: selectedSubject && selectedSubject.id === item.id && selectedSubject.type === item.type }"
          @tap="onSelectSubject(item)"
        >
          <view class="chip-avatar" :class="item.type === 'baby' ? 'baby' : 'adult'">
            <image
              v-if="item.avatar"
              :src="item.avatar"
              class="chip-avatar-img"
              mode="aspectFill"
            />
            <text v-else>{{ item.type === 'baby' ? '👶' : '👩' }}</text>
          </view>
          <view class="chip-text">
            <text class="chip-name">{{ item.name }}</text>
            <text class="chip-sub">{{ item.sub }}</text>
          </view>
        </view>

        <!-- 添加按钮 -->
        <view class="subject-chip add-chip" @tap="goProfile">
          <text class="add-icon">＋</text>
        </view>
      </view>
    </scroll-view>

    <!-- 今日概览卡片 -->
    <view v-if="selectedSubject" class="today-card card" style="margin: 0 40rpx 24rpx;">
      <view class="tc-header">
        <text class="tc-title">{{ selectedSubject.name }} · 今日概览</text>
        <text class="tc-date">{{ todayDisplayStr }}</text>
      </view>
      <view v-if="dailyLoading" class="tc-loading">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else class="tc-stats">
        <view class="tc-stat">
          <text class="tc-num">{{ dailySummary.mealCount || 0 }}</text>
          <text class="tc-label">进餐(餐)</text>
        </view>
        <view class="tc-divider"></view>
        <view class="tc-stat">
          <text class="tc-num">{{ dailySummary.avgScore != null ? dailySummary.avgScore : '-' }}</text>
          <text class="tc-label">平均评分(分)</text>
        </view>
        <view class="tc-divider"></view>
        <view class="tc-stat">
          <text class="tc-num">{{ dailySummary.ingredientCount || 0 }}</text>
          <text class="tc-label">食材种类(种)</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view v-if="selectedSubject" class="quick-actions" style="margin: 0 40rpx 24rpx;">
      <view class="qa-item" @tap="goMealRecord">
        <view class="qa-icon" style="background: #FFF3E6;">
          <text>🍽️</text>
        </view>
        <text class="qa-label">记一餐</text>
      </view>
      <view class="qa-item" @tap="goCamera">
        <view class="qa-icon" style="background: #E8F8EE;">
          <text>📷</text>
        </view>
        <text class="qa-label">拍照识别</text>
      </view>
      <view v-if="selectedSubject.type === 'baby'" class="qa-item" @tap="goGrowthRecord">
        <view class="qa-icon" style="background: #E0F0FF;">
          <text>📏</text>
        </view>
        <text class="qa-label">身高体重</text>
      </view>
      <view v-if="selectedSubject.type === 'user'" class="qa-item" @tap="goWeightRecord">
        <view class="qa-icon" style="background: #F0E8FF;">
          <text>⚖️</text>
        </view>
        <text class="qa-label">体重记录</text>
      </view>
    </view>

    <!-- 分类筛选（Segment） -->
    <view v-if="selectedSubject" class="segment-bar" style="margin: 0 40rpx 16rpx;">
      <view
        v-for="seg in segmentOptions"
        :key="seg.value"
        class="segment-item"
        :class="{ active: activeSegment === seg.value }"
        @tap="activeSegment = seg.value"
      >
        <text>{{ seg.label }}</text>
      </view>
    </view>

    <!-- 日期筛选 -->
    <view class="filter-bar" style="margin: 0 40rpx 16rpx;">
      <view
        v-for="f in filterOptions"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @tap="onFilterChange(f.value)"
      >
        {{ f.label }}
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="recordsLoading && recordGroups.length === 0" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!recordsLoading && recordGroups.length === 0" class="empty-state">
      <image :src="emptyImage" class="empty-img" mode="aspectFit" />
      <text class="empty-text">还没有记录，去记第一笔吧~</text>
      <view class="empty-btn" @tap="goEmptyRecord">开始记录</view>
    </view>

    <!-- 混合记录流：按日期分组 -->
    <view v-else class="record-flow">
      <view v-for="group in recordGroups" :key="group.date" class="date-group">
        <!-- 日期行 -->
        <view class="date-row">
          <view class="date-badge">
            <text class="date-day">{{ group.displayDay }}</text>
            <text class="date-month">{{ group.displayMonth }}</text>
          </view>
          <view class="date-info">
            <text class="date-label">{{ group.dateLabel }}</text>
            <text class="date-count">{{ group.records.length }} 条记录</text>
          </view>
          <view v-if="group.avgScore" class="date-score" :class="getScoreClass(group.avgScore)">
            {{ group.avgScore }}分
          </view>
        </view>

        <!-- 记录卡片 -->
        <view class="flow-cards" style="padding: 0 40rpx;">
          <view
            class="flow-card card anim-fade-in-up"
            v-for="(record, index) in group.records"
            :key="record.type + '-' + record.id"
            :style="{ animationDelay: index * 0.06 + 's' }"
            @tap="onRecordTap(record)"
          >
            <!-- 饮食记录卡片 -->
            <template v-if="record.type === 'meal'">
              <view class="fc-header">
                <view class="flow-icon meal-icon">
                  <text>🍽️</text>
                </view>
                <text class="fc-type">{{ record.mealTypeLabel }}</text>
                <text class="fc-time">{{ record.time }}</text>
                <view v-if="record.score" class="flow-score" :class="getScoreClass(record.score)">
                  {{ record.score }}分
                </view>
              </view>
              <!-- 食材标签 -->
              <view v-if="record.ingredients && record.ingredients.length > 0" class="fc-tags">
                <view
                  v-for="ing in record.ingredients"
                  :key="typeof ing === 'string' ? ing : ing.name"
                  class="flow-tag"
                >
                  <text>{{ typeof ing === 'string' ? ing : ing.name }}</text>
                </view>
              </view>
              <!-- 图片 -->
              <image v-if="record.photo && !record.photoError" :src="record.photo" class="fc-photo" mode="aspectFill" @error="onPhotoError(record)" />
              <!-- AI 建议 -->
              <view v-if="record.suggestion" class="fc-suggestion">
                <text>💡 {{ record.suggestion }}</text>
              </view>
            </template>

            <!-- 生长记录卡片（宝宝） -->
            <template v-else-if="record.type === 'growth'">
              <view class="fc-header">
                <view class="flow-icon growth-icon">
                  <text>📏</text>
                </view>
                <text class="fc-type">生长记录</text>
                <text class="fc-time">{{ record.date }}</text>
              </view>
              <view class="fc-body">
                <text class="fc-data">身高 {{ record.heightCm }}cm · 体重 {{ record.weightKg }}kg</text>
              </view>
              <view v-if="record.notes" class="fc-suggestion">
                <text>📝 {{ record.notes }}</text>
              </view>
            </template>

            <!-- 体重记录卡片（妈妈） -->
            <template v-else-if="record.type === 'weight'">
              <view class="fc-header">
                <view class="flow-icon weight-icon">
                  <text>⚖️</text>
                </view>
                <text class="fc-type">体重记录</text>
                <text class="fc-time">{{ record.date }}</text>
              </view>
              <view class="fc-body">
                <text class="fc-data">体重 {{ record.weightKg }}kg</text>
                <text v-if="record.weekOfPregnancy" class="fc-extra">孕{{ record.weekOfPregnancy }}周</text>
                <text v-if="record.postpartumDays != null" class="fc-extra">产后{{ record.postpartumDays }}天</text>
              </view>
              <view v-if="record.notes" class="fc-suggestion">
                <text>📝 {{ record.notes }}</text>
              </view>
            </template>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部加载提示 -->
    <view v-if="recordsLoading && recordGroups.length > 0" class="loading-tip">加载中...</view>
    <view v-if="noMore && recordGroups.length > 0" class="no-more-tip">没有更多了</view>

    <!-- 底部留白 -->
    <view style="height: 120rpx;"></view>

    <!-- 悬浮拍照按钮 -->
    <wd-fab icon="camera-fill" @click="goCamera" />
  </scroll-view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { getMealList, getDailySummary } from '@/api/meal.js'
import { getGrowthRecords } from '@/api/baby.js'
import { getWeightRecords } from '@/api/mother.js'
import { useErrorHandler } from '@/composables/useErrorHandler.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { formatAge } from '@/utils/age.js'
import { phaseMap } from '@/constants/phase.js'

const userStore = useUserStore()
const { handleError } = useErrorHandler()
const { safeTop } = useSafeArea()

// ── 主体选择器 ──────────────────────────────
const selectedSubject = ref(null)

const subjectList = computed(() => {
  const list = []
  // 宝宝列表
  const babies = userStore.babies || []
  babies.forEach(b => {
    list.push({
      id: b.id,
      type: 'baby',
      name: b.name || '宝宝',
      sub: formatAge(b.birthday) || '',
      avatar: b.avatarUrl || ''
    })
  })
  // 妈妈档案
  if (userStore.mother) {
    list.push({
      id: userStore.userId,
      type: 'user',
      name: getMotherLabel(),
      sub: phaseMap[userStore.mother.phase] || '',
      avatar: ''
    })
  }
  return list
})

function getMotherLabel() {
  // 妈妈 chip 与今日概览统一显示"我"，不区分阶段
  return '我'
}

function onSelectSubject(item) {
  selectedSubject.value = { ...item }
}

function initDefaultSubject() {
  const current = userStore.currentSubject
  if (!current) {
    selectedSubject.value = null
    return
  }
  // 如果已选主体仍在列表中，保持不变
  if (selectedSubject.value) {
    const still = subjectList.value.find(
      s => s.id === selectedSubject.value.id && s.type === selectedSubject.value.type
    )
    if (still) return
  }
  // 否则默认选 currentSubject
  selectedSubject.value = {
    id: current.subjectType === 'baby' ? current.id : userStore.userId,
    type: current.subjectType === 'baby' ? 'baby' : 'user',
    name: current.subjectType === 'baby' ? (current.name || '宝宝') : getMotherLabel(),
    sub: current.subjectType === 'baby' ? formatAge(current.birthday) : (phaseMap[userStore.mother?.phase] || ''),
    avatar: current.avatarUrl || ''
  }
}

function goProfile() {
  uni.navigateTo({ url: '/pages/profile/index' })
}

// ── 筛选器 ──────────────────────────────
const activeFilter = ref('week')
const filterOptions = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' }
]

const activeSegment = ref('all')
const segmentOptions = computed(() => {
  if (selectedSubject.value?.type === 'baby') {
    return [
      { value: 'all', label: '全部' },
      { value: 'meal', label: '饮食' },
      { value: 'growth', label: '生长' }
    ]
  }
  return [
    { value: 'all', label: '全部' },
    { value: 'meal', label: '饮食' },
    { value: 'weight', label: '体重' }
  ]
})

// ── 数据状态 ──────────────────────────────
const dailyLoading = ref(false)
const dailySummary = ref({})
const recordsLoading = ref(false)
const noMore = ref(false)

const allMeals = ref([])
const allGrowthRecords = ref([])
const allWeightRecords = ref([])

// ── 日期工具函数 ──────────────────────────────
function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateStr(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toLocalDateStr(isoStr) {
  if (!isoStr) return getTodayStr()
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateRange() {
  const today = new Date()
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const endDate = fmt(today)
  if (activeFilter.value === 'today') return { startDate: endDate, endDate }
  if (activeFilter.value === 'week') {
    const d = new Date(today); d.setDate(d.getDate() - 6)
    return { startDate: fmt(d), endDate }
  }
  if (activeFilter.value === 'month') {
    const d = new Date(today); d.setDate(d.getDate() - 29)
    return { startDate: fmt(d), endDate }
  }
  return {}
}

const todayDisplayStr = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const emptyImage = computed(() => {
  if (selectedSubject.value?.type === 'user') {
    return '/static/empty/no-records-adult.png'
  }
  return '/static/empty/no-meals.png'
})

// ── 数据加载 ──────────────────────────────
async function loadDailySummary() {
  if (!selectedSubject.value) return
  dailyLoading.value = true
  try {
    const subjectType = selectedSubject.value.type === 'baby' ? 'baby' : 'user'
    const res = await getDailySummary(selectedSubject.value.id, subjectType)
    dailySummary.value = res || {}
  } catch (e) {
    handleError(e, { fallback: '加载今日概览失败' })
    dailySummary.value = {}
  } finally {
    dailyLoading.value = false
  }
}

async function loadMeals() {
  if (!selectedSubject.value) return
  try {
    const subjectType = selectedSubject.value.type === 'baby' ? 'baby' : 'user'
    const { startDate, endDate } = getDateRange()
    const list = await getMealList(selectedSubject.value.id, subjectType, 0, 50, startDate, endDate)
    allMeals.value = (list || []).map(m => {
      let timeStr = ''
      if (m.mealTime) {
        const mealDate = new Date(m.mealTime)
        timeStr = `${String(mealDate.getHours()).padStart(2, '0')}:${String(mealDate.getMinutes()).padStart(2, '0')}`
      }
      return {
        type: 'meal',
        id: m.id,
        date: toLocalDateStr(m.mealTime),
        time: timeStr,
        mealType: (m.mealType || 'breakfast').toLowerCase(),
        mealTypeLabel: getMealTypeLabel((m.mealType || 'breakfast').toLowerCase()),
        ingredients: (m.ingredients || []).map(i => typeof i === 'string' ? i : (i.name || i)),
        score: m.aiScore || null,
        photo: m.signedPhotoUrl || '',
        photoError: false,
        suggestion: m.aiFeedback ? (m.aiFeedback.length > 30 ? m.aiFeedback.substring(0, 30) + '...' : m.aiFeedback) : null,
        sortKey: m.mealTime || ''
      }
    })
  } catch (e) {
    handleError(e, { fallback: '加载饮食记录失败' })
    allMeals.value = []
  }
}

async function loadGrowthRecords() {
  if (!selectedSubject.value || selectedSubject.value.type !== 'baby') {
    allGrowthRecords.value = []
    return
  }
  try {
    const list = await getGrowthRecords(selectedSubject.value.id)
    allGrowthRecords.value = (list || []).map(r => ({
      type: 'growth',
      id: r.id,
      date: toLocalDateStr(r.recordDate),
      time: '',
      heightCm: r.heightCm,
      weightG: r.weightG,
      weightKg: r.weightG ? (r.weightG / 1000).toFixed(1) : '-',
      notes: r.notes || '',
      sortKey: r.recordDate || ''
    }))
  } catch (e) {
    handleError(e, { fallback: '加载生长记录失败' })
    allGrowthRecords.value = []
  }
}

async function loadWeightRecords() {
  if (!selectedSubject.value || selectedSubject.value.type !== 'user') {
    allWeightRecords.value = []
    return
  }
  try {
    const list = await getWeightRecords()
    allWeightRecords.value = (list || []).map(r => ({
      type: 'weight',
      id: r.id,
      date: toLocalDateStr(r.recordDate),
      time: '',
      weightKg: r.weightKg ? Number(r.weightKg).toFixed(1) : '-',
      weekOfPregnancy: r.weekOfPregnancy || null,
      postpartumDays: r.postpartumDays != null ? r.postpartumDays : null,
      notes: r.notes || '',
      sortKey: r.recordDate || ''
    }))
  } catch (e) {
    handleError(e, { fallback: '加载体重记录失败' })
    allWeightRecords.value = []
  }
}

function getMealTypeLabel(type) {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
  return map[type] || type
}

function getScoreClass(score) {
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-ok'
  return 'score-low'
}

function onPhotoError(record) {
  record.photoError = true
}

// ── 记录合并 + 过滤 + 分组 ──────────────────────────────
const filteredRecords = computed(() => {
  let meals = allMeals.value
  let others = []

  if (selectedSubject.value?.type === 'baby') {
    others = allGrowthRecords.value
  } else if (selectedSubject.value?.type === 'user') {
    others = allWeightRecords.value
  }

  // 按日期范围过滤非饮食记录
  const { startDate, endDate } = getDateRange()
  if (startDate && endDate) {
    others = others.filter(r => r.date >= startDate && r.date <= endDate)
  }

  // Segment 过滤
  if (activeSegment.value === 'meal') {
    return [...meals]
  } else if (activeSegment.value === 'growth') {
    return [...others]
  } else if (activeSegment.value === 'weight') {
    return [...others]
  }
  // all
  return [...meals, ...others]
})

const sortedRecords = computed(() => {
  return filteredRecords.value.sort((a, b) => {
    const keyA = a.sortKey || (a.date + 'T' + (a.time || '00:00'))
    const keyB = b.sortKey || (b.date + 'T' + (b.time || '00:00'))
    return keyB.localeCompare(keyA)
  })
})

const recordGroups = computed(() => {
  const map = {}
  sortedRecords.value.forEach(r => {
    if (!map[r.date]) map[r.date] = []
    map[r.date].push(r)
  })
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const records = map[date]
      const mealScores = records.filter(r => r.type === 'meal' && r.score).map(r => r.score)
      const avgScore = mealScores.length > 0 ? Math.round(mealScores.reduce((a, b) => a + b, 0) / mealScores.length) : null
      const d = new Date(date)
      let dateLabel = date
      if (date === getTodayStr()) dateLabel = '今天'
      else if (date === getDateStr(-1)) dateLabel = '昨天'
      return {
        date,
        displayDay: d.getDate(),
        displayMonth: (d.getMonth() + 1) + '月',
        dateLabel,
        records,
        avgScore
      }
    })
})

// ── 交互 ──────────────────────────────
function onFilterChange(value) {
  activeFilter.value = value
  loadAllData()
}

function onRecordTap(record) {
  if (record.type === 'meal') {
    uni.navigateTo({ url: `/pages/meal-record/index?id=${record.id}` })
  } else if (record.type === 'growth') {
    uni.navigateTo({ url: '/pages/growth-record/index' })
  } else if (record.type === 'weight') {
    uni.navigateTo({ url: '/pages/weight-record/index' })
  }
}

function goMealRecord() {
  uni.navigateTo({ url: '/pages/meal-record/index' })
}

function goEmptyRecord() {
  if (activeSegment.value === 'weight') {
    goWeightRecord()
  } else if (activeSegment.value === 'growth') {
    goGrowthRecord()
  } else {
    goMealRecord()
  }
}

function goCamera() {
  uni.navigateTo({ url: '/pages/camera/index' })
}

function goGrowthRecord() {
  uni.navigateTo({ url: '/pages/growth-record/index' })
}

function goWeightRecord() {
  uni.navigateTo({ url: '/pages/weight-record/index' })
}

function onReachBottom() {
  // 当前一次性加载所有数据，无需分页
}

// ── 统一加载所有数据 ──────────────────────────────
async function loadAllData() {
  if (!selectedSubject.value) return
  recordsLoading.value = true
  noMore.value = false
  try {
    await Promise.allSettled([
      loadDailySummary(),
      loadMeals(),
      selectedSubject.value.type === 'baby' ? loadGrowthRecords() : loadWeightRecords()
    ])
  } finally {
    recordsLoading.value = false
    noMore.value = true
  }
}

// ── 监听主体切换 ──────────────────────────────
watch(
  () => selectedSubject.value ? (selectedSubject.value.type + '-' + selectedSubject.value.id) : null,
  (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      activeSegment.value = 'all'
      activeFilter.value = 'week'
      allMeals.value = []
      allGrowthRecords.value = []
      allWeightRecords.value = []
      dailySummary.value = {}
      loadAllData()
    }
  }
)

// ── 生命周期 ──────────────────────────────
onShow(() => {
  initDefaultSubject()
  loadAllData()
})
</script>

<style lang="scss" scoped>
.page-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #FAF7F2;
}

/* ── 自定义导航栏 ── */
.header-area {
  padding-bottom: 16rpx;
  padding-left: 40rpx;
  padding-right: 40rpx;
  background: #FAF7F2;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #3D3935;
  line-height: 88rpx;
}

/* ── 主体选择器 ── */
.subject-selector {
  white-space: nowrap;
  margin-bottom: 24rpx;
  padding: 0 40rpx;
}

.subject-chips {
  display: flex;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.subject-chip {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 28rpx 16rpx 16rpx;
  background: #fff;
  border-radius: 48rpx;
  border: 3rpx solid transparent;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
  white-space: nowrap;
  flex-shrink: 0;

  &.active {
    border-color: #F5A85B;
    background: #FFF8F0;
  }

  &:active {
    opacity: 0.85;
  }
}

.add-chip {
  padding: 16rpx 28rpx;
  justify-content: center;
  border: 3rpx dashed #E0E0E0;
  box-shadow: none;
  background: transparent;
}

.add-icon {
  font-size: 36rpx;
  color: #F5A85B;
}

.chip-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex-shrink: 0;
  overflow: hidden;

  &.baby { background: #E8F8EE; }
  &.adult { background: #F0E8FF; }
}

.chip-avatar-img {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
}

.chip-text {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.chip-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #3D3935;
  line-height: 1.2;
}

.chip-sub {
  font-size: 22rpx;
  color: #999;
  line-height: 1.2;
}

/* ── 今日概览卡片 ── */
.today-card {
  padding: 28rpx 32rpx;
}

.tc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.tc-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
}

.tc-date {
  font-size: 24rpx;
  color: #999;
}

.tc-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx 0;
}

.tc-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.tc-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}

.tc-num {
  font-size: 44rpx;
  font-weight: 700;
  color: #F5A85B;
  line-height: 1.1;
}

.tc-label {
  font-size: 22rpx;
  color: #999;
}

.tc-divider {
  width: 1rpx;
  height: 60rpx;
  background: #F0E9DE;
}

/* ── 快捷操作 ── */
.quick-actions {
  display: flex;
  gap: 20rpx;
}

.qa-item {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  padding: 24rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

.qa-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.qa-label {
  font-size: 24rpx;
  color: #3D3935;
  font-weight: 600;
}

/* ── 分类筛选（Segment） ── */
.segment-bar {
  display: flex;
  background: #fff;
  border-radius: 48rpx;
  padding: 6rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}

.segment-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #999;
  border-radius: 42rpx;
  transition: all 0.25s ease;

  &.active {
    background: #F5A85B;
    color: #fff;
    font-weight: 700;
  }

  &:active {
    opacity: 0.85;
  }
}

/* ── 日期筛选 ── */
.filter-bar {
  display: flex;
  gap: 0;
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

  &:active {
    opacity: 0.85;
  }
}

/* ── 空状态 ── */
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

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.empty-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 48rpx;
  padding: 18rpx 56rpx;
  font-size: 30rpx;
  font-weight: 600;

  &:active {
    opacity: 0.85;
  }
}

/* ── 日期分组 ── */
.record-flow {
  margin-top: 8rpx;
}

.date-group {
  margin-bottom: 8rpx;
}

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

.date-day {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1;
}

.date-month {
  font-size: 20rpx;
  color: rgba(255,255,255,0.8);
}

.date-info { flex: 1; }

.date-label {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 4rpx;
}

.date-count {
  font-size: 24rpx;
  color: #999;
}

.date-score {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 700;

  &.score-good { background: #E8F8EE; color: #5CB87A; }
  &.score-ok { background: #FFF3E6; color: #F5A85B; }
  &.score-low { background: #FDEEE9; color: #E07A5F; }
}

/* ── 记录卡片 ── */
.flow-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.flow-card {
  padding: 24rpx;
}

.fc-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.flow-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex-shrink: 0;

  &.meal-icon { background: #FFF3E6; }
  &.growth-icon { background: #E0F0FF; }
  &.weight-icon { background: #F0E8FF; }
}

.fc-type {
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
}

.fc-time {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}

.flow-score {
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 700;

  &.score-good { background: #E8F8EE; color: #5CB87A; }
  &.score-ok { background: #FFF3E6; color: #F5A85B; }
  &.score-low { background: #FDEEE9; color: #E07A5F; }
}

.fc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.flow-tag {
  background: #F5F5F5;
  border-radius: 20rpx;
  padding: 6rpx 16rpx;
  font-size: 24rpx;
  color: #666;
}

.fc-photo {
  width: 100%;
  height: 180rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.fc-suggestion {
  background: #F5F9FF;
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.fc-body {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.fc-data {
  font-size: 28rpx;
  color: #3D3935;
  font-weight: 600;
}

.fc-extra {
  font-size: 24rpx;
  color: #999;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 4rpx 16rpx;
}

/* ── 底部提示 ── */
.loading-tip, .no-more-tip {
  padding: 24rpx 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}

.no-more-tip {
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

/* ── 加载状态 ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.loading-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}

/* ── 卡片淡入上升动画 ── */
@keyframes anim-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-fade-in-up {
  animation: anim-fade-in-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
</style>
