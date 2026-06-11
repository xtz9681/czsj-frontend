<template>
  <view class="home-page">
    <!-- 顶部主体卡片 -->
    <view class="top-section" :style="topSectionStyle">
      <view class="top-bar">
        <view class="subject-info" @tap="showSwitcher = true">
          <view class="subject-avatar">
            <image v-if="subjectMode === 'baby' && currentBaby?.gender === 'female'" src="/static/icons/avatar-girl.png" class="avatar-img" />
            <image v-else-if="subjectMode === 'baby' && currentBaby?.gender === 'male'" src="/static/icons/avatar-boy.png" class="avatar-img" />
            <image v-else src="/static/icons/avatar-mother.png" class="avatar-img" />
          </view>
          <view class="subject-detail">
            <view class="subject-name-row">
              <text class="subject-name">{{ subjectName }}</text>
              <text class="name-arrow">▾</text>
              <view class="edit-btn" @tap.stop="goEditProfile">
                <text>✏️</text>
              </view>
            </view>
            <text class="subject-sub">{{ subjectSubtitle }}</text>
          </view>
        </view>
      </view>

      <!-- 今日营养概览 -->
      <view class="today-summary">
        <view class="summary-title">
          <text>今日饮食</text>
          <text class="summary-date">{{ todayStr }}</text>
        </view>
        <view v-if="pageLoading" class="loading-state">
          <text class="loading-icon">⏳</text>
          <text class="loading-text">加载中...</text>
        </view>
        <view v-else class="nutrition-row">
          <view class="nutrition-item" v-for="n in nutritionStats" :key="n.key">
            <text class="nutrition-icon">{{ n.icon }}</text>
            <view class="nutrition-data">
              <view class="nutrition-num-row">
                <text class="nutrition-num" :style="{ color: n.color }">{{ n.value }}</text>
                <text class="nutrition-unit">{{ n.unit }}</text>
              </view>
              <text class="nutrition-label">{{ n.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 月龄里程碑提醒 -->
    <view v-if="currentMilestone && subjectMode === 'baby'" class="section milestone-section anim-fade-in-up">
      <view class="milestone-card card" :class="{ 'milestone-new': currentMilestone.isNew }">
        <view class="milestone-header">
          <image :src="currentMilestone.icon" class="milestone-icon" mode="aspectFit" />
          <view class="milestone-info">
            <text class="milestone-title">{{ currentMilestone.title }}</text>
            <text class="milestone-desc">{{ currentMilestone.desc }}</text>
          </view>
        </view>
        <view class="milestone-tip">
          <text class="tip-label">小贴士</text>
          <text class="tip-text">{{ currentMilestone.tip }}</text>
        </view>
        <view v-if="nextMilestone" class="milestone-next">
          <text class="next-text">下一站：{{ nextMilestone.month }} 个月 — {{ nextMilestone.title }}</text>
        </view>
      </view>
    </view>

    <!-- 近 7 天营养趋势 -->
    <view v-if="trendData.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">近 7 天营养趋势</text>
      </view>
      <view class="trend-card card anim-fade-in-up">
        <NutritionTrendChart :chartData="trendData" height="360rpx" />
      </view>
    </view>

    <!-- 快速记录按钮 -->
    <view class="quick-actions">
      <view class="action-primary" @tap="goCamera">
        <image src="/static/icons/icon-camera.png" class="action-icon-img-big" />
        <view>
          <text class="action-title">拍照记一餐</text>
          <text class="action-sub">AI 自动识别食材</text>
        </view>
        <text class="action-arrow">›</text>
      </view>
      <view class="action-secondary" @tap="goMealRecord">
        <image src="/static/icons/icon-manual.png" class="action-icon-img" />
        <text class="action-text">手动记录</text>
      </view>
    </view>

    <!-- 宝宝模式：今日餐次 + 推荐食材 -->
    <template v-if="subjectMode === 'baby'">
      <view class="section">
        <view class="section-header">
          <text class="section-title">今天吃了</text>
          <text class="section-more" @tap="goMealList">全部记录 ›</text>
        </view>
        <view v-if="pageLoading" class="loading-state">
          <text class="loading-icon">⏳</text>
          <text class="loading-text">加载中...</text>
        </view>
        <view v-else-if="todayMeals.length === 0" class="empty-meals">
          <image src="/static/empty/no-meals.png" class="empty-img" mode="aspectFit" />
          <text class="empty-text">今天还没记录，快去拍一拍吧~</text>
          <view class="empty-btn" @tap="goCamera">记第一餐</view>
        </view>
        <view v-else class="meal-list">
          <view
            class="meal-card card anim-fade-in-up"
            v-for="(meal, index) in todayMeals"
            :key="meal.id"
            :style="{ animationDelay: index * 0.08 + 's' }"
            @tap="goMealDetail(meal.id)"
          >
            <view class="meal-card-header">
              <text class="meal-time">{{ meal.mealType }}</text>
              <text class="meal-hour">{{ meal.time }}</text>
              <view v-if="meal.score" class="score-badge" :class="getScoreClass(meal.score)">
                {{ meal.score }}分
              </view>
            </view>
            <view class="ingredients-row">
              <view
                v-for="ing in meal.ingredients"
                :key="ing.id"
                class="ingredient-chip"
                :class="{ 'allergy-chip': ing.isAllergy }"
              >
                <text v-if="ing.isAllergy" class="allergy-icon">⚠️</text>
                <text>{{ ing.name }}</text>
              </view>
            </view>
            <image v-if="meal.photo" :src="meal.photo" class="meal-photo" mode="aspectFill" />
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header" @tap="showRecommend = !showRecommend" style="cursor: pointer;">
          <text class="section-title">推荐食材</text>
          <text class="section-toggle">{{ showRecommend ? '收起 ⌃' : '展开 ⌄' }}</text>
        </view>
        <view v-if="showRecommend">
          <scroll-view scroll-x class="recommend-scroll">
            <view class="recommend-list">
              <view
                class="recommend-card card"
                v-for="item in recommendIngredients"
                :key="item.id"
                @tap="addIngredient(item)"
              >
                <text class="recommend-emoji">{{ item.emoji }}</text>
                <text class="recommend-name">{{ item.name }}</text>
                <text class="recommend-tip">{{ item.tip }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </template>

    <!-- 妈妈模式：孕期营养提示 -->
    <template v-else>
      <view class="section">
        <view class="mother-tip-card card">
          <view class="mother-tip-header">
            <view class="mother-tip-title-row">
              <image :src="phaseEmoji" class="phase-emoji-img" mode="aspectFit" />
              <text class="mother-tip-title">{{ subjectSubtitle }}</text>
            </view>
            <text class="mother-tip-stage-desc">{{ phaseDesc }}</text>
          </view>

          <!-- 营养素标签 -->
          <view class="nutrient-tags">
            <view class="nutrient-tag" v-for="n in phaseNutrients" :key="n.name">
              <text class="nutrient-emoji">{{ n.emoji }}</text>
              <text class="nutrient-name">{{ n.name }}</text>
            </view>
          </view>

          <!-- 一句话口诀 -->
          <view class="tip-slogan">
            <text class="slogan-icon">💡</text>
            <text class="slogan-text">{{ phaseSlogan }}</text>
          </view>

          <!-- 折叠详情 -->
          <view class="tip-expand" @tap="showMotherDetail = !showMotherDetail">
            <text class="expand-text">{{ showMotherDetail ? '收起详情 ⌃' : '查看详细说明 ⌄' }}</text>
          </view>

          <view v-if="showMotherDetail" class="tip-detail">
            <text class="mother-tip-content">
              <text
                v-for="(fragment, idx) in motherNutritionTips"
                :key="idx"
                :class="fragment.highlight ? 'nutrition-highlight' : 'nutrition-normal'"
              >{{ fragment.text }}</text>
            </text>
          </view>

          <view class="mother-tip-edit" @tap="goEditMother">
            <text>修改我的阶段 ›</text>
          </view>
        </view>
      </view>
    </template>

    <!-- AI 周计划入口 -->
    <view class="plan-banner" @tap="goPlan">
      <view class="plan-banner-content">
        <image src="/static/icons/icon-plan.png" class="plan-banner-icon-img" />
        <view>
          <text class="plan-banner-title">AI 智能周计划</text>
          <text class="plan-banner-sub">根据月龄 + 过敏史，帮你安排本周饮食</text>
        </view>
      </view>
      <text class="plan-banner-arrow">›</text>
    </view>

    <view class="bottom-space"></view>

    <!-- 主体切换 Sheet -->
    <view v-if="showSwitcher" class="switcher-mask" @tap="showSwitcher = false">
      <view class="switcher-sheet" @tap.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-title">切换视角</text>

        <!-- 宝妈档案 -->
        <view v-if="mother" class="switcher-item" :class="{ active: subjectMode === 'mother' }" @tap="switchToMother">
          <image src="/static/icons/avatar-mother.png" class="switcher-avatar-img" />
          <view class="switcher-info">
            <text class="switcher-name">我的营养</text>
            <text class="switcher-sub">{{ { preconception: '备孕期', pregnancy_early: '孕早期', pregnancy_mid: '孕中期', pregnancy_late: '孕晚期', lactation: '哺乳期', adult_female: '日常营养' }[mother.phase] || '妈妈' }}</text>
          </view>
          <text v-if="subjectMode === 'mother'" class="switcher-check">✓</text>
        </view>

        <!-- 宝宝列表 -->
        <text class="sheet-section-title">我的宝宝</text>
        <view
          v-for="b in babies"
          :key="b.id"
          class="switcher-item"
          :class="{ active: subjectMode === 'baby' && currentBabyId === b.id }"
          @tap="switchToBaby(b)"
        >
          <image v-if="b.gender === 'female'" src="/static/icons/avatar-girl.png" class="switcher-avatar-img" />
          <image v-else src="/static/icons/avatar-boy.png" class="switcher-avatar-img" />
          <view class="switcher-info">
            <text class="switcher-name">{{ b.name }}</text>
            <text class="switcher-sub">{{ babyAgeText(b) }}</text>
          </view>
          <text v-if="subjectMode === 'baby' && currentBabyId === b.id" class="switcher-check">✓</text>
        </view>

        <!-- 添加宝宝 -->
        <view class="switcher-add" @tap="addBaby">
          <text class="add-icon">＋</text>
          <text class="add-text">添加宝宝</text>
          <text v-if="babies.length >= 1" class="add-tag">年会员</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMealList, getIngredientsByAge, getDailySummary, getNutritionTrend } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'
import NutritionTrendChart from "@/components/NutritionTrendChart.vue"

const userStore = useUserStore()

// ── 安全区适配 ──────────────────────────────
const systemInfo = uni.getSystemInfoSync()
const menuButton = uni.getMenuButtonBoundingClientRect?.() || null
const safeTop = menuButton
  ? (menuButton.bottom + 8) + 'px'
  : (systemInfo.statusBarHeight + 44) + 'px'
const topSectionStyle = computed(() => ({
  paddingTop: safeTop
}))

// ── 当前主体状态 ──────────────────────────────
// subjectMode: 'baby' | 'mother'
const subjectMode = ref('baby')
const showSwitcher = ref(false)

// 直接从 store 取，不再手动维护本地 ref
const babies = computed(() => userStore.babies)
const currentBabyId = computed(() => userStore.currentBabyId)
const currentBaby = computed(() => userStore.currentBaby)
const mother = computed(() => userStore.mother)

// ── 首页数据 ──────────────────────────────────
const todayMeals = ref([])
const recommendIngredients = ref([])
const showRecommend = ref(false)
const pageLoading = ref(false)
const showMotherDetail = ref(false)
const trendData = ref([])

const nutritionStats = ref([
  { key: 'meals', icon: '🍽️', label: '餐次', value: '-', unit: '餐', color: '#F5A85B' },
  { key: 'score', icon: '⭐', label: '均分', value: '-', unit: '分', color: '#A3D9B1' },
  { key: 'ingredients', icon: '🥗', label: '食材', value: '-', unit: '种', color: '#FF8FA3' },
  { key: 'coverage', icon: '🎯', label: '营养覆盖', value: '-', unit: '%', color: '#A8D8EA' },
])

// ── 计算属性 ──────────────────────────────────
const ageMonths = computed(() => {
  if (subjectMode.value !== 'baby' || !currentBaby.value?.birthday) return 0
  const birth = new Date(currentBaby.value.birthday)
  return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.4))
})

const ageText = computed(() => {
  if (subjectMode.value !== 'baby') return ''
  const m = ageMonths.value
  if (m < 12) return `${m} 个月`
  const y = Math.floor(m / 12)
  const rem = m % 12
  return rem > 0 ? `${y} 岁 ${rem} 个月` : `${y} 岁`
})

// 月龄里程碑数据
const MILESTONES = [
  { month: 4,  icon: '/static/icons/stage-baby.png', title: '关注辅食时机', desc: '宝宝 4 个月啦，可以开始关注辅食添加时机了', tip: '建议纯母乳到 6 个月再开始添加' },
  { month: 6,  icon: '/static/icons/stage-baby.png', title: '辅食启程！', desc: '可以尝试米糊、南瓜泥等单一食材', tip: '每次只试一种新食材，观察 3 天' },
  { month: 8,  icon: '/static/icons/stage-baby.png', title: '解锁蛋黄', desc: '可以尝试蛋黄了，记得先少量试敏哦', tip: '蛋白建议 12 个月后再尝试' },
  { month: 10, icon: '/static/icons/stage-baby.png', title: '手指食物时间', desc: '可以尝试手指食物了，锻炼咀嚼能力', tip: '切成条状或小块，让宝宝自主抓握' },
  { month: 12, icon: '/static/icons/stage-baby.png', title: '满 1 岁啦！', desc: '可以喝鲜牛奶、尝试蜂蜜了', tip: '逐步从奶瓶过渡到水杯' },
  { month: 15, icon: '/static/icons/stage-baby.png', title: '饮食大升级', desc: '可以和大人吃差不多的食物了', tip: '注意少盐少糖，避免重口味' },
  { month: 18, icon: '/static/icons/stage-baby.png', title: '大部分食材解锁', desc: '大部分食材都能吃了，注意均衡搭配', tip: '每天保证奶量 400-500ml' },
  { month: 24, icon: '/static/icons/stage-baby.png', title: '2 岁啦！', desc: '饮食接近成人，重点关注钙铁锌', tip: '可以开始培养自主进食习惯了' },
]

const currentMilestone = computed(() => {
  if (subjectMode.value !== 'baby' || !ageMonths.value) return null
  const age = ageMonths.value
  // 找到当前所处的里程碑（最近的已达到的节点）
  let current = null
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (age >= MILESTONES[i].month) {
      current = MILESTONES[i]
      break
    }
  }
  // 如果刚好在里程碑月份（±1个月内），高亮显示
  if (current && Math.abs(age - current.month) <= 1) {
    return { ...current, isNew: true }
  }
  // 否则显示当前阶段（不高亮）
  return current ? { ...current, isNew: false } : null
})

const nextMilestone = computed(() => {
  if (subjectMode.value !== 'baby' || !ageMonths.value) return null
  const age = ageMonths.value
  for (const ms of MILESTONES) {
    if (ms.month > age) return ms
  }
  return null
})

// 顶部显示名称
const subjectName = computed(() => {
  if (subjectMode.value === 'baby') return currentBaby.value?.name || '小宝贝'
  return '我的营养'
})

// 顶部显示副标题
const subjectSubtitle = computed(() => {
  if (subjectMode.value === 'baby') return ageText.value ? `${ageText.value}` : '宝宝'
  const phaseMap = {
    preconception: '备孕期',
    pregnancy_early: '孕早期',
    pregnancy_mid: '孕中期',
    pregnancy_late: '孕晚期',
    lactation: '哺乳期',
    adult_female: '日常营养',
  }
  return phaseMap[mother.value?.phase] || '妈妈'
})

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

// ── 数据加载 ──────────────────────────────────
async function loadTodayMeals() {
  if (subjectMode.value !== 'baby' || !currentBaby.value?.id) return
  try {
    const list = await getMealList(currentBaby.value.id, 0, 10)
    const todayDate = new Date().toISOString().split('T')[0]
    todayMeals.value = (list || [])
      .filter(m => m.mealTime && m.mealTime.startsWith(todayDate))
      .map(m => ({
        id: m.id,
        mealType: m.mealType,
        time: m.mealTime ? m.mealTime.substring(11, 16) : '',
        score: m.aiScore,
        photo: m.signedPhotoUrl || '',
        ingredients: (m.ingredients || []).map(i => ({ id: i.name, name: i.name, isAllergy: false }))
      }))
  } catch (e) {
    // 静默处理
  }
}

async function loadDailySummary() {
  try {
    let subjectId, subjectType
    if (subjectMode.value === 'baby' && currentBaby.value?.id) {
      subjectId = currentBaby.value.id
      subjectType = 'BABY'
    } else if (subjectMode.value === 'mother') {
      subjectId = userStore.userId
      subjectType = 'MOTHER'
    } else {
      return
    }
    const res = await getDailySummary(subjectId, subjectType)
    nutritionStats.value[0].value = res.mealCount || 0
    nutritionStats.value[1].value = res.avgScore != null ? res.avgScore : '-'
    nutritionStats.value[2].value = res.ingredientCount || 0
    nutritionStats.value[3].value = res.nutritionCoverage || 0
  } catch (e) {
    // 静默处理，保持 '-' 显示
  }
}

async function loadRecommendIngredients() {
  if (subjectMode.value !== 'baby' || !currentBaby.value?.id) return
  try {
    const list = await getIngredientsByAge(currentBaby.value.id)
    recommendIngredients.value = (list || []).slice(0, 6).map(i => ({
      id: i.id,
      emoji: '🥗',
      name: i.name,
      tip: i.nutritionBrief || ''
    }))
  } catch (e) {
    // 静默处理
  }
}

async function loadTrend() {
  try {
    const params = subjectMode.value === "mother"
      ? { subjectType: "MOTHER", days: 7 }
      : { subjectType: "BABY", subjectId: currentBaby.value?.id, days: 7 }
    const res = await getNutritionTrend(params)
    trendData.value = res.points || []
  } catch (e) {
    trendData.value = []
  }
}

function syncFromStore() {
  // 妈妈阶段优先级：孕期/哺乳期默认进入妈妈模式；adult_female 才能优先进入宝宝模式
  if (userStore.mother) {
    const motherPhase = userStore.mother.phase
    const pregnancyAndLactationPhases = ['preconception', 'pregnancy_early', 'pregnancy_mid', 'pregnancy_late', 'lactation']

    // 孕期/备孕期/哺乳期：默认妈妈模式
    if (pregnancyAndLactationPhases.includes(motherPhase)) {
      subjectMode.value = 'mother'
    } else if (motherPhase === 'adult_female' && userStore.currentBabyId && userStore.babies.length > 0) {
      // adult_female 且有宝宝：优先宝宝模式
      subjectMode.value = 'baby'
    } else {
      // adult_female 但没有宝宝：回退妈妈模式
      subjectMode.value = 'mother'
    }
  } else if (userStore.currentBabyId && userStore.babies.length > 0) {
    // 没有妈妈档案，有宝宝：宝宝模式
    subjectMode.value = 'baby'
  }
}

onShow(() => {
  syncFromStore()
  pageLoading.value = true
  todayMeals.value = []
  recommendIngredients.value = []
  Promise.allSettled([
    loadTodayMeals(),
    loadRecommendIngredients(),
    loadDailySummary(),
    loadTrend()
  ]).finally(() => {
    pageLoading.value = false
  })
})

// ── 切换器 ────────────────────────────────────
function switchToBaby(baby) {
  userStore.switchBaby(baby.id)
  subjectMode.value = 'baby'
  showSwitcher.value = false
  todayMeals.value = []
  recommendIngredients.value = []
  pageLoading.value = true
  Promise.allSettled([
    loadTodayMeals(),
    loadRecommendIngredients(),
    loadDailySummary(),
    loadTrend()
  ]).finally(() => {
    pageLoading.value = false
  })
}

function switchToMother() {
  subjectMode.value = 'mother'
  showSwitcher.value = false
  todayMeals.value = []
  recommendIngredients.value = []
  pageLoading.value = true
  Promise.allSettled([
    loadDailySummary(),
    loadTrend()
  ]).finally(() => {
    pageLoading.value = false
  })
}

function addBaby() {
  showSwitcher.value = false
  uni.navigateTo({ url: '/pages/profile/index' })
}

// ── 工具函数 ──────────────────────────────────
function getScoreClass(score) {
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-ok'
  return 'score-low'
}

function babyAgeText(baby) {
  if (!baby?.birthday) return ''
  const m = Math.floor((Date.now() - new Date(baby.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.4))
  if (m < 12) return `${m} 个月`
  const y = Math.floor(m / 12)
  const rem = m % 12
  return rem > 0 ? `${y} 岁 ${rem} 个月` : `${y} 岁`
}

function goCamera() { uni.navigateTo({ url: '/pages/camera/index' }) }
function goMealRecord() { uni.navigateTo({ url: '/pages/meal-record/index' }) }
function goMealList() { uni.switchTab({ url: '/pages/meal-list/index' }) }
function goPlan() { uni.switchTab({ url: '/pages/plan/index' }) }
function goMealDetail(id) { uni.navigateTo({ url: `/pages/meal-record/index?id=${id}` }) }
function goEditMother() {
  showSwitcher.value = false
  if (subjectMode.value === 'mother') {
    uni.navigateTo({ url: '/pages/mother-profile/index?edit=1' })
  } else if (subjectMode.value === 'baby' && currentBaby.value?.id) {
    uni.navigateTo({ url: `/pages/profile/index?babyId=${currentBaby.value.id}&edit=1` })
  }
}

const goEditProfile = goEditMother
function addIngredient(item) {
  uni.navigateTo({ url: `/pages/meal-record/index?ingredient=${item.id}` })
}

const phaseEmoji = computed(() => {
  const map = {
    preconception: '/static/icons/phase-preconception.png',
    pregnancy_early: '/static/icons/phase-pregnancy.png',
    pregnancy_mid: '/static/icons/phase-pregnancy.png',
    pregnancy_late: '/static/icons/phase-pregnancy.png',
    lactation: '/static/icons/phase-lactation.png',
    adult_female: '/static/icons/phase-daily.png'
  }
  return map[mother.value?.phase] || '/static/icons/phase-pregnancy.png'
})

const phaseDesc = computed(() => {
  const map = {
    preconception: '身体慢慢养稳的阶段',
    pregnancy_early: '胃口波动期，吃得下就好',
    pregnancy_mid: '宝宝快速发育阶段',
    pregnancy_late: '规律供能，为生产蓄力',
    lactation: '支持奶量和身体恢复',
    adult_female: '让自己越来越均衡'
  }
  return map[mother.value?.phase] || ''
})

const phaseNutrients = computed(() => {
  const map = {
    preconception: [
      { emoji: '💊', name: '叶酸' },
      { emoji: '🩸', name: '铁' },
      { emoji: '🥩', name: '优质蛋白' }
    ],
    pregnancy_early: [
      { emoji: '💊', name: '叶酸' },
      { emoji: '🥩', name: '蛋白质' },
      { emoji: '🥣', name: '清淡易消化' }
    ],
    pregnancy_mid: [
      { emoji: '🐟', name: 'DHA' },
      { emoji: '🦴', name: '钙' },
      { emoji: '🩸', name: '铁' },
      { emoji: '🥩', name: '优质蛋白' }
    ],
    pregnancy_late: [
      { emoji: '🦴', name: '钙' },
      { emoji: '🥩', name: '蛋白质' },
      { emoji: '⚡', name: '整体能量' },
      { emoji: '🕐', name: '规律饮食' }
    ],
    lactation: [
      { emoji: '⚡', name: '能量' },
      { emoji: '🦴', name: '钙' },
      { emoji: '💧', name: '水分' },
      { emoji: '🥩', name: '优质蛋白' }
    ],
    adult_female: [
      { emoji: '🥩', name: '蛋白质' },
      { emoji: '🥦', name: '蔬菜水果' },
      { emoji: '💧', name: '水分' },
      { emoji: '🕐', name: '三餐规律' }
    ]
  }
  return map[mother.value?.phase] || map['pregnancy_mid']
})

const phaseSlogan = computed(() => {
  const map = {
    preconception: '三餐规律，叶酸跟上，慢慢养稳',
    pregnancy_early: '能吃得下就好，别给自己压力',
    pregnancy_mid: '每餐搭配：主食 + 蛋白 + 蔬菜',
    pregnancy_late: '稳定供能，舒服地吃、规律地吃',
    lactation: '先照顾好自己，别总随便对付',
    adult_female: '整体越来越均衡，不追求每顿完美'
  }
  return map[mother.value?.phase] || map['pregnancy_mid']
})

const motherNutritionTips = computed(() => {
  const phase = mother.value?.phase
  const tips = {
    preconception: [
      { text: '这段时间不用急着"补很多"，更重要的是先把身体慢慢养稳。', highlight: false },
      { text: '叶酸', highlight: true },
      { text: '、', highlight: false },
      { text: '铁', highlight: true },
      { text: '和', highlight: false },
      { text: '优质蛋白', highlight: true },
      { text: '可以开始有意识地跟上，', highlight: false },
      { text: '三餐尽量规律', highlight: true },
      { text: '一点，少熬夜、少凑合，身体状态稳定下来，比短时间内吃得特别"用力"更重要。你现在做的每一点准备，都是在给后面的怀孕过程打基础。', highlight: false },
    ],
    pregnancy_early: [
      { text: '孕早期胃口忽上忽下、闻到味道不舒服、吃不下东西都很常见，所以这时候不需要逼自己"必须吃得很标准"。先保证能吃得下，再慢慢把', highlight: false },
      { text: '叶酸', highlight: true },
      { text: '、', highlight: false },
      { text: '蛋白质', highlight: true },
      { text: '和一些', highlight: false },
      { text: '清淡好消化', highlight: true },
      { text: '的食物顾上就已经很好了。别因为一两天吃得不理想就焦虑，看整体、慢慢来，比每一顿都完美更重要。', highlight: false },
    ],
    pregnancy_mid: [
      { text: '到了孕中期，很多妈妈的胃口会慢慢稳定一些，宝宝也进入长得更快的阶段。这时候可以更有意识地把', highlight: false },
      { text: 'DHA', highlight: true },
      { text: '、', highlight: false },
      { text: '钙', highlight: true },
      { text: '、', highlight: false },
      { text: '铁', highlight: true },
      { text: '和', highlight: false },
      { text: '优质蛋白', highlight: true },
      { text: '补起来，让每一餐都尽量更均衡一点。你不用一下子记住很多复杂规则，只要记得"', highlight: false },
      { text: '主食、蛋白质、蔬菜', highlight: true },
      { text: '"尽量搭配着来，身体和宝宝都会更舒服。', highlight: false },
    ],
    pregnancy_late: [
      { text: '越到后面，身体的负担会越明显，这时候吃得', highlight: false },
      { text: '规律', highlight: true },
      { text: '、稳定供能，比一时多吃更重要。', highlight: false },
      { text: '钙', highlight: true },
      { text: '、', highlight: false },
      { text: '蛋白质', highlight: true },
      { text: '和', highlight: false },
      { text: '整体能量', highlight: true },
      { text: '要慢慢跟上，既是为了宝宝最后阶段的发育，也是为了让你自己更有力气面对生产和产后恢复。这个阶段不需要逼自己吃撑，舒服地吃、规律地吃，反而更容易坚持下来。', highlight: false },
    ],
    lactation: [
      { text: '你现在吃进去的，不只是"自己的一餐"，也在支持', highlight: false },
      { text: '奶量', highlight: true },
      { text: '、', highlight: false },
      { text: '体力', highlight: true },
      { text: '和身体恢复。很多时候妈妈会只顾着宝宝，忘了自己其实也很需要被照顾，所以', highlight: false },
      { text: '能量', highlight: true },
      { text: '、', highlight: false },
      { text: '钙', highlight: true },
      { text: '、', highlight: false },
      { text: '水分', highlight: true },
      { text: '和', highlight: false },
      { text: '优质蛋白', highlight: true },
      { text: '都要记得跟上。哪怕做不到每顿都很精致，也尽量别总是随便对付，先让自己别太亏，身体和状态会慢慢更稳。', highlight: false },
    ],
    adult_female: [
      { text: '到了日常管理阶段，不代表就要一下子把自己要求得特别严格，而是可以把关注点放回到"我怎么吃得更舒服、更稳定"。', highlight: false },
      { text: '三餐尽量规律', highlight: true },
      { text: '一点，', highlight: false },
      { text: '蛋白质', highlight: true },
      { text: '、', highlight: false },
      { text: '蔬菜水果', highlight: true },
      { text: '和', highlight: false },
      { text: '水分', highlight: true },
      { text: '慢慢搭起来，不必追求每一顿都完美，只要', highlight: false },
      { text: '整体越来越均衡', highlight: true },
      { text: '，身体状态就会一点点变好。营养管理不是短跑，更像是慢慢把自己照顾回来的过程。', highlight: false },
    ],
  }
  return tips[phase] || tips['pregnancy_mid']
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #FAF7F2;
}

/* 淡入向上动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* 顶部渐变区域 */
.top-section {
  background: linear-gradient(160deg, #F5A85B 0%, #F7BC7A 100%);
  padding: 0 40rpx 40rpx;
  border-radius: 0 0 40rpx 40rpx;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
  padding-right: 160rpx;
}

/* 主体信息（替代原 baby-info） */
.subject-info {
  display: flex;
  align-items: center;
  flex: 1;
  &:active {
    opacity: 0.85;
  }
}

.subject-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.avatar-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.subject-detail { flex: 1; }

.subject-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 4rpx;
}

.subject-name {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.name-arrow {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 8rpx;
  margin-right: 16rpx;
}

.subject-sub {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.85);
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  font-size: 20rpx;
  &:active {
    background: rgba(255,255,255,0.3);
  }
}

.baby-avatar {
  border: 3rpx solid rgba(255,255,255,0.6);
  margin-right: 20rpx;
}

.baby-avatar-placeholder {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-right: 20rpx;
}

.baby-name {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 4rpx;
}

.baby-age {
  font-size: 24rpx;
  color: rgba(255,255,255,0.85);
}

.edit-icon {
  font-size: 32rpx;
  margin-left: 12rpx;
}


/* 今日营养概览 */
.today-summary {
  background: rgba(255,255,255,0.2);
  border-radius: 20rpx;
  padding: 24rpx;
}

.summary-title {
  display: flex;
  justify-content: space-between;
  font-size: 28rpx;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  margin-bottom: 20rpx;
}

.summary-date { font-weight: 400; }

.nutrition-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.nutrition-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nutrition-icon { font-size: 28rpx; }

.nutrition-data {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nutrition-num-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.nutrition-num {
  font-size: 44rpx;
  font-weight: 700;
}

.nutrition-unit {
  font-size: 20rpx;
  color: #999;
}

.nutrition-label {
  font-size: 24rpx;
  color: rgba(255,255,255,0.9);
}

/* 快速操作 */
.quick-actions {
  margin: 32rpx 40rpx 0;
  display: flex;
  gap: 20rpx;
}

.action-primary {
  flex: 1;
  background: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(245, 168, 91, 0.2);
  padding: 28rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-icon-big { font-size: 56rpx; }

.action-icon-img-big {
  width: 64rpx;
  height: 64rpx;
}

.action-title { display: block; font-size: 30rpx; font-weight: 700; color: #3D3935; margin-bottom: 4rpx; }
.action-sub { font-size: 22rpx; color: #999; }

.action-arrow { font-size: 44rpx; color: #F5A85B; margin-left: auto; }

.action-secondary {
  background: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 130rpx;
}

.action-icon { font-size: 44rpx; }
.action-icon-img {
  width: 48rpx;
  height: 48rpx;
}
.action-text { font-size: 24rpx; color: #666; }

/* 通用 section */
.section {
  margin: 40rpx 40rpx 0;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title { font-size: 32rpx; font-weight: 700; color: #3D3935; }
.section-more { font-size: 26rpx; color: #F5A85B; }
.section-sub { font-size: 24rpx; color: #999; }
.section-toggle { font-size: 24rpx; color: #999; }

/* 空状态 */
.empty-meals {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.empty-img {
  width: 320rpx;
  height: 320rpx;
  margin-bottom: 24rpx;
}

.empty-text { font-size: 28rpx; color: #999; display: block; margin-bottom: 32rpx; }

.empty-btn {
  display: inline-block;
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 48rpx;
  padding: 16rpx 48rpx;
  font-size: 28rpx;
  font-weight: 600;
}

/* 餐次卡片 */
.meal-list { display: flex; flex-direction: column; gap: 20rpx; }

.meal-card {
  padding: 28rpx;
}

.meal-card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.meal-time { font-size: 30rpx; font-weight: 700; color: #3D3935; }
.meal-hour { font-size: 24rpx; color: #999; flex: 1; }

.score-badge {
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 700;

  &.score-good { background: #E8F8EE; color: #5CB87A; }
  &.score-ok { background: #FFF3E6; color: #F5A85B; }
  &.score-low { background: #FDEEE9; color: #E07A5F; }
}

/* 月龄里程碑卡片 */
.milestone-section {
  padding: 0 40rpx;
  margin-bottom: 16rpx;
}

.milestone-card {
  padding: 28rpx 32rpx;
  position: relative;
  overflow: hidden;
}

.milestone-card.milestone-new {
  background: linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%);
  border: 2rpx solid #F5A85B;
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.milestone-icon {
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
}

.milestone-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.milestone-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #3D3935;
}

.milestone-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.milestone-tip {
  background: #FAF7F2;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
}

.tip-label {
  font-size: 22rpx;
  color: #F5A85B;
  font-weight: 600;
  margin-right: 8rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}

.milestone-next {
  padding-top: 12rpx;
  border-top: 1rpx solid #F0E9DE;
}

.next-text {
  font-size: 22rpx;
  color: #999;
}

.milestone-card.milestone-new::after {
  content: 'NEW';
  position: absolute;
  top: 16rpx;
  right: -24rpx;
  background: #F5A85B;
  color: #FFFFFF;
  font-size: 18rpx;
  font-weight: 700;
  padding: 4rpx 32rpx;
  transform: rotate(45deg);
}

.ingredients-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.ingredient-chip {
  background: #F5F5F5;
  border-radius: 24rpx;
  padding: 8rpx 20rpx;
  font-size: 26rpx;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.allergy-chip {
  background: #FDEEE9;
  color: #E07A5F;
  font-weight: 600;
}

.allergy-icon { font-size: 22rpx; }

.meal-photo {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
}

/* 月龄推荐 */
.recommend-scroll { white-space: nowrap; }

.recommend-list {
  display: flex;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.recommend-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 20rpx;
  min-width: 120rpx;
}

.recommend-emoji { font-size: 48rpx; margin-bottom: 8rpx; }
.recommend-name { font-size: 26rpx; font-weight: 600; color: #3D3935; margin-bottom: 4rpx; }
.recommend-tip { font-size: 20rpx; color: #A3D9B1; font-weight: 600; }

/* 周计划 banner */
.plan-banner {
  margin: 40rpx 40rpx 0;
  background: linear-gradient(135deg, #A3D9B1 0%, #7ECFA0 100%);
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
}

.plan-banner-content {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.plan-banner-icon { font-size: 56rpx; }

.plan-banner-icon-img {
  width: 56rpx;
  height: 56rpx;
  margin-right: 16rpx;
}

.plan-banner-title { display: block; font-size: 30rpx; font-weight: 700; color: #FFFFFF; margin-bottom: 6rpx; }
.plan-banner-sub { font-size: 24rpx; color: rgba(255,255,255,0.85); }
.plan-banner-arrow { font-size: 44rpx; color: rgba(255,255,255,0.7); }

.bottom-space { height: 120rpx; }

/* 妈妈模式营养卡片 */
.mother-tip-card { }

.mother-tip-header {
  margin-bottom: 24rpx;
}

.mother-tip-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.phase-emoji-img {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}

.mother-tip-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #3D3935;
}

.mother-tip-stage-desc {
  font-size: 26rpx;
  color: #999;
}

.nutrient-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.nutrient-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc((100% - 48rpx) / 4);
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx 8rpx;
  border: 2rpx solid #F0E9DE;
}

.nutrient-emoji {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.nutrient-name {
  font-size: 24rpx;
  color: #3D3935;
  font-weight: 600;
  text-align: center;
}

.tip-slogan {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #F0F9F3;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
}

.slogan-icon {
  font-size: 28rpx;
}

.slogan-text {
  font-size: 26rpx;
  color: #3D3935;
  font-weight: 600;
}

.tip-expand {
  text-align: center;
  padding: 8rpx 0;
}

.expand-text {
  font-size: 24rpx;
  color: #F5A85B;
}

.tip-detail {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #F0E9DE;
}

.mother-tip-content {
  display: block;
  font-size: 28rpx;
  color: #3D3935;
  line-height: 1.8;
  margin-bottom: 24rpx;
  word-break: break-word;
}

.nutrition-normal {
  color: #3D3935;
}

.nutrition-highlight {
  color: #E07A5F;
  font-weight: 600;
}

.mother-tip-edit { font-size: 26rpx; color: #F5A85B; text-align: right; }

/* 切换器遮罩 + Sheet */
.switcher-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.switcher-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 40rpx 80rpx;
}

.sheet-handle {
  width: 80rpx; height: 8rpx;
  background: #E0E0E0;
  border-radius: 4rpx;
  margin: 0 auto 32rpx;
}

.sheet-title { display: block; font-size: 32rpx; font-weight: 700; color: #3D3935; margin-bottom: 24rpx; }
.sheet-section-title { display: block; font-size: 24rpx; color: #999; margin: 20rpx 0 12rpx; }

.switcher-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  margin-bottom: 8rpx;
  background: #F8F8F8;

  &.active { background: #FFF3E6; }
}

.switcher-avatar {
  width: 72rpx; height: 72rpx;
  border-radius: 50%;
  background: #F0F0F0;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}

.switcher-avatar-img {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.switcher-info { flex: 1; }
.switcher-name { display: block; font-size: 28rpx; font-weight: 600; color: #3D3935; margin-bottom: 4rpx; }
.switcher-sub { display: block; font-size: 24rpx; color: #999; }
.switcher-check { font-size: 28rpx; color: #F5A85B; font-weight: 700; }

.switcher-add {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  border: 2rpx dashed #E0E0E0;
  margin-top: 8rpx;
}

.add-icon { font-size: 36rpx; color: #F5A85B; }
.add-text { font-size: 28rpx; color: #F5A85B; flex: 1; }
.add-tag {
  font-size: 20rpx;
  color: #F5A85B;
  background: #FFF3E6;
  border-radius: 16rpx;
  padding: 4rpx 12rpx;
}

.trend-card {
  padding: 24rpx;
}
</style>
