<template>
  <view class="page-container">
    <!-- 顶部提示 -->
    <view class="tip-card card">
      <text class="tip-icon">💡</text>
      <text class="tip-text">开启后，到了饭点会通过微信消息提醒你记录宝宝的一餐</text>
    </view>

    <!-- 添加提醒 -->
    <view class="section">
      <text class="section-title">添加提醒</text>
      <view class="time-slots">
        <view
          v-for="slot in timeSlots"
          :key="slot.hour"
          class="time-slot card"
          @tap="handleSubscribe(slot)"
          :class="{ 'time-slot-added': isTimeAdded(slot.hour) }"
        >
          <text class="slot-emoji">{{ slot.icon }}</text>
          <view class="slot-info">
            <text class="slot-label">{{ slot.label }}</text>
            <text class="slot-time">{{ slot.time }}</text>
          </view>
          <text class="slot-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 已设置的提醒 -->
    <view v-if="reminders.length > 0" class="section">
      <text class="section-title">已设置的提醒</text>
      <view class="reminder-list">
        <view v-for="item in reminders" :key="item.id" class="reminder-item card">
          <view class="reminder-info">
            <text class="reminder-time">{{ formatTime(item.remindHour) }}</text>
            <text class="reminder-count">剩余 {{ item.availableCount }} 次</text>
          </view>
          <view class="reminder-actions">
            <wd-switch
              v-model="item.enabled"
              :disabled="loading"
              @change="handleToggle(item)"
            />
            <text class="action-delete" @tap="handleDelete(item)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">🔔</text>
      <text class="empty-text">还没有设置任何提醒</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getReminderList, subscribeReminder, toggleReminder, deleteReminder } from '@/api/reminder.js'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()
const reminders = ref([])
const loading = ref(false)

// 微信订阅消息模板 ID（需要在微信后台申请后填入）
const MEAL_REMINDER_TPL_ID = 'your-template-id-here'

const timeSlots = [
  { label: '早餐', hour: 8, time: '08:00', icon: '🌅' },
  { label: '午餐', hour: 12, time: '12:00', icon: '☀️' },
  { label: '晚餐', hour: 18, time: '18:00', icon: '🌙' },
]

onShow(() => {
  loadReminders()
})

async function loadReminders() {
  loading.value = true
  try {
    reminders.value = await getReminderList()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function isTimeAdded(hour) {
  return reminders.value.some(r => r.remindHour === hour && r.enabled)
}

function formatTime(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

async function handleSubscribe(slot) {
  // #ifdef MP-WEIXIN
  try {
    const res = await new Promise((resolve, reject) => {
      uni.requestSubscribeMessage({
        tmplIds: [MEAL_REMINDER_TPL_ID],
        success: resolve,
        fail: reject,
      })
    })

    // 检查用户是否同意
    if (res[MEAL_REMINDER_TPL_ID] === 'accept') {
      // 调后端接口记录订阅
      const baby = userStore.currentBaby
      await subscribeReminder({
        babyId: baby?.id,
        remindHour: slot.hour,
      })
      uni.showToast({ title: '提醒已开启', icon: 'success' })
      await loadReminders()
    } else {
      uni.showToast({ title: '需要授权才能发送提醒哦', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '授权失败，请重试', icon: 'none' })
  }
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '提醒功能仅在微信小程序中可用', icon: 'none' })
  // #endif
}

async function handleToggle(item) {
  try {
    await toggleReminder(item.id, !item.enabled)
    item.enabled = !item.enabled
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

async function handleDelete(item) {
  uni.showModal({
    title: '提示',
    content: '确定删除这个提醒吗？',
    success: async (res) => {
      if (res.confirm) {
        await deleteReminder(item.id)
        await loadReminders()
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #FAF7F2;
  padding: 32rpx 40rpx;
}

.tip-card {
  padding: 20rpx 24rpx;
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 32rpx;
  background: #FFF8F0;
}

.tip-icon {
  font-size: 36rpx;
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.section {
  margin-bottom: 32rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.time-slot {
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  transition: background 0.3s;
}

.time-slot-added {
  background: #FFF3E6;
  border: 2rpx solid #F5A85B;
}

.slot-emoji {
  font-size: 40rpx;
}

.slot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.slot-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
}

.slot-time {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.slot-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reminder-item {
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reminder-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.reminder-time {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
}

.reminder-count {
  display: block;
  font-size: 22rpx;
  color: #999;
}

.reminder-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-delete {
  font-size: 24rpx;
  color: #E07A5F;
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>
