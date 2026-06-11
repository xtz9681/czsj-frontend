<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">AI 营养师</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 热门问题（无回答时显示） -->
      <view v-if="!answer && !loading" class="hot-questions">
        <text class="hot-title">热门问题</text>
        <view class="hot-list">
          <view
            v-for="q in hotQuestions"
            :key="q"
            class="hot-item card"
            @tap="tapHotQuestion(q)"
          >
            <text class="hot-text">{{ q }}</text>
            <text class="hot-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- AI 回答 -->
      <view v-if="answer && !loading" class="answer-card card anim-fade-in-up">
        <text class="answer-title">AI 回答</text>
        <text class="answer-text">{{ answer }}</text>
        <text class="disclaimer">{{ disclaimer }}</text>
      </view>

      <!-- 错误提示 -->
      <view v-if="errorMsg && !loading" class="error-card card">
        <text class="error-text">{{ errorMsg }}</text>
      </view>

      <!-- Loading 状态 -->
      <view v-if="loading" class="loading-state">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">AI 正在思考中...</text>
      </view>
    </view>

    <!-- 底部输入区 -->
    <view class="input-area">
      <view class="input-wrapper">
        <wd-input
          v-model="question"
          type="textarea"
          placeholder="输入你的喂养问题..."
          :maxlength="200"
          :rows="2"
          @confirm="handleAsk()"
        />
      </view>
      <wd-button
        type="primary"
        :loading="loading"
        :disabled="!question.trim() || loading"
        @click="handleAsk()"
      >
        提问
      </wd-button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { askAi } from '@/api/ai.js'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()

const question = ref('')
const answer = ref('')
const disclaimer = ref('')
const loading = ref(false)
const errorMsg = ref('')

const hotQuestions = [
  '6个月宝宝可以吃鸡蛋吗？',
  '宝宝不爱吃蔬菜怎么办？',
  '辅食一天吃几次合适？',
  '补铁吃什么食物好？',
]

async function handleAsk(q) {
  const text = q || question.value.trim()
  if (!text) return

  loading.value = true
  answer.value = ''
  errorMsg.value = ''

  try {
    const params = { question: text }
    // 注入主体上下文
    const baby = userStore.currentBaby
    if (baby) {
      params.subjectType = 'BABY'
      params.subjectId = baby.id
    } else if (userStore.mother) {
      params.subjectType = 'MOTHER'
    }

    const res = await askAi(params)
    answer.value = res.answer || ''
    disclaimer.value = res.disclaimer || ''
    question.value = ''
  } catch (e) {
    // 检查 402 错误
    if (e?.statusCode === 402 || e?.code === 402 || e?.message?.includes('402')) {
      errorMsg.value = '今日免费次数已用完，明天再来问吧～'
    } else {
      errorMsg.value = '网络异常，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

function tapHotQuestion(q) {
  question.value = q
  handleAsk(q)
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #FAF7F2;
  padding-top: 60rpx;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #F0E9DE;
  padding: 0 20rpx;
  z-index: 100;
}

.nav-back {
  font-size: 40rpx;
  color: #3D3935;
}

.nav-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: 700;
  color: #3D3935;
}

.nav-placeholder {
  width: 40rpx;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx 40rpx;
  padding-bottom: 200rpx;
}

.hot-questions {
  margin-bottom: 24rpx;
}

.hot-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.hot-item {
  padding: 16rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hot-text {
  flex: 1;
  font-size: 26rpx;
  color: #666;
}

.hot-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.answer-card {
  padding: 24rpx;
}

.answer-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.answer-text {
  display: block;
  font-size: 26rpx;
  color: #3D3935;
  line-height: 1.8;
  margin-bottom: 16rpx;
}

.disclaimer {
  display: block;
  font-size: 22rpx;
  color: #999;
  line-height: 1.6;
  padding-top: 12rpx;
  border-top: 1rpx solid #F0E9DE;
}

.error-card {
  padding: 24rpx;
  background: #FDEEE9;
  border: 1rpx solid #E07A5F;
}

.error-text {
  display: block;
  font-size: 26rpx;
  color: #E07A5F;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 1rpx solid #F0E9DE;
  padding: 16rpx 40rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 12rpx;
  align-items: flex-end;
}

.input-wrapper {
  flex: 1;
}

.input-wrapper :deep(.wd-input) {
  font-size: 26rpx;
}

.input-wrapper :deep(.wd-input__wrapper) {
  background: #F5F5F5;
  border-radius: 8rpx;
}
</style>
