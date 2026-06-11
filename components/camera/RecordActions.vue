<template>
  <view class="action-buttons">
    <view v-if="subjectMode === 'baby'" class="action-btn primary" :class="{ disabled }" @tap="!disabled && $emit('record-baby')">
      <text>记录</text>
    </view>

    <template v-else>
      <view v-if="hasBabies" class="action-btn primary" :class="{ disabled }" @tap="!disabled && $emit('record-mother')">
        <text>记录我的</text>
      </view>
      <view v-else class="action-btn primary" :class="{ disabled }" @tap="!disabled && $emit('record-mother')">
        <text>记录</text>
      </view>

      <view v-if="hasBabies" class="action-btn secondary" :class="{ disabled }" @tap="!disabled && $emit('record-multiple')">
        <text>记录多个</text>
      </view>
    </template>
  </view>
</template>

<script setup>
defineProps({
  subjectMode: {
    type: String,
    required: true // 'baby' | 'mother'
  },
  hasBabies: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['record-mother', 'record-baby', 'record-multiple'])
</script>

<style lang="scss" scoped>
.action-buttons {
  display: flex;
  gap: 16rpx;
  padding: 0 40rpx 40rpx;
}

.action-btn {
  flex: 1;
  padding: 20rpx 28rpx;
  border-radius: 16rpx;
  background: #FFFFFF;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;

  &.primary {
    background: #F5A85B;
    color: #FFFFFF;
  }

  &.secondary {
    background: #F5F5F5;
    color: #666;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
