<template>
  <view class="fallback-stage">
    <image v-if="photo" :src="photo" class="fallback-photo" mode="aspectFill" @tap="previewPhoto" />

    <view class="fallback-card-container">
      <scroll-view scroll-y class="fallback-scroll-container">
        <view class="fallback-card">
          <view class="fallback-header">
            <text class="fallback-title">📸 这一餐看起来是辅食～</text>
            <text class="fallback-sub">帮我确认下用了什么食材？</text>
          </view>

          <!-- 月龄常用食材 -->
          <view class="quick-select-section">
            <text class="quick-select-title">{{ babyAgeText }}常用食材</text>
            <view class="quick-select-grid">
              <view
                v-for="ing in ingredients"
                :key="ing.id"
                class="quick-select-item"
                :class="{
                  selected: ing.selected,
                  'allergy-item': ing.isAllergy
                }"
                @tap="$emit('toggle-ingredient', ing)"
              >
                <text class="quick-item-emoji">{{ ing.emoji }}</text>
                <text class="quick-item-name">{{ ing.name }}</text>
                <text v-if="ing.isAllergy" class="quick-allergy-icon">⚠️</text>
                <view v-if="ing.selected" class="selected-check">✓</view>
              </view>
            </view>
          </view>

          <!-- 自定义输入 -->
          <view class="custom-input-area">
            <wd-button type="primary" block @click="$emit('request-add-custom')">＋ 添加其他食材</wd-button>
          </view>

          <!-- 已选食材展示 -->
          <view v-if="selectedIngredients.length > 0" class="selected-summary">
            <text class="selected-title">已选 {{ selectedIngredients.length }} 种食材</text>
            <view class="selected-tags">
              <view
                v-for="ing in selectedIngredients"
                :key="ing.id"
                class="selected-tag"
                :class="{ 'allergy-tag': ing.isAllergy }"
              >
                <text v-if="ing.isAllergy">⚠️ </text>
                <text>{{ ing.name }}</text>
                <text class="remove-tag" @tap="$emit('remove-ingredient', ing)">✕</text>
              </view>
            </view>
          </view>

          <!-- 过敏预警 -->
          <view v-if="allergyWarnings.length > 0" class="allergy-warning-card">
            <text class="warning-title">⚠️ 过敏提醒</text>
            <view v-for="w in allergyWarnings" :key="w.name" class="warning-item">
              <text class="warning-name">{{ w.name }}</text>
              <text class="warning-desc">{{ w.desc }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 动作按钮 -->
      <RecordActions
        :subject-mode="subjectMode"
        :has-babies="hasBabies"
        :disabled="selectedIngredients.length === 0"
        @record-mother="$emit('record-mother')"
        @record-baby="$emit('record-baby')"
        @record-multiple="$emit('record-multiple')"
      />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import RecordActions from './RecordActions.vue'

const props = defineProps({
  photo: {
    type: String,
    default: null
  },
  ingredients: {
    type: Array,
    required: true // [{ id, emoji, name, selected, isAllergy }]
  },
  allergyWarnings: {
    type: Array,
    default: () => []
  },
  babyAgeText: {
    type: String,
    required: true
  },
  subjectMode: {
    type: String,
    required: true // 'baby' | 'mother'
  },
  hasBabies: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-ingredient', 'remove-ingredient', 'request-add-custom', 'record-mother', 'record-baby', 'record-multiple'])

const selectedIngredients = computed(() =>
  props.ingredients.filter(i => i.selected)
)

function previewPhoto() {
  if (!props.photo) return
  uni.previewImage({
    urls: [props.photo],
    current: props.photo
  })
}
</script>

<style lang="scss" scoped>
.fallback-stage {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.fallback-photo {
  width: 100%;
  flex: 1;
  min-height: 200rpx;
  object-fit: cover;
}

.fallback-card-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.fallback-scroll-container {
  flex: 1;
  min-height: 0;
}

.fallback-card {
  background: #FFFFFF;
  border-radius: 40rpx 40rpx 0 0;
  margin-top: -40rpx;
  padding: 40rpx 40rpx 60rpx;
}

.fallback-header {
  margin-bottom: 32rpx;
}

.fallback-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 8rpx;
}

.fallback-sub {
  display: block;
  font-size: 24rpx;
  color: #999;
}

/* 快速勾选 */
.quick-select-section {
  margin-bottom: 32rpx;
}

.quick-select-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.quick-select-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.quick-select-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 12rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
  border: 2rpx solid transparent;
  position: relative;

  &.selected {
    background: #FFF3E6;
    border-color: #F5A85B;
  }

  &.allergy-item {
    background: #FDEEE9;
    border-color: #E07A5F;
  }
}

.quick-item-emoji {
  font-size: 40rpx;
}

.quick-item-name {
  font-size: 22rpx;
  color: #666;
  text-align: center;
  line-height: 1.3;
}

.quick-select-item.selected .quick-item-name {
  color: #F5A85B;
  font-weight: 600;
}

.quick-allergy-icon {
  font-size: 20rpx;
  position: absolute;
  top: 4rpx;
  right: 4rpx;
}

.selected-check {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 20rpx;
  height: 20rpx;
  background: #A3D9B1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12rpx;
  color: #FFFFFF;
  font-weight: 700;
}

/* 自定义输入 */
.custom-input-area {
  margin-bottom: 32rpx;
}

.custom-input-area :deep(.wd-button) {
  width: 100%;
}

/* 已选食材展示 */
.selected-summary {
  margin-bottom: 32rpx;
}

.selected-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 12rpx;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border-radius: 20rpx;
  background: #F5F5F5;
  font-size: 24rpx;
  color: #666;

  &.allergy-tag {
    background: #FDEEE9;
    color: #E07A5F;
    border: 1rpx solid #E07A5F;
  }
}

.remove-tag {
  color: #C8C8C8;
  cursor: pointer;
  font-weight: bold;
}

.selected-tag:active .remove-tag {
  color: #E07A5F;
}

/* 过敏警告 */
.allergy-warning-card {
  background: #FDEEE9;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  border-left: 6rpx solid #E07A5F;
}

.warning-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #E07A5F;
  display: block;
  margin-bottom: 16rpx;
}

.warning-item {
  margin-bottom: 8rpx;
}

.warning-name { font-size: 26rpx; font-weight: 600; color: #C04B32; }
.warning-desc { font-size: 24rpx; color: #C04B32; margin-left: 8rpx; }
</style>
