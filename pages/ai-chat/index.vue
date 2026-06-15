<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: safeTop }">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">AI 营养师</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 对话列表 -->
      <view v-if="chatMessages.length > 0" class="chat-list">
        <view
          v-for="(msg, idx) in chatMessages"
          :key="idx"
          :class="['chat-bubble', msg.role === 'user' ? 'bubble-user' : 'bubble-assistant']"
        >
          <text class="bubble-content">{{ msg.content }}</text>
          <text v-if="msg.disclaimer" class="bubble-disclaimer">{{ msg.disclaimer }}</text>
        </view>
        <!-- AI 正在思考 -->
        <view v-if="loading" class="chat-bubble bubble-assistant">
          <text class="bubble-content typing">AI 正在思考...</text>
        </view>
      </view>

      <!-- 热门问题（无对话时显示） -->
      <view v-if="chatMessages.length === 0 && !loading" class="hot-questions">
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

      <!-- 错误提示 -->
      <view v-if="errorMsg" class="error-msg">
        <text>{{ errorMsg }}</text>
      </view>

      <!-- 开启新对话按钮 -->
      <view v-if="chatMessages.length > 0" class="new-chat-btn" @tap="clearChat">
        <text>开启新对话</text>
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
import { onShow } from '@dcloudio/uni-app'
import { askAi, getChatHistory, clearChatHistory } from '@/api/ai.js'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()

const systemInfo = uni.getSystemInfoSync()
const safeTop = (systemInfo.statusBarHeight + 44) + 'px'

const question = ref('')
const chatMessages = ref([])  // [{ role: 'user'|'assistant', content: '', disclaimer: '' }]
const loading = ref(false)
const errorMsg = ref('')

const DISCLAIMER = '仅供参考，请咨询医生'

const hotQuestions = [
  '6个月宝宝可以吃鸡蛋吗？',
  '宝宝不爱吃蔬菜怎么办？',
  '辅食一天吃几次合适？',
  '补铁吃什么食物好？',
]

onShow(async () => {
  try {
    const list = await getChatHistory()
    if (list && list.length > 0) {
      chatMessages.value = list.map(m => ({
        role: m.role,
        content: m.content,
        disclaimer: m.role === 'assistant' ? DISCLAIMER : ''
      }))
    }
  } catch (e) {
    // 加载历史失败不阻断，静默忽略
  }
})

async function handleAsk(q) {
  const text = q || question.value.trim()
  if (!text) return

  loading.value = true
  errorMsg.value = ''

  // 用户消息立即显示
  chatMessages.value.push({ role: 'user', content: text })
  question.value = ''

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

    // 注入最近 5 轮历史（排除当前提问，取之前的 10 条消息）
    const historyMessages = chatMessages.value
      .slice(0, -1)  // 排除刚 push 的当前提问
      .slice(-10)    // 最多 10 条（5 轮）
      .map(m => ({ role: m.role, content: m.content }))
    if (historyMessages.length > 0) {
      params.history = historyMessages
    }

    const res = await askAi(params)
    chatMessages.value.push({
      role: 'assistant',
      content: res.answer || '',
      disclaimer: res.disclaimer || ''
    })
  } catch (e) {
    // 检查 402 错误
    if (e?.statusCode === 402 || e?.code === 402 || e?.message?.includes('402')) {
      errorMsg.value = '今日免费次数已用完，明天再来问吧～'
    } else {
      errorMsg.value = e?.message || '网络开小差了，请稍后再试~'
    }
    // 提问失败时移除用户消息
    chatMessages.value.pop()
  } finally {
    loading.value = false
  }
}

function tapHotQuestion(q) {
  question.value = q
  handleAsk(q)
}

async function clearChat() {
  chatMessages.value = []
  errorMsg.value = ''
  try {
    await clearChatHistory()
  } catch (e) {
    // 清空后端失败不阻断前端体验
  }
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

/* 对话列表 */
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.chat-bubble {
  max-width: 85%;
  padding: 24rpx 28rpx;
  border-radius: 20rpx;
  word-break: break-all;
}

.bubble-user {
  align-self: flex-end;
  background: #F5A85B;
  color: #fff;
  border-bottom-right-radius: 4rpx;
}

.bubble-assistant {
  align-self: flex-start;
  background: #fff;
  color: #3D3935;
  border-bottom-left-radius: 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

.bubble-content {
  font-size: 28rpx;
  line-height: 1.6;
}

.bubble-disclaimer {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
}

.typing {
  color: #999;
}

.error-msg {
  padding: 24rpx;
  background: #FDEEE9;
  border-radius: 16rpx;
  border: 1rpx solid #E07A5F;
}

.error-msg text {
  display: block;
  font-size: 26rpx;
  color: #E07A5F;
}

.new-chat-btn {
  text-align: center;
  margin-top: 32rpx;
  padding: 16rpx 0;
}

.new-chat-btn text {
  font-size: 26rpx;
  color: #999;
  text-decoration: underline;
}
</style>
