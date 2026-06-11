<template>
  <view class="result-stage">
    <image :src="photo" class="result-photo" mode="aspectFill" />

    <scroll-view scroll-y class="result-card-scroll">
      <view class="result-card">
        <view class="result-header">
          <text class="result-icon">✅</text>
          <text class="result-title">识别到这些食材</text>
          <text class="result-sub">点击可以调整</text>
        </view>

        <view class="ingredient-tags">
          <view
            v-for="ing in ingredients"
            :key="ing.id"
            class="ingredient-tag"
            :class="{
              selected: ing.selected,
              'allergy-tag': ing.isAllergy
            }"
            @tap="$emit('toggle-ingredient', ing)"
          >
            <text v-if="ing.isAllergy" class="tag-warning">⚠️</text>
            <text>{{ ing.name }}</text>
            <text v-if="ing.selected" class="tag-check">✓</text>
            <text v-else class="tag-remove">✕</text>
          </view>
          <view class="ingredient-tag add-tag" @tap="$emit('add-ingredient')">
            <text>+ 添加</text>
          </view>
        </view>

        <!-- 年龄警告 -->
        <view v-if="ageWarning" class="age-warning-card">
          <text class="warning-title">💡 食材提示</text>
          <text class="warning-text">{{ ageWarning }}</text>
        </view>

        <!-- 过敏预警 -->
        <view v-if="allergyWarnings.length > 0" class="allergy-warning-card">
          <text class="warning-title">⚠️ 过敏提醒</text>
          <view v-for="w in allergyWarnings" :key="w.name" class="warning-item">
            <text class="warning-name">{{ w.name }}</text>
            <text class="warning-desc">{{ w.desc }}</text>
          </view>
        </view>

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
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import RecordActions from './RecordActions.vue'

const props = defineProps({
  photo: {
    type: String,
    required: true
  },
  ingredients: {
    type: Array,
    required: true // [{ id, name, selected, isAllergy }]
  },
  ageWarning: {
    type: String,
    default: null
  },
  allergyWarnings: {
    type: Array,
    default: () => []
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

defineEmits(['toggle-ingredient', 'add-ingredient', 'record-mother', 'record-baby', 'record-multiple'])

const selectedIngredients = computed(() =>
  props.ingredients.filter(i => i.selected)
)
</script>

<style lang="scss" scoped>
.result-stage {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.result-photo {
  width: 100%;
  height: 400rpx;
  flex-shrink: 0;
}

.result-card-scroll {
  flex: 1;
  overflow-y: auto;
  border-radius: 40rpx 40rpx 0 0;
  background: #FFFFFF;
  margin-top: -40rpx;
}

.result-card {
  padding: 40rpx 40rpx 80rpx;
  border-radius: 40rpx 40rpx 0 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 32rpx;
}

.result-icon { font-size: 40rpx; }
.result-title { font-size: 32rpx; font-weight: 700; color: #3D3935; flex: 1; }
.result-sub { font-size: 24rpx; color: #999; }

.ingredient-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.ingredient-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 24rpx;
  border-radius: 32rpx;
  border: 2rpx solid #F0E9DE;
  font-size: 28rpx;
  color: #666;
  background: #F5F5F5;

  &.selected {
    background: #FFF3E6;
    border-color: #F5A85B;
    color: #F5A85B;
    font-weight: 600;
  }

  &.allergy-tag {
    background: #FDEEE9;
    border-color: #E07A5F;
    color: #E07A5F;
  }
}

.add-tag {
  background: transparent;
  border-style: dashed;
  color: #F5A85B;
}

.tag-check { font-size: 22rpx; color: #A3D9B1; font-weight: 700; }
.tag-warning { font-size: 22rpx; }
.tag-remove { font-size: 22rpx; color: #C8C8C8; }

/* 警告卡片 */
.age-warning-card {
  background: #F5F9FF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
}

.age-warning-card .warning-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #4A7FB5;
  display: block;
  margin-bottom: 8rpx;
}

.age-warning-card .warning-text {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.allergy-warning-card {
  background: #FDEEE9;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  border-left: 6rpx solid #E07A5F;
}

.allergy-warning-card .warning-title {
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
