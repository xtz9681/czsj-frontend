<template>
  <view class="page-container">
    <!-- 宝宝信息卡片 -->
    <view class="baby-info-card card">
      <text class="baby-name">{{ currentBaby?.name || '宝宝' }}</text>
      <text class="baby-age">{{ babyAgeText }}</text>
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
import { formatAge } from '@/utils/age.js'

const userStore = useUserStore()
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
    uni.showToast({ title: '加载记录失败', icon: 'none' })
  } finally {
    recordsLoading.value = false
  }
}

async function submitRecord() {
  if (!formData.value.height || !formData.value.weight) {
    uni.showToast({ title: '请填写身高和体重', icon: 'none' })
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
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
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
          uni.showToast({ title: '删除失败', icon: 'none' })
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

</style>
