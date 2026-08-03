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
      class="stage-flex"
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
      class="stage-flex"
      :photo="capturedPhoto"
      :ingredients="ageBasedIngredients"
      :allergy-warnings="allergyWarnings"
      :baby-age-text="babyAgeText"
      :subject-mode="subjectMode"
      :has-babies="userStore.babies.length > 0"
      @toggle-ingredient="toggleIngredient"
      @request-add-custom="handleCustomIngredient"
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

    <!-- 自定义食材录入弹窗 -->
    <CustomIngredientDialog
      :visible="showCustomIngredientDialog"
      @confirm="handleCustomIngredientConfirm"
      @cancel="showCustomIngredientDialog = false"
    />
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler.js'
import { useAiDisclaimer } from '@/composables/useAiDisclaimer.js'
import { onLoad } from '@dcloudio/uni-app'
import SubjectSelector from '@/components/SubjectSelector.vue'
import RecognitionResult from '@/components/camera/RecognitionResult.vue'
import IngredientPicker from '@/components/camera/IngredientPicker.vue'
import CustomIngredientDialog from '@/components/CustomIngredientDialog.vue'
import { photoRecord } from '@/api/ai.js'
import { getIngredients, record, createIngredient } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'
import { useMealStore } from '@/store/meal'
import { useSafeArea } from '@/composables/useSafeArea.js'

const userStore = useUserStore()
const mealStore = useMealStore()
const subjectSelectorRef = ref(null)
const { handleError } = useErrorHandler()
const { showAiDisclaimer } = useAiDisclaimer()

// ── 安全区适配 ──────────────────────────────
const { safeTop } = useSafeArea()
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
const showCustomIngredientDialog = ref(false)

const baby = computed(() => userStore.currentBaby || { ageMonths: 8 })
const allergyList = computed(() => userStore.allergyList)
const subjectMode = ref('baby')

const babyAgeText = computed(() => {
  const m = baby.value.ageMonths || 8
  return m < 12 ? `${m} 个月` : `${Math.floor(m / 12)} 岁`
})

// 月龄食材库从后端拉取
const ageBasedIngredients = ref([])

async function loadAgeIngredients() {
  // getIngredients() 是全量食材库查询，不依赖 babyId，无宝宝用户也能加载勾选库
  try {
    const list = await getIngredients()
    ageBasedIngredients.value = (list || []).map(i => ({
      id: i.id,
      emoji: '🥗',
      name: i.name,
      selected: false,
      isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === i.name),
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
  const canProceed = await showAiDisclaimer()
  if (!canProceed) return

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
  const canProceed = await showAiDisclaimer()
  if (!canProceed) return

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
  // babyId 可选：无宝宝用户也调用 AI 识别，后端对无 babyId 情况不做月龄过滤
  const babyId = baby.value?.id || null
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
        isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === name)
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
          isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === i.name)
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
  showCustomIngredientDialog.value = true
}

async function handleCustomIngredientConfirm(e) {
  const { name, category } = e

  // Determine which stage to add to
  if (stage.value === 'high-confidence') {
    // 检查重复（对于高置信度页）
    const exists = recognizedIngredients.value.some(i => i.name === name)
    if (exists) {
      uni.showToast({ title: '食材已存在', icon: 'none' })
      return
    }
  } else if (stage.value === 'low-confidence') {
    // 检查重复（对于低置信度页）
    const exists = ageBasedIngredients.value.some(i => i.name === name)
    if (exists) {
      uni.showToast({ title: '该食材已添加', icon: 'none' })
      return
    }
  }

  // 调用后端入库接口
  try {
    const result = await createIngredient(name, category)
    // 入库成功，添加到对应清单
    if (stage.value === 'high-confidence') {
      recognizedIngredients.value.push({
        id: result.id,
        name: result.name,
        selected: true,
        isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === result.name)
      })
    } else if (stage.value === 'low-confidence') {
      ageBasedIngredients.value.push({
        id: result.id,
        emoji: '🍴',
        name: result.name,
        selected: true,
        isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === result.name)
      })
    }
    showCustomIngredientDialog.value = false
  } catch (error) {
    handleError(error, { fallback: '添加食材失败，请重试' })
  }
}

// 用于 IngredientPicker 子组件的处理函数
function handleCustomIngredient() {
  showCustomIngredientDialog.value = true
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
    uni.showToast({ title: '请先选择食材', icon: 'none' })
    return
  }

  // 调用妈妈餐记录接口
  const payload = {
    subjects: [{ subjectType: 'user', subjectId: userStore.userId }],
    ingredients: finalIngredients.map(i => i.name || i),  // 只传食材名称
    mealType: 'DINNER',  // 妈妈餐默认为晚餐，前端可后续优化
    photoKey: pendingRecognition.value?.photoKey || null,
    recognitionId: pendingRecognition.value?.recognitionId || null,
    note: '',
    source: 'PHOTO'
  }

  uni.showLoading({ title: '保存中...' })
  record(payload)
    .then((res) => {
      uni.hideLoading()
      uni.showToast({ title: '保存成功~', icon: 'success' })
      // 跳转到 meal-record 页展示 AI 评分结果（取第一个档案的 id）
      if (res && res.length > 0 && res[0].id) {
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/meal-record/index?id=' + res[0].id + '&waitScore=1' })
        }, 800)
      } else {
        setTimeout(() => {
          uni.navigateBack()
        }, 1200)
      }
    })
    .catch(e => {
      uni.hideLoading()
      handleError(e, { fallback: '保存失败，请重试' })
    })
}

function recordToBaby() {
  const finalIngredients = getFinalIngredients()
  if (finalIngredients.length === 0) {
    uni.showToast({ title: '请先选择食材', icon: 'none' })
    return
  }

  mealStore.setPendingMeal({
    ingredients: finalIngredients,
    photo: capturedPhoto.value,
    recognitionId: pendingRecognition.value?.recognitionId || null,
    photoKey: pendingRecognition.value?.photoKey || null,
    subjectType: 'baby'
  })
  uni.navigateTo({ url: '/pages/meal-record/index?from=camera' })
}

function showMultipleSelect() {
  const finalIngredients = getFinalIngredients()
  if (finalIngredients.length === 0) {
    uni.showToast({ title: '请先选择食材', icon: 'none' })
    return
  }

  pendingIngredients.value = finalIngredients
  showSubjectSelector.value = true
  nextTick(() => {
    subjectSelectorRef.value?.open()
  })
}

function onSubjectSelectorConfirm(selectedSubjects) {
  const finalIngredients = getFinalIngredients()

  const payload = {
    subjects: selectedSubjects,  // SubjectSelector emit 的 [{subjectType, subjectId}]
    ingredients: finalIngredients.map(i => i.name || i),  // 只传食材名称
    mealType: 'DINNER',  // 从相机记录默认为晚餐
    photoKey: pendingRecognition.value?.photoKey || null,
    recognitionId: pendingRecognition.value?.recognitionId || null,
    note: '',
    source: 'PHOTO'
  }

  uni.showLoading({ title: '保存中...' })
  record(payload)
    .then((res) => {
      uni.hideLoading()
      uni.showToast({ title: '保存成功~', icon: 'success' })
      showSubjectSelector.value = false
      // 跳转到 meal-record 页展示 AI 评分结果（取第一个档案的 id）
      if (res && res.length > 0 && res[0].id) {
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/meal-record/index?id=' + res[0].id + '&waitScore=1' })
        }, 800)
      } else {
        setTimeout(() => {
          uni.navigateBack()
        }, 1200)
      }
    })
    .catch(e => {
      uni.hideLoading()
      handleError(e, { fallback: '保存失败，请重试' })
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #FAF7F2;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40rpx 20rpx;
  background: #FAF7F2;
  flex-shrink: 0;
}

/* 阶段容器 flex 包装 */
.stage-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
