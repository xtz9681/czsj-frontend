<template>
  <view class="score-poster-container">
    <!-- 圆弧进度环专用 canvas（type="2d"，用于动态生成弧线图） -->
    <canvas
      id="scoreRingCanvas"
      class="ring-canvas"
      type="2d"
      style="width: 140px; height: 140px;"
    ></canvas>
    <!-- 海报主 canvas（mp-painter 使用旧版 canvas-id） -->
    <canvas
      canvas-id="scorePosterCanvas"
      class="poster-canvas"
      style="width: 600px; height: 1000px;"
    ></canvas>
  </view>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
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
  subjectName: {
    type: String,
    default: '我'
  },
  avatarUrl: {
    type: String,
    default: '/static/images/avatar-default.png'
  }
})

const instance = getCurrentInstance()
const painter = ref(null)
const ringTempPath = ref('')

// 分数对应的颜色和评价
const scoreInfo = computed(() => {
  const s = props.score || 0
  if (s >= 90) return { color: '#5CB87A', label: '优秀' }
  if (s >= 80) return { color: '#F5A85B', label: '良好' }
  if (s >= 70) return { color: '#FFD700', label: '及格' }
  return { color: '#E07A5F', label: '需加油' }
})

// ── Step 1: 动态生成圆弧进度环图片 ──
async function generateRingImage() {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery().in(instance.proxy)
    query
      .select('#scoreRingCanvas')
      .node((res) => {
        if (!res || !res[0]) {
          // 如果 type="2d" canvas 不可用，回退到不显示进度环
          resolve('')
          return
        }

        const canvas = res[0]
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio

        canvas.width = 140 * dpr
        canvas.height = 140 * dpr
        ctx.scale(dpr, dpr)

        const centerX = 70
        const centerY = 70
        const outerRadius = 65
        const lineWidth = 10
        const scoreColor = scoreInfo.value.color

        // 背景圆环（灰色轨道）
        ctx.beginPath()
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
        ctx.strokeStyle = '#F0F0F0'
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.stroke()

        // 进度弧线（从顶部开始，顺时针画分数百分比）
        const percentage = Math.min(props.score / 100, 1)
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + Math.PI * 2 * percentage

        ctx.beginPath()
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
        ctx.strokeStyle = scoreColor
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.stroke()

        // 导出为临时图片
        uni.canvasToTempFilePath(
          {
            canvas: canvas,
            success(tempRes) {
              ringTempPath.value = tempRes.tempFilePath
              resolve(tempRes.tempFilePath)
            },
            fail(err) {
              // 导出失败时回退
              resolve('')
            }
          }
        )
      })
      .exec()
  })
}

// ── Step 2: 用 mp-painter 绘制海报主体 ──
async function renderPoster() {
  try {
    // 先生成圆弧进度环图片
    const ringSrc = await generateRingImage()

    const ctx = uni.createCanvasContext('scorePosterCanvas')
    painter.value = new Painter(ctx)

    const posterConfig = buildPosterConfig(ringSrc)

    await painter.value.draw(posterConfig)
  } catch (e) {
    console.error('renderPoster failed:', e)
    throw e
  }
}

function buildPosterConfig(ringSrc) {
  const scoreColor = scoreInfo.value.color

  // 食材药丸标签
  const ingredientElements = []
  if (props.ingredients.length > 0) {
    ingredientElements.push({
      type: 'text',
      content: '今日食材：',
      left: 60,
      top: 340,
      fontSize: 20,
      fontWeight: 'bold',
      color: '#666666'
    })

    props.ingredients.slice(0, 8).forEach((name, idx) => {
      const col = idx % 4
      const row = Math.floor(idx / 4)
      const tagLeft = 60 + col * 120
      const tagTop = 370 + row * 44

      ingredientElements.push({
        type: 'rect',
        left: tagLeft,
        top: tagTop,
        width: 100,
        height: 32,
        borderRadius: 16,
        background: '#E8F8EE'
      })
      ingredientElements.push({
        type: 'text',
        content: name,
        left: tagLeft + 50,
        top: tagTop + 20,
        fontSize: 16,
        color: '#5CB87A',
        align: 'center'
      })
    })
  }

  const tagsRows = props.ingredients.length > 0
    ? Math.ceil(props.ingredients.slice(0, 8).length / 4)
    : 0
  const tagsHeight = tagsRows * 44 + 60
  const aiTop = 330 + tagsHeight

  const feedbackDisplay = props.feedback.length > 60
    ? props.feedback.substring(0, 60) + '...'
    : props.feedback

  const children = [
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
    // 头像（圆形裁剪）
    {
      type: 'clip',
      left: 60,
      top: 70,
      path: {
        type: 'rounded-rect',
        width: 64,
        height: 64,
        borderRadius: 32
      },
      content: {
        type: 'image',
        src: props.avatarUrl,
        width: 64,
        height: 64,
        objectFit: 'cover'
      }
    },
    // 名字
    {
      type: 'text',
      content: props.subjectName,
      left: 140,
      top: 80,
      fontSize: 22,
      fontWeight: 'bold',
      color: '#3D3935'
    },
    // 副标题
    {
      type: 'text',
      content: '今日营养评分',
      left: 140,
      top: 108,
      fontSize: 18,
      color: '#999999'
    }
  ]

  // 圆弧进度环（如果有动态生成的图片）
  if (ringSrc) {
    children.push({
      type: 'image',
      src: ringSrc,
      left: 230,
      top: 170,
      width: 140,
      height: 140
    })
  } else {
    // 回退：灰色圆底
    children.push({
      type: 'rect',
      left: 230,
      top: 170,
      width: 140,
      height: 140,
      borderRadius: 70,
      background: '#F0F0F0'
    })
  }

  // 分数数字
  children.push({
    type: 'text',
    content: String(props.score),
    left: 300,
    top: 225,
    fontSize: 44,
    fontWeight: 'bold',
    color: scoreColor,
    align: 'center'
  })

  // 评价标签
  children.push({
    type: 'text',
    content: scoreInfo.value.label,
    left: 300,
    top: 260,
    fontSize: 20,
    color: scoreColor,
    align: 'center'
  })

  // 食材标签
  children.push(...ingredientElements)

  // AI 评语气泡
  children.push({
    type: 'rect',
    left: 50,
    top: aiTop,
    width: 500,
    height: 110,
    borderRadius: 16,
    background: '#FFF3E6'
  })
  children.push({
    type: 'text',
    content: 'AI 评语',
    left: 70,
    top: aiTop + 24,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5A85B'
  })
  children.push({
    type: 'text-block',
    content: feedbackDisplay,
    left: 70,
    top: aiTop + 52,
    width: 460,
    fontSize: 16,
    color: '#666666',
    lineHeight: 24
  })

  // 底部
  children.push({
    type: 'text',
    content: '成长食记 · 记录每一餐的营养',
    left: 300,
    top: 850,
    fontSize: 18,
    color: '#999999',
    align: 'center'
  })
  children.push({
    type: 'rect',
    left: 250,
    top: 880,
    width: 100,
    height: 100,
    borderRadius: 8,
    background: '#E8E8E8'
  })
  children.push({
    type: 'text',
    content: '小程序码',
    left: 300,
    top: 930,
    fontSize: 12,
    color: '#999999',
    align: 'center'
  })

  return {
    type: 'container',
    direction: 'vertical',
    width: 600,
    height: 1000,
    background: '#FAF7F2',
    children
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

.ring-canvas {
  width: 140px;
  height: 140px;
}

.poster-canvas {
  width: 600px;
  height: 1000px;
}
</style>
