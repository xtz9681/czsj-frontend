<template>
  <view class="page-container">
    <view class="header">
      <text class="header-title">{{ isEdit ? '编辑我的档案' : '告诉我更多' }}</text>
    </view>

    <!-- 阶段选择 -->
    <view class="section">
      <text class="label">当前阶段</text>
      <view class="phase-row">
        <view
          v-for="p in phaseOptions"
          :key="p.value"
          class="phase-chip"
          :class="{ active: isPhaseActive(p.value) }"
          @tap="onPhaseSelect(p.value)"
        >{{ p.label }}</view>
      </view>
    </view>

    <!-- 通用基础信息 -->
    <view class="section-group">
      <text class="group-title">基础信息</text>

      <!-- 提示文案：信息越完善 AI 建议越准 -->
      <view class="tip-bar">
        <image src="/static/icons/icon-sparkle.png" class="tip-icon-img" mode="aspectFit" />
        <text class="tip-text">填得越详细，AI 给出的营养建议就越贴合你的情况～</text>
      </view>

      <view class="form-card card">
        <view class="form-item">
          <text class="form-label">出生年份</text>
          <picker mode="selector" :range="yearRange" :value="yearIndex" @change="onYearSelect">
            <view class="picker-inline">
              <text :class="form.birthYear ? 'picker-val' : 'picker-placeholder'">
                {{ form.birthYear ? form.birthYear + ' 年' : '请选择' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="divider"></view>

        <view class="form-item">
          <text class="form-label">身高</text>
          <view class="input-inline">
            <input class="num-input" type="digit" v-model="form.heightCm" placeholder="如 165" />
            <text class="unit">cm</text>
          </view>
        </view>
        <view class="divider"></view>

        <view class="form-item">
          <text class="form-label">当前体重</text>
          <view class="input-inline">
            <input class="num-input" type="digit" v-model="form.weightKg" placeholder="如 58.5" />
            <text class="unit">kg</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 备孕期专属 -->
    <view class="section-group" v-if="form.phase === 'preconception'">
      <text class="group-title">备孕信息</text>
      <view class="form-card card">
        <view class="form-item">
          <text class="form-label">备孕时长</text>
          <view class="input-inline">
            <input class="num-input" type="number" v-model="form.ttcMonths" placeholder="如 3" />
            <text class="unit">个月</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">是否月经不调</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.irregularPeriod === 1 }" @tap="form.irregularPeriod = 1">是</view>
            <view class="bool-btn" :class="{ active: form.irregularPeriod === 2 }" @tap="form.irregularPeriod = 2">偶尔</view>
            <view class="bool-btn" :class="{ active: form.irregularPeriod === 0 }" @tap="form.irregularPeriod = 0">否</view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">是否在服用叶酸</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.takingFolicAcid === 1 }" @tap="form.takingFolicAcid = 1">是</view>
            <view class="bool-btn" :class="{ active: form.takingFolicAcid === 2 }" @tap="form.takingFolicAcid = 2">偶尔</view>
            <view class="bool-btn" :class="{ active: form.takingFolicAcid === 0 }" @tap="form.takingFolicAcid = 0">否</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 孕期专属 -->
    <view class="section-group" v-if="isPregnancy">
      <text class="group-title">孕期信息</text>
      <view class="form-card card">
        <view class="form-item">
          <text class="form-label">预产期 <text class="required">*</text></text>
          <picker mode="date" :value="form.dueDate" :start="today" @change="e => form.dueDate = e.detail.value">
            <view class="picker-inline">
              <text :class="form.dueDate ? 'picker-val' : 'picker-placeholder'">{{ form.dueDate || '请选择（必填）' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
        <view v-if="pregnancyPhaseHint" class="pregnancy-phase-hint">
          <image src="/static/icons/phase-pregnancy.png" class="phase-hint-icon" mode="aspectFit" />
          <text class="phase-hint-text">{{ pregnancyPhaseHint }}</text>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">孕前体重</text>
          <view class="input-inline">
            <input class="num-input" type="digit" v-model="form.prePregnancyWeightKg" placeholder="如 55.0" />
            <text class="unit">kg</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">多胞胎</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.isMultiple === true }" @tap="form.isMultiple = true">是</view>
            <view class="bool-btn" :class="{ active: form.isMultiple === false }" @tap="form.isMultiple = false">否</view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">妊娠糖尿病</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.hasGdm === true }" @tap="form.hasGdm = true">是</view>
            <view class="bool-btn" :class="{ active: form.hasGdm === false }" @tap="form.hasGdm = false">否</view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">妊娠高血压</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.hasGhtn === true }" @tap="form.hasGhtn = true">是</view>
            <view class="bool-btn" :class="{ active: form.hasGhtn === false }" @tap="form.hasGhtn = false">否</view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">缺铁（体检）</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.ironDeficient === true }" @tap="form.ironDeficient = true">是</view>
            <view class="bool-btn" :class="{ active: form.ironDeficient === false }" @tap="form.ironDeficient = false">否</view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">缺钙（体检）</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.calciumDeficient === true }" @tap="form.calciumDeficient = true">是</view>
            <view class="bool-btn" :class="{ active: form.calciumDeficient === false }" @tap="form.calciumDeficient = false">否</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 哺乳期专属 -->
    <view class="section-group" v-if="form.phase === 'lactation'">
      <text class="group-title">哺乳期信息</text>
      <view class="form-card card">
        <view class="form-item">
          <text class="form-label"><text class="required">*</text> 宝宝出生日期</text>
          <picker mode="date" :value="form.deliveryDate" :end="today" @change="e => form.deliveryDate = e.detail.value">
            <view class="picker-inline">
              <text :class="form.deliveryDate ? 'picker-val' : 'picker-placeholder'">
                {{ form.deliveryDate || '请选择' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
          <text class="hint">用于计算产后周数</text>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">孕前体重</text>
          <view class="input-inline">
            <input class="num-input" type="digit" v-model="form.prePregnancyWeightKg" placeholder="如 55.0" />
            <text class="unit">kg</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">纯母乳喂养</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.isBreastfeeding === true }" @tap="form.isBreastfeeding = true">是</view>
            <view class="bool-btn" :class="{ active: form.isBreastfeeding === false }" @tap="form.isBreastfeeding = false">否</view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">奶水不足</text>
          <view class="bool-row">
            <view class="bool-btn" :class="{ active: form.lowMilkSupply === true }" @tap="form.lowMilkSupply = true">是</view>
            <view class="bool-btn" :class="{ active: form.lowMilkSupply === false }" @tap="form.lowMilkSupply = false">否</view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="isEdit || form.phase === 'preconception' || form.phase === 'pregnancy_early' || form.phase === 'pregnancy_mid' || form.phase === 'pregnancy_late'">
      <button class="btn-primary" @tap="save" :loading="saving">
        {{ isEdit ? '保存修改' : '完成，进入首页' }}
      </button>
    </view>

    <!-- 日常管理：两个按钮 -->
    <view v-else-if="!isEdit && form.phase === 'adult_female'" class="btn-group">
      <button class="btn-secondary" @tap="saveAndGoHome" :loading="saving">进入首页</button>
      <button class="btn-primary" @tap="save" :loading="saving">下一步，填宝宝信息</button>
    </view>

    <!-- 哺乳期/其他有宝宝的：一个按钮 -->
    <view v-else>
      <button class="btn-primary" @tap="save" :loading="saving">
        {{ isEdit ? '保存修改' : '下一步，填宝宝信息' }}
      </button>
    </view>

    <text class="skip-hint" v-if="!isEdit" @tap="skip">先跳过，稍后完善</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { createMother, updateMother } from '@/api/mother.js'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()
const isEdit = ref(false)
const saving = ref(false)
const today = new Date().toISOString().split('T')[0]

const form = ref({
  phase: 'pregnancy_mid',
  birthYear: null,
  heightCm: '',
  weightKg: '',
  prePregnancyWeightKg: '',
  dueDate: '',
  isMultiple: null,
  hasGdm: null,
  hasGhtn: null,
  ironDeficient: null,
  calciumDeficient: null,
  deliveryDate: '',
  isBreastfeeding: null,
  lowMilkSupply: null,
  ttcMonths: '',
  irregularPeriod: null,  // 0否/1是/2偶尔
  takingFolicAcid: null,  // 0否/1是/2偶尔
})

// 用户看到的阶段选项，孕早/中/晚合并为「孕期」
const phaseOptions = [
  { value: 'preconception', label: '备孕' },
  { value: 'pregnancy',     label: '孕期' },   // 虚拟值，选中后自动转换
  { value: 'lactation',     label: '哺乳期' },
  { value: 'adult_female',  label: '日常营养' },
]

const bloodTypes = [] // 已移除血型字段

const isPregnancy = computed(() => ['pregnancy_early', 'pregnancy_mid', 'pregnancy_late'].includes(form.value.phase))

// 首次填写后需要跳宝宝档案（有宝宝的情况）
const needsBabyProfile = computed(() => {
  if (isEdit.value) return false
  // 只要妈妈选了哺乳期或日常女性（可能有宝宝），就跳宝宝档案
  return ['lactation', 'adult_female'].includes(form.value.phase)
})

// chip 高亮：孕期类的三个内部值都对应「孕期」chip
function isPhaseActive(chipValue) {
  if (chipValue === 'pregnancy') return isPregnancy.value
  return form.value.phase === chipValue
}

// 点击 chip：孕期先设为 pregnancy_mid，等预产期填好后自动换
function onPhaseSelect(chipValue) {
  if (chipValue === 'pregnancy') {
    form.value.phase = 'pregnancy_mid'
  } else {
    form.value.phase = chipValue
  }
}

// 根据预产期自动计算孕期阶段
function calcPregnancyPhase(dueDate) {
  if (!dueDate) return 'pregnancy_mid'
  const weeksLeft = Math.round((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
  if (weeksLeft > 28) return 'pregnancy_early'
  if (weeksLeft > 14) return 'pregnancy_mid'
  return 'pregnancy_late'
}

const pregnancyPhaseHint = computed(() => {
  if (!form.value.dueDate) return ''
  const weeksLeft = Math.round((new Date(form.value.dueDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
  const weeksPregnant = 40 - weeksLeft
  if (weeksPregnant < 0) return '预产期已过，宝宝应该出生了~'
  if (weeksLeft > 28) return `孕早期 · 约第 ${weeksPregnant} 周`
  if (weeksLeft > 14) return `孕中期 · 约第 ${weeksPregnant} 周`
  return `孕晚期 · 约第 ${weeksPregnant} 周`
})

const birthDateForPicker = computed(() => form.value.birthYear ? `${form.value.birthYear}-01-01` : '1990-01-01')

const currentYear = new Date().getFullYear()
const yearRange = computed(() => {
  const start = currentYear - 60
  const end = currentYear
  const years = []
  for (let i = start; i <= end; i++) years.push(i.toString())
  return years
})

const defaultBirthYear = computed(() => new Date().getFullYear() - 25)
const yearIndex = computed(() => {
  if (form.value.birthYear) {
    return yearRange.value.indexOf(form.value.birthYear.toString())
  }
  return yearRange.value.indexOf(defaultBirthYear.value.toString())
})

function onYearSelect(e) {
  form.value.birthYear = Number(yearRange.value[e.detail.value])
}

function onBirthYearChange(e) {
  form.value.birthYear = new Date(e.detail.value).getFullYear()
}

const babyPhaseFromSetup = ref('')

onLoad((options) => {
  if (options?.stage) {
    if (options.stage === 'pregnancy') form.value.phase = 'pregnancy_mid'
    else if (['weaning', 'toddler'].includes(options.stage)) form.value.phase = 'adult_female'
    else form.value.phase = options.stage
  }
  if (options?.edit) {
    isEdit.value = true
    const m = userStore.mother
    if (m) {
      Object.keys(form.value).forEach(k => {
        if (m[k] !== undefined && m[k] !== null) form.value[k] = m[k]
      })
    }
  }
})

// 返回时用 navigateBack
onBackPress(() => {
  uni.navigateBack()
  return true
})

async function save() {
  // 孕期必须填预产期
  if (isPregnancy.value && !form.value.dueDate) {
    uni.showToast({ title: '请填写预产期，AI 需要它来判断你的孕周～', icon: 'none' })
    return
  }

  // 哺乳期必须填宝宝出生日期
  if (form.value.phase === 'lactation' && !form.value.deliveryDate) {
    uni.showToast({ title: '请填写宝宝出生日期，用于计算产后周数～', icon: 'none' })
    return
  }

  // 根据预产期自动修正孕期阶段
  if (isPregnancy.value && form.value.dueDate) {
    form.value.phase = calcPregnancyPhase(form.value.dueDate)
  }

  saving.value = true
  try {
    const payload = {
      phase: form.value.phase,
      birthYear: form.value.birthYear || null,
      heightCm: form.value.heightCm ? Number(form.value.heightCm) : null,
      weightKg: form.value.weightKg ? Number(form.value.weightKg) : null,
      prePregnancyWeightKg: form.value.prePregnancyWeightKg ? Number(form.value.prePregnancyWeightKg) : null,
      dueDate: form.value.dueDate || null,
      isMultiple: form.value.isMultiple,
      hasGdm: form.value.hasGdm,
      hasGhtn: form.value.hasGhtn,
      ironDeficient: form.value.ironDeficient,
      calciumDeficient: form.value.calciumDeficient,
      deliveryDate: form.value.deliveryDate || null,
      isBreastfeeding: form.value.isBreastfeeding,
      lowMilkSupply: form.value.lowMilkSupply,
      ttcMonths: form.value.ttcMonths ? Number(form.value.ttcMonths) : null,
      irregularPeriod: form.value.irregularPeriod,
      takingFolicAcid: form.value.takingFolicAcid,
    }
    const res = isEdit.value ? await updateMother(payload) : await createMother(payload)
    userStore.setMother(res)

    if (!isEdit.value && needsBabyProfile.value) {
      // 首次：保存宝妈档案后继续创建宝宝档案
      // 哺乳期时带宝宝出生日期过去
      const babyDeliveryDate = form.value.phase === 'lactation' ? form.value.deliveryDate : ''
      uni.showToast({ title: '宝妈档案已保存，接下来填宝宝信息～', icon: 'success' })
      setTimeout(() => uni.navigateTo({ url: `/pages/profile/index?babyDeliveryDate=${babyDeliveryDate}` }), 1000)
    } else {
      uni.showToast({ title: isEdit.value ? '修改成功~' : '设置完成！', icon: 'success' })
      setTimeout(() => {
        // 编辑模式直接回首页，新建模式根据阶段判断
        if (isEdit.value) {
          uni.reLaunch({ url: '/pages/index/index' })
        } else if (form.value.phase === 'preconception' || isPregnancy.value) {
          // 备孕和孕期直接跳首页（无宝宝，不需要 onboarding）
          uni.reLaunch({ url: '/pages/index/index' })
        } else if (!uni.getStorageSync('onboarded')) {
          // 哺乳期和日常管理：检查是否已 onboarded
          uni.reLaunch({ url: '/pages/onboarding/index' })
        } else {
          uni.reLaunch({ url: '/pages/index/index' })
        }
      }, 1000)
    }
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败，请稍后再试~', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function skip() {
  if (!uni.getStorageSync('onboarded')) {
    uni.reLaunch({ url: '/pages/onboarding/index' })
  } else {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

// 日常管理模式直接进首页
async function saveAndGoHome() {
  saving.value = true
  try {
    const payload = {
      phase: form.value.phase,
      birthYear: form.value.birthYear || null,
      heightCm: form.value.heightCm ? Number(form.value.heightCm) : null,
      weightKg: form.value.weightKg ? Number(form.value.weightKg) : null,
    }
    const res = await createMother(payload)
    userStore.setMother(res)
    uni.showToast({ title: '设置完成！', icon: 'success' })
    setTimeout(() => {
      if (!uni.getStorageSync('onboarded')) {
        uni.reLaunch({ url: '/pages/onboarding/index' })
      } else {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    }, 1000)
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败，请稍后再试~', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 0 40rpx calc(80rpx + constant(safe-area-inset-bottom));
  padding: 0 40rpx calc(80rpx + env(safe-area-inset-bottom));
}

.header {
  padding: 40rpx 0 32rpx;
}
.header-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #3D3935;
  margin-bottom: 8rpx;
}
.header-sub {
  display: block;
  font-size: 26rpx;
  color: #F5A85B;
  font-weight: 600;
}

.phase-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.phase-chip {
  padding: 14rpx 28rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: #F5F5F5;
  color: #666;
  border: 3rpx solid transparent;
  &.active {
    background: #FFF3E6;
    color: #F5A85B;
    border-color: #F5A85B;
    font-weight: 600;
  }
}

.section-group {
  margin-bottom: 40rpx;
}
.group-title {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.section {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #3D3935;
  margin-bottom: 16rpx;
}

.form-card { padding: 0 32rpx; }

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 104rpx;
}
.form-label {
  font-size: 28rpx;
  color: #3D3935;
  flex-shrink: 0;
  width: 180rpx;
}
.divider {
  height: 1rpx;
  background: #F5F0EA;
}

.picker-inline {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.picker-val { font-size: 28rpx; color: #3D3935; }
.picker-placeholder { font-size: 28rpx; color: #C8C8C8; }
.picker-arrow { font-size: 32rpx; color: #C8C8C8; }

.pregnancy-phase-hint {
  padding: 16rpx 0 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.phase-hint-icon { width: 36rpx; height: 36rpx; flex-shrink: 0; vertical-align: middle; }
.phase-hint-text {
  font-size: 26rpx;
  color: #F5A85B;
  font-weight: 600;
}

.input-inline {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.num-input {
  font-size: 28rpx;
  color: #3D3935;
  text-align: right;
  width: 120rpx;
}
.unit { font-size: 26rpx; color: #999; }

.hint {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
  padding-bottom: 16rpx;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.tag-chip {
  padding: 10rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  background: #F5F5F5;
  color: #666;
  border: 2rpx solid transparent;
  &.active {
    background: #FFF3E6;
    color: #F5A85B;
    border-color: #F5A85B;
    font-weight: 600;
  }
}

.bool-row {
  display: flex;
  gap: 16rpx;
}
.bool-btn {
  padding: 10rpx 32rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  background: #F5F5F5;
  color: #666;
  border: 2rpx solid transparent;
  &.active {
    background: #FFF3E6;
    color: #F5A85B;
    border-color: #F5A85B;
    font-weight: 600;
  }
}

.btn-primary {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 96rpx;
  font-size: 34rpx;
  font-weight: 600;
  border: none;
  height: 104rpx;
  line-height: 104rpx;
  margin-top: 48rpx;
  &::after { border: none; }
}

.btn-secondary {
  background: #FFFFFF;
  color: #F5A85B;
  border: 3rpx solid #F5A85B;
  border-radius: 96rpx;
  font-size: 34rpx;
  font-weight: 600;
  height: 104rpx;
  line-height: 104rpx;
  margin-top: 48rpx;
  &::after { border: none; }
}

.btn-group {
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;
  button {
    flex: 1;
    margin-top: 0 !important;
  }
}

.skip-hint {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: #C8C8C8;
  margin-top: 24rpx;
  padding: 16rpx;
}

.tip-bar {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 20rpx;
  padding: 18rpx 24rpx;
  background: #FFF8F0;
  border-radius: 12rpx;
  border-left: 6rpx solid #F5A85B;
}
.tip-icon-img { width: 32rpx; height: 32rpx; flex-shrink: 0; }
.tip-text { font-size: 24rpx; color: #3D3935; line-height: 1.6; }

.required { color: #E07A5F; font-size: 28rpx; margin-left: 4rpx; }
</style>
