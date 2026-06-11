<template>
  <view class="chart-container">
    <canvas
      id="nutrition-trend-canvas"
      class="chart-canvas"
      :style="{ height: height }"
      type="2d"
    ></canvas>
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import uCharts from '@qiun/ucharts'

const props = defineProps({
  chartData: {
    type: Array,
    default: () => [],
    // 格式: [{ date: '06-05', avgScore: 78, mealCount: 3 }, ...]
  },
  height: {
    type: String,
    default: '400rpx'
  }
})

const chart = ref(null)
const canvasWidth = ref(300)
const canvasHeight = ref(400)

onMounted(() => {
  initChart()
})

// 监听数据变化，重绘图表
watch(
  () => props.chartData,
  () => {
    if (chart.value) {
      chart.value.dispose()
      chart.value = null
    }
    initChart()
  },
  { deep: true }
)

async function initChart() {
  if (!props.chartData || props.chartData.length === 0) return

  // 获取 canvas 上下文
  const query = uni.createSelectorQuery().in(this)
  query.select('#nutrition-trend-canvas').node(res => {
    if (!res || !res.node) return

    const canvas = res.node
    const ctx = canvas.getContext('2d')

    // 获取设备像素比
    const dpr = uni.getSystemInfoSync().pixelRatio || 1

    // 设置 canvas 尺寸
    canvasWidth.value = 300
    canvasHeight.value = Math.ceil(parseFloat(props.height) / 2) // rpx to px

    canvas.width = canvasWidth.value * dpr
    canvas.height = canvasHeight.value * dpr
    ctx.scale(dpr, dpr)

    // 提取数据
    const dates = props.chartData.map(d => d.date || '')
    const scores = props.chartData.map(d => d.avgScore !== null ? d.avgScore : null)

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
            pointSize: 6,
          }
        ],
        xAxis: {
          disableGrid: false,
          type: 'categories',
          gridColor: '#E8E8E8',
          gridType: 'dash',
          boundaryGap: 'justify',
          axisLineColor: '#E8E8E8',
        },
        yAxis: {
          min: 0,
          max: 100,
          splitNumber: 4,
          gridColor: '#E8E8E8',
          gridType: 'dash',
          axisLineColor: '#E8E8E8',
        },
        extra: {
          line: {
            type: 'curve',
            width: 3,
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
        padding: [15, 10, 30, 40],
      })
    } catch (e) {
      console.error('uCharts 初始化失败:', e)
    }
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
</style>
