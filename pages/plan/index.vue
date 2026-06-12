<template>
  <view class="page-container" style="padding: 0 0 80rpx;">
    <!-- 付费引导 Banner（未订阅时显示） -->
    <view v-if="!isPremium" class="premium-banner">
      <view class="premium-content">
        <image src="/static/icons/icon-plan.png" class="premium-icon-img" mode="aspectFit" />
        <view>
          <text class="premium-title">AI 智能周计划</text>
          <text class="premium-desc">根据宝宝月龄 + 过敏史 + 已吃食材，自动生成 7 天食谱安排</text>
        </view>
      </view>
      <view class="premium-actions">
        <view class="premium-price-row">
          <view class="price-tag">
            <text class="price-num">¥19</text>
            <text class="price-unit">/月</text>
          </view>
          <text class="price-or">或</text>
          <view class="price-tag price-year">
            <text class="price-num">¥149</text>
            <text class="price-unit">/年</text>
          </view>
          <text class="price-save">省 79 元</text>
        </view>
        <view class="premium-btn" @tap="showPayModal">开通会员，生成本周计划</view>
        <text class="premium-features">包含：无限 AI 评分 · 无限拍照识别 · PDF 月报(即将上线) · 群体对比(即将上线)</text>
      </view>
    </view>

    <!-- 已订阅：周计划内容 -->
    <view v-if="isPremium">
      <view class="plan-header">
        <view class="plan-header-left">
          <text class="plan-week">{{ weekRangeText }}</text>
          <text class="plan-status" :class="planReady ? 'status-ready' : 'status-generating'">
            {{ planReady ? '✓ 计划已生成' : '⏳ 生成中...' }}
          </text>
        </view>
        <view class="regenerate-btn" :class="{ disabled: planLoading }" @tap="!planLoading && generatePlan">{{ planLoading ? '生成中...' : '重新生成' }}</view>
      </view>

      <view class="plan-days" style="padding: 0 40rpx;">
        <view v-if="planLoading" class="loading-state">
          <text class="loading-icon">⏳</text>
          <text class="loading-text">AI 正在准备中...</text>
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

    <!-- 付费弹窗 -->
    <view v-if="showPay" class="pay-modal-mask" @tap.self="showPay = false">
      <view class="pay-modal">
        <text class="pay-modal-title">开通成长食记会员</text>

        <view class="pay-options">
          <view
            class="pay-option"
            :class="{ selected: selectedPlan === 'month' }"
            @tap="selectedPlan = 'month'"
          >
            <text class="po-name">月会员</text>
            <text class="po-price">¥19/月</text>
            <text class="po-desc">随时取消</text>
          </view>
          <view
            class="pay-option popular"
            :class="{ selected: selectedPlan === 'year' }"
            @tap="selectedPlan = 'year'"
          >
            <view class="po-popular-tag">最划算</view>
            <text class="po-name">年会员</text>
            <text class="po-price">¥149/年</text>
            <text class="po-desc">相当于 ¥12.4/月</text>
          </view>
          <view
            class="pay-option"
            :class="{ selected: selectedPlan === 'lifetime' }"
            @tap="selectedPlan = 'lifetime'"
          >
            <text class="po-name">终身会员</text>
            <text class="po-price">¥299</text>
            <text class="po-desc">一次买断</text>
          </view>
        </view>

        <view class="pay-benefits">
          <view class="pb-item" v-for="b in benefits" :key="b">
            <text class="pb-check">✓</text>
            <text class="pb-text">{{ b }}</text>
          </view>
        </view>

        <view class="pay-confirm-btn" @tap="confirmPay">
          {{ selectedPlan === 'month' ? '¥19 开通月会员' : selectedPlan === 'year' ? '¥149 开通年会员' : '¥299 终身会员' }}
        </view>

        <text class="pay-disclaimer">AI 建议仅供参考，不构成医疗建议，请咨询专业人员</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getWeeklyPlan, getLatestPlan } from '@/api/ai.js'
import { useUserStore } from '@/store/user.js'

const isPremium = ref(true)  // dev-mode: 测试期间默认全部放行，上线前改 false
const showPay = ref(false)
const selectedPlan = ref('year')
const planReady = ref(false)
const planLoading = ref(false)

const benefits = [
  '无限次 AI 拍照识食材',
  '无限次 AI 营养评分',
  'AI 智能周计划生成',
  'PDF 周报/月报导出（即将上线）',
  '同月龄群体营养对比（即将上线）',
  '全部历史记录无限保存',
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
const previewDays = ref(generatePreviewDays())

function generatePreviewDays() {
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  return dayNames.slice(0, 3).map((d, i) => ({
    dayLabel: '周' + d,
    dateStr: '',
    blurText: i === 0 ? '米糊+蛋黄+...' : i === 1 ? '猪肉泥+...' : '鳕鱼+...'
  }))
}

function parsePlanJson(raw) {
  if (!raw) return []
  const today = new Date().toISOString().split('T')[0]
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  const mealTypeMap = { breakfast: '早', lunch: '午', dinner: '晚', snack: '加' }
  return (raw.days || []).map((day, i) => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1 + i)
    const dateStr = d.toISOString().split('T')[0]
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
  const baby = useUserStore().currentBaby
  if (!baby?.id) return
  planLoading.value = true
  try {
    const res = await getLatestPlan(baby.id)
    if (res?.planJson) {
      weekPlan.value = parsePlanJson(res.planJson)
      planReady.value = true
    }
  } catch (e) {
    // 暂无计划，保持空
  } finally {
    planLoading.value = false
  }
}

function showPayModal() {
  showPay.value = true
}

function confirmPay() {
  uni.showModal({
    title: '功能开发中',
    content: '支付功能正在开发中，敬请期待！',
    showCancel: false,
    confirmText: '好的'
  })
}

async function generatePlan() {
  if (planLoading.value) return
  const baby = useUserStore().currentBaby
  if (!baby?.id) { uni.showToast({ title: '请先完善宝宝档案~', icon: 'none' }); return }
  planLoading.value = true
  planReady.value = false
  try {
    const res = await getWeeklyPlan(baby.id)
    if (res?.planJson) {
      weekPlan.value = parsePlanJson(res.planJson)
    }
    planReady.value = true
    uni.showToast({ title: '周计划已更新~', icon: 'success' })
  } catch (e) {
    planReady.value = true
    if (e.message?.includes('402') || e.message?.includes('会员')) {
      uni.showToast({ title: 'AI 周计划是会员功能~', icon: 'none' })
    } else {
      uni.showToast({ title: e.message || '生成失败，请稍后再试~', icon: 'none' })
    }
  } finally {
    planLoading.value = false
  }
}

function recordDay(day) {
  uni.navigateTo({ url: '/pages/meal-record/index' })
}

onShow(() => { loadLatestPlan() })
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
</style>
