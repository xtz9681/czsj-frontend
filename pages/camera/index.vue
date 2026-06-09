<template>
  <view class="camera-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">‹</view>
      <text class="nav-title">拍照识食材</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- === 状态1：初始拍照界面 === -->
    <view v-if="stage === 'init'" class="init-stage">
      <!-- 相机区域 -->
      <view class="camera-area" @tap="takePhoto">
        <view class="camera-frame">
          <view class="corner tl"></view>
          <view class="corner tr"></view>
          <view class="corner bl"></view>
          <view class="corner br"></view>
          <view class="camera-hint">
            <text class="camera-hint-icon">📸</text>
            <text class="camera-hint-text">点击拍照或选择相册</text>
          </view>
        </view>
      </view>

      <view class="init-actions">
        <wd-button type="primary" block @click="takePhoto">
          📷 拍照
        </wd-button>
        <wd-button block @click="chooseFromAlbum">
          🖼️ 相册
        </wd-button>
      </view>

      <view class="divider-row">
        <view class="divider-line"></view>
        <text class="divider-text">或者</text>
        <view class="divider-line"></view>
      </view>

      <view class="manual-entry" @tap="goManual">
        <text class="manual-text">✍️ 直接手动选择食材</text>
      </view>
    </view>

    <!-- === 状态2：识别中 === -->
    <view v-if="stage === 'recognizing'" class="recognizing-stage">
      <image :src="capturedPhoto" class="preview-img" mode="aspectFit" />
      <view class="recognizing-overlay">
        <view class="loading-ring"></view>
        <text class="recognizing-text">AI 正在识别食材，稍等一下~</text>
      </view>
    </view>

    <!-- === 状态3：高置信度 — 直接展示识别结果 === -->
    <view v-if="stage === 'high-confidence'" class="result-stage">
      <image :src="capturedPhoto" class="result-photo" mode="aspectFill" />

      <scroll-view class="result-card-scroll">
        <view class="result-card">
          <view class="result-header">
            <text class="result-icon">✅</text>
            <text class="result-title">识别到这些食材</text>
            <text class="result-sub">点击可以调整</text>
          </view>

          <view class="ingredient-tags">
            <view
              v-for="ing in recognizedIngredients"
              :key="ing.id"
              class="ingredient-tag"
              :class="{
                selected: ing.selected,
                'allergy-tag': ing.isAllergy
              }"
              @tap="toggleIngredient(ing)"
            >
              <text v-if="ing.isAllergy" class="tag-warning">⚠️</text>
              <text>{{ ing.name }}</text>
              <text v-if="ing.selected" class="tag-check">✓</text>
              <text v-else class="tag-remove">✕</text>
            </view>
            <view class="ingredient-tag add-tag" @tap="showAddIngredient">
              <text>+ 添加</text>
            </view>
          </view>

          <!-- 年龄警告（如果有） -->
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
          <view class="action-buttons">
            <wd-button type="primary" @click="confirmIngredients" block round>
              继续记为宝宝餐
            </wd-button>
            <wd-button
              v-if="ageWarning || suggestedSubjectType === 'MOTHER'"
              @click="confirmAsMotherMeal"
              block
              round
              :type="suggestedSubjectType === 'MOTHER' ? 'primary' : 'default'"
            >
              记为我的营养
            </wd-button>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- === 状态4：低置信度 — fallback 勾选 === -->
    <view v-if="stage === 'low-confidence'" class="fallback-stage">
      <image v-if="capturedPhoto" :src="capturedPhoto" class="fallback-photo" mode="aspectFill" />

      <view class="fallback-card">
        <view class="fallback-header">
          <text class="fallback-title">📸 这一餐看起来是辅食～</text>
          <text class="fallback-sub">帮我确认下用了什么食材？</text>
        </view>

        <!-- 月龄常用食材（快速勾选） -->
        <view class="quick-select-section">
          <text class="quick-select-title">{{ babyAgeText }}常用食材</text>
          <view class="quick-select-grid">
            <view
              v-for="ing in ageBasedIngredients"
              :key="ing.id"
              class="quick-select-item"
              :class="{
                selected: ing.selected,
                'allergy-item': ing.isAllergy
              }"
              @tap="toggleIngredient(ing)"
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
          <wd-input
            v-model="customIngredient"
            placeholder="输入其他食材名称"
            clearable
            @confirm="addCustomIngredient"
          />
          <wd-button @click="addCustomIngredient" type="primary">添加</wd-button>
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
              <text class="remove-tag" @tap="removeIngredient(ing)">✕</text>
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

        <wd-button
          type="primary"
          :disabled="selectedIngredients.length === 0"
          @click="confirmIngredients"
          block
          round
        >
          {{ selectedIngredients.length > 0 ? '确认，去看营养评分' : '请至少选一种食材' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { photoRecord } from '@/api/ai.js'
import { getIngredientsByAge } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'

const stage = ref('init') // init | recognizing | high-confidence | low-confidence
const capturedPhoto = ref('')
const customIngredient = ref('')
const recognizedIngredients = ref([])
const ageWarning = ref(null)
const suggestedSubjectType = ref(null)

const baby = useUserStore().currentBaby || { ageMonths: 8 }
const allergyList = uni.getStorageSync('allergyList') || []

const babyAgeText = computed(() => {
  const m = baby.ageMonths || 8
  return m < 12 ? `${m} 个月` : `${Math.floor(m / 12)} 岁`
})

// 月龄食材库从后端拉取
const ageBasedIngredients = ref([])

async function loadAgeIngredients() {
  if (!baby?.id) return
  try {
    const list = await getIngredientsByAge(baby.id)
    ageBasedIngredients.value = (list || []).map(i => ({
      id: i.id,
      emoji: '🥗',
      name: i.name,
      selected: false,
      isAllergy: allergyList.some(a => a.name === i.name),
      allergyDesc: ''
    }))
  } catch (e) {
    // 后端失败时降级为空列表，用户可手动输入
  }
}

onLoad(() => { loadAgeIngredients() })

const selectedIngredients = computed(() =>
  ageBasedIngredients.value.filter(i => i.selected)
)

const allergyWarnings = computed(() => {
  const selected = stage.value === 'high-confidence'
    ? recognizedIngredients.value.filter(i => i.selected)
    : selectedIngredients.value
  return selected.filter(i => i.isAllergy).map(i => ({
    name: i.name,
    desc: i.allergyDesc || '宝宝之前有过敏反应，请谨慎添加'
  }))
})


async function takePhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera'],
    success: async (res) => {
      capturedPhoto.value = res.tempFilePaths[0]
      await startRecognition(capturedPhoto.value)
    }
  })
}

async function chooseFromAlbum() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success: async (res) => {
      capturedPhoto.value = res.tempFilePaths[0]
      await startRecognition(capturedPhoto.value)
    }
  })
}

// 保存后端返回的 recognitionId 和 photoKey，提交记录时带上
const pendingRecognition = ref(null)

async function startRecognition(filePath) {
  stage.value = 'recognizing'
  const babyId = baby.id
  if (!babyId) {
    stage.value = 'low-confidence'
    return
  }
  try {
    const result = await photoRecord(filePath, babyId)
    pendingRecognition.value = { recognitionId: result.recognitionId, photoKey: result.photoKey }

    // 保存年龄警告和建议的记录归属
    ageWarning.value = result.ageWarning || null
    suggestedSubjectType.value = result.suggestedSubjectType || null

    // 只要 recognized 不为空，就展示高置信度页面（即使有 ageWarning）
    if ((result.recognized && result.recognized.length > 0) && (result.mode === 'confirm' || result.mode === 'review')) {
      recognizedIngredients.value = (result.recognized || []).map((name, idx) => ({
        id: idx,
        name,
        selected: true,
        isAllergy: allergyList.some(a => (a.name || a.ingredientName) === name)
      }))
      stage.value = 'high-confidence'
    } else {
      // fallback：低置信度或无识别结果，展示月龄勾选
      if (result.ageIngredients?.length) {
        ageBasedIngredients.value = result.ageIngredients.map((i, idx) => ({
          id: idx,
          emoji: i.emoji || '🍴',
          name: i.name,
          selected: false,
          isAllergy: allergyList.some(a => (a.name || a.ingredientName) === i.name)
        }))
      }
      stage.value = 'low-confidence'
    }
  } catch (e) {
    // 配额不足时 e.message 是友好提示，其他错误无缝 fallback
    if (e.message?.includes('次数')) {
      uni.showToast({ title: e.message, icon: 'none' })
    }
    stage.value = 'low-confidence'
  }
}

function toggleIngredient(ing) {
  ing.selected = !ing.selected
}

function showAddIngredient() {
  uni.showModal({
    title: '添加食材',
    editable: true,
    placeholderText: '输入食材名称',
    success(res) {
      if (res.confirm && res.content?.trim()) {
        recognizedIngredients.value.push({
          id: Date.now(),
          name: res.content.trim(),
          selected: true,
          isAllergy: allergyList.some(a => a.name === res.content.trim())
        })
      }
    }
  })
}

function addCustomIngredient() {
  const name = customIngredient.value.trim()
  if (!name) return
  if (ageBasedIngredients.value.some(i => i.name === name)) {
    uni.showToast({ title: '食材已在列表里了~', icon: 'none' })
    return
  }
  ageBasedIngredients.value.push({
    id: Date.now(),
    emoji: '🍴',
    name,
    selected: true,
    isAllergy: allergyList.some(a => a.name === name)
  })
  customIngredient.value = ''
}

function removeIngredient(ing) {
  ing.selected = false
}

function confirmIngredients() {
  const finalIngredients = stage.value === 'high-confidence'
    ? recognizedIngredients.value.filter(i => i.selected)
    : selectedIngredients.value

  if (finalIngredients.length === 0) {
    uni.showToast({ title: '请选择至少一种食材~', icon: 'none' })
    return
  }

  // 将数据传递给记一餐页
  uni.setStorageSync('pendingMeal', {
    ingredients: finalIngredients,
    photo: capturedPhoto.value,
    recognitionId: pendingRecognition.value?.recognitionId || null,
    photoKey: pendingRecognition.value?.photoKey || null,
    subjectType: 'BABY'  // 默认记为宝宝餐
  })
  uni.navigateTo({ url: '/pages/meal-record/index?from=camera' })
}

function confirmAsMotherMeal() {
  const finalIngredients = recognizedIngredients.value.filter(i => i.selected)

  if (finalIngredients.length === 0) {
    uni.showToast({ title: '请选择至少一种食材~', icon: 'none' })
    return
  }

  // TODO: 调用妈妈餐快速记录接口（后端同步补）
  // 接口规范参考：/api/mother-meal/quick-record （待定）
  // 参数示例：
  // {
  //   ingredients: [{ name, grams }],
  //   photoKey: recognitionId.photoKey,
  //   recognitionId: recognitionId.recognitionId,
  //   note: ''
  // }

  uni.showToast({ title: '妈妈餐记录接口待后端补充~', icon: 'none' })
}

function goManual() {
  stage.value = 'low-confidence'
  capturedPhoto.value = ''
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.camera-page {
  min-height: 100vh;
  background: #FAF7F2;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 88rpx 40rpx 20rpx;
  background: #FAF7F2;
}

.nav-back {
  font-size: 52rpx;
  color: #3D3935;
  width: 80rpx;
  line-height: 1;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #3D3935;
}

.nav-placeholder { width: 80rpx; }

/* 初始拍照界面 */
.init-stage {
  padding: 40rpx;
}

.camera-area {
  width: 100%;
  aspect-ratio: 1;
  background: #F0EAE0;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  overflow: hidden;
}

.camera-frame {
  position: relative;
  width: 85%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  border-color: #F5A85B;
  border-style: solid;

  &.tl { top: 0; left: 0; border-width: 4rpx 0 0 4rpx; }
  &.tr { top: 0; right: 0; border-width: 4rpx 4rpx 0 0; }
  &.bl { bottom: 0; left: 0; border-width: 0 0 4rpx 4rpx; }
  &.br { bottom: 0; right: 0; border-width: 0 4rpx 4rpx 0; }
}

.camera-hint {
  text-align: center;
}

.camera-hint-icon { font-size: 80rpx; display: block; margin-bottom: 20rpx; }
.camera-hint-text { font-size: 28rpx; color: #999; }

.init-actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.init-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
}

.primary-btn {
  background: #F5A85B;
  color: #FFFFFF;
}

.secondary-btn {
  background: #FFFFFF;
  color: #F5A85B;
  border: 2rpx solid #F5A85B;
}

.divider-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.divider-line { flex: 1; height: 1rpx; background: #F0E9DE; }
.divider-text { font-size: 26rpx; color: #C8C8C8; }

.manual-entry {
  text-align: center;
  padding: 24rpx;
}

.manual-text { font-size: 28rpx; color: #F5A85B; }

/* 识别中 */
.recognizing-stage {
  position: relative;
}

.preview-img {
  width: 100%;
  height: 500rpx;
}

.recognizing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.loading-ring {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid rgba(255,255,255,0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.recognizing-text {
  font-size: 28rpx;
  color: #FFFFFF;
}

/* 高置信度结果 */
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
  color: #555;
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

/* fallback 手动勾选 */
.fallback-stage {
  display: flex;
  flex-direction: column;
}

.fallback-photo {
  width: 100%;
  height: 240rpx;
}

.fallback-card {
  background: #FFFFFF;
  border-radius: 40rpx 40rpx 0 0;
  margin-top: -40rpx;
  padding: 40rpx 40rpx 60rpx;
  flex: 1;
}

.fallback-header {
  margin-bottom: 32rpx;
}

.fallback-title { display: block; font-size: 32rpx; font-weight: 700; color: #3D3935; margin-bottom: 8rpx; }
.fallback-sub { font-size: 26rpx; color: #999; }

.quick-select-title {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}

.quick-select-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.quick-select-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc((100% - 48rpx) / 4);
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 20rpx 8rpx;
  border: 3rpx solid transparent;

  &.selected {
    border-color: #F5A85B;
    background: #FFF3E6;
  }

  &.allergy-item {
    border-color: #E07A5F;
    background: #FDEEE9;
  }
}

.quick-item-emoji { font-size: 44rpx; margin-bottom: 6rpx; }
.quick-item-name { font-size: 22rpx; color: #3D3935; text-align: center; }
.quick-allergy-icon { font-size: 20rpx; position: absolute; top: 8rpx; right: 8rpx; }

.selected-check {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 32rpx;
  height: 32rpx;
  background: #F5A85B;
  border-radius: 50%;
  font-size: 20rpx;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-input-area {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.custom-input {
  flex: 1;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  height: 80rpx;
  font-size: 28rpx;
  color: #3D3935;
}

.input-placeholder { color: #C8C8C8; }

.custom-add-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 12rpx;
  padding: 0 32rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.selected-summary {
  margin-bottom: 32rpx;
}

.selected-title { font-size: 26rpx; color: #999; display: block; margin-bottom: 16rpx; }

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #FFF3E6;
  border: 2rpx solid #F5A85B;
  border-radius: 24rpx;
  padding: 10rpx 20rpx;
  font-size: 26rpx;
  color: #F5A85B;

  &.allergy-tag {
    background: #FDEEE9;
    border-color: #E07A5F;
    color: #E07A5F;
  }
}

.remove-tag { color: #C8C8C8; margin-left: 4rpx; }

/* 年龄警告卡 */
.age-warning-card {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border-left: 6rpx solid #F5A85B;
}

.warning-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #F5A85B;
  display: block;
  margin-bottom: 12rpx;
}

.warning-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 动作按钮组 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
</style>
