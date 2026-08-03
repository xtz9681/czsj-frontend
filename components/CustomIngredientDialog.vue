<template>
  <view v-if="visible" class="dialog-mask" @tap.stop="$emit('cancel')">
    <view class="dialog-sheet" @tap.stop>
      <!-- 头部 -->
      <view class="dialog-header">
        <text class="dialog-title">添加食材</text>
        <text class="dialog-close" @tap="$emit('cancel')">✕</text>
      </view>

      <!-- 内容 -->
      <view class="dialog-body">
        <!-- 食材名称输入 -->
        <view class="input-section">
          <text class="section-label">食材名称</text>
          <wd-input
            v-model="ingredientName"
            maxlength="20"
            placeholder="输入食材名称"
            show-word-limit
          />
        </view>

        <!-- 分类选择 -->
        <view class="category-section">
          <text class="section-label">食材分类</text>
          <view class="category-grid">
            <view
              v-for="cat in categories"
              :key="cat"
              class="category-chip"
              :class="{ selected: selectedCategory === cat }"
              @tap="selectedCategory = cat"
            >
              <text>{{ cat }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="dialog-footer">
        <wd-button type="default" block @click="$emit('cancel')">取消</wd-button>
        <wd-button type="primary" block @click="handleConfirm">确认</wd-button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const ingredientName = ref('')
const selectedCategory = ref(null)

const categories = [
  '谷物',
  '蔬菜',
  '水果',
  '猪肉',
  '牛羊肉',
  '禽肉',
  '蛋类',
  '鱼类',
  '虾蟹贝',
  '豆制品',
  '乳制品',
  '坚果',
  '油脂',
  '调味品',
  '其他'
]

function handleConfirm() {
  const name = ingredientName.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入食材名称', icon: 'none' })
    return
  }
  if (!selectedCategory.value) {
    uni.showToast({ title: '请选择食材分类', icon: 'none' })
    return
  }
  emit('confirm', { name, category: selectedCategory.value })
  // Reset state for next use
  ingredientName.value = ''
  selectedCategory.value = null
}
</script>

<style lang="scss" scoped>
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.dialog-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid #F0E9DE;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #3D3935;
}

.dialog-close {
  font-size: 32rpx;
  color: #999;
  width: 40rpx;
  text-align: center;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx 40rpx;
}

.input-section {
  margin-bottom: 40rpx;
}

.section-label {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.category-section {
  margin-bottom: 24rpx;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.category-chip {
  padding: 16rpx 12rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
  border: 2rpx solid transparent;
  text-align: center;
  font-size: 26rpx;
  color: #666;
  transition: all 0.2s ease;

  &.selected {
    background: #FFF3E6;
    border-color: #F5A85B;
    color: #F5A85B;
    font-weight: 600;
  }
}

.dialog-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 40rpx 40rpx;
  border-top: 1rpx solid #F0E9DE;

  :deep(.wd-button) {
    flex: 1;
  }
}
</style>
