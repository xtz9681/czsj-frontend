<template>
  <view class="page-container">
    <!-- 宝宝信息卡片 -->
    <view class="baby-info-card card">
      <text class="baby-name">{{ currentBaby?.name || '宝宝' }}</text>
      <text class="baby-age">{{ babyAgeText }}</text>
    </view>

    <!-- 里程碑时间轴 -->
    <view v-if="currentBaby?.birthday" class="timeline-card card">
      <view class="tl-header">
        <text class="tl-title">🌱 成长时光机</text>
        <text class="tl-age">{{ ageMonths }}个月 {{ ageDaysText }}</text>
      </view>
      <view class="timeline">
        <view class="tl-track"></view>
        <view class="tl-nodes">
          <view v-for="m in MILESTONES" :key="m.month"
                class="tl-node"
                :class="{ 'past': isPast(m), 'current': isCurrent(m), 'future': isFuture(m) }">
            <view class="tl-dot" :class="{ 'past': isPast(m), 'current': isCurrent(m), 'future': isFuture(m) }">
              <text v-if="isPast(m)" class="tl-check">✓</text>
            </view>
            <view class="tl-content">
              <text class="tl-label">{{ m.month }}个月{{ isCurrent(m) ? ' · 现在' : '' }}</text>
              <text class="tl-desc">{{ m.title }} · {{ m.desc }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 倒计时卡 -->
    <view v-if="nextMilestone" class="countdown-card">
      <text class="cd-icon">⏰</text>
      <view class="cd-text">
        <text class="cd-title">下个里程碑</text>
        <text class="cd-desc">{{ nextMilestone.title }} · {{ nextMilestone.desc }}</text>
      </view>
      <view class="cd-num-wrap">
        <text class="cd-num">{{ countdownDays }}</text>
        <text class="cd-unit">天后</text>
      </view>
    </view>

    <!-- 迷你生长曲线 -->
    <view v-if="currentBaby?.birthday" class="mini-chart-card card">
      <view class="mc-header">
        <text class="mc-title">📊 生长曲线</text>
        <view class="mc-switch">
          <text :class="{ active: chartMode === 'height' }" @click="chartMode = 'height'">身高</text>
          <text :class="{ active: chartMode === 'weight' }" @click="chartMode = 'weight'">体重</text>
        </view>
      </view>
      <view v-if="chartData.length >= 2" class="mc-chart">
        <svg width="100%" height="100" viewBox="0 0 300 100">
          <line x1="0" y1="50" x2="300" y2="50" stroke="#F0E9DE" stroke-width="1" stroke-dasharray="4,3" />
          <polyline :points="chartPoints" fill="none" stroke="#F5A85B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle v-for="(p, i) in chartData" :key="i"
                  :cx="p.x" :cy="p.y" r="4" fill="#F5A85B"
                  :stroke="i === chartData.length - 1 ? '#fff' : 'none'" :stroke-width="i === chartData.length - 1 ? 2 : 0" />
          <text v-for="(p, i) in chartData" :key="'label-'+i"
                :x="p.x" y="98" font-size="8" fill="#999" text-anchor="middle">{{ p.label }}</text>
        </svg>
      </view>
      <view v-else class="mc-empty">
        <text>记录至少 2 次身高体重就能看到成长曲线啦</text>
      </view>
    </view>

    <!-- 录入表单 -->
    <view class="form-card card">
      <view class="form-group">
        <text class="form-label">日期</text>
        <view class="date-picker-row">
          <picker mode="date" :value="formData.date" :end="getTodayStr()" start="2020-01-01" @change="onDateChange">
            <wd-input
              v-model="formData.date"
              type="text"
              readonly
              placeholder="选择日期"
            />
          </picker>
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">身高</text>
        <view class="input-row">
          <wd-input
            v-model="formData.height"
            type="digit"
            placeholder="身高（cm）"
          />
          <text class="unit">cm</text>
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">体重</text>
        <view class="input-row">
          <wd-input
            v-model="formData.weight"
            type="digit"
            placeholder="体重（g）"
          />
          <text class="unit">g</text>
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">备注</text>
        <wd-input
          v-model="formData.note"
          type="textarea"
          placeholder="可选：记录任何需要说明的事项"
          :maxlength="200"
          show-word-limit
        />
      </view>

      <wd-button type="primary" @click="submitRecord" :loading="saving" block round>
        保存记录
      </wd-button>
    </view>

    <!-- 历史记录 -->
    <view v-if="recordsLoading" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="records.length > 0" class="history-section">
      <text class="section-title">历史记录</text>
      <view class="record-list">
        <view v-for="record in records" :key="record.id" class="record-card card">
          <view class="record-header">
            <text class="record-date">{{ formatDate(record.recordDate) }}</text>
            <view class="record-actions">
              <text class="delete-btn" @tap="deleteRecord(record.id)">删除</text>
            </view>
          </view>
          <view class="record-data">
            <view class="data-item">
              <text class="data-label">身高</text>
              <text class="data-value">{{ record.heightCm }} cm</text>
            </view>
            <view class="data-item">
              <text class="data-label">体重</text>
              <text class="data-value">{{ record.weightG }} g</text>
            </view>
          </view>
          <view v-if="record.notes" class="record-note">
            <text>{{ record.notes }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <image src="/static/empty/no-records.png" class="empty-img" mode="aspectFit" />
      <text class="empty-text">还没有记录过宝宝的成长数据</text>
      <text class="empty-sub">开始记录，见证宝宝的每一步成长～</text>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { getGrowthRecords, addGrowthRecord } from '@/api/baby.js'
import { deleteGrowthRecord } from '@/api/record.js'
import { formatAge, calcAgeMonths } from '@/utils/age.js'
import { useErrorHandler } from '@/composables/useErrorHandler.js'

const userStore = useUserStore()
const { handleError } = useErrorHandler()
const babyId = ref('')
const currentBaby = computed(() => userStore.babies.find(b => b.id === babyId.value))

const babyAgeText = computed(() => formatAge(currentBaby.value?.birthday))

const formData = ref({
  date: getTodayStr(),
  height: '',
  weight: '',
  note: ''
})

const records = ref([])
const recordsLoading = ref(false)
const saving = ref(false)

// ── 成长时光机：里程碑时间轴 ──
const MILESTONES = [
  { month: 4, title: '关注辅食时机', desc: '宝宝 4 个月啦，可以开始关注辅食添加时机了', tip: '建议纯母乳到 6 个月再开始添加' },
  { month: 6, title: '辅食启程！', desc: '可以尝试米糊、南瓜泥等单一食材', tip: '每次只试一种新食材，观察 3 天' },
  { month: 8, title: '解锁蛋黄', desc: '可以尝试蛋黄了，记得先少量试敏哦', tip: '蛋白建议 12 个月后再尝试' },
  { month: 10, title: '手指食物时间', desc: '可以尝试手指食物了，锻炼咀嚼能力', tip: '切成条状或小块，让宝宝自主抓握' },
  { month: 12, title: '满 1 岁啦！', desc: '可以喝鲜牛奶、尝试蜂蜜了', tip: '逐步从奶瓶过渡到水杯' },
  { month: 15, title: '饮食大升级', desc: '可以和大人吃差不多的食物了', tip: '注意少盐少糖，避免重口味' },
  { month: 18, title: '大部分食材解锁', desc: '大部分食材都能吃了，注意均衡搭配', tip: '每天保证奶量 400-500ml' },
  { month: 24, title: '2 岁啦！', desc: '饮食接近成人，重点关注钙铁锌', tip: '可以开始培养自主进食习惯了' }
]

const ageMonths = computed(() => {
  if (!currentBaby.value?.birthday) return 0
  return calcAgeMonths(currentBaby.value.birthday)
})

const ageDaysText = computed(() => {
  if (!currentBaby.value?.birthday) return ''
  const birthday = new Date(currentBaby.value.birthday)
  const now = new Date()
  const months = ageMonths.value
  // 减去整月天数，得到剩余天数
  const monthDate = new Date(birthday)
  monthDate.setMonth(monthDate.getMonth() + months)
  const remainDays = Math.floor((now - monthDate) / (1000 * 60 * 60 * 24))
  return remainDays > 0 ? `${remainDays}天` : ''
})

function isPast(milestone) {
  return ageMonths.value > milestone.month
}

function isCurrent(milestone) {
  // 当前月龄落在两个里程碑之间，前一个是"当前"
  // 但如果所有里程碑都已过（>24月），则没有"当前"节点
  const hasNext = MILESTONES.some(m => m.month > ageMonths.value)
  if (!hasNext) return false
  const prev = [...MILESTONES].reverse().find(m => ageMonths.value >= m.month)
  return prev?.month === milestone.month
}

function isFuture(milestone) {
  return !isPast(milestone) && !isCurrent(milestone)
}

// ── 倒计时卡 ──
const nextMilestone = computed(() => MILESTONES.find(m => m.month > ageMonths.value))

const countdownDays = computed(() => {
  if (!nextMilestone.value || !currentBaby.value?.birthday) return 0
  const birthday = new Date(currentBaby.value.birthday)
  const targetDate = new Date(birthday)
  targetDate.setMonth(targetDate.getMonth() + nextMilestone.value.month)
  const diff = targetDate.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

// ── 迷你生长曲线 ──
const chartMode = ref('height') // 'height' | 'weight'

const chartData = computed(() => {
  if (!records.value || records.value.length === 0) return []
  // 按日期正序排列（旧→新）
  const sorted = [...records.value].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate))
  // 取最近 8 条
  const recent = sorted.slice(-8)
  // 计算数据范围
  const values = recent
    .map(r => chartMode.value === 'height' ? r.heightCm : r.weightG / 1000)
    .filter(v => v != null)
  if (values.length < 2) return []
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  // 映射到 SVG 坐标
  const padding = 10
  const chartHeight = 70
  return recent.map((r, i) => {
    const val = chartMode.value === 'height' ? r.heightCm : r.weightG / 1000
    if (val == null) return null
    const x = padding + (i / Math.max(1, recent.length - 1)) * (300 - 2 * padding)
    const y = padding + (1 - (val - minVal) / range) * chartHeight
    const d = new Date(r.recordDate)
    const label = `${d.getMonth() + 1}月`
    return { x, y, label, val }
  }).filter(Boolean)
})

const chartPoints = computed(() => chartData.value.map(p => `${p.x},${p.y}`).join(' '))

onLoad((options) => {
  babyId.value = options?.babyId || userStore.currentBaby?.id || ''
})

onShow(() => {
  loadRecords()
})

async function loadRecords() {
  if (!babyId.value) return
  recordsLoading.value = true
  try {
    const list = await getGrowthRecords(babyId.value)
    records.value = (list || []).sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
  } catch (e) {
    handleError(e, { fallback: '加载记录失败' })
  } finally {
    recordsLoading.value = false
  }
}

async function submitRecord() {
  if (!formData.value.height || !formData.value.weight) {
    uni.showToast({ title: '请输入身高和体重', icon: 'none' })
    return
  }

  saving.value = true
  try {
    await addGrowthRecord(babyId.value, {
      recordDate: formData.value.date,
      heightCm: parseFloat(formData.value.height),
      weightG: parseInt(formData.value.weight),
      notes: formData.value.note
    })
    uni.showToast({ title: '记录已保存', icon: 'success' })
    formData.value = {
      date: getTodayStr(),
      height: '',
      weight: '',
      note: ''
    }
    loadRecords()
  } catch (e) {
    handleError(e, { fallback: '保存失败，请重试' })
  } finally {
    saving.value = false
  }
}

async function deleteRecord(recordId) {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    confirmText: '删除',
    confirmColor: '#E07A5F',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteGrowthRecord(babyId.value, recordId)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadRecords()
        } catch (e) {
          handleError(e, { fallback: '删除失败' })
        }
      }
    }
  })
}

function onDateChange(e) {
  formData.value.date = e.detail.value
}

function getTodayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.getMonth() + 1 + '月' + d.getDate() + '日'
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 0 40rpx calc(40rpx + env(safe-area-inset-bottom));
  background: #FAF7F2;
  min-height: 100vh;
}

.baby-info-card {
  margin-top: 24rpx;
  padding: 24rpx;
  text-align: center;
}

.baby-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 8rpx;
}

.baby-age {
  display: block;
  font-size: 26rpx;
  color: #999;
}

/* ── 里程碑时间轴 ── */
.timeline-card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.tl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.tl-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #3D3935;
}

.tl-age {
  font-size: 24rpx;
  color: #F5A85B;
  font-weight: 600;
}

.timeline {
  position: relative;
  padding-left: 20rpx;
}

.tl-track {
  position: absolute;
  left: 19rpx;
  top: 20rpx;
  bottom: 20rpx;
  width: 3rpx;
  background: linear-gradient(to bottom, #F5A85B, #A3D9B1, #F0E9DE);
}

.tl-nodes {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  position: relative;
}

.tl-node {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.tl-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -20rpx;
  background: #E0D8CC;
  z-index: 1;
}

.tl-dot.past {
  background: #A3D9B1;
}

.tl-dot.current {
  background: #F5A85B;
  animation: pulse 2s infinite;
}

.tl-dot.future {
  background: #E0D8CC;
}

.tl-check {
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.tl-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding-top: 4rpx;
}

.tl-label {
  font-size: 26rpx;
  font-weight: 600;
}

.tl-node.past .tl-label {
  color: #999;
}

.tl-node.current .tl-label {
  color: #3D3935;
}

.tl-node.future .tl-label {
  color: #C8C8C8;
}

.tl-desc {
  font-size: 22rpx;
}

.tl-node.past .tl-desc {
  color: #999;
}

.tl-node.current .tl-desc {
  color: #3D3935;
}

.tl-node.future .tl-desc {
  color: #C8C8C8;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(245,168,91,0.2); }
  50% { box-shadow: 0 0 0 8px rgba(245,168,91,0.1); }
}

/* ── 倒计时卡 ── */
.countdown-card {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #FFF3E6, #FFFAF5);
  border: 1px solid #FFE0C0;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.cd-icon {
  font-size: 48rpx;
}

.cd-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.cd-title {
  font-size: 24rpx;
  color: #999;
}

.cd-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.cd-num-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cd-num {
  font-size: 48rpx;
  color: #F5A85B;
  font-weight: 800;
  line-height: 1;
}

.cd-unit {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* ── 迷你生长曲线 ── */
.mini-chart-card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.mc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.mc-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #3D3935;
}

.mc-switch {
  display: flex;
  gap: 12rpx;
}

.mc-switch text {
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 8rpx;
  background: #F5F5F5;
  color: #666;
}

.mc-switch text.active {
  background: #F5A85B;
  color: #fff;
}

.mc-chart {
  width: 100%;
}

.mc-empty {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 40rpx 0;
}

.form-card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.form-group {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #3D3935;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.date-picker-row {
  display: flex;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.input-row .wd-input {
  flex: 1;
}

.unit {
  font-size: 26rpx;
  color: #999;
  min-width: 40rpx;
}

.history-section {
  margin-top: 40rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.record-card {
  padding: 24rpx;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.record-date {
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
}

.record-actions {
  display: flex;
  gap: 12rpx;
}

.delete-btn {
  font-size: 24rpx;
  color: #E07A5F;
  padding: 8rpx 16rpx;
}

.record-data {
  display: flex;
  gap: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #F0E9DE;
  margin-bottom: 12rpx;
}

.data-item {
  display: flex;
  flex-direction: column;
}

.data-label {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.data-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #F5A85B;
}

.record-note {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  word-break: break-word;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.loading-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}

</style>
