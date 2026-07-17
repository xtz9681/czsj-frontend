<template>
  <view class="page-container">
    <!-- 妈妈信息卡片 -->
    <view class="mother-info-card card">
      <image src="/static/icons/avatar-mother.png" class="mother-emoji-img" mode="aspectFit" />
      <text class="mother-phase">{{ motherPhaseLabel }}</text>
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
        <text class="form-label">体重</text>
        <view class="input-row">
          <wd-input
            v-model="formData.weight"
            type="digit"
            placeholder="体重（kg）"
          />
          <text class="unit">kg</text>
        </view>
      </view>

      <view v-if="isPregnancy" class="form-group">
        <text class="form-label">孕周</text>
        <view class="input-row">
          <wd-input
            v-model="formData.weekOfPregnancy"
            type="digit"
            placeholder="孕周（周）"
          />
          <text class="unit">周</text>
        </view>
      </view>

      <view v-if="isLactation" class="form-group">
        <text class="form-label">产后天数</text>
        <view class="input-row">
          <wd-input
            v-model="formData.daysPostpartum"
            type="digit"
            placeholder="产后天数（天）"
          />
          <text class="unit">天</text>
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
              <text class="data-label">体重</text>
              <text class="data-value">{{ record.weightKg }} kg</text>
            </view>
            <view v-if="record.weekOfPregnancy" class="data-item">
              <text class="data-label">孕周</text>
              <text class="data-value">{{ record.weekOfPregnancy }} 周</text>
            </view>
            <view v-if="record.postpartumDays" class="data-item">
              <text class="data-label">产后</text>
              <text class="data-value">{{ record.postpartumDays }} 天</text>
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
      <image src="/static/empty/no-records-adult.png" class="empty-img" mode="aspectFit" />
      <text class="empty-text">还没有记录过体重数据</text>
      <text class="empty-sub">开始记录，关注自己的健康～</text>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler.js'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { getWeightRecords, addWeightRecord } from '@/api/mother.js'
import { deleteWeightRecord } from '@/api/record.js'

const userStore = useUserStore()

const motherPhaseLabel = computed(() => {
  const phase = userStore.mother?.phase
  const phaseMap = {
    preconception: '备孕期',
    pregnancy_early: '孕早期',
    pregnancy_mid: '孕中期',
    pregnancy_late: '孕晚期',
    lactation: '哺乳期',
    adult_female: '日常管理',
  }
  return phaseMap[phase] || '妈妈'
})

const isPregnancy = computed(() => {
  const phase = userStore.mother?.phase
  return phase && phase.includes('pregnancy')
})

const isLactation = computed(() => {
  return userStore.mother?.phase === 'lactation'
})

const { handleError } = useErrorHandler()

const formData = ref({
  date: getTodayStr(),
  weight: '',
  weekOfPregnancy: '',
  daysPostpartum: '',
  note: ''
})

const records = ref([])
const recordsLoading = ref(false)
const saving = ref(false)

onShow(() => {
  loadRecords()
})

async function loadRecords() {
  recordsLoading.value = true
  try {
    const list = await getWeightRecords()
    records.value = (list || []).sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
  } catch (e) {
    handleError(e, { fallback: '操作失败，请稍后重试' })
  } finally {
    recordsLoading.value = false
  }
}

async function submitRecord() {
  if (!formData.value.weight) {
    uni.showToast({ title: '请输入体重', icon: 'none' })
    return
  }

  const data = {
    recordDate: formData.value.date,
    weightKg: parseFloat(formData.value.weight),
    notes: formData.value.note
  }

  if (isPregnancy.value && formData.value.weekOfPregnancy) {
    data.weekOfPregnancy = parseInt(formData.value.weekOfPregnancy)
  }

  if (isLactation.value && formData.value.daysPostpartum) {
    data.postpartumDays = parseInt(formData.value.daysPostpartum)
  }

  saving.value = true
  try {
    await addWeightRecord(data)
    uni.showToast({ title: '记录已保存', icon: 'success' })
    formData.value = {
      date: getTodayStr(),
      weight: '',
      weekOfPregnancy: '',
      daysPostpartum: '',
      note: ''
    }
    loadRecords()
  } catch (e) {
    handleError(e, { fallback: '操作失败，请稍后重试' })
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
          await deleteWeightRecord(recordId)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadRecords()
        } catch (e) {
          handleError(e, { fallback: '操作失败，请稍后重试' })
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

.mother-info-card {
  margin-top: 24rpx;
  padding: 24rpx;
  text-align: center;
}

.mother-emoji {
  display: block;
  margin-bottom: 12rpx;
}

.mother-emoji-img {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: block;
  margin: 0 auto 12rpx;
}

.mother-phase {
  display: block;
  font-size: 28rpx;
  color: #3D3935;
  font-weight: 700;
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
  flex-wrap: wrap;
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

</style>
