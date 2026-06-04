<template>
  <view class="page-container" style="padding: 0 40rpx 60rpx;">
    <view class="header-tip">
      <text class="tip-title">{{ isEdit ? '修改宝宝档案' : '先来认识一下小宝贝~' }}</text>
      <text class="tip-sub">{{ isEdit ? '随时可以更新哦' : '填写正确月龄，AI 推荐才准确' }}</text>
    </view>

    <!-- 头像 -->
    <view class="avatar-area" @tap="chooseAvatar">
      <image v-if="form.avatar" :src="form.avatar" class="avatar-img" mode="aspectFill" />
      <view v-else class="avatar-placeholder">
        <text class="avatar-icon">👶</text>
      </view>
      <view class="avatar-badge">📷</view>
    </view>

    <!-- 表单 -->
    <view class="form-card card">
      <!-- 宝宝阶段 -->
      <view class="form-item">
        <text class="form-label">宝贝当前阶段</text>
        <view class="phase-row">
          <view
            v-for="p in babyPhaseOptions"
            :key="p.value"
            class="phase-chip"
            :class="{ active: form.phase === p.value }"
            @tap="form.phase = p.value"
          >{{ p.label }}</view>
        </view>
      </view>
      <view class="divider"></view>

      <!-- 姓名/昵称 -->
      <view class="form-item">
        <text class="form-label">宝贝叫什么</text>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="给宝宝起个昵称"
          placeholder-class="input-placeholder"
          maxlength="10"
        />
      </view>
      <view class="divider"></view>

      <!-- 性别 -->
      <view class="form-item">
        <text class="form-label">宝贝性别</text>
        <view class="gender-group">
          <view
            class="gender-btn"
            :class="{ active: form.gender === 'male' }"
            @tap="form.gender = 'male'"
          >
            <text>👦 男宝</text>
          </view>
          <view
            class="gender-btn"
            :class="{ active: form.gender === 'female' }"
            @tap="form.gender = 'female'"
          >
            <text>👧 女宝</text>
          </view>
        </view>
      </view>
      <view class="divider"></view>

      <!-- 出生日期 -->
      <view class="form-item">
        <text class="form-label">出生日期</text>
        <picker mode="date" :value="form.birthday" :end="today" @change="onBirthdayChange">
          <view class="picker-value" :class="{ placeholder: !form.birthday }">
            <text>{{ form.birthday || '点击选择出生日期' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 身高 -->
      <view class="form-item">
        <text class="form-label">身高</text>
        <view class="input-inline">
          <input class="num-input" type="digit" v-model="form.heightCm" placeholder="如 65" />
          <text class="unit">cm</text>
        </view>
      </view>
      <view class="divider"></view>

      <!-- 体重 -->
      <view class="form-item">
        <text class="form-label">体重</text>
        <view class="input-inline">
          <input class="num-input" type="digit" v-model="form.weightG" placeholder="如 8500" />
          <text class="unit">g</text>
        </view>
      </view>
      <view class="divider"></view>

      <!-- 幼儿期（toddler）专属字段 -->
      <view v-if="isToddler">
        <view class="form-item">
          <text class="form-label">宝宝已断母乳</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.babyWeaned === 1 }" @tap="form.babyWeaned = 1">是</view>
            <view class="bool-btn" :class="{ active: form.babyWeaned === 0 }" @tap="form.babyWeaned = 0">否</view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">食物不耐受/过敏</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.foodIntolerance === 1 }" @tap="form.foodIntolerance = 1">有</view>
            <view class="bool-btn" :class="{ active: form.foodIntolerance === 0 }" @tap="form.foodIntolerance = 0">无</view>
          </view>
        </view>
      </view>
      <view v-if="ageMonths >= 0" class="age-badge">
        <text>宝宝现在 </text>
        <text class="age-num">{{ displayAge }}</text>
        <text v-if="ageMonths < 6" class="age-tip"> · 辅食还没开始哦，6 个月后再记录~</text>
        <text v-else-if="ageMonths > 24" class="age-tip"> · 宝宝已经过了辅食期，加油~</text>
      </view>
    </view>

    <!-- 保存按钮 -->
    <button class="btn-primary" @tap="saveBaby" :loading="saving">
      {{ isEdit ? '保存修改' : '开始记录吧~' }}
    </button>

    <!-- 跳过（仅新建时） -->
    <text v-if="!isEdit" class="skip-btn" @tap="skipToHome">先去看看再说</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createBaby, updateBaby } from '@/api/baby.js'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()
const isEdit = ref(false)
const saving = ref(false)
const today = new Date().toISOString().split('T')[0]

const form = ref({
  id: null,
  name: '',
  gender: 'male',
  birthday: '',
  avatar: '',
  phase: 'weaning',
  heightCm: null,
  weightG: null,
  babyWeaned: 0,
  foodIntolerance: 0
})

const isToddler = computed(() => form.value.phase === 'toddler')

const babyPhaseOptions = [
  { value: 'nursing', label: '哺乳期（0-6月）' },
  { value: 'weaning', label: '辅食期（6-24月）' },
  { value: 'toddler', label: '幼儿期（24-36月）' },
]

const ageMonths = computed(() => {
  if (!form.value.birthday) return -1
  const birth = new Date(form.value.birthday)
  const now = new Date()
  return Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30.4))
})

const displayAge = computed(() => {
  const months = ageMonths.value
  if (months < 0) return ''
  if (months < 12) return `${months} 个月`
  const years = Math.floor(months / 12)
  const remainMonths = months % 12
  return remainMonths > 0 ? `${years} 岁 ${remainMonths} 个月` : `${years} 岁`
})

onLoad((options) => {
  if (options?.babyId || options?.edit) {
    isEdit.value = true
    const targetId = options?.babyId ? Number(options.babyId) : null
    const baby = targetId
      ? userStore.babies.find(b => b.id === targetId)
      : userStore.currentBaby
    if (baby) form.value = { ...baby }
  }
})

function onBirthdayChange(e) {
  form.value.birthday = e.detail.value
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      form.value.avatar = res.tempFilePaths[0]
      // TODO: 上传图片到 OSS，将返回 URL 赋给 form.avatar
    }
  })
}

async function saveBaby() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '给宝宝起个昵称吧~', icon: 'none' })
    return
  }
  if (!form.value.birthday) {
    uni.showToast({ title: '填一下出生日期，AI 评分更准确~', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      gender: form.value.gender,
      birthday: form.value.birthday,
      phase: form.value.phase || 'weaning',
      heightCm: form.value.heightCm ? Number(form.value.heightCm) : null,
      weightG: form.value.weightG ? Number(form.value.weightG) : null,
      babyWeaned: form.value.babyWeaned,
      foodIntolerance: form.value.foodIntolerance
    }
    let savedBaby
    if (isEdit.value) {
      savedBaby = await updateBaby(form.value.id, payload)
    } else {
      savedBaby = await createBaby(payload)
    }

    // 更新 store（store 内部同步 storage）
    if (isEdit.value) {
      userStore.updateBaby(savedBaby)
    } else {
      userStore.addBaby(savedBaby)
    }

    uni.showToast({ title: isEdit.value ? '修改成功~' : '太棒了，开始记录吧！', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 1200)
  } catch (e) {
    uni.showToast({ title: e.message || '保存时出了点问题~', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function skipToHome() {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.header-tip {
  padding: 60rpx 0 40rpx;
  text-align: center;
}

.tip-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 12rpx;
}

.tip-sub {
  font-size: 26rpx;
  color: #999;
}

.avatar-area {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
  position: relative;
  width: 160rpx;
  margin-left: auto;
  margin-right: auto;
}

.avatar-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid #F0E9DE;
}

.avatar-placeholder {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #FFF3E6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 72rpx;
}

.avatar-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 52rpx;
  height: 52rpx;
  background: #F5A85B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  border: 3rpx solid #FAF7F2;
}

.form-card {
  margin-bottom: 48rpx;
}

.form-item {
  padding: 24rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: 30rpx;
  color: #3D3935;
  font-weight: 500;
  flex-shrink: 0;
  width: 180rpx;
}

.form-input {
  flex: 1;
  text-align: right;
  font-size: 30rpx;
  color: #3D3935;
}

.input-placeholder {
  color: #C8C8C8;
}

.gender-group {
  display: flex;
  gap: 16rpx;
}

.gender-btn {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  border: 2rpx solid #F0E9DE;
  font-size: 26rpx;
  color: #999;
  background: #FAFAFA;

  &.active {
    border-color: #F5A85B;
    color: #F5A85B;
    background: #FFF3E6;
    font-weight: 600;
  }
}

.picker-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 30rpx;
  color: #3D3935;

  &.placeholder {
    color: #C8C8C8;
  }
}

.picker-arrow {
  font-size: 40rpx;
  color: #C8C8C8;
  margin-left: 8rpx;
}

.age-badge {
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  color: #666;
  margin-top: 8rpx;
  line-height: 1.6;
}

.age-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #F5A85B;
}

.age-tip {
  color: #A3D9B1;
}

.skip-btn {
  display: block;
  text-align: center;
  color: #C8C8C8;
  font-size: 26rpx;
  margin-top: 24rpx;
  padding: 16rpx;
}

.divider {
  height: 1rpx;
  background: #F0E9DE;
  margin: 0 -16rpx;
}

.bool-row {
  display: flex;
  gap: 12rpx;
}

.bool-btn {
  flex: 1;
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  border: 2rpx solid #F0E9DE;
  font-size: 26rpx;
  color: #999;
  background: #FAFAFA;
  text-align: center;

  &.active {
    border-color: #F5A85B;
    color: #F5A85B;
    background: #FFF3E6;
    font-weight: 600;
  }
}

.input-inline {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.num-input {
  flex: 1;
  text-align: right;
  font-size: 30rpx;
  color: #3D3935;
}

.unit {
  color: #999;
  font-size: 26rpx;
}
</style>
