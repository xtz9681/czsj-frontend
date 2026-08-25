<template>
  <view class="page-container" style="padding: 0 0 80rpx;">
    <!-- 付费引导 Banner（未订阅时显示） -->
    <view v-if="!isPremium" class="premium-banner">
      <view class="premium-content">
        <image src="/static/icons/icon-plan.png" class="premium-icon-img" mode="aspectFit" />
        <view>
          <text class="premium-title">AI 智能周计划</text>
          <text class="premium-desc">结合月龄或孕期阶段、过敏史和近期饮食，自动生成 7 天饮食安排</text>
        </view>
      </view>
      <view class="premium-actions">
        <view class="premium-btn" @tap="showBetaModal = true">内测期间如需体验，请联系客服开通</view>
        <text class="premium-features">包含：{{ benefits.join(' · ') }}</text>
      </view>
    </view>

    <!-- 已订阅：周计划内容 -->
    <view v-if="isPremium">
      <!-- 主体切换器 -->
      <view v-if="showSubjectToggle" class="subject-toggle">
        <view
          class="subject-tab"
          :class="{ active: subjectMode === 'baby' }"
          @tap="switchSubject('baby')"
        >
          {{ userStore.currentBaby?.name || '宝宝' }}
        </view>
        <view
          class="subject-tab"
          :class="{ active: subjectMode === 'mother' }"
          @tap="switchSubject('mother')"
        >
          我的营养
        </view>
      </view>

      <view class="plan-header">
        <view class="plan-header-left">
          <text class="plan-week">{{ weekRangeText }}</text>
          <text class="plan-status" :class="{
            'status-generating': planLoading,
            'status-ready': !planLoading && planReady,
            'status-empty': !planLoading && !planReady
          }">
            {{ planStatusText }}
          </text>
        </view>
        <view class="regenerate-btn" :class="{ disabled: planLoading }" @tap="!planLoading && generatePlan()">{{ planLoading ? '生成中...' : '重新生成' }}</view>
      </view>

      <!-- 周营养要点 -->
      <view v-if="planReady && weekTips" class="week-tips-card">
        <text class="week-tips-text">💡 {{ weekTips }}</text>
      </view>

      <view class="plan-days" style="padding: 0 40rpx;">
        <view v-if="planLoading" class="loading-state">
          <text class="loading-icon">⏳</text>
          <text class="loading-text">AI 正在准备中...</text>
        </view>
        <view v-else-if="!planReady" class="empty-state">
          <view class="empty-card">
            <text class="empty-icon">📋</text>
            <text class="empty-text">本周还没有生成计划</text>
            <view class="empty-btn" @tap="generatePlan">立即生成本周计划</view>
          </view>
        </view>
        <template v-else>
          <view
            class="plan-day-card card"
            v-for="day in weekPlan"
            :key="day.date"
            :class="{ today: day.isToday }"
          >
          <view class="pdc-header">
            <view class="pdc-date-badge" :class="{ today: day.isToday }">
              <text>{{ day.dayLabel }}</text>
            </view>
            <text class="pdc-date">{{ day.dateStr }}</text>
            <view v-if="day.isToday" class="today-tag">今天</view>
          </view>

          <view class="pdc-meals">
            <view class="pdc-meal" v-for="meal in day.meals" :key="meal.type">
              <text class="pdc-meal-type">{{ meal.typeLabel }}</text>
              <view class="pdc-ingredients">
                <text v-for="ing in meal.ingredients" :key="ing">{{ ing }}</text>
              </view>
            </view>
          </view>

          <view class="pdc-tip" v-if="day.tip">
            <text>💡 {{ day.tip }}</text>
          </view>

          <view class="pdc-actions">
            <view class="pdc-record-btn" @tap="recordDay(day)">记这天</view>
          </view>
        </view>
        </template>
      </view>
    </view>

    <!-- 免费用户预览（模糊效果） -->
    <view v-if="!isPremium" class="preview-section">
      <text class="preview-title">本周计划预览</text>
      <view class="preview-cards">
        <view class="preview-day-card card" v-for="d in previewDays" :key="d.day">
          <view class="pdc-header">
            <view class="pdc-date-badge">
              <text>{{ d.dayLabel }}</text>
            </view>
            <text class="pdc-date">{{ d.dateStr }}</text>
          </view>
          <!-- 模糊遮罩 -->
          <view class="preview-blur">
            <view class="blur-content">
              <text class="blur-text">{{ d.blurText }}</text>
            </view>
            <view class="blur-overlay"></view>
            <view class="blur-hint">
              <text>🔒 开通会员查看完整计划</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 内测提示模态框 -->
    <view v-if="showBetaModal" class="modal-mask" @tap="showBetaModal = false">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">成长食记会员内测</text>
        <text class="modal-desc">当前功能处于内测阶段，会员功能需人工开通。如需体验，请在「我的」页面反馈。</text>
        <view class="modal-btn" @tap="showBetaModal = false">关闭</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getWeeklyPlan, getLatestPlan } from '@/api/ai.js'
import { getUserInfo } from '@/api/auth.js'
import { useUserStore } from '@/store/user.js'
import { useErrorHandler } from '@/composables/useErrorHandler.js'

const userStore = useUserStore()
const isPremium = computed(() => userStore.isPaid)
const planReady = ref(false)
const planLoading = ref(false)
const showBetaModal = ref(false)

const { handleError } = useErrorHandler()

// 主体模式：'baby' | 'mother'
const subjectMode = ref('baby')

// 根据当前主体得出 subjectType 和 subjectId
const currentSubject = computed(() => {
  if (subjectMode.value === 'baby') {
    return { subjectType: 'baby', subjectId: userStore.currentBaby?.id }
  } else {
    return { subjectType: 'user', subjectId: userStore.userId }
  }
})

// 初始化 subjectMode：仅当当前选择无效时才重新初始化
function initSubjectMode() {
  const currentMode = subjectMode.value
  const hasBaby = userStore.babies.length > 0 && userStore.currentBaby
  const hasMother = userStore.mother

  // 如果当前选择的主体不存在，则重新初始化
  if (currentMode === 'baby' && !hasBaby) {
    subjectMode.value = hasMother ? 'mother' : 'baby'
  } else if (currentMode === 'mother' && !hasMother) {
    subjectMode.value = hasBaby ? 'baby' : 'mother'
  }
  // 否则保持用户当前选择
}

// 是否显示切换器：同时存在宝宝和妈妈档案
const showSubjectToggle = computed(() =>
  userStore.babies.length > 0 && userStore.mother
)

const planStatusText = computed(() => {
  if (planLoading.value) return '⏳ 生成中...'
  if (planReady.value) return '✓ 计划已生成'
  return '本周还没有计划'
})

const benefits = [
  'AI 智能周计划',
  '无限次 AI 拍照识食材',
  '无限次 AI 文字拆食材',
  '无限次 AI 营养评分',
  '营养趋势曲线',
]

const weekRangeText = computed(() => {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${monday.getMonth() + 1}月${monday.getDate()}日 — ${sunday.getMonth() + 1}月${sunday.getDate()}日`
})

const weekPlan = ref([])
const weekTips = ref('')
const previewDays = ref(generatePreviewDays())

function generatePreviewDays() {
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  return dayNames.slice(0, 3).map((d, i) => ({
    dayLabel: '周' + d,
    dateStr: '',
    blurText: i === 0 ? '米糊+蛋黄+...' : i === 1 ? '猪肉泥+...' : '鳕鱼+...'
  }))
}

function parsePlanJson(raw, weekStart) {
  if (!raw) return []
  // 本地今天日期
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // 确定周一日期：weekStart 存在则用它，否则计算当前周一
  let mondayDate
  if (weekStart) {
    const [year, month, day] = weekStart.split('-').map(Number)
    mondayDate = new Date(year, month - 1, day)
  } else {
    mondayDate = new Date(now)
    const dow = now.getDay() || 7
    mondayDate.setDate(now.getDate() - dow + 1)
  }

  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  const mealTypeMap = { breakfast: '早', lunch: '午', dinner: '晚', snack: '加' }

  return (raw.days || []).map((day, i) => {
    const d = new Date(mondayDate)
    d.setDate(d.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${date}`

    const meals = Object.entries(mealTypeMap)
      .filter(([type]) => day[type])
      .map(([type, typeLabel]) => ({
        type,
        typeLabel,
        ingredients: day[type]?.ingredients || []
      }))
    return {
      date: dateStr,
      dayLabel: '周' + dayNames[i],
      dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday: dateStr === today,
      tip: day.tip || null,
      meals
    }
  })
}

async function loadLatestPlan() {
  const { subjectType, subjectId } = currentSubject.value
  if (!subjectId) return
  planLoading.value = true
  try {
    const res = await getLatestPlan(subjectType, subjectId)
    const parsed = parsePlanJson(res?.planJson, res?.weekStart)
    weekTips.value = res?.planJson?.tips || ''
    if (parsed.length > 0) {
      weekPlan.value = parsed
      planReady.value = true
    } else {
      weekPlan.value = []
      planReady.value = false
    }
  } catch (e) {
    // 暂无计划，保持空，静默忽略
  } finally {
    planLoading.value = false
  }
}

function recordDay(day) {
  uni.navigateTo({ url: `/pages/meal-record/index?date=${day.date}` })
}

async function generatePlan() {
  if (planLoading.value) return
  const { subjectType, subjectId } = currentSubject.value
  if (!subjectId) { uni.showToast({ title: '请先完善档案后再生成计划', icon: 'none' }); return }
  planLoading.value = true
  planReady.value = false
  try {
    const res = await getWeeklyPlan(subjectType, subjectId)
    const parsed = parsePlanJson(res?.planJson, res?.weekStart)
    weekTips.value = res?.planJson?.tips || ''
    if (parsed.length > 0) {
      weekPlan.value = parsed
      planReady.value = true
      uni.showToast({ title: '周计划已更新~', icon: 'success' })
    } else {
      weekPlan.value = []
      planReady.value = false
      uni.showToast({ title: '生成结果为空，请稍后重试', icon: 'none' })
    }
  } catch (e) {
    handleError(e, { fallback: '生成失败，请稍后再试' })
  } finally {
    planLoading.value = false
  }
}

async function refreshMemberStatus() {
  try {
    const res = await getUserInfo()
    userStore.syncUserInfo(res)
  } catch (e) {
    // 静默忽略刷新失败，沿用现有状态
  }
}

function switchSubject(mode) {
  if (subjectMode.value === mode) return
  subjectMode.value = mode
  planReady.value = false
  weekPlan.value = []
  loadLatestPlan()
}

onShow(async () => {
  await refreshMemberStatus()
  initSubjectMode()
  await loadLatestPlan()
})
</script>

<style lang="scss" scoped>
/* 付费引导 Banner */
.premium-banner {
  margin: 24rpx 40rpx;
  background: linear-gradient(135deg, #F5A85B 0%, #F7BC7A 100%);
  border-radius: 24rpx;
  padding: 36rpx;
  box-shadow: 0 8rpx 24rpx rgba(245, 168, 91, 0.3);
}

.premium-content {
  display: flex;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.premium-icon { flex-shrink: 0; }

.premium-icon-img { width: 56rpx; height: 56rpx; margin-right: 16rpx; }


.premium-title { display: block; font-size: 34rpx; font-weight: 700; color: #FFFFFF; margin-bottom: 8rpx; }
.premium-desc { font-size: 26rpx; color: rgba(255,255,255,0.9); line-height: 1.6; }

.premium-price-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.price-tag {
  background: rgba(255,255,255,0.2);
  border-radius: 12rpx;
  padding: 10rpx 20rpx;
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.price-year { background: rgba(255,255,255,0.3); }
.price-num { font-size: 36rpx; font-weight: 700; color: #FFFFFF; }
.price-unit { font-size: 22rpx; color: rgba(255,255,255,0.8); }
.price-or { font-size: 24rpx; color: rgba(255,255,255,0.6); }

.price-save {
  background: #E07A5F;
  color: #FFFFFF;
  border-radius: 20rpx;
  padding: 6rpx 16rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.premium-btn {
  background: #FFFFFF;
  color: #F5A85B;
  border-radius: 12rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.premium-features { font-size: 22rpx; color: rgba(255,255,255,0.8); text-align: center; }

/* 内测提示模态框 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  max-width: 600rpx;
  text-align: center;
}

.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 20rpx;
}

.modal-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.modal-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 12rpx;
  padding: 16rpx 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  display: inline-block;
}

/* 主体切换器 */
.subject-toggle {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 40rpx;
  border-bottom: 1rpx solid #F0E9DE;
}

.subject-tab {
  flex: 1;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  text-align: center;
  font-size: 28rpx;
  color: #999;
  background: #F5F5F5;
  transition: all 0.2s;

  &.active {
    background: #FFF3E6;
    color: #F5A85B;
    font-weight: 600;
  }
}

/* 周营养要点 */
.week-tips-card {
  background: #E8F8EE;
  border-radius: 16rpx;
  margin: 20rpx 40rpx 0;
  padding: 20rpx 24rpx;
}

.week-tips-text {
  display: block;
  font-size: 26rpx;
  color: #5CB87A;
  line-height: 1.6;
}

/* 预览 */
.preview-section { padding: 0 40rpx; }
.preview-title { display: block; font-size: 30rpx; font-weight: 700; color: #3D3935; margin: 24rpx 0 16rpx; }

.preview-cards { display: flex; flex-direction: column; gap: 16rpx; }

.preview-day-card {
  overflow: hidden;
  padding: 0;
}

.preview-blur { position: relative; padding: 24rpx; min-height: 120rpx; }

.blur-content {
  filter: blur(6px);
  font-size: 28rpx;
  color: #666;
}

.blur-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.5);
}

.blur-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #999;
}

/* 订阅后的计划内容 */
.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 40rpx;
}

.plan-week { display: block; font-size: 28rpx; font-weight: 700; color: #3D3935; }
.plan-status { display: block; font-size: 24rpx; }
.status-ready { color: #5CB87A; }
.status-generating { color: #F5A85B; }
.status-empty { color: #999; }

.regenerate-btn {
  background: #F5F5F5;
  color: #666;
  border-radius: 20rpx;
  padding: 10rpx 24rpx;
  font-size: 24rpx;

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.plan-days { display: flex; flex-direction: column; gap: 16rpx; }

.plan-day-card {
  padding: 24rpx;
  border: 2rpx solid transparent;

  &.today {
    border-color: #F5A85B;
    box-shadow: 0 4rpx 16rpx rgba(245, 168, 91, 0.2);
  }
}

.pdc-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.pdc-date-badge {
  width: 72rpx;
  height: 72rpx;
  background: #F5F5F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666;
  font-weight: 600;

  &.today {
    background: #F5A85B;
    color: #FFFFFF;
  }
}

.pdc-date { font-size: 26rpx; color: #999; flex: 1; }

.today-tag {
  background: #FFF3E6;
  color: #F5A85B;
  border-radius: 16rpx;
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.pdc-meals { display: flex; flex-direction: column; gap: 12rpx; margin-bottom: 16rpx; }

.pdc-meal {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.pdc-meal-type {
  font-size: 24rpx;
  color: #FFFFFF;
  background: #A3D9B1;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  flex-shrink: 0;
  font-weight: 700;
}

.pdc-ingredients {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;

  text {
    font-size: 26rpx;
    color: #666;

    &:not(:last-child)::after {
      content: ' · ';
      color: #C8C8C8;
    }
  }
}

.pdc-tip {
  background: #F5F9FF;
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
  font-size: 24rpx;
  color: #4A7FB5;
  margin-bottom: 16rpx;
}

.pdc-actions { display: flex; justify-content: flex-end; }

.pdc-record-btn {
  background: #FFF3E6;
  color: #F5A85B;
  border-radius: 20rpx;
  padding: 10rpx 28rpx;
  font-size: 26rpx;
  font-weight: 600;
}

/* 付费弹窗 */
.pay-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.pay-modal {
  background: #FFFFFF;
  border-radius: 40rpx 40rpx 0 0;
  padding: 48rpx 40rpx;
  width: 100%;
  max-height: 80vh;
}

.pay-modal-title { display: block; font-size: 36rpx; font-weight: 700; color: #3D3935; text-align: center; margin-bottom: 40rpx; }

.pay-options { display: flex; gap: 16rpx; margin-bottom: 36rpx; }

.pay-option {
  flex: 1;
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  border: 3rpx solid transparent;
  position: relative;

  &.selected {
    border-color: #F5A85B;
    background: #FFF3E6;
  }

  &.popular.selected {
    border-color: #F5A85B;
  }
}

.po-popular-tag {
  position: absolute;
  top: -16rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #E07A5F;
  color: #FFFFFF;
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
  font-size: 20rpx;
  font-weight: 700;
  white-space: nowrap;
}

.po-name { display: block; font-size: 26rpx; color: #666; margin-bottom: 8rpx; }
.po-price { display: block; font-size: 36rpx; font-weight: 700; color: #F5A85B; margin-bottom: 4rpx; }
.po-desc { display: block; font-size: 22rpx; color: #999; }

.pay-benefits { margin-bottom: 36rpx; }

.pb-item { display: flex; align-items: center; gap: 12rpx; padding: 10rpx 0; }
.pb-check { font-size: 28rpx; color: #5CB87A; }
.pb-text { font-size: 26rpx; color: #666; }

.pay-confirm-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 96rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
}

.pay-disclaimer { display: block; text-align: center; font-size: 22rpx; color: #C8C8C8; }

/* 空状态卡片 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  color: #999;
  margin-bottom: 32rpx;
}

.empty-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 20rpx;
  padding: 16rpx 40rpx;
  font-size: 26rpx;
  font-weight: 600;
}

</style>
