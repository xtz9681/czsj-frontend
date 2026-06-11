<template>
  <view class="page-container">
    <!-- 餐次类型选择 -->
    <view class="meal-type-row">
      <wd-button
        v-for="t in mealTypes"
        :key="t.value"
        :type="form.mealType === t.value ? 'primary' : 'default'"
        @click="form.mealType = t.value"
      >
        <image :src="t.icon" class="meal-type-icon-img" mode="aspectFit" />
        {{ t.label }}
      </wd-button>
    </view>

    <!-- 已从相机带入的图片 -->
    <view v-if="form.photo" class="photo-preview">
      <image :src="form.photo" class="photo-img" mode="aspectFill" />
      <view class="photo-remove" @tap="form.photo = ''">✕</view>
    </view>

    <!-- 食材列表 -->
    <view class="section-title-row">
      <text class="section-title">食材清单</text>
      <text class="section-count">{{ form.ingredients.length }} 种</text>
    </view>

    <!-- 已选食材 -->
    <view class="ingredient-list card" v-if="form.ingredients.length > 0">
      <view
        class="ingredient-row"
        v-for="(ing, idx) in form.ingredients"
        :key="ing.id"
      >
        <text v-if="ing.isAllergy" class="row-allergy-icon">⚠️</text>
        <text class="row-emoji">{{ ing.emoji || '🍴' }}</text>
        <text class="row-name" :class="{ 'text-danger': ing.isAllergy }">{{ ing.name }}</text>
        <view class="row-amount">
          <view class="amount-btn" @tap="changeAmount(idx, -5)">-</view>
          <text class="amount-val">{{ ing.amount }}g</text>
          <view class="amount-btn" @tap="changeAmount(idx, 5)">+</view>
        </view>
        <view class="row-remove" @tap="removeIngredient(idx)">✕</view>
      </view>
    </view>

    <!-- 添加食材入口 -->
    <view class="add-ingredient-row card" @tap="showIngredientPicker">
      <text class="add-icon">＋</text>
      <text class="add-text">添加食材</text>
    </view>

    <!-- 过敏警告 -->
    <view v-if="allergyWarnings.length > 0" class="allergy-block">
      <text class="allergy-block-title">⚠️ 过敏提醒</text>
      <view v-for="w in allergyWarnings" :key="w.name" class="allergy-block-item">
        <text class="allergy-name">{{ w.name }}</text>
        <text class="allergy-desc">{{ w.desc }}</text>
      </view>
    </view>

    <!-- 备注 -->
    <view class="note-area">
      <wd-input
        v-model="form.note"
        type="textarea"
        placeholder="备注这顿的情况，比如宝宝吃得很开心～"
        :maxlength="200"
        show-word-limit
      />
    </view>

    <!-- 记给谁 -->
    <view class="subject-select-area">
      <view class="subject-select-header">
        <text class="subject-select-title">记给谁</text>
        <view v-if="showSubjectSelectorBtn" class="subject-select-more" @tap="openSubjectSelector">
          <text>更多 ›</text>
        </view>
      </view>
      <view class="subject-tags">
        <view
          v-if="!useMultipleSubjects"
          class="subject-tag active"
        >
          <text>{{ currentTargetLabel }}</text>
        </view>
        <view
          v-for="label in selectedSubjectLabels"
          v-else
          :key="label"
          class="subject-tag active"
        >
          <text>{{ label }}</text>
        </view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <wd-button type="primary" @click="saveMeal" :loading="saving" block round>
      {{ useMultipleSubjects && selectedSubjectIds.length > 0 ? `保存到 ${selectedSubjectIds.length} 个档案` : (scoreResult ? '重新评分' : '保存并获取 AI 评分') }}
    </wd-button>

    <!-- AI 营养评分结果 -->
    <view v-if="scoreResult" class="score-result card">
      <view class="score-header">
        <view class="score-circle" :class="getScoreClass(scoreResult.score)">
          <text class="score-num">{{ scoreResult.score }}</text>
          <text class="score-unit">分</text>
        </view>
        <view class="score-summary">
          <text class="score-label">AI 营养评分</text>
          <text class="score-grade">{{ getScoreGrade(scoreResult.score) }}</text>
        </view>
      </view>

      <!-- 营养覆盖 -->
      <view class="nutrient-check-list">
        <view
          v-for="n in scoreResult.nutrients"
          :key="n.key"
          class="nutrient-check-item"
        >
          <text class="nutrient-icon">{{ n.icon }}</text>
          <text class="nutrient-name">{{ n.name }}</text>
          <text class="nutrient-status" :class="n.ok ? 'status-ok' : 'status-miss'">
            {{ n.ok ? '✓' : '○' }}
          </text>
        </view>
      </view>

      <!-- AI 建议 -->
      <view class="ai-suggestion">
        <text class="suggestion-title">💡 小建议</text>
        <text class="suggestion-text">{{ scoreResult.suggestion }}</text>
      </view>

      <text class="disclaimer">AI 评分仅供参考，不构成医疗建议，请咨询专业人员</text>
    </view>

    <SubjectSelector
      ref="subjectSelectorRef"
      :visible="showSubjectSelector"
      :ingredients="form.ingredients"
      @confirm="onSubjectSelectorConfirm"
      @cancel="showSubjectSelector = false"
    />

    <!-- 食材选择弹窗 -->
    <view v-if="showIngredientSheet" class="ingredient-sheet-mask" @tap="showIngredientSheet = false">
      <view class="ingredient-sheet" @tap.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-title">选择食材</text>

        <!-- 搜索框 -->
        <view class="search-bar">
          <wd-input
            v-model="ingredientSearch"
            placeholder="搜索食材..."
            clearable
            prefix-icon="search"
          />
        </view>

        <!-- 最近常用 -->
        <view v-if="frequentIngredients.length > 0" class="frequent-section">
          <text class="frequent-title">最近常用</text>
          <scroll-view scroll-x class="frequent-scroll">
            <view class="frequent-list">
              <view
                v-for="item in frequentIngredients"
                :key="item.name"
                class="frequent-chip"
                @tap="selectIngredient(item)"
              >
                <text>{{ item.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 分类 tab -->
        <scroll-view scroll-x class="category-tabs">
          <view class="category-tab-list">
            <view
              v-for="cat in ingredientCategories"
              :key="cat"
              class="category-tab"
              :class="{ active: selectedCategory === cat }"
              @tap="selectedCategory = cat"
            >{{ cat }}</view>
          </view>
        </scroll-view>

        <!-- 食材列表 -->
        <scroll-view scroll-y class="ingredient-grid" style="max-height: 500rpx;">
          <view
            v-for="item in filteredIngredients"
            :key="item.name"
            class="ingredient-option"
            :class="{ 'allergy-option': item.allergyRisk === 'high' }"
            @tap="selectIngredient(item)"
          >
            <text class="option-name">{{ item.name }}</text>
            <text v-if="item.allergyRisk === 'high'" class="option-allergy">⚠️</text>
            <text class="option-brief">{{ item.nutritionBrief }}</text>
          </view>
          <view v-if="filteredIngredients.length === 0" class="empty-search">
            <text>没有找到相关食材</text>
          </view>
        </scroll-view>

        <!-- 自定义输入 -->
        <view class="custom-input-row">
          <wd-input v-model="customIngredientName" placeholder="没找到？手动输入食材名" />
          <wd-button size="small" type="primary" @click="addCustomIngredient" :disabled="!customIngredientName">添加</wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import SubjectSelector from '@/components/SubjectSelector.vue'
import { quickRecord, recordMultiple, getIngredientsByAge, getFrequentIngredients } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()
const subjectSelectorRef = ref(null)
const showSubjectSelector = ref(false)
const useMultipleSubjects = ref(false)
const selectedSubjectIds = ref([])

const saving = ref(false)
const scoreResult = ref(null)

// 食材选择相关
const showIngredientSheet = ref(false)
const ingredientSearch = ref('')
const selectedCategory = ref('全部')
const allIngredients = ref([])
const frequentIngredients = ref([])
const customIngredientName = ref('')

const form = ref({
  mealType: 'breakfast',
  ingredients: [],
  note: '',
  photo: ''
})

const mealTypes = [
  { value: 'breakfast', icon: '/static/icons/meal-breakfast.png', label: '早餐' },
  { value: 'lunch', icon: '/static/icons/meal-lunch.png', label: '午餐' },
  { value: 'dinner', icon: '/static/icons/meal-dinner.png', label: '晚餐' },
  { value: 'snack', icon: '/static/icons/meal-snack.png', label: '加餐' },
]

const allergyList = uni.getStorageSync('allergyList') || []

const allergyWarnings = computed(() =>
  form.value.ingredients.filter(i => i.isAllergy).map(i => ({
    name: i.name,
    desc: i.allergyDesc || '宝宝之前有过敏反应，请谨慎添加'
  }))
)

const ingredientCategories = computed(() => {
  const cats = [...new Set(allIngredients.value.map(i => i.category).filter(Boolean))]
  return ['全部', ...cats]
})

const filteredIngredients = computed(() => {
  let list = allIngredients.value
  if (selectedCategory.value !== '全部') {
    list = list.filter(i => i.category === selectedCategory.value)
  }
  if (ingredientSearch.value) {
    const keyword = ingredientSearch.value.toLowerCase()
    list = list.filter(i => i.name.toLowerCase().includes(keyword))
  }
  return list
})

const showSubjectSelectorBtn = computed(() => userStore.babies.length > 1 || !!userStore.mother)

const currentTargetLabel = computed(() => {
  const baby = userStore.currentBaby
  if (baby?.id) {
    return `${baby.gender === 'female' ? '👧' : '👦'} ${baby.name}`
  }
  if (userStore.mother) {
    return '🤱 妈妈'
  }
  return '未选择'
})

const selectedSubjectLabels = computed(() => {
  return selectedSubjectIds.value.map(id => {
    if (userStore.mother && id === userStore.mother.id) {
      return '🤱 妈妈'
    }
    const baby = userStore.babies.find(b => b.id === id)
    if (baby) {
      return `${baby.gender === 'female' ? '👧' : '👦'} ${baby.name}`
    }
    return ''
  }).filter(Boolean)
})

onLoad((options) => {
  // 从拍照页带入的食材
  if (options?.from === 'camera') {
    const pending = uni.getStorageSync('pendingMeal')
    if (pending?.ingredients) {
      form.value.ingredients = pending.ingredients.map(i => ({ ...i, amount: 30 }))
      form.value.photo = pending.photo || ''
    }
    uni.removeStorageSync('pendingMeal')
  }
  // 从首页点击带入的单个食材
  if (options?.ingredient) {
    // 从首页食材快捷入口进入，暂不自动填充（食材库接口需要 babyId）
  }
})

onBackPress(() => {
  // 判断用户是否已填写了内容
  const hasContent = form.value.ingredients.length > 0 || form.value.note || form.value.photo

  if (hasContent && !scoreResult.value) {
    uni.showModal({
      title: '提示',
      content: '当前记录尚未保存，确定要离开吗？',
      confirmText: '离开',
      cancelText: '继续填写',
      confirmColor: '#E07A5F',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack()
        }
      }
    })
    return true  // 阻止默认返回
  }
  return false  // 没填内容或已保存，正常返回
})

function changeAmount(idx, delta) {
  const cur = form.value.ingredients[idx].amount || 30
  form.value.ingredients[idx].amount = Math.max(5, cur + delta)
}

function removeIngredient(idx) {
  form.value.ingredients.splice(idx, 1)
  scoreResult.value = null
}

async function showIngredientPicker() {
  showIngredientSheet.value = true
  if (allIngredients.value.length === 0) {
    try {
      const list = await getIngredientsByAge()
      allIngredients.value = list || []
    } catch (e) {
      uni.showToast({ title: '加载食材库失败', icon: 'none' })
    }
  }
  // 加载常用食材
  loadFrequentIngredients()
}

async function loadFrequentIngredients() {
  const userStore = useUserStore()
  const baby = userStore.currentBaby
  const mother = userStore.mother

  if (!baby?.id && !mother?.id) return

  try {
    const subject = baby ? { subjectId: baby.id, subjectType: 'BABY' } : { subjectId: mother.id, subjectType: 'MOTHER' }
    const list = await getFrequentIngredients(subject.subjectId, subject.subjectType)
    // 过滤掉已经在 form.ingredients 中的食材
    const selectedNames = form.value.ingredients.map(i => i.name)
    frequentIngredients.value = (list || []).filter(item => !selectedNames.includes(item.name))
  } catch (e) {
    // 静默处理
  }
}

function selectIngredient(item) {
  // 检查是否已添加
  const exists = form.value.ingredients.find(i => i.name === item.name)
  if (exists) {
    uni.showToast({ title: '已添加过该食材', icon: 'none' })
    return
  }
  form.value.ingredients.push({
    id: item.name,
    name: item.name,
    emoji: '🍴',
    amount: 30,
    isAllergy: item.allergyRisk === 'high'
  })
  scoreResult.value = null
  // 从常用列表中移除
  frequentIngredients.value = frequentIngredients.value.filter(i => i.name !== item.name)
  showIngredientSheet.value = false
  ingredientSearch.value = ''
}

function addCustomIngredient() {
  if (!customIngredientName.value) return
  const name = customIngredientName.value.trim()
  const exists = form.value.ingredients.find(i => i.name === name)
  if (exists) {
    uni.showToast({ title: '已添加过该食材', icon: 'none' })
    return
  }
  form.value.ingredients.push({
    id: name,
    name: name,
    emoji: '🍴',
    amount: 30,
    isAllergy: false
  })
  scoreResult.value = null
  customIngredientName.value = ''
  showIngredientSheet.value = false
}

function openSubjectSelector() {
  showSubjectSelector.value = true
  nextTick(() => {
    subjectSelectorRef.value?.open()
  })
}

function onSubjectSelectorConfirm(ids) {
  selectedSubjectIds.value = ids
  useMultipleSubjects.value = true
  showSubjectSelector.value = false
}

async function saveMeal() {
  if (form.value.ingredients.length === 0) {
    uni.showToast({ title: '先添加食材吧~', icon: 'none' })
    return
  }

  if (useMultipleSubjects.value && selectedSubjectIds.value.length > 0) {
    saving.value = true
    try {
      const pending = uni.getStorageSync('pendingMeal') || {}
      const subjects = selectedSubjectIds.value.map(id => {
        if (userStore.mother && id === userStore.mother.id) {
          return { subjectType: 'MOTHER', subjectId: null }
        }
        return { subjectType: 'BABY', subjectId: id }
      })

      const payload = {
        subjects,
        ingredients: form.value.ingredients.map(i => ({ name: i.name, grams: i.amount || 30 })),
        photoKey: pending.photoKey || null,
        recognitionId: pending.recognitionId || null,
        note: form.value.note || ''
      }

      await recordMultiple(payload)
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1200)
    } catch (e) {
      uni.showToast({ title: e.message || '保存时遇到了点小问题~', icon: 'none' })
    } finally {
      saving.value = false
    }
    return
  }

  const baby = userStore.currentBaby
  if (!baby?.id) {
    uni.showToast({ title: '请先完善宝宝档案~', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const pending = uni.getStorageSync('pendingMeal') || {}
    const payload = {
      babyId: baby.id,
      subjectType: 'BABY',
      mealType: form.value.mealType.toUpperCase(),
      ingredients: form.value.ingredients.map(i => ({ name: i.name, grams: i.amount || 30 })),
      note: form.value.note || '',
      photoKey: pending.photoKey || null,
      recognitionId: pending.recognitionId || null,
      source: pending.recognitionId ? 'PHOTO' : 'MANUAL'
    }
    const res = await quickRecord(payload)
    scoreResult.value = buildScoreResult(res)
    uni.showToast({ title: '已保存，评分出来了！', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存时遇到了点小问题~', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function buildScoreResult(res) {
  if (!res.aiScore) return null
  return {
    score: res.aiScore,
    nutrients: [],
    suggestion: res.aiFeedback || ''
  }
}

function getScoreClass(score) {
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-ok'
  return 'score-low'
}

function getScoreGrade(score) {
  if (score >= 90) return '优秀！营养均衡 🌟'
  if (score >= 80) return '不错！继续保持~'
  if (score >= 60) return '还可以，稍作调整'
  return '食材种类可以再丰富一些'
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 0 40rpx calc(80rpx + constant(safe-area-inset-bottom));
  padding: 0 40rpx calc(80rpx + env(safe-area-inset-bottom));
}

.meal-type-row {
  display: flex;
  gap: 16rpx;
  padding: 32rpx 0 24rpx;
}

.meal-type-icon-img {
  width: 40rpx;
  height: 40rpx;
  margin-right: 8rpx;
}

.meal-type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  border-radius: 16rpx;
  background: #FFFFFF;
  border: 3rpx solid transparent;
  font-size: 26rpx;
  color: #999;
  gap: 6rpx;

  &.active {
    border-color: #F5A85B;
    background: #FFF3E6;
    color: #F5A85B;
    font-weight: 600;
  }

  text:first-child { font-size: 36rpx; }
}

.photo-preview {
  position: relative;
  margin-bottom: 24rpx;
}

.photo-img {
  width: 100%;
  height: 280rpx;
  border-radius: 16rpx;
}

.photo-remove {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  background: rgba(0,0,0,0.4);
  color: #FFFFFF;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.section-title { font-size: 30rpx; font-weight: 700; color: #3D3935; }
.section-count { font-size: 26rpx; color: #999; }

.ingredient-list {
  margin-bottom: 16rpx;
  overflow: hidden;
  padding: 0;
}

.ingredient-row {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  gap: 12rpx;
  border-bottom: 1rpx solid #F0E9DE;

  &:last-child { border-bottom: none; }
}

.row-allergy-icon { font-size: 28rpx; flex-shrink: 0; }
.row-emoji { font-size: 36rpx; flex-shrink: 0; }
.row-name { font-size: 28rpx; color: #3D3935; flex: 1; }
.text-danger { color: #E07A5F; font-weight: 600; }

.row-amount {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.amount-btn {
  width: 48rpx;
  height: 48rpx;
  background: #F5F5F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #555;
  flex-shrink: 0;
}

.amount-val { font-size: 26rpx; color: #666; min-width: 64rpx; text-align: center; }

.row-remove {
  font-size: 28rpx;
  color: #C8C8C8;
  flex-shrink: 0;
  padding: 8rpx;
}

.add-ingredient-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
}

.add-icon { font-size: 36rpx; color: #F5A85B; }
.add-text { font-size: 28rpx; color: #F5A85B; font-weight: 600; }

.allergy-block {
  background: #FDEEE9;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border-left: 6rpx solid #E07A5F;
}

.allergy-block-title { display: block; font-size: 28rpx; font-weight: 700; color: #E07A5F; margin-bottom: 12rpx; }
.allergy-block-item { margin-bottom: 4rpx; }
.allergy-name { font-size: 26rpx; font-weight: 600; color: #C04B32; }
.allergy-desc { font-size: 24rpx; color: #C04B32; margin-left: 8rpx; }

.note-area {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  margin-bottom: 24rpx;
}

.subject-select-area {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  margin-bottom: 32rpx;
}

.subject-select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.subject-select-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
}

.subject-select-more {
  font-size: 24rpx;
  color: #F5A85B;
}

.subject-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.subject-tag {
  border-radius: 24rpx;
  padding: 8rpx 24rpx;
  font-size: 24rpx;

  &.active {
    background: #F5A85B;
    color: #FFFFFF;
  }
}

.note-input {
  width: 100%;
  font-size: 28rpx;
  color: #3D3935;
  min-height: 80rpx;
}

.input-placeholder { color: #C8C8C8; }

.score-result {
  margin-top: 32rpx;
}

.score-header {
  display: flex;
  align-items: center;
  gap: 28rpx;
  margin-bottom: 32rpx;
}

.score-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.score-good { background: #E8F8EE; }
  &.score-ok { background: #FFF3E6; }
  &.score-low { background: #FDEEE9; }
}

.score-num {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1;

  .score-good & { color: #5CB87A; }
  .score-ok & { color: #F5A85B; }
  .score-low & { color: #E07A5F; }
}

.score-unit { font-size: 22rpx; color: #999; }

.score-label { display: block; font-size: 26rpx; color: #999; margin-bottom: 8rpx; }
.score-grade { display: block; font-size: 30rpx; font-weight: 700; color: #3D3935; }

.nutrient-check-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.nutrient-check-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #F5F5F5;
  border-radius: 24rpx;
  padding: 10rpx 20rpx;
}

.nutrient-icon { font-size: 28rpx; }
.nutrient-name { font-size: 24rpx; color: #555; }
.nutrient-status { font-size: 24rpx; font-weight: 700; }
.status-ok { color: #5CB87A; }
.status-miss { color: #C8C8C8; }

.ai-suggestion {
  background: #F5F9FF;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
}

.suggestion-title { display: block; font-size: 26rpx; font-weight: 700; color: #4A7FB5; margin-bottom: 10rpx; }
.suggestion-text { font-size: 26rpx; color: #555; line-height: 1.8; }

.disclaimer {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #C8C8C8;
  line-height: 1.6;
}

/* 食材选择弹窗 */
.ingredient-sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.ingredient-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.sheet-handle {
  width: 80rpx;
  height: 8rpx;
  background: #E0E0E0;
  border-radius: 4rpx;
  margin: 0 auto 24rpx;
}

.sheet-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #3D3935;
  padding: 0 24rpx 24rpx;
}

.search-bar {
  padding: 16rpx 24rpx;
}

.category-tabs {
  white-space: nowrap;
  padding: 0 24rpx 16rpx;
}

.category-tab-list {
  display: flex;
  gap: 16rpx;
}

.category-tab {
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background: #F5F5F5;
  font-size: 24rpx;
  color: #666;
  flex-shrink: 0;
  &.active {
    background: #F5A85B;
    color: white;
  }
}

.ingredient-grid {
  padding: 0 24rpx;
  flex: 1;
  overflow-y: auto;
}

.ingredient-option {
  display: flex;
  align-items: center;
  padding: 20rpx 16rpx;
  border-bottom: 1rpx solid #F0E9DE;
  gap: 12rpx;
  &:active {
    background: #FFF5EB;
  }
}

.option-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.option-allergy {
  font-size: 24rpx;
}

.option-brief {
  font-size: 22rpx;
  color: #999;
  margin-left: auto;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.allergy-option {
  background: #FFF5F0;
}

.empty-search {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

.custom-input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 16rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
}

/* 最近常用 */
.frequent-section {
  padding: 16rpx 24rpx;
}

.frequent-title {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.frequent-scroll {
  white-space: nowrap;
}

.frequent-list {
  display: flex;
  gap: 12rpx;
}

.frequent-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #FFF5E6;
  color: #F5A85B;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
