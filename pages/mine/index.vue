<template>
  <view class="mine-page">
    <!-- 顶部用户信息卡片 -->
    <view class="user-card">
      <view class="user-header">
        <view class="user-avatar">
          <image :src="userMode === 'baby' && currentBaby ? (currentBaby.gender === 'female' ? '/static/icons/avatar-girl.png' : '/static/icons/avatar-boy.png') : '/static/icons/avatar-mother.png'" class="user-avatar-img" mode="aspectFit" />
        </view>
        <view class="user-info">
          <text class="user-name">
            {{ userMode === 'baby' && currentBaby ? currentBaby.name : '我的营养' }}
          </text>
          <text class="user-sub">
            {{ userMode === 'baby' && currentBaby ? babyAgeText : motherPhaseText }}
          </text>
        </view>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="features-section">
      <text class="section-title">功能</text>
      <view class="features-list">
        <!-- 宝宝档案 -->
        <view class="feature-item card" @tap="goToBabyProfile">
          <view class="feature-icon"><image src="/static/icons/icon-bottle.png" class="feature-icon-img" mode="aspectFit" /></view>
          <view class="feature-content">
            <text class="feature-title">宝宝档案</text>
            <text class="feature-desc">{{ babies.length > 0 ? `${babies.length} 个档案` : '管理宝宝信息' }}</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 妈妈档案 -->
        <view class="feature-item card" @tap="goToMotherProfile">
          <view class="feature-icon"><image src="/static/icons/icon-mother-profile.png" class="feature-icon-img" mode="aspectFit" /></view>
          <view class="feature-content">
            <text class="feature-title">妈妈档案</text>
            <text class="feature-desc">{{ motherPhaseText }}</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 过敏管理 -->
        <view class="feature-item card" @tap="goToAllergy">
          <view class="feature-icon"><image src="/static/icons/icon-allergy.png" class="feature-icon-img" mode="aspectFit" /></view>
          <view class="feature-content">
            <text class="feature-title">过敏管理</text>
            <text class="feature-desc">{{ allergyCount > 0 ? allergyCount + ' 项过敏记录' : '暂无记录' }}</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 生长记录 -->
        <view v-if="currentBaby?.id" class="feature-item card" @tap="goToGrowthRecord">
          <view class="feature-icon"><image src="/static/icons/icon-growth.png" class="feature-icon-img" mode="aspectFit" /></view>
          <view class="feature-content">
            <text class="feature-title">生长记录</text>
            <text class="feature-desc">记录宝宝成长数据</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 体重管理 -->
        <view v-if="mother" class="feature-item card" @tap="goToWeightRecord">
          <view class="feature-icon"><image src="/static/icons/icon-weight.png" class="feature-icon-img" mode="aspectFit" /></view>
          <view class="feature-content">
            <text class="feature-title">体重管理</text>
            <text class="feature-desc">记录妈妈体重</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 用餐提醒 -->
        <view class="feature-item card" @tap="goToReminder">
          <view class="feature-icon"><text class="feature-emoji">🔔</text></view>
          <view class="feature-content">
            <text class="feature-title">用餐提醒</text>
            <text class="feature-desc">定时提醒记录餐食</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 意见反馈 -->
        <button class="feature-item card feedback-btn" open-type="feedback">
          <view class="feature-icon"><text class="feature-emoji">💬</text></view>
          <view class="feature-content">
            <text class="feature-title">意见反馈</text>
            <text class="feature-desc">问题反馈与建议</text>
          </view>
          <text class="feature-arrow">›</text>
        </button>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="bottom-actions">
      <view class="logout-btn" @tap="handleLogout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user.js'
import { formatAge } from '@/utils/age.js'
import { phaseMap } from '@/constants/phase.js'

const userStore = useUserStore()

// ── 数据计算 ──────────────────────────────
const userMode = ref('baby')
const babies = computed(() => userStore.babies)
const currentBaby = computed(() => userStore.currentBaby)
const mother = computed(() => userStore.mother)

const babyAgeText = computed(() => formatAge(currentBaby.value?.birthday))

const motherPhaseText = computed(() => {
  if (!mother.value) return ''
  return phaseMap[mother.value.phase] || '妈妈档案'
})

const allergyCount = computed(() => {
  const allergyList = uni.getStorageSync('allergyList') || []
  return allergyList.length
})

// ── 页面初始化 ──────────────────────────────
function initUserMode() {
  // 如果有宝宝，默认显示宝宝信息；否则显示妈妈信息
  if (babies.value.length > 0) {
    userMode.value = 'baby'
  } else if (mother.value) {
    userMode.value = 'mother'
  }
}

// ── 导航函数 ──────────────────────────────
function goToBabyProfile() {
  if (currentBaby.value?.id) {
    uni.navigateTo({
      url: `/pages/profile/index?babyId=${currentBaby.value.id}&edit=1`
    })
  } else {
    uni.showToast({ title: '请先添加宝宝档案', icon: 'none' })
  }
}

function goToMotherProfile() {
  uni.navigateTo({
    url: '/pages/mother-profile/index'
  })
}

function goToAllergy() {
  uni.navigateTo({
    url: '/pages/allergy/index'
  })
}

function goToGrowthRecord() {
  if (currentBaby.value?.id) {
    uni.navigateTo({
      url: `/pages/growth-record/index?babyId=${currentBaby.value.id}`
    })
  } else {
    uni.showToast({ title: '请先添加宝宝档案', icon: 'none' })
  }
}

function goToWeightRecord() {
  uni.navigateTo({
    url: '/pages/weight-record/index'
  })
}

function goToReminder() {
  uni.navigateTo({
    url: '/pages/reminder/index'
  })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    confirmText: '退出',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({
          url: '/pages/login/index'
        })
      }
    }
  })
}

initUserMode()
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background: #FAF7F2;
  padding: 0 40rpx 200rpx;
}

/* 用户信息卡片 */
.user-card {
  background: linear-gradient(160deg, #F5A85B 0%, #F7BC7A 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin: 40rpx 0;

  .user-header {
    display: flex;
    align-items: center;
    gap: 24rpx;
  }

  .user-avatar {
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }

  .user-avatar-img {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
  }

  .user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .user-name {
    font-size: 32rpx;
    font-weight: 700;
    color: #FFFFFF;
  }

  .user-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

/* 功能列表 */
.features-section {
  margin: 40rpx 0 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 20rpx;
  display: block;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  gap: 20rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  transition: all 0.3s ease;

  &:active:not(.disabled) {
    background: #FFF9F5;
    transform: scale(0.98);
  }

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .feature-icon {
    min-width: 60rpx;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .feature-icon-img {
    width: 48rpx;
    height: 48rpx;
  }

  .feature-emoji {
    font-size: 44rpx;
  }

  .feature-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  .feature-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #3D3935;
  }

  .feature-desc {
    font-size: 22rpx;
    color: #999;
  }

  .feature-arrow {
    font-size: 32rpx;
    color: #CCC;
  }

  .feature-tag {
    font-size: 20rpx;
    color: #F5A85B;
    background: #FFF0E6;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
  }
}

/* 底部操作区 */
.bottom-actions {
  margin-top: 80rpx;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: #FDEEE9;
  color: #E07A5F;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.3s ease;

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.feedback-btn {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  line-height: normal;
  font-size: inherit;
}

.feedback-btn::after {
  border: none;
}
</style>
