<template>
  <view class="onboarding-page">
    <!-- 步骤指示器 -->
    <view class="step-indicator">
      <text class="step-text">{{ currentStep }}/3</text>
    </view>

    <!-- Step 1: 选择宝宝阶段 -->
    <view v-if="currentStep === 1" class="step-content anim-fade-in-up">
      <text class="step-title">选择宝宝阶段</text>
      <text class="step-sub">帮助我们为宝宝推荐适龄食材</text>

      <view class="phase-list">
        <view
          v-for="phase in phases"
          :key="phase.value"
          :class="['phase-card', selectedPhase === phase.value ? 'active' : '']"
          @tap="selectedPhase = phase.value"
        >
          <text class="phase-emoji">{{ phase.emoji }}</text>
          <text class="phase-name">{{ phase.label }}</text>
          <text class="phase-age">{{ phase.age }}</text>
        </view>
      </view>
    </view>

    <!-- Step 2: 标记常见过敏食材 -->
    <view v-if="currentStep === 2" class="step-content anim-fade-in-up">
      <text class="step-title">标记过敏食材</text>
      <text class="step-sub">可选，帮助识别过敏风险</text>

      <view class="allergy-tags">
        <view
          v-for="allergen in commonAllergens"
          :key="allergen"
          :class="['allergy-tag', selectedAllergies.includes(allergen) ? 'selected' : '']"
          @tap="toggleAllergy(allergen)"
        >
          <text>{{ allergen }}</text>
        </view>
      </view>

      <view class="skip-btn" @tap="currentStep = 3">
        <text>跳过此步</text>
      </view>
    </view>

    <!-- Step 3: 引导记第一餐 -->
    <view v-if="currentStep === 3" class="step-content anim-fade-in-up">
      <text class="step-title">记录第一餐</text>
      <text class="step-sub">开始追踪宝宝的饮食营养</text>

      <view class="action-cards">
        <view class="action-card card" @tap="goPhotoRecord">
          <text class="action-emoji">📸</text>
          <text class="action-title">拍照识食材</text>
          <text class="action-desc">拍一拍，AI 自动识别</text>
        </view>

        <view class="action-card card" @tap="goMealRecord">
          <text class="action-emoji">✏️</text>
          <text class="action-title">手动选择</text>
          <text class="action-desc">自己选择食材</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="footer-actions">
      <wd-button
        v-if="currentStep > 1"
        type="default"
        @click="currentStep--"
      >
        上一步
      </wd-button>
      <wd-button
        v-if="currentStep < 3"
        type="primary"
        :disabled="currentStep === 1 && !selectedPhase"
        @click="nextStep"
      >
        下一步
      </wd-button>
      <wd-button
        v-if="currentStep === 3"
        type="primary"
        @click="finishOnboarding"
      >
        开始使用
      </wd-button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useMealStore } from '@/store/meal.js'
import { useUserStore } from '@/store/user.js'

const mealStore = useMealStore()
const userStore = useUserStore()

const currentStep = ref(1)
const selectedPhase = ref('weaning')
const selectedAllergies = ref([])

const phases = [
  { value: 'nursing', label: '初生期', age: '0-6 个月', emoji: '👶' },
  { value: 'weaning', label: '辅食期', age: '6-24 个月', emoji: '🍚' },
  { value: 'toddler', label: '幼儿期', age: '1-3 岁', emoji: '🎈' }
]

const commonAllergens = [
  '鸡蛋', '牛奶', '花生', '坚果', '鱼类', '贝类', '小麦', '大豆', '芝麻', '芒果'
]

function toggleAllergy(allergen) {
  const idx = selectedAllergies.value.indexOf(allergen)
  if (idx > -1) {
    selectedAllergies.value.splice(idx, 1)
  } else {
    selectedAllergies.value.push(allergen)
  }
}

function nextStep() {
  if (currentStep.value === 1 && !selectedPhase.value) return

  // Step 1: 保存选择的阶段到当前宝宝档案
  if (currentStep.value === 1 && userStore.currentBaby) {
    userStore.currentBaby.phase = selectedPhase.value
  }

  currentStep.value++
}

function goPhotoRecord() {
  uni.navigateTo({ url: '/pages/camera/index' })
  finishOnboarding()
}

function goMealRecord() {
  uni.navigateTo({ url: '/pages/meal-record/index' })
  finishOnboarding()
}

function finishOnboarding() {
  uni.setStorageSync('onboarded', true)
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.onboarding-page {
  min-height: 100vh;
  background: #FAF7F2;
  padding: 40rpx 40rpx 200rpx 40rpx;
  display: flex;
  flex-direction: column;
}

.step-indicator {
  text-align: center;
  margin-bottom: 60rpx;
}

.step-text {
  font-size: 32rpx;
  color: #F5A85B;
  font-weight: 600;
}

.step-content {
  flex: 1;
}

.step-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.step-sub {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

/* Step 1: 阶段选择 */
.phase-list {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.phase-card {
  background: #FFFFFF;
  border: 2rpx solid #F0E9DE;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  transition: all 0.3s ease;
}

.phase-card.active {
  background: #FFF3E6;
  border-color: #F5A85B;
}

.phase-emoji {
  display: block;
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.phase-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 8rpx;
}

.phase-age {
  display: block;
  font-size: 20rpx;
  color: #999;
}

/* Step 2: 过敏标签 */
.allergy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 40rpx;
}

.allergy-tag {
  background: #FFFFFF;
  border: 2rpx solid #F0E9DE;
  border-radius: 24rpx;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s ease;
}

.allergy-tag.selected {
  background: #FFF3E6;
  border-color: #F5A85B;
  color: #F5A85B;
  font-weight: 600;
}

.skip-btn {
  text-align: center;
  padding: 16rpx 0;
}

.skip-btn text {
  font-size: 26rpx;
  color: #999;
  text-decoration: underline;
}

/* Step 3: 行动卡片 */
.action-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.action-card {
  padding: 32rpx 20rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-emoji {
  display: block;
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.action-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 8rpx;
}

.action-desc {
  display: block;
  font-size: 22rpx;
  color: #999;
}

/* 底部按钮 */
.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 1rpx solid #F0E9DE;
  padding: 16rpx 40rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 12rpx;
}

.footer-actions :deep(.wd-button) {
  flex: 1;
}

/* 动画 */
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
  animation: fadeInUp 0.4s ease-out both;
}
</style>
