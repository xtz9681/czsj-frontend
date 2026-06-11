<template>
  <view class="page-container">
    <!-- 说明卡 -->
    <view class="explain-card card" style="margin: 24rpx 40rpx;">
      <text class="explain-title">⚠️ 过敏管理</text>
      <text class="explain-text">
        标记后，每次记录含这些食材时会自动提醒。
        也会检测交叉过敏风险（如虾过敏 → 提醒螃蟹）。
        过敏预警功能永久免费，宝宝安全最重要。
      </text>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: activeTab === 'marked' }" @tap="activeTab = 'marked'">
        已标记 ({{ allergyList.length }})
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'add' }" @tap="activeTab = 'add'">
        添加新的
      </view>
    </view>

    <!-- Tab 1：已标记 -->
    <view v-if="activeTab === 'marked'" class="tab-content">
      <!-- 已标记过敏食材 -->
      <view class="section-header" style="padding: 0 40rpx;">
        <text class="section-title">过敏食材</text>
        <text class="section-count">{{ allergyList.length }} 种</text>
      </view>

      <view v-if="allergyLoading" class="loading-state">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="allergyList.length === 0" class="empty-allergy">
        <image src="/static/empty/no-allergy.png" class="empty-img" mode="aspectFit" />
        <text class="empty-text">还没有标记过敏食材，宝宝目前没有已知过敏~</text>
      </view>

      <view v-else class="allergy-list" style="padding: 0 40rpx;">
        <view
          class="allergy-item card"
          v-for="item in allergyList"
          :key="item.id"
        >
          <view class="ai-left">
            <text class="ai-emoji">{{ item.emoji || '⚠️' }}</text>
            <view>
              <text class="ai-name">{{ item.ingredientName || item.name }}</text>
              <text v-if="(item.relatedIngredients || item.crossAllergies || []).length > 0" class="ai-cross">
                交叉过敏：{{ (item.relatedIngredients || item.crossAllergies).join('、') }}
              </text>
            </view>
          </view>
          <view class="ai-remove" @tap="removeAllergy(item)">移除</view>
        </view>
      </view>

      <!-- 月龄禁忌提示 -->
      <view class="forbidden-card" style="margin: 32rpx 40rpx 0;">
        <text class="forbidden-title">🚫 月龄禁忌（规则硬限制）</text>
        <text class="forbidden-desc">以下食物系统会自动拦截，无需手动标记</text>
        <view class="forbidden-list">
          <view class="forbidden-item" v-for="f in forbiddenFoods" :key="f.name">
            <text class="f-name">{{ f.name }}</text>
            <text class="f-reason">{{ f.reason }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 2：添加新的 -->
    <view v-if="activeTab === 'add'" class="tab-content">
      <!-- 搜索/添加 -->
      <view class="search-row">
        <view class="search-input-wrap">
          <text class="search-icon">🔍</text>
          <wd-input
            v-model="searchKeyword"
            placeholder="搜索食材名称"
            clearable
            @input="onSearchInput"
          />
        </view>
      </view>

      <!-- 搜索结果 -->
      <view v-if="searchKeyword && searchResults.length > 0" class="search-result-list card" style="margin: 0 40rpx 24rpx;">
        <view
          v-for="item in searchResults"
          :key="item.id"
          class="search-result-item"
          @tap="addAllergyIngredient(item)"
        >
          <text class="sri-emoji">{{ item.emoji }}</text>
          <text class="sri-name">{{ item.name }}</text>
          <text class="sri-category">{{ item.category }}</text>
          <view class="sri-add-btn">+ 标记过敏</view>
        </view>
      </view>

      <view v-if="searchKeyword && searchResults.length === 0" class="no-result">
        <text>没找到「{{ searchKeyword }}」，试试其他名称</text>
        <view class="custom-add-btn" @tap="addCustomAllergy">直接添加</view>
      </view>

      <!-- 常见过敏原参考 -->
      <view class="common-section" style="padding: 0 40rpx;">
        <text class="common-title">常见婴幼儿过敏原</text>
        <text class="common-sub">点击快速标记</text>
      </view>

      <view class="common-grid" style="padding: 0 40rpx;">
        <view
          v-for="item in commonAllergens"
          :key="item.id"
          class="common-item"
          :class="{ added: isAdded(item) }"
          @tap="toggleCommonAllergen(item)"
        >
          <text class="common-emoji">{{ item.emoji }}</text>
          <text class="common-name">{{ item.name }}</text>
          <view v-if="isAdded(item)" class="common-check">✓</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAllergyList, addAllergy, removeAllergy as removeAllergyApi } from '@/api/allergy.js'
import { getIngredientsByAge } from '@/api/meal.js'
import { useUserStore } from '@/store/user.js'

const searchKeyword = ref('')
const allergyList = ref([])
const allergyLoading = ref(false)
const activeTab = ref('marked')

function getBabyId() {
  return useUserStore().currentBaby?.id
}

async function loadAllergyList() {
  const babyId = getBabyId()
  if (!babyId) return
  allergyLoading.value = true
  try {
    const list = await getAllergyList(babyId)
    allergyList.value = list
    uni.setStorageSync('allergyList', list.map(a => ({ name: a.ingredientName, id: a.id, crossAllergies: a.relatedIngredients || [] })))
  } catch (e) {
    // 网络失败时降级读 storage
    allergyList.value = uni.getStorageSync('allergyList') || []
  } finally {
    allergyLoading.value = false
  }
}

onShow(() => { loadAllergyList(); loadIngredientDatabase() })

// 食材搜索库从后端拉取
const ingredientDatabase = ref([])

async function loadIngredientDatabase() {
  const baby = useUserStore().currentBaby
  if (!baby?.id) return
  try {
    const list = await getIngredientsByAge(baby.id)
    ingredientDatabase.value = (list || []).map(i => ({
      id: i.id,
      emoji: '🥗',
      name: i.name,
      category: i.category || '',
      crossAllergies: []
    }))
  } catch (e) {
    // 加载失败时搜索库为空，用户仍可手动输入
  }
}

const searchResults = computed(() => {
  if (!searchKeyword.value.trim()) return []
  return ingredientDatabase.value.filter(i =>
    i.name.includes(searchKeyword.value.trim()) && !isAdded(i)
  )
})

const commonAllergens = ref([
  { id: 101, emoji: '🦐', name: '虾', crossAllergies: ['螃蟹', '龙虾'] },
  { id: 103, emoji: '🥛', name: '牛奶', crossAllergies: ['奶酪', '酸奶'] },
  { id: 104, emoji: '🥚', name: '鸡蛋', crossAllergies: ['蛋糕', '蛋挞'] },
  { id: 105, emoji: '🌾', name: '小麦', crossAllergies: ['面包', '饼干'] },
  { id: 106, emoji: '🥜', name: '花生', crossAllergies: ['花生酱'] },
  { id: 107, emoji: '🌰', name: '坚果', crossAllergies: ['核桃', '腰果'] },
  { id: 108, emoji: '🐟', name: '鱼', crossAllergies: [] },
  { id: 102, emoji: '🦀', name: '螃蟹', crossAllergies: ['虾', '龙虾'] },
])

const forbiddenFoods = [
  { name: '🍯 蜂蜜', reason: '< 12 个月 · 肉毒杆菌风险' },
  { name: '🥛 鲜牛奶', reason: '< 12 个月 · 肾脏负担重' },
  { name: '🌰 整粒坚果', reason: '< 3 岁 · 窒息风险' },
  { name: '🧂 高盐食物', reason: '< 12 个月 · < 1g 盐/天' },
  { name: '🍬 添加糖', reason: '< 12 个月 · 尽量不加' },
]

function onSearchInput() { /* 响应式自动触发 */ }

function isAdded(item) {
  return allergyList.value.some(a => (a.ingredientName || a.name) === item.name)
}

async function addAllergyIngredient(item) {
  if (isAdded(item)) {
    uni.showToast({ title: '已经标记过了~', icon: 'none' })
    return
  }
  const babyId = getBabyId()
  if (!babyId) { uni.showToast({ title: '请先完善宝宝档案~', icon: 'none' }); return }
  try {
    const res = await addAllergy(babyId, item.name)
    allergyList.value.push(res)
    uni.setStorageSync('allergyList', allergyList.value.map(a => ({ name: a.ingredientName || a.name, id: a.id, crossAllergies: a.relatedIngredients || [] })))
    searchKeyword.value = ''
    activeTab.value = 'marked'
    uni.showToast({ title: `已标记 ${item.name} 过敏`, icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '标记失败，稍后再试~', icon: 'none' })
  }
}

async function addCustomAllergy() {
  const name = searchKeyword.value.trim()
  if (!name) return
  await addAllergyIngredient({ name })
}

function toggleCommonAllergen(item) {
  if (isAdded(item)) {
    const found = allergyList.value.find(a => (a.ingredientName || a.name) === item.name)
    if (found) doRemove(found)
  } else {
    addAllergyIngredient(item)
  }
}

function removeAllergy(item) {
  doRemove(item)
}

function doRemove(item) {
  uni.showModal({
    title: `移除 ${item.ingredientName || item.name} 过敏标记？`,
    content: '移除后，含此食材的记录不再提醒',
    confirmText: '移除',
    confirmColor: '#E07A5F',
    success(res) {
      if (!res.confirm) return
      removeAllergyApi(item.id).then(() => {
        allergyList.value = allergyList.value.filter(a => a.id !== item.id)
        uni.setStorageSync('allergyList', allergyList.value.map(a => ({ name: a.ingredientName || a.name, id: a.id, crossAllergies: a.relatedIngredients || [] })))
      }).catch(e => {
        uni.showToast({ title: e.message || '移除失败，稍后再试~', icon: 'none' })
      })
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 0 0 calc(80rpx + constant(safe-area-inset-bottom));
  padding: 0 0 calc(80rpx + env(safe-area-inset-bottom));
}

.explain-card {
  padding: 28rpx;
}

.explain-title { display: block; font-size: 30rpx; font-weight: 700; color: #3D3935; margin-bottom: 12rpx; }
.explain-text { font-size: 26rpx; color: #666; line-height: 1.8; }

/* Tab 切换 */
.tab-bar {
  display: flex;
  margin: 0 40rpx 24rpx;
  background: #F0EAE0;
  border-radius: 12rpx;
  padding: 6rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #999;
  font-weight: 600;
  transition: all 0.3s;
}

.tab-item.active {
  background: #FFFFFF;
  color: #3D3935;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.tab-content {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.search-row {
  padding: 0 40rpx 20rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  padding: 0 24rpx;
  height: 88rpx;
  gap: 16rpx;
}

.search-icon { font-size: 32rpx; }

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #3D3935;
}

.input-placeholder { color: #C8C8C8; }

.search-result-list { padding: 0 !important; overflow: hidden; }

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #F0E9DE;

  &:last-child { border-bottom: none; }
}

.sri-emoji { font-size: 36rpx; }
.sri-name { font-size: 28rpx; font-weight: 600; color: #3D3935; flex: 1; }
.sri-category { font-size: 22rpx; color: #999; }

.sri-add-btn {
  background: #FDEEE9;
  color: #E07A5F;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.no-result {
  padding: 24rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 26rpx;
  color: #999;
}

.custom-add-btn {
  background: #F5A85B;
  color: #FFFFFF;
  border-radius: 20rpx;
  padding: 8rpx 24rpx;
  font-size: 26rpx;
  white-space: nowrap;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 24rpx 0 16rpx;
}

.section-title { font-size: 30rpx; font-weight: 700; color: #3D3935; }
.section-count { font-size: 24rpx; color: #999; }

.empty-allergy {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 40rpx;
}

.empty-img {
  width: 280rpx;
  height: 280rpx;
  margin-bottom: 20rpx;
}

.empty-text { font-size: 26rpx; color: #999; text-align: center; line-height: 1.8; }

.allergy-list { display: flex; flex-direction: column; gap: 16rpx; }

.allergy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
}

.ai-left { display: flex; align-items: center; gap: 16rpx; flex: 1; }
.ai-emoji { font-size: 44rpx; flex-shrink: 0; }
.ai-name { display: block; font-size: 30rpx; font-weight: 700; color: #3D3935; margin-bottom: 4rpx; }
.ai-cross { font-size: 24rpx; color: #E07A5F; }

.ai-remove {
  background: #FDEEE9;
  color: #E07A5F;
  border-radius: 20rpx;
  padding: 8rpx 24rpx;
  font-size: 24rpx;
}

.common-section {
  padding: 32rpx 0 16rpx;
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.common-title { font-size: 30rpx; font-weight: 700; color: #3D3935; }
.common-sub { font-size: 24rpx; color: #999; }

.common-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.common-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc((100% - 48rpx) / 4);
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  border: 3rpx solid transparent;

  &.added {
    border-color: #E07A5F;
    background: #FDEEE9;
  }
}

.common-emoji { font-size: 44rpx; margin-bottom: 6rpx; }
.common-name { font-size: 24rpx; color: #3D3935; }

.common-check {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  background: #E07A5F;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.forbidden-card {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 28rpx;
  border: 2rpx solid #F0E9DE;
}

.forbidden-title { display: block; font-size: 28rpx; font-weight: 700; color: #3D3935; margin-bottom: 8rpx; }
.forbidden-desc { display: block; font-size: 24rpx; color: #999; margin-bottom: 20rpx; }

.forbidden-list { display: flex; flex-direction: column; gap: 12rpx; }

.forbidden-item { display: flex; align-items: center; justify-content: space-between; }
.f-name { font-size: 28rpx; color: #3D3935; }
.f-reason { font-size: 22rpx; color: #E07A5F; }

</style>
