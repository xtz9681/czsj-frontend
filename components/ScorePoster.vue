<template>
  <view class="score-poster-container">
    <canvas
      canvas-id="scorePosterCanvas"
      class="poster-canvas"
      style="width: 600px; height: 1000px;"
    ></canvas>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import Painter from 'mp-painter'

const props = defineProps({
  score: {
    type: Number,
    default: 0
  },
  ingredients: {
    type: Array,
    default: () => []
  },
  feedback: {
    type: String,
    default: '继续加油！'
  },
  babyName: {
    type: String,
    default: '宝宝'
  }
})

const painter = ref(null)

// 获取分数对应的颜色和评价
const scoreInfo = computed(() => {
  const s = props.score || 0
  if (s >= 90) return { color: '#5CB87A', label: '优秀' }
  if (s >= 80) return { color: '#F5A85B', label: '良好' }
  if (s >= 70) return { color: '#FFD700', label: '及格' }
  return { color: '#E07A5F', label: '需加油' }
})

async function renderPoster() {
  return new Promise((resolve, reject) => {
    try {
      const ctx = uni.createCanvasContext('scorePosterCanvas')
      painter.value = new Painter(ctx)

      const posterConfig = buildPosterConfig()

      painter.value.draw(posterConfig).then(() => {
        resolve()
      }).catch(err => {
        reject(err)
      })
    } catch (e) {
      reject(e)
    }
  })
}

function buildPosterConfig() {
  const scoreColor = scoreInfo.value.color
  const ingredientOffset = props.ingredients.length > 0 ? 100 : 0

  return {
    type: 'container',
    direction: 'vertical',
    width: 600,
    height: 1000,
    background: '#FAF7F2',
    children: [
      // 白色卡片背景
      {
        type: 'rect',
        left: 30,
        top: 40,
        width: 540,
        height: 920,
        borderRadius: 24,
        background: '#FFFFFF'
      },
      // 标题
      {
        type: 'text',
        content: `${props.babyName}今日营养评分`,
        left: 300,
        top: 80,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3D3935',
        align: 'center'
      },
      // 分数圆形背景
      {
        type: 'rect',
        left: 220,
        top: 140,
        width: 160,
        height: 160,
        borderRadius: 80,
        background: '#F0F0F0'
      },
      // 分数文字
      {
        type: 'text',
        content: String(props.score),
        left: 300,
        top: 200,
        fontSize: 48,
        fontWeight: 'bold',
        color: scoreColor,
        align: 'center'
      },
      // 评价标签
      {
        type: 'text',
        content: scoreInfo.value.label,
        left: 300,
        top: 255,
        fontSize: 20,
        color: scoreColor,
        align: 'center'
      },
      // 食材部分
      ...(props.ingredients.length > 0 ? [
        {
          type: 'text',
          content: '今日食材：',
          left: 60,
          top: 330,
          fontSize: 20,
          color: '#666666'
        },
        {
          type: 'text-block',
          content: props.ingredients.slice(0, 8).join('  '),
          left: 60,
          top: 360,
          width: 480,
          fontSize: 18,
          color: '#5CB87A',
          lineHeight: 40
        }
      ] : []),
      // AI 评语气泡背景
      {
        type: 'rect',
        left: 50,
        top: 480 + ingredientOffset,
        width: 500,
        height: 100,
        borderRadius: 16,
        background: '#FFF3E6'
      },
      // AI 评语标题
      {
        type: 'text',
        content: 'AI 评语',
        left: 70,
        top: 508 + ingredientOffset,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F5A85B'
      },
      // AI 评语内容（用 text-block 支持换行）
      {
        type: 'text-block',
        content: props.feedback,
        left: 70,
        top: 532 + ingredientOffset,
        width: 460,
        fontSize: 16,
        color: '#666666',
        lineHeight: 24
      },
      // 底部提示
      {
        type: 'text',
        content: '扫码记录宝宝饮食',
        left: 300,
        top: 820 + ingredientOffset,
        fontSize: 18,
        color: '#999999',
        align: 'center'
      },
      // 小程序码占位
      {
        type: 'rect',
        left: 250,
        top: 860 + ingredientOffset,
        width: 100,
        height: 100,
        borderRadius: 8,
        background: '#E8E8E8'
      },
      // 小程序码文字
      {
        type: 'text',
        content: '小程序码',
        left: 300,
        top: 910 + ingredientOffset,
        fontSize: 12,
        color: '#999999',
        align: 'center'
      }
    ]
  }
}

async function exportImage() {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath(
      {
        canvasId: 'scorePosterCanvas',
        success(res) {
          resolve(res.tempFilePath)
        },
        fail(err) {
          reject(err)
        }
      }
    )
  })
}

defineExpose({
  renderPoster,
  exportImage
})
</script>

<style lang="scss" scoped>
.score-poster-container {
  position: fixed;
  left: -9999rpx;
  top: -9999rpx;
  width: 600px;
  height: 1000px;
  z-index: -1;
}

.poster-canvas {
  width: 600px;
  height: 1000px;
}
</style>

