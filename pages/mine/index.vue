<template>
  <view class="mine-page">
    <!-- 顶部用户信息卡片 -->
    <view class="user-card">
      <view class="user-header">
        <view class="user-avatar">
          {{ userMode === 'baby' && currentBaby ? (currentBaby.gender === 'female' ? '👧' : '👦') : '🤱' }}
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
          <view class="feature-icon">🍼</view>
          <view class="feature-content">
            <text class="feature-title">宝宝档案</text>
            <text class="feature-desc">{{ babies.length > 0 ? `${babies.length} 个档案` : '管理宝宝信息' }}</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 妈妈档案 -->
        <view class="feature-item card" @tap="goToMotherProfile">
          <view class="feature-icon">🤱</view>
          <view class="feature-content">
            <text class="feature-title">妈妈档案</text>
            <text class="feature-desc">{{ motherPhaseText }}</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 过敏管理 -->
        <view class="feature-item card" @tap="goToAllergy">
          <view class="feature-icon">⚠️</view>
          <view class="feature-content">
            <text class="feature-title">过敏管理</text>
            <text class="feature-desc">{{ allergyCount > 0 ? allergyCount + ' 项过敏记录' : '暂无记录' }}</text>
          </view>
          <text class="feature-arrow">›</text>
        </view>

        <!-- 生长记录 -->
        <view class="feature-item card disabled">
          <view class="feature-icon">📊</view>
          <view class="feature-content">
            <text class="feature-title">生长记录</text>
            <text class="feature-desc">即将开放</text>
          </view>
          <text class="feature-tag">Coming Soon</text>
        </view>
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

const userStore = useUserStore()

// ── 数据计算 ──────────────────────────────
const userMode = ref('baby')
const babies = computed(() => userStore.babies)
const currentBaby = computed(() => userStore.currentBaby)
const mother = computed(() => userStore.mother)

const babyAgeText = computed(() => {
  if (!currentBaby.value?.birthday) return ''
  const birth = new Date(currentBaby.value.birthday)
  const months = Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.4))
  if (months < 12) return `${months} 个月`
  const years = Math.floor(months / 12)
  const remainMonths = months % 12
  return remainMonths > 0 ? `${years} 岁 ${remainMonths} 个月` : `${years} 岁`
})

const motherPhaseText = computed(() => {
  if (!mother.value) return ''
  const phaseMap = {
    preconception: '备孕期',
    pregnancy_early: '孕早期',
    pregnancy_mid: '孕中期',
    pregnancy_late: '孕晚期',
    lactation: '哺乳期',
    adult_female: '日常营养'
  }
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
    font-size: 80rpx;
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.3);
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
  color: #333;
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
    font-size: 48rpx;
    min-width: 60rpx;
    text-align: center;
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
    color: #333;
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
  background: #FFE8D6;
  color: #E87D3F;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.3s ease;

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}
</style>
