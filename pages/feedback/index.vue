<template>
  <view class="page-container">
    <!-- 反馈内容卡片 -->
    <view class="card content-card">
      <text class="card-title">反馈内容</text>
      <textarea
        v-model="form.content"
        :maxlength="500"
        placeholder="描述一下你遇到的问题或建议吧…"
        class="feedback-textarea"
      ></textarea>
      <view class="char-count">{{ form.content.length }}/500</view>
    </view>

    <!-- 截图卡片 -->
    <view class="card image-card">
      <text class="card-title">截图（选填，最多 3 张）</text>
      <view class="image-grid">
        <view
          v-for="(img, idx) in form.images"
          :key="idx"
          class="image-item"
        >
          <image
            :src="img.tempPath"
            class="image-thumb"
            mode="aspectFill"
          ></image>
          <view v-if="img.status === 'uploading'" class="image-overlay">
            <text class="overlay-text">上传中</text>
          </view>
          <view v-else-if="img.status === 'failed'" class="image-overlay failed">
            <text class="overlay-text">上传失败</text>
          </view>
          <view class="image-remove" @tap="removeImage(idx)">✕</view>
        </view>

        <!-- 添加按钮 -->
        <view
          v-if="form.images.length < 3"
          class="image-add"
          @tap="chooseImages"
        >
          <text class="add-icon">＋</text>
          <text class="add-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 联系方式卡片 -->
    <view class="card contact-card">
      <text class="card-title">联系方式（选填）</text>
      <input
        v-model="form.contact"
        :maxlength="64"
        placeholder="微信号或手机号，方便我们联系你"
        class="contact-input"
      />
    </view>

    <!-- 提交按钮 -->
    <view class="button-group">
      <view
        class="submit-btn"
        :class="{ disabled: isSubmitDisabled }"
        @tap="handleSubmit"
      >
        <text>提交反馈</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { uploadFeedbackImage, submitFeedback } from '@/api/feedback.js'
import { useErrorHandler } from '@/composables/useErrorHandler.js'

const { handleError } = useErrorHandler()

const form = ref({
  content: '',
  images: [],
  contact: ''
})

const submitting = ref(false)

// 检查是否有图片在上传中
const hasUploadingImage = computed(() =>
  form.value.images.some(img => img.status === 'uploading')
)

// 提交按钮禁用条件：内容为空或有图片在上传
const isSubmitDisabled = computed(() =>
  form.value.content.trim() === '' || hasUploadingImage.value || submitting.value
)

async function chooseImages() {
  const remainCount = 3 - form.value.images.length
  if (remainCount <= 0) return

  uni.chooseImage({
    count: remainCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      res.tempFilePaths.forEach(tempPath => {
        const imgItem = {
          tempPath,
          key: null,
          status: 'uploading'
        }
        form.value.images.push(imgItem)

        // 立即上传
        uploadFeedbackImage(tempPath)
          .then(key => {
            imgItem.key = key
            imgItem.status = 'done'
          })
          .catch(e => {
            imgItem.status = 'failed'
            uni.showToast({
              title: typeof e === 'string' ? e : e.message,
              icon: 'none'
            })
          })
      })
    }
  })
}

function removeImage(idx) {
  form.value.images.splice(idx, 1)
}

async function handleSubmit() {
  if (form.value.content.trim() === '') {
    uni.showToast({ title: '先填写反馈内容吧~', icon: 'none' })
    return
  }

  if (hasUploadingImage.value) {
    uni.showToast({ title: '请等待图片上传完成', icon: 'none' })
    return
  }

  submitting.value = true

  try {
    // 收集所有已上传成功的图片 key
    const imageKeys = form.value.images
      .filter(img => img.status === 'done')
      .map(img => img.key)

    const data = {
      content: form.value.content.trim()
    }

    if (imageKeys.length > 0) {
      data.imageKeys = imageKeys
    }

    if (form.value.contact.trim()) {
      data.contact = form.value.contact.trim()
    }

    await submitFeedback(data)

    uni.showToast({ title: '感谢你的反馈~', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    handleError(e, { fallback: '提交失败，请稍后重试' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #FAF7F2;
  padding: 24rpx 40rpx 40rpx;
}

.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 20rpx;
}

/* 内容卡片 */
.content-card {
  position: relative;
}

.feedback-textarea {
  width: 100%;
  height: 180rpx;
  padding: 16rpx;
  border: 1rpx solid #F0E9DE;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #3D3935;
  line-height: 1.6;
  box-sizing: border-box;
}

.feedback-textarea::placeholder {
  color: #999;
}

.char-count {
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
}

/* 截图卡片 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
}

.image-thumb {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;

  &.failed {
    background: rgba(224, 122, 95, 0.3);
  }
}

.overlay-text {
  font-size: 22rpx;
  color: #3D3935;
  font-weight: 600;
}

.image-remove {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 32rpx;
  height: 32rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: #FFFFFF;
}

.image-add {
  aspect-ratio: 1;
  border: 2rpx dashed #E0E0E0;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.add-icon {
  font-size: 40rpx;
  color: #F5A85B;
}

.add-text {
  font-size: 20rpx;
  color: #999;
}

/* 联系方式卡片 */
.contact-input {
  width: 100%;
  padding: 16rpx;
  border: 1rpx solid #F0E9DE;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #3D3935;
  box-sizing: border-box;
}

.contact-input::placeholder {
  color: #999;
}

/* 按钮组 */
.button-group {
  padding: 0 40rpx 40rpx;
}

.submit-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 16rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  transition: opacity 0.2s;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
