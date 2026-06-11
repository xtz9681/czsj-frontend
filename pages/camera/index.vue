<template>
  <view class="camera-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="navBarStyle">
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
    <RecognitionResult
      v-if="stage === 'high-confidence'"
      :photo="capturedPhoto"
      :ingredients="recognizedIngredients"
      :age-warning="ageWarning"
      :allergy-warnings="allergyWarnings"
      :subject-mode="subjectMode"
      :has-babies="userStore.babies.length > 0"
      @toggle-ingredient="toggleIngredient"
      @add-ingredient="showAddIngredient"
      @record-mother="recordToMother"
      @record-baby="recordToBaby"
      @record-multiple="showMultipleSelect"
    />

    <!-- === 状态4：低置信度 — fallback 勾选 === -->
    <IngredientPicker
      v-if="stage === 'low-confidence'"
      :photo="capturedPhoto"
      :ingredients="ageBasedIngredients"
      :allergy-warnings="allergyWarnings"
      :baby-age-text="babyAgeText"
      :subject-mode="subjectMode"
      :has-babies="userStore.babies.length > 0"
      @toggle-ingredient="toggleIngredient"
      @add-custom="handleCustomIngredient"
      @remove-ingredient="removeIngredient"
      @record-mother="recordToMother"
      @record-baby="recordToBaby"
      @record-multiple="showMultipleSelect"
    />

    <!-- 档案选择器 -->
    <SubjectSelector
      ref="subjectSelectorRef"
      :visible="showSubjectSelector"
      :ingredients="pendingIngredients"
      @confirm="onSubjectSelectorConfirm"
      @cancel="showSubjectSelector = false"
    />
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SubjectSelector from '@/components/SubjectSelector.vue'
import RecognitionResult from '@/components/camera/RecognitionResult.vue'
import IngredientPicker from '@/components/camera/IngredientPicker.vue'
import { photoRecord } from '@/api/ai.js'
import { getIngredientsByAge, quickRecord, recordMultiple } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'
import { useMealStore } from '@/store/meal'

const userStore = useUserStore()
const mealStore = useMealStore()
const subjectSelectorRef = ref(null)

// ── 安全区适配 ──────────────────────────────
const systemInfo = uni.getSystemInfoSync()
const menuButton = uni.getMenuButtonBoundingClientRect?.() || null
const safeTop = menuButton
  ? (menuButton.bottom + 8) + 'px'
  : (systemInfo.statusBarHeight + 44) + 'px'
const navBarStyle = computed(() => ({
  paddingTop: safeTop
}))

const stage = ref('init') // init | recognizing | high-confidence | low-confidence
const capturedPhoto = ref('')
const recognizedIngredients = ref([])
const ageWarning = ref(null)
const suggestedSubjectType = ref(null)
const showSubjectSelector = ref(false)
const pendingIngredients = ref([])

const baby = userStore.currentBaby || { ageMonths: 8 }
const allergyList = uni.getStorageSync('allergyList') || []
const subjectMode = ref('baby')

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

onLoad(() => {
  loadAgeIngredients()
  // 从 index 页面获取当前主体模式
  const motherPhase = userStore.mother?.phase
  const pregnancyAndLactationPhases = ['preconception', 'pregnancy_early', 'pregnancy_mid', 'pregnancy_late', 'lactation']

  if (userStore.mother && pregnancyAndLactationPhases.includes(motherPhase)) {
    subjectMode.value = 'mother'
  } else if (motherPhase === 'adult_female' && userStore.currentBabyId && userStore.babies.length > 0) {
    subjectMode.value = 'baby'
  } else if (userStore.currentBabyId && userStore.babies.length > 0) {
    subjectMode.value = 'baby'
  } else {
    subjectMode.value = 'mother'
  }
})

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

// 用于 IngredientPicker 子组件的处理函数
function handleCustomIngredient(name) {
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
}

function removeIngredient(ing) {
  ing.selected = false
}

function getFinalIngredients() {
  return stage.value === 'high-confidence'
    ? recognizedIngredients.value.filter(i => i.selected)
    : selectedIngredients.value
}

function recordToMother() {
  const finalIngredients = getFinalIngredients()
  if (finalIngredients.length === 0) {
    uni.showToast({ title: '请选择至少一种食材~', icon: 'none' })
    return
  }

  // 调用妈妈餐快速记录接口
  const payload = {
    subjectType: 'MOTHER',
    ingredients: finalIngredients.map(i => ({ name: i.name || i, grams: i.amount || 30 })),
    photoKey: pendingRecognition.value?.photoKey || null,
    recognitionId: pendingRecognition.value?.recognitionId || null,
    note: ''
  }

  uni.showLoading({ title: '保存中...' })
  quickRecord(payload)
    .then(() => {
      uni.hideLoading()
      uni.showToast({ title: '保存成功~', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1200)
    })
    .catch(e => {
      uni.hideLoading()
      uni.showToast({ title: e.message || '保存失败，请重试', icon: 'none' })
    })
}

function recordToBaby() {
  const finalIngredients = getFinalIngredients()
  if (finalIngredients.length === 0) {
    uni.showToast({ title: '请选择至少一种食材~', icon: 'none' })
    return
  }

  mealStore.setPendingMeal({
    ingredients: finalIngredients,
    photo: capturedPhoto.value,
    recognitionId: pendingRecognition.value?.recognitionId || null,
    photoKey: pendingRecognition.value?.photoKey || null,
    subjectType: 'BABY'
  })
  uni.navigateTo({ url: '/pages/meal-record/index?from=camera' })
}

function showMultipleSelect() {
  const finalIngredients = getFinalIngredients()
  if (finalIngredients.length === 0) {
    uni.showToast({ title: '请选择至少一种食材~', icon: 'none' })
    return
  }

  pendingIngredients.value = finalIngredients
  showSubjectSelector.value = true
  nextTick(() => {
    subjectSelectorRef.value?.open()
  })
}

function onSubjectSelectorConfirm(selectedSubjectIds) {
  const finalIngredients = getFinalIngredients()

  // 将选中的 ID 转换为 subjects 对象数组
  const subjects = selectedSubjectIds.map(id => {
    if (userStore.mother && id === userStore.mother.id) {
      return { subjectType: 'MOTHER', subjectId: null }
    } else {
      return { subjectType: 'BABY', subjectId: id }
    }
  })

  const payload = {
    subjects,
    ingredients: finalIngredients.map(i => ({ name: i.name || i, grams: i.amount || 30 })),
    photoKey: pendingRecognition.value?.photoKey || null,
    recognitionId: pendingRecognition.value?.recognitionId || null,
    note: ''
  }

  uni.showLoading({ title: '保存中...' })
  recordMultiple(payload)
    .then(() => {
      uni.hideLoading()
      uni.showToast({ title: '保存成功~', icon: 'success' })
      showSubjectSelector.value = false
      setTimeout(() => {
        uni.navigateBack()
      }, 1200)
    })
    .catch(e => {
      uni.hideLoading()
      uni.showToast({ title: e.message || '保存失败，请重试', icon: 'none' })
    })
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
  padding: 0 40rpx 20rpx;
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
</style>
