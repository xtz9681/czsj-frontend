<template>
  <view class="chart-container">
    <!-- 有评分数据时显示图表 -->
    <canvas
      v-if="hasScore"
      id="nutrition-trend-canvas"
      class="chart-canvas"
      :style="{ height: height }"
      type="2d"
    ></canvas>
    <!-- 无评分数据时显示空态 -->
    <view v-else class="empty-state" :style="{ height: height }">
      <text class="empty-text">这周还没有评分记录，记一餐就能看到趋势啦~</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, getCurrentInstance } from 'vue'
import uCharts from '@qiun/ucharts'

const props = defineProps({
  chartData: {
    type: Array,
    default: () => [],
    // 格式: [{ date: '2026-08-19', avgScore: 78 }, ...]
  },
  height: {
    type: String,
    default: '360rpx'
  }
})

const chart = ref(null)
const canvasWidth = ref(300)
const canvasHeight = ref(400)
const instance = getCurrentInstance()

// 检查是否有评分数据
const hasScore = computed(() =>
  props.chartData.some(d => d.avgScore !== null && d.avgScore !== undefined)
)

// 提取有评分的数据，X 轴用 M/D 短日期
const filteredData = computed(() => {
  return props.chartData.filter(d => d.avgScore !== null && d.avgScore !== undefined)
})

// 转换日期为 M/D 格式
function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  // 去前导零
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)
  return `${m}/${d}`
}

onMounted(() => {
  if (hasScore.value) {
    initChart()
  }
})

// 监听数据变化，重绘图表
watch(
  () => props.chartData,
  () => {
    if (chart.value) {
      chart.value.dispose()
      chart.value = null
    }
    if (hasScore.value) {
      initChart()
    }
  },
  { deep: true }
)

async function initChart() {
  if (!filteredData.value || filteredData.value.length === 0) return

  // 获取 canvas 上下文
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select('#nutrition-trend-canvas').boundingClientRect(rect => {
    query.select('#nutrition-trend-canvas').node(res => {
      if (!res || !res.node) return

      const canvas = res.node
      const ctx = canvas.getContext('2d')

      // 获取设备像素比
      const dpr = uni.getSystemInfoSync().pixelRatio || 1

      // 设置 canvas 尺寸：宽度取容器实际宽度，高度由 props.height 计算
      canvasWidth.value = rect && rect.width > 0 ? rect.width : 300
      canvasHeight.value = Math.ceil(parseFloat(props.height) / 2) // rpx to px

      canvas.width = canvasWidth.value * dpr
      canvas.height = canvasHeight.value * dpr
      ctx.scale(dpr, dpr)

      // 提取数据：短日期 + 评分
      const dates = filteredData.value.map(d => formatShortDate(d.date))
      const scores = filteredData.value.map(d => d.avgScore)

      // 初始化 uCharts
      try {
        chart.value = new uCharts({
          type: 'line',
          context: ctx,
          width: canvasWidth.value,
          height: canvasHeight.value,
          categories: dates,
          series: [
            {
              name: '营养评分',
              data: scores,
              color: '#F5A85B',
              lineType: 'curve',
              pointSize: 4,
            }
          ],
          xAxis: {
            disableGrid: false,
            type: 'categories',
            gridColor: '#ECE7E0',
            gridType: 'dash',
            boundaryGap: 'justify',
            axisLineColor: '#ECE7E0',
            fontSize: 10,
            fontColor: '#9A8F85',
          },
          yAxis: {
            min: 0,
            max: 100,
            splitNumber: 4,
            gridColor: '#ECE7E0',
            gridType: 'dash',
            axisLineColor: '#ECE7E0',
            fontSize: 10,
            fontColor: '#B8AEA4',
          },
          extra: {
            line: {
              type: 'curve',
              width: 2.5,
              activeType: 'hollow',
            }
          },
          legend: {
            show: false,
          },
          tooltip: {
            show: true,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            fontColor: '#FFFFFF',
            fontSize: 12,
          },
          padding: [15, 15, 30, 30],
        })
      } catch (e) {
        console.error('uCharts 初始化失败:', e)
      }
    }).exec()
  }).exec()
}

// 清理
function dispose() {
  if (chart.value) {
    chart.value.dispose()
  }
}

onUnmounted(() => {
  dispose()
})
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-canvas {
  width: 100%;
  background: transparent;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: transparent;
}

.empty-text {
  font-size: 26rpx;
  color: #9A8F85;
  text-align: center;
}
</style>
