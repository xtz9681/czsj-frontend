<template>
  <view v-if="visible" class="selector-mask" @tap="handleMaskTap">
    <view class="selector-sheet" @tap.stop>
      <view class="sheet-header">
        <text class="sheet-title">这顿饭要记到哪些档案？</text>
        <view class="sheet-close" @tap="onCancel">✕</view>
      </view>

      <scroll-view scroll-y class="selector-body">
        <!-- 妈妈档案 -->
        <view v-if="mother" class="subject-item">
          <view class="subject-checkbox">
            <view
              class="checkbox"
              :class="{ checked: selectedSubjects.includes(mother.id) }"
              @tap="toggleSubject(mother.id)"
            >
              <text v-if="selectedSubjects.includes(mother.id)">✓</text>
            </view>
          </view>
          <view class="subject-info">
            <text class="subject-name">{{ motherPhaseLabel }}</text>
            <text class="subject-sub">我的营养</text>
          </view>
        </view>

        <!-- 孩子档案 -->
        <view v-for="baby in babies" :key="baby.id" class="subject-item">
          <view class="subject-checkbox">
            <view
              class="checkbox"
              :class="{ checked: selectedSubjects.includes(baby.id) }"
              @tap="toggleSubject(baby.id)"
            >
              <text v-if="selectedSubjects.includes(baby.id)">✓</text>
            </view>
          </view>
          <view class="subject-info">
            <text class="subject-name">{{ baby.name }}</text>
            <text class="subject-sub">{{ babyPhaseLabel(baby) }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="sheet-footer">
        <view class="action-btn secondary" @tap="onCancel">
          <text>取消</text>
        </view>
        <view class="action-btn primary" @tap="!isChecking && onConfirm()">
          <text>{{ isChecking ? '检查中...' : '确认记录' }}</text>
        </view>
      </view>
    </view>

    <!-- nursing 孩子警告弹层 -->
    <view v-if="showNursingWarning" class="warning-modal-mask" @tap.stop>
      <view class="warning-modal" @tap.stop>
        <text class="warning-modal-title">⚠️ 提示</text>
        <text class="warning-modal-content">{{ nursingWarningText }}</text>
        <wd-button type="primary" @click="closeNursingWarning" block round>确定</wd-button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { checkMultiRecordWarning } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  ingredients: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const userStore = useUserStore()
const mother = computed(() => userStore.mother)
const babies = computed(() => userStore.babies)

const selectedSubjects = ref([])
const showNursingWarning = ref(false)
const nursingWarningText = ref('')
const isChecking = ref(false)

const motherPhaseLabel = computed(() => {
  const phaseMap = {
    preconception: '备孕期',
    pregnancy_early: '孕早期',
    pregnancy_mid: '孕中期',
    pregnancy_late: '孕晚期',
    lactation: '哺乳期',
    adult_female: '日常营养'
  }
  return phaseMap[mother.value?.phase] || '妈妈档案'
})

function babyPhaseLabel(baby) {
  if (!baby.birthday) return baby.name
  const months = Math.floor((Date.now() - new Date(baby.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.4))
  if (months < 12) return `${months} 个月`
  const years = Math.floor(months / 12)
  const remainMonths = months % 12
  return remainMonths > 0 ? `${years} 岁 ${remainMonths} 个月` : `${years} 岁`
}

function toggleSubject(id) {
  const idx = selectedSubjects.value.indexOf(id)
  if (idx > -1) {
    selectedSubjects.value.splice(idx, 1)
  } else {
    selectedSubjects.value.push(id)
  }
}

function handleMaskTap() {
  onCancel()
}

function onCancel() {
  selectedSubjects.value = []
  emit('cancel')
}

function closeNursingWarning() {
  showNursingWarning.value = false
}

async function onConfirm() {
  if (selectedSubjects.value.length === 0) {
    uni.showToast({ title: '请至少选择一个档案', icon: 'none' })
    return
  }

  isChecking.value = true
  try {
    // 调用后端 suitability 检查接口
    const res = await checkMultiRecordWarning({
      subjectIds: selectedSubjects.value,
      ingredients: props.ingredients.map(i => ({ name: i.name || i }))
    })

    if (res.hasWarning && res.warningMessage) {
      // 有 nursing 孩子警告，先弹提示
      nursingWarningText.value = res.warningMessage
      showNursingWarning.value = true
      return
    }

    // 没有警告或用户已确认，直接提交
    emit('confirm', selectedSubjects.value)
    selectedSubjects.value = []
  } catch (e) {
    uni.showToast({ title: e.message || '检查失败，请重试', icon: 'none' })
  } finally {
    isChecking.value = false
  }
}

// 初始化时默认选中妈妈档案
defineExpose({
  open() {
    selectedSubjects.value = mother.value ? [mother.value.id] : []
  }
})
</script>

<style lang="scss" scoped>
.selector-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.selector-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow: hidden;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 40rpx;
  border-bottom: 1rpx solid #F0E9DE;
}

.sheet-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #3D3935;
}

.sheet-close {
  font-size: 32rpx;
  color: #C8C8C8;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.subject-item {
  display: flex;
  align-items: center;
  padding: 24rpx 40rpx;
  border-bottom: 1rpx solid #F0E9DE;

  &:last-child {
    border-bottom: none;
  }
}

.subject-checkbox {
  margin-right: 20rpx;
}

.checkbox {
  width: 48rpx;
  height: 48rpx;
  border: 2rpx solid #F5A85B;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  font-size: 28rpx;
  color: #F5A85B;

  &.checked {
    background: #F5A85B;
    color: #FFFFFF;
  }
}

.subject-info {
  flex: 1;
}

.subject-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 4rpx;
}

.subject-sub {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.sheet-footer {
  padding: 24rpx 40rpx 40rpx;
  border-top: 1rpx solid #F0E9DE;
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  transition: all 0.3s ease;

  &.primary {
    background: #F5A85B;
    color: #FFFFFF;

    &:active {
      opacity: 0.8;
      transform: scale(0.98);
    }
  }

  &.secondary {
    background: #FFFFFF;
    color: #F5A85B;
    border: 2rpx solid #F5A85B;

    &:active {
      background: #FFF9F5;
      transform: scale(0.98);
    }
  }
}

/* nursing 警告弹层 */
.warning-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-modal {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 80%;
  max-width: 600rpx;
}

.warning-modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 20rpx;
}

.warning-modal-content {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 32rpx;
}
</style>
