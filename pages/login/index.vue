<template>
  <view class="login-page">
    <!-- 顶部背景装饰 -->
    <view class="top-bg">
      <view class="bg-circle circle-1"></view>
      <view class="bg-circle circle-2"></view>
    </view>

    <!-- 主内容 -->
    <view class="content" :style="contentStyle">
      <!-- Logo 区域 -->
      <view class="logo-area">
        <image src="/static/icons/logo-app.jpg" class="logo-icon-img" mode="aspectFit" />
        <text class="app-name">成长食记</text>
        <text class="app-slogan">从第一口辅食开始，记录宝宝的成长</text>
      </view>

      <!-- 特性介绍 -->
      <view class="features card">
        <view class="feature-item" v-for="f in features" :key="f.id">
          <image :src="f.iconPath" class="feature-intro-icon" mode="aspectFit" />
          <view class="feature-text">
            <text class="feature-title">{{ f.title }}</text>
            <text class="feature-desc">{{ f.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 登录按钮 -->
      <view class="btn-area">
        <view class="agreement-check">
          <checkbox :checked="agreedPrivacy" @tap="agreedPrivacy = !agreedPrivacy" color="#5CB87A" />
          <text class="agreement-text">
            我已阅读并同意<text class="link" @tap="showPrivacy">《隐私政策》</text>
          </text>
        </view>
        <button class="wx-login-btn" :disabled="!agreedPrivacy" :class="{ disabled: !agreedPrivacy }" @tap="handleWxLogin" :loading="loading">
          <image src="/static/icons/icon-wechat.jpg" class="btn-icon-img" mode="aspectFit" />
          <text>微信一键登录</text>
        </button>
        <text class="privacy-tip">AI 建议仅供参考，请咨询专业人员</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { wxLogin } from '@/api/auth.js'
import { useUserStore } from '@/store/user.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useErrorHandler } from '@/composables/useErrorHandler.js'

const loading = ref(false)
const agreedPrivacy = ref(false)
const userStore = useUserStore()
const { handleError } = useErrorHandler()

// ── 安全区适配 ──────────────────────────────
const { safeTop } = useSafeArea()
// login 页面原来 padding-top 是 160rpx，比较大，这里在 safeTop 基础上额外加 20px
const contentStyle = computed(() => ({
  paddingTop: `calc(${safeTop} + 20px)`
}))

const features = [
  { id: 1, iconPath: '/static/icons/icon-camera.jpg', title: '拍照识食材', desc: '拍一拍，AI 自动识别今天吃了什么' },
  { id: 2, iconPath: '/static/icons/icon-star.jpg', title: 'AI 营养评分', desc: '实时评估营养均衡度，小建议一目了然' },
  { id: 3, iconPath: '/static/icons/icon-allergy.jpg', title: '过敏预警', desc: '自动检测交叉过敏风险，宝宝更安全' },
]

async function handleWxLogin() {
  if (!agreedPrivacy.value) {
    uni.showToast({ title: '请先同意隐私政策', icon: 'none' })
    return
  }
  if (loading.value) return
  loading.value = true

  // 在点击事件的同步上下文中，先获取用户资料权限
  let nickName = ''
  let avatarUrl = ''
  try {
    const profileRes = await new Promise(resolve => {
      uni.getUserProfile({
        desc: '用于完善用户资料',
        success: res => resolve(res),
        fail: err => resolve(null)
      })
    })
    console.log('[wxLogin] getUserProfile result:', profileRes?.userInfo)
    if (profileRes?.userInfo) {
      nickName = profileRes.userInfo.nickName || ''
      avatarUrl = profileRes.userInfo.avatarUrl || ''
    }
  } catch (e) {
    console.warn('[wxLogin] getUserProfile exception:', e)
  }

  // 然后再异步调用登录
  try {
    const [err, loginRes] = await new Promise(resolve => {
      uni.login({
        provider: 'weixin',
        success: res => resolve([null, res]),
        fail: err => resolve([err, null])
      })
    })
    if (err || !loginRes?.code) {
      uni.showToast({ title: '获取登录信息时出了点小问题~', icon: 'none' })
      return
    }

    console.log('[wxLogin] calling backend with:', { code: loginRes.code, nickName, avatarUrl })
    const res = await wxLogin(loginRes.code, nickName, avatarUrl)
    console.log('[wxLogin] backend response:', res)
    userStore.setLoginResult(res)

    if (!res.babies?.length && !res.mother) {
      uni.redirectTo({ url: '/pages/setup/index' })
    } else {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  } catch (e) {
    handleError(e, { fallback: '登录失败，请稍后重试' })
  } finally {
    loading.value = false
  }
}

function showPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/index' })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: #FAF7F2;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.top-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 500rpx;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
}

.circle-1 {
  width: 600rpx;
  height: 600rpx;
  background: rgba(245, 168, 91, 0.12);
  top: -200rpx;
  right: -100rpx;
}

.circle-2 {
  width: 400rpx;
  height: 400rpx;
  background: rgba(163, 217, 177, 0.15);
  top: 100rpx;
  left: -120rpx;
}

.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 40rpx;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo-icon {
  font-size: 96rpx;
  margin-bottom: 20rpx;
}

.logo-icon-img {
  width: 120rpx;
  height: 120rpx;
  /* 图片素材自带圆角（实测 22.6%），圆角外四角为黑色不透明区域，30% 圆角留足余量裁掉黑边 */
  border-radius: 30%;
  margin-bottom: 20rpx;
}

.app-name {
  font-size: 56rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: #999;
  text-align: center;
}

.features {
  padding: 16rpx 32rpx;
  margin-bottom: 60rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #F0E9DE;

  &:last-child {
    border-bottom: none;
  }
}

.feature-icon {
  font-size: 44rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.feature-intro-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.feature-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  display: block;
  margin-bottom: 4rpx;
}

.feature-desc {
  font-size: 24rpx;
  color: #999;
}

.btn-area {
  margin-top: auto;
  padding-bottom: calc(80rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.wx-login-btn {
  background: #07C160;
  color: #FFFFFF;
  border-radius: 96rpx;
  font-size: 34rpx;
  font-weight: 600;
  border: none;
  height: 104rpx;
  line-height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;

  &::after {
    border: none;
  }
}

.btn-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.btn-icon-img {
  width: 40rpx;
  height: 40rpx;
  margin-right: 12rpx;
}

.privacy-tip {
  font-size: 22rpx;
  color: #BBBBBB;
  text-align: center;
  display: block;
  line-height: 1.8;
}

.link {
  color: #F5A85B;
}

.agreement-check {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  gap: 8rpx;
}

.agreement-text {
  font-size: 24rpx;
  color: #666;
}

.wx-login-btn.disabled {
  opacity: 0.5;
}
</style>
