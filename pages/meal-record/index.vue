<template>
  <view class="page-container">
    <!-- 今日已记录（新建模式时显示，供快速编辑） -->
    <view v-if="todayMeals.length > 0 && !editingMealId" class="today-meals-section">
      <view class="today-header">
        <text class="today-title">今日记录</text>
        <text class="today-count">{{ todayMeals.length }} 餐</text>
      </view>
      <scroll-view scroll-x class="today-scroll">
        <view class="today-list">
          <view
            v-for="meal in todayMeals"
            :key="meal.id"
            class="today-card card"
            @tap="editTodayMeal(meal)"
          >
            <view class="today-card-header">
              <text class="today-meal-type">{{ getMealTypeLabel(meal.mealType) }}</text>
              <text class="today-time">{{ meal.time }}</text>
            </view>
            <view class="today-ingredients">
              <text v-for="(ing, i) in meal.ingredients" :key="i" class="today-ing-tag">
                {{ ing }}{{ i < meal.ingredients.length - 1 ? '、' : '' }}
              </text>
              <text v-if="meal.ingredients.length === 0" class="today-no-ing">无食材</text>
            </view>
            <view v-if="meal.score" class="today-score" :class="getScoreClass(meal.score)">
              {{ meal.score }}分
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 编辑模式提示 -->
    <view v-if="editingMealId" class="editing-banner">
      <text class="editing-text">正在编辑今日记录</text>
      <view class="editing-cancel" @tap="cancelEdit">取消</view>
    </view>

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

    <!-- AI 文字拆食材 -->
    <view class="ai-parse-card card">
      <view class="ai-parse-header">
        <text class="ai-parse-title">不知道有哪些食材？让 AI 帮你拆</text>
      </view>
      <wd-input
        v-model="foodDescription"
        type="textarea"
        placeholder="说说这餐吃了什么，比如：中午吃了番茄炒蛋和一碗米饭"
        :maxlength="200"
        show-word-limit
        class="ai-parse-input"
      />
      <view v-if="lowConfidenceWarning" class="low-confidence-tip">
        <text>描述有点模糊，识别结果可能不准，记得核对下食材清单</text>
      </view>
      <view v-if="newIngredientsAdded.length > 0" class="new-ingredients-tip">
        <text>已把 {{ newIngredientsAdded.join('、') }} 加入食材库</text>
      </view>
      <wd-button
        size="small"
        type="primary"
        :disabled="!foodDescription.trim()"
        :loading="parsing"
        @click="parseByAi"
        class="ai-parse-btn"
      >
        AI 帮我拆食材
      </wd-button>
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

    <!-- 保存按钮（已保存等待评分时隐藏，避免重复提交） -->
    <wd-button v-if="!savedMealId && !isScoring" type="primary" @click="saveMeal" :loading="saving" block round>
      {{ editingMealId ? '更新记录' : (useMultipleSubjects && selectedSubjectIds.length > 0 ? `保存到 ${selectedSubjectIds.length} 个档案` : (scoreResult ? '重新评分' : '保存并获取 AI 评分')) }}
    </wd-button>

    <!-- 评分加载状态 -->
    <view v-if="isScoring" class="scoring-loading">
      <text>🤖 AI 正在评分中...</text>
    </view>

    <!-- 评分超时提示 -->
    <view v-if="scoreTimeout && !scoreResult" class="score-timeout card">
      <text class="timeout-text">AI 评分稍慢，可稍后在餐食列表中查看结果</text>
      <wd-button type="primary" size="small" round @click="uni.navigateBack()">返回首页</wd-button>
    </view>

    <!-- 服务端返回的交叉过敏预警 -->
    <view v-if="serverAllergyWarnings.length > 0" class="allergy-block">
      <view v-for="(warning, idx) in serverAllergyWarnings" :key="idx">
        <text>{{ warning }}</text>
      </view>
    </view>

    <!-- AI 营养评分结果 -->
    <view v-if="scoreResult" class="score-result card anim-fade-in-up">
      <view class="score-header">
        <view class="score-circle anim-scale-in" :class="getScoreClass(scoreResult.score)">
          <text class="score-num anim-count-up">{{ scoreResult.score }}</text>
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

      <wd-button type="primary" round block @click="uni.navigateBack()">完成</wd-button>
    </view>

    <SubjectSelector
      ref="subjectSelectorRef"
      :visible="showSubjectSelector"
      :ingredients="form.ingredients"
      @confirm="onSubjectSelectorConfirm"
      @cancel="showSubjectSelector = false"
    />

    <!-- 自定义食材录入弹窗 -->
    <CustomIngredientDialog
      :visible="showCustomIngredientDialog"
      @confirm="handleCustomIngredientConfirm"
      @cancel="showCustomIngredientDialog = false"
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
      <wd-button size="small" type="primary" block @click="showCustomIngredientDialog = true">＋ 手动添加新食材</wd-button>
    </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import SubjectSelector from '@/components/SubjectSelector.vue'
import CustomIngredientDialog from '@/components/CustomIngredientDialog.vue'
import { record, getIngredients, getFrequentIngredients, getMealById, getMealList, updateMeal, parseFoodText, createIngredient } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'
import { useMealStore } from '@/store/meal'
import { useErrorHandler } from '@/composables/useErrorHandler.js'
import { useAiDisclaimer } from '@/composables/useAiDisclaimer.js'

const userStore = useUserStore()
const mealStore = useMealStore()
const { handleError } = useErrorHandler()
const { showAiDisclaimer } = useAiDisclaimer()
const subjectSelectorRef = ref(null)
const showSubjectSelector = ref(false)
const useMultipleSubjects = ref(false)
const selectedSubjectIds = ref([])

const saving = ref(false)
const scoreResult = ref(null)
const pollingTimer = ref(null)
const pollingStartTime = ref(0)
const isScoring = ref(false)
// 已保存的餐食 ID（保存后等待评分时置位，用于隐藏保存按钮、标识只读等待状态）
const savedMealId = ref(null)
// 评分轮询超时标记（30s 未返回评分时置位，展示超时提示）
const scoreTimeout = ref(false)

// 服务端返回的交叉过敏预警
const serverAllergyWarnings = ref([])

// 今日已记录列表（用于快速编辑）
const todayMeals = ref([])
// 当前正在编辑的今日记录 ID
const editingMealId = ref(null)

// 食材选择相关
const showIngredientSheet = ref(false)
const ingredientSearch = ref('')
const selectedCategory = ref('全部')
const allIngredients = ref([])
const frequentIngredients = ref([])
const showCustomIngredientDialog = ref(false)

// AI 文字拆食材相关
const foodDescription = ref('')
const parsing = ref(false)
const usedAiParse = ref(false)
const lowConfidenceWarning = ref(false)
const newIngredientsAdded = ref([])

const form = ref({
  mealType: 'breakfast',
  ingredients: [],
  note: '',
  photo: '',
  recognitionId: null,
  photoKey: null
})

const mealTypes = [
  { value: 'breakfast', icon: '/static/icons/meal-breakfast.png', label: '早餐' },
  { value: 'lunch', icon: '/static/icons/meal-lunch.png', label: '午餐' },
  { value: 'dinner', icon: '/static/icons/meal-dinner.png', label: '晚餐' },
  { value: 'snack', icon: '/static/icons/meal-snack.png', label: '加餐' },
]

const allergyList = computed(() => useUserStore().allergyList)

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
  const subject = userStore.currentSubject
  if (!subject) return '未选择'
  if (subject.subjectType === 'baby') {
    return `${subject.gender === 'female' ? '👧' : '👦'} ${subject.name}`
  }
  return '🤱 妈妈'
})

const selectedSubjectLabels = computed(() => {
  return selectedSubjectIds.value.map(item => {
    const id = item.subjectId || item
    if (item.subjectType === 'user' || id === userStore.userId) {
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
  // 等待评分模式：从 camera 直接保存后跳转过来，展示 AI 评分结果
  if (options?.id && options?.waitScore === '1') {
    savedMealId.value = options.id
    loadMealData(options.id).then(() => {
      // 加载后若还没有评分，自动开始轮询
      if (!scoreResult.value) {
        pollScoreResult(options.id)
      }
    })
  }
  // 编辑已有的餐食记录
  else if (options?.id) {
    loadMealData(options.id)
  }
  // 从拍照页带入的食材
  else if (options?.from === 'camera') {
    const pending = mealStore.clearPendingMeal()
    if (pending?.ingredients) {
      form.value.ingredients = pending.ingredients
      form.value.photo = pending.photo || ''
      form.value.recognitionId = pending.recognitionId || null
      form.value.photoKey = pending.photoKey || null
    }
  }
  // 从首页点击带入的单个食材
  else if (options?.ingredient) {
    // 从首页食材快捷入口进入，暂不自动填充（食材库接口需要 babyId）
  }
  // 新建记录：加载今日已记录列表供快速编辑
  else {
    loadTodayMeals()
  }
})

onBackPress(() => {
  // 判断用户是否已填写了内容
  const hasContent = form.value.ingredients.length > 0 || form.value.note || form.value.photo

  if (hasContent && !scoreResult.value && !savedMealId.value) {
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

onUnmounted(() => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
  }
})

function removeIngredient(idx) {
  form.value.ingredients.splice(idx, 1)
  scoreResult.value = null
}

async function showIngredientPicker() {
  showIngredientSheet.value = true
  if (allIngredients.value.length === 0) {
    try {
      const list = await getIngredients()
      allIngredients.value = list || []
    } catch (e) {
      handleError(e, { fallback: '操作失败，请稍后重试' })
    }
  }
  // 加载常用食材
  loadFrequentIngredients()
}

async function loadFrequentIngredients() {
  const baby = userStore.currentBaby
  const mother = userStore.mother

  if (!baby?.id && !mother?.id) return

  try {
    // USER 类型的 subjectId 存的是 userId（非 mothers.id）
    const subject = baby ? { subjectId: baby.id, subjectType: 'baby' } : { subjectId: userStore.userId, subjectType: 'user' }
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
    uni.showToast({ title: '该食材已添加', icon: 'none' })
    return
  }
  form.value.ingredients.push({
    id: item.name,
    name: item.name,
    emoji: '🍴',
    isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === item.name)
  })
  scoreResult.value = null
  // 从常用列表中移除
  frequentIngredients.value = frequentIngredients.value.filter(i => i.name !== item.name)
  showIngredientSheet.value = false
  ingredientSearch.value = ''
}

async function handleCustomIngredientConfirm(e) {
  const { name, category } = e

  // 检查重复
  const exists = form.value.ingredients.find(i => i.name === name)
  if (exists) {
    uni.showToast({ title: '食材已存在', icon: 'none' })
    return
  }

  // 调用后端入库接口
  try {
    const result = await createIngredient(name, category)
    // 入库成功，添加到清单
    form.value.ingredients.push({
      id: result.id,
      name: result.name,
      emoji: '🍴',
      isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === result.name)
    })
    scoreResult.value = null
    showCustomIngredientDialog.value = false
  } catch (error) {
    handleError(error, { fallback: '添加食材失败，请重试' })
  }
}

async function parseByAi() {
  // 1. 先显示 AI 免责声明
  const canProceed = await showAiDisclaimer()
  if (!canProceed) return

  // 2. 检查输入
  const desc = foodDescription.value.trim()
  if (!desc) {
    uni.showToast({ title: '先说说这餐吃了什么吧', icon: 'none' })
    return
  }

  // 3. 调用 API
  parsing.value = true
  lowConfidenceWarning.value = false
  newIngredientsAdded.value = []

  try {
    const result = await parseFoodText(desc)
    const { recognized, newIngredients, confidence } = result

    // 标记已使用 AI 拆解（接口成功返回即算使用）
    usedAiParse.value = true

    // 4. 追加食材到清单，去重
    let addedCount = 0

    recognized.forEach(name => {
      const exists = form.value.ingredients.find(i => i.name === name)
      if (!exists) {
        form.value.ingredients.push({
          id: name,
          name,
          emoji: '🍴',
          isAllergy: allergyList.value.some(a => (a.ingredientName || a.name) === name)
        })
        addedCount++
      }
    })

    // 5. 清空评分（食材变了）
    scoreResult.value = null

    // 6. 显示提示
    if (addedCount === 0) {
      uni.showToast({ title: '这些食材已经在清单里了', icon: 'none' })
    } else {
      uni.showToast({ title: `已添加 ${addedCount} 种食材`, icon: 'success' })
    }

    // 7. 新食材库提示
    if (newIngredients && newIngredients.length > 0) {
      newIngredientsAdded.value = newIngredients
      // 2 秒后自动清除提示
      setTimeout(() => {
        newIngredientsAdded.value = []
      }, 2000)
    }

    // 8. 低置信度警告
    if (confidence === 'low') {
      lowConfidenceWarning.value = true
    }

    // 9. 清空输入
    foodDescription.value = ''
  } catch (e) {
    handleError(e, { fallback: 'AI 拆解失败，请稍后再试或手动选择食材' })
  } finally {
    parsing.value = false
  }
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

async function loadMealData(mealId) {
  try {
    const meal = await getMealById(mealId)
    if (!meal) {
      handleError(new Error('餐食不存在'), { fallback: '餐食不存在' })
      return
    }

    // 填充表单数据
    form.value.mealType = (meal.mealType || 'breakfast').toLowerCase()
    form.value.ingredients = (meal.ingredients || []).map(i => {
      const name = typeof i === 'string' ? i : (i.name || i)
      const matched = allergyList.value.find(a => (a.ingredientName || a.name) === name)
      return {
        id: typeof i === 'string' ? i : (i.id || name),
        name,
        emoji: '🍴',
        isAllergy: !!matched,
        allergyDesc: matched?.note || ''
      }
    })
    form.value.note = meal.note || ''
    form.value.photo = meal.signedPhotoUrl || ''
    form.value.photoKey = null
    form.value.recognitionId = null

    // 如果已有评分，直接显示
    if (meal.aiScore !== null && meal.aiScore !== undefined) {
      scoreResult.value = {
        score: meal.aiScore,
        suggestion: meal.aiFeedback || '',
        nutrients: [],
        improvements: meal.improvements || []
      }
    }
  } catch (e) {
    handleError(e, { fallback: '加载餐食数据失败，请稍后重试' })
  }
}

/**
 * 加载今日已记录的餐食列表，用于快速编辑
 * 仅在非编辑模式下调用（新建记录时显示今日已有记录）
 */
async function loadTodayMeals() {
  const subject = userStore.currentSubject
  if (!subject?.id) return

  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  try {
    const list = await getMealList(subject.id, subject.subjectType, 0, 10, dateStr, dateStr)
    todayMeals.value = (list || []).map(m => {
      // 解析 ISO 时间并转换为本地时间
      let timeStr = ''
      if (m.mealTime) {
        const mealDate = new Date(m.mealTime)
        timeStr = `${String(mealDate.getHours()).padStart(2, '0')}:${String(mealDate.getMinutes()).padStart(2, '0')}`
      }
      return {
        id: m.id,
        mealType: (m.mealType || 'BREAKFAST').toLowerCase(),
        time: timeStr,
        ingredients: (m.ingredients || []).slice(0, 3).map(i => typeof i === 'string' ? i : i.name),
        score: m.aiScore || null
      }
    })
  } catch (e) {
    // 今日列表是辅助功能，加载失败静默处理
    todayMeals.value = []
  }
}

/**
 * 点击今日记录卡片，进入编辑模式
 */
function editTodayMeal(meal) {
  editingMealId.value = meal.id
  loadMealData(meal.id)
}

/**
 * 重置 AI 拆食材相关状态
 */
function resetAiParseState() {
  usedAiParse.value = false
  foodDescription.value = ''
  lowConfidenceWarning.value = false
  newIngredientsAdded.value = []
}

/**
 * 取消编辑今日记录，重置表单
 */
function cancelEdit() {
  editingMealId.value = null
  form.value = {
    mealType: 'breakfast',
    ingredients: [],
    note: '',
    photo: '',
    recognitionId: null,
    photoKey: null
  }
  scoreResult.value = null
  resetAiParseState()
}

/**
 * 获取餐次类型标签
 */
function getMealTypeLabel(type) {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
  return map[type] || type
}

async function pollScoreResult(mealId) {
  isScoring.value = true
  pollingStartTime.value = Date.now()

  pollingTimer.value = setInterval(async () => {
    try {
      const meal = await getMealById(mealId)
      if (meal && meal.aiScore !== null && meal.aiScore !== undefined) {
        clearInterval(pollingTimer.value)
        pollingTimer.value = null
        isScoring.value = false
        scoreResult.value = {
          score: meal.aiScore,
          suggestion: meal.aiFeedback || '',
          nutrients: [],
          improvements: meal.improvements || []
        }
      } else if (Date.now() - pollingStartTime.value > 30000) {
        clearInterval(pollingTimer.value)
        pollingTimer.value = null
        isScoring.value = false
        scoreTimeout.value = true
      }
    } catch (e) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
      isScoring.value = false
    }
  }, 3000)
}

async function saveMeal() {
  if (form.value.ingredients.length === 0) {
    uni.showToast({ title: '请先添加食材', icon: 'none' })
    return
  }

  saving.value = true
  try {
    // 编辑模式：更新已有记录
    if (editingMealId.value) {
      const updatePayload = {
        ingredients: form.value.ingredients.map(i => i.name),
        mealType: form.value.mealType.toUpperCase(),
        note: form.value.note || '',
        photoKey: form.value.photoKey || null
      }
      await updateMeal(editingMealId.value, updatePayload)
      uni.showToast({ title: '更新成功', icon: 'success' })

      // 刷新今日列表并退出编辑模式
      editingMealId.value = null
      await loadTodayMeals()

      // 重置表单
      form.value = {
        mealType: 'breakfast',
        ingredients: [],
        note: '',
        photo: '',
        recognitionId: null,
        photoKey: null
      }
      scoreResult.value = null
      resetAiParseState()
      return
    }

    // 确定提交的档案列表
    let subjects = []

    if (useMultipleSubjects.value && selectedSubjectIds.value.length > 0) {
      // 多档案模式：SubjectSelector emit 的 [{subjectType, subjectId}]
      subjects = selectedSubjectIds.value
    } else {
      // 单档案模式：使用当前主体
      const subject = userStore.currentSubject
      if (!subject?.id) {
        uni.showToast({ title: '请先添加档案', icon: 'none' })
        saving.value = false
        return
      }
      subjects = [{ subjectType: subject.subjectType, subjectId: subject.id }]
    }

    // 构建新接口的 payload
    const payload = {
      subjects,
      ingredients: form.value.ingredients.map(i => i.name),  // 只传食材名称
      mealType: form.value.mealType.toUpperCase(),
      note: form.value.note || '',
      photoKey: form.value.photoKey || null,
      recognitionId: form.value.recognitionId || null,
      source: usedAiParse.value ? 'TEXT_AI' : (form.value.recognitionId ? 'PHOTO' : 'MANUAL')
    }

    const res = await record(payload)

    // 收集服务端返回的交叉过敏预警
    if (Array.isArray(res)) {
      serverAllergyWarnings.value = res
        .filter(meal => meal.allergyWarning)
        .map(meal => meal.allergyWarning)
    }

    // 返回值是列表
    uni.showToast({ title: '保存成功', icon: 'success' })

    // 如果是单档案（列表中只有一个），构建评分结果
    if (Array.isArray(res) && res.length === 1) {
      scoreResult.value = buildScoreResult(res[0])
    }

    // 轮询评分状态（取第一个档案的 id）
    // 评分需 3-10 秒，去掉 5 秒自动返回，改为评分到位后用户手动点"完成"返回
    if (res && res.length > 0 && res[0].id) {
      savedMealId.value = res[0].id
      pollScoreResult(res[0].id)
      // 新建成功后也刷新今日列表
      loadTodayMeals()
    } else {
      setTimeout(() => {
        uni.navigateBack()
      }, 1200)
    }
  } catch (e) {
    handleError(e, { fallback: '保存失败，请稍后重试' })
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

// AI 文字拆食材卡片
.ai-parse-card {
  margin-bottom: 24rpx;
  padding: 24rpx;
}

.ai-parse-header {
  margin-bottom: 16rpx;
}

.ai-parse-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
}

.ai-parse-input {
  margin-bottom: 16rpx;
}

.low-confidence-tip {
  background: #FFFBF0;
  border-radius: 10rpx;
  padding: 12rpx 16rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #E87D3F;
}

.new-ingredients-tip {
  background: #E8F8EE;
  border-radius: 10rpx;
  padding: 12rpx 16rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #5CB87A;
}

.ai-parse-btn {
  width: 100%;
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
.allergy-name { font-size: 26rpx; font-weight: 600; color: #E07A5F; }
.allergy-desc { font-size: 24rpx; color: #E07A5F; margin-left: 8rpx; }

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
.nutrient-name { font-size: 24rpx; color: #666; }
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
.suggestion-text { font-size: 26rpx; color: #666; line-height: 1.8; }

.disclaimer {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #C8C8C8;
  line-height: 1.6;
  margin-bottom: 24rpx;
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
  color: #3D3935;
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

/* 评分结果动画 */
.anim-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.anim-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.anim-count-up {
  animation: countUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scoring-loading {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.score-timeout {
  text-align: center;
  padding: 48rpx 32rpx;
  margin-top: 32rpx;
}

.timeout-text {
  display: block;
  font-size: 28rpx;
  color: #999;
  margin-bottom: 32rpx;
}

/* 今日记录快速编辑 */
.today-meals-section {
  margin-bottom: 24rpx;
}

.today-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.today-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #3D3935;
}

.today-count {
  font-size: 24rpx;
  color: #999;
}

.today-scroll {
  white-space: nowrap;
}

.today-list {
  display: inline-flex;
  gap: 16rpx;
}

.today-card {
  width: 280rpx;
  padding: 20rpx;
  display: inline-block;
  white-space: normal;
  vertical-align: top;
}

.today-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.today-meal-type {
  font-size: 26rpx;
  font-weight: 600;
  color: #3D3935;
}

.today-time {
  font-size: 22rpx;
  color: #999;
}

.today-ingredients {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 40rpx;
}

.today-ing-tag {
  display: inline;
}

.today-no-ing {
  color: #C8C8C8;
}

.today-score {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 600;

  &.score-good { background: #E8F8EE; color: #5CB87A; }
  &.score-ok { background: #FFF3E6; color: #F5A85B; }
  &.score-low { background: #FDEEE9; color: #E07A5F; }
}

.editing-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFF3E6;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  margin-bottom: 24rpx;
}

.editing-text {
  font-size: 26rpx;
  color: #F5A85B;
  font-weight: 600;
}

.editing-cancel {
  font-size: 24rpx;
  color: #999;
  padding: 8rpx 16rpx;
}
</style>
