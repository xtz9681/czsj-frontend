<template>
  <view class="setup-page">
    <view class="top-bg">
      <view class="bg-circle circle-1"></view>
      <view class="bg-circle circle-2"></view>
    </view>

    <view class="content">
      <view class="logo-area">
        <image src="/static/icons/logo-setup.png" class="logo-icon-img" mode="aspectFit" />
        <text class="title">告诉我更多关于你</text>
        <text class="subtitle">根据你的阶段，我们会给出最合适的营养建议</text>
      </view>

      <view class="stage-list">
        <view
          v-for="s in motherStages"
          :key="s.value"
          class="stage-card"
          :class="{ active: selected === s.value }"
          @tap="selected = s.value"
        >
          <image :src="s.icon" class="stage-icon-img" mode="aspectFit" />
          <view class="stage-text">
            <text class="stage-title">{{ s.label }}</text>
            <text class="stage-desc">{{ s.desc }}</text>
          </view>
          <view class="stage-check" v-if="selected === s.value">✓</view>
        </view>
      </view>

      <button class="btn-primary" :disabled="!selected" @tap="handleNext" :loading="loading">
        下一步
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const selected = ref('')
const loading = ref(false)

const motherStages = [
  { value: 'preconception', icon: '/static/icons/stage-love.png', label: '备孕中', desc: '正在为迎接宝宝做准备' },
  { value: 'pregnancy',     icon: '/static/icons/phase-pregnancy.png', label: '孕期',   desc: '孕早期 / 孕中期 / 孕晚期' },
  { value: 'lactation',     icon: '/static/icons/phase-lactation.png', label: '哺乳期', desc: '刚生产，正在哺乳' },
  { value: 'adult_female',  icon: '/static/icons/stage-woman.png', label: '日常管理', desc: '自身日常营养管理或孩子处于三岁以内' },
]

function handleNext() {
  if (!selected.value) return
  uni.navigateTo({ url: `/pages/mother-profile/index?stage=${selected.value}` })
}
</script>

<style lang="scss" scoped>
.setup-page {
  min-height: 100vh;
  background: #FAF7F2;
  position: relative;
  overflow: hidden;
}

.top-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 400rpx;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
}

.circle-1 {
  width: 600rpx; height: 600rpx;
  background: rgba(245, 168, 91, 0.12);
  top: -200rpx; right: -100rpx;
}

.circle-2 {
  width: 400rpx; height: 400rpx;
  background: rgba(163, 217, 177, 0.15);
  top: 80rpx; left: -120rpx;
}

.content {
  position: relative;
  z-index: 1;
  padding: 120rpx 40rpx calc(80rpx + constant(safe-area-inset-bottom));
  padding: 120rpx 40rpx calc(80rpx + env(safe-area-inset-bottom));
}

.logo-area {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo-icon { font-size: 80rpx; display: block; margin-bottom: 24rpx; }

.logo-icon-img {
  width: 120rpx;
  height: 120rpx;
  display: block;
  margin: 0 auto 24rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #999;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 60rpx;
}

.stage-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  border: 3rpx solid transparent;
  transition: all 0.2s;

  &.active {
    border-color: #F5A85B;
    background: #FFF8F0;
  }
}

.stage-icon { font-size: 52rpx; flex-shrink: 0; }

.stage-icon-img {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}

.stage-text { flex: 1; }

.stage-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 4rpx;
}

.stage-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.stage-check {
  font-size: 28rpx;
  color: #F5A85B;
  font-weight: 700;
  flex-shrink: 0;
}

.btn-primary {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 96rpx;
  font-size: 34rpx;
  font-weight: 600;
  border: none;
  height: 104rpx;
  line-height: 104rpx;

  &[disabled] { opacity: 0.4; }
  &::after { border: none; }
}
</style>
