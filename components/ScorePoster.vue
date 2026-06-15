<template>
  <view class="score-poster-container">
    <canvas
      id="scorePosterCanvas"
      class="poster-canvas"
      type="2d"
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
const canvasCtx = ref(null)

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
    // 获取 canvas
    const query = uni.createSelectorQuery()
    query
      .select('#scorePosterCanvas')
      .node((res) => {
        if (!res) {
          reject(new Error('Canvas not found'))
          return
        }

        const canvas = res[0]
        const ctx = canvas.getContext('2d')
        canvasCtx.value = ctx

        // 设置 canvas 尺寸
        const dpr = uni.getSystemInfoSync().pixelRatio
        canvas.width = 600 * dpr
        canvas.height = 1000 * dpr
        ctx.scale(dpr, dpr)

        // 开始绘制
        try {
          drawPoster(ctx)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
      .exec()
  })
}

function drawPoster(ctx) {
  // 背景
  ctx.fillStyle = '#FAF7F2'
  ctx.fillRect(0, 0, 600, 1000)

  // 白色卡片背景 + 阴影
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowColor = 'rgba(0,0,0,0.08)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 10
  drawRoundRect(ctx, 30, 40, 540, 920, 24)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  let y = 80

  // 标题：宝宝名字 + "今日营养评分"
  ctx.fillStyle = '#3D3935'
  ctx.font = 'bold 32px "PingFang SC"'
  ctx.textAlign = 'center'
  ctx.fillText(`${props.babyName}今日营养评分`, 300, y)
  y += 60

  // 圆形进度条 + 分数
  drawScoreCircle(ctx, 300, y + 60, 80, props.score, scoreInfo.value.color)

  // 分数文字
  ctx.fillStyle = scoreInfo.value.color
  ctx.font = 'bold 48px "PingFang SC"'
  ctx.textAlign = 'center'
  ctx.fillText(String(props.score), 300, y + 75)

  // 评价标签
  ctx.fillStyle = scoreInfo.value.color
  ctx.font = '20px "PingFang SC"'
  ctx.textAlign = 'center'
  ctx.fillText(scoreInfo.value.label, 300, y + 110)
  y += 160

  // 食材标签
  if (props.ingredients.length > 0) {
    y += 20
    ctx.fillStyle = '#666'
    ctx.font = '20px "PingFang SC"'
    ctx.textAlign = 'left'
    ctx.fillText('今日食材：', 60, y)
    y += 30

    let x = 60
    const maxWidth = 480
    const lineHeight = 40
    let lineCount = 0

    props.ingredients.slice(0, 8).forEach((ingredient) => {
      const text = ingredient
      const textMetrics = ctx.measureText(text)
      const tagWidth = textMetrics.width + 24
      const tagHeight = 32

      // 换行逻辑
      if (x + tagWidth > maxWidth) {
        x = 60
        y += lineHeight
        lineCount++
      }

      if (lineCount > 1) return // 最多显示两行

      // 绘制药丸形标签
      ctx.fillStyle = '#E8F8EE'
      drawRoundRect(ctx, x, y - tagHeight + 8, tagWidth, tagHeight, 16)
      ctx.fill()

      // 标签文字
      ctx.fillStyle = '#5CB87A'
      ctx.font = '18px "PingFang SC"'
      ctx.textAlign = 'left'
      ctx.fillText(text, x + 12, y + 2)

      x += tagWidth + 12
    })
    y += 80
  }

  // AI 评语气泡
  y += 20
  ctx.fillStyle = '#FFF3E6'
  drawRoundRect(ctx, 50, y, 500, 100, 16)
  ctx.fill()

  ctx.fillStyle = '#F5A85B'
  ctx.font = 'bold 18px "PingFang SC"'
  ctx.textAlign = 'left'
  ctx.fillText('AI 评语', 70, y + 28)

  // 换行文字
  const feedbackLines = wrapText(ctx, props.feedback, 460, 16)
  ctx.fillStyle = '#666'
  ctx.font = '16px "PingFang SC"'
  feedbackLines.forEach((line, idx) => {
    ctx.fillText(line, 70, y + 52 + idx * 24)
  })
  y += 120

  // 底部信息
  y += 30
  ctx.fillStyle = '#999'
  ctx.font = '18px "PingFang SC"'
  ctx.textAlign = 'center'
  ctx.fillText('扫码记录宝宝饮食', 300, y)
  y += 40

  // 小程序码占位
  ctx.fillStyle = '#E8E8E8'
  drawRoundRect(ctx, 250, y, 100, 100, 8)
  ctx.fill()

  ctx.fillStyle = '#999'
  ctx.font = '12px "PingFang SC"'
  ctx.textAlign = 'center'
  ctx.fillText('小程序码', 300, y + 50)
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

function drawScoreCircle(ctx, x, y, radius, score, color) {
  // 背景圆
  ctx.fillStyle = '#F0F0F0'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // 分数进度圆弧
  const percentage = Math.min(score / 100, 1)
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + Math.PI * 2 * percentage

  ctx.strokeStyle = color
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x, y, radius - 5, startAngle, endAngle)
  ctx.stroke()
}

function wrapText(ctx, text, maxWidth, fontSize) {
  const lines = []
  let line = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const testLine = line + char
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth) {
      if (line) lines.push(line)
      line = char
    } else {
      line = testLine
    }
  }

  if (line) lines.push(line)
  return lines
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
      },
      this
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
