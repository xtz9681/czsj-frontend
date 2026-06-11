# 成长食记 — 前端项目说明

  ## 项目背景

  「成长食记」是面向新手妈妈的母婴全周期营养记录小程序。支持宝宝辅食记录 + 妈妈孕期/哺乳期营养管理 + AI 营养评分。

  **详细 PRD**：`/Users/xutianzhe/czsj/成长食记 — PRD（母婴全周期营养助手）.md`
  **技术架构**：`/Users/xutianzhe/czsj/成长食记 — Stage 1 技术架构文档.md`

  ## 技术栈

  - 前端框架：**uni-app + Vue 3**（一份代码出微信小程序）
  - UI 组件库：**wot-design-uni**（必用，不要用 vant / element 等其他库）
  - 语法：`<script setup>` 组合式 API
  - 状态管理：Pinia（如果需要）
  - 后端 API：Spring Boot（不在本项目目录，假设走 `/api/*` 路径）

  ## 视觉规范

  - 主色：`#F5A85B`（奶油橙）—— 按钮、强调、主操作
  - 副色：`#A3D9B1`（薄荷绿）—— 健康/营养相关、积极反馈
  - 辅色：`#FF8FA3`（柔粉）—— 母婴相关元素
  - 警示色：`#E07A5F`（暖红橙）—— 过敏警告（用暖红不用刺眼红）
  - 中性色：`#FAF7F2`（暖白背景）/ `#F0E9DE`（分割线）/ `#3D3935`（深色文字）
  - 字体：PingFang SC / OPPO Sans
  - 圆角：16rpx 卡片 / 8rpx 按钮
  - 阴影：`box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05)`（轻柔感）

  ## 代码风格

  - 单位：必须用 `rpx`（750 设计稿），不要用 px
  - 命名：组件 PascalCase，文件 kebab-case
  - API 请求：封装在 `api/` 目录，每个模块一个文件（如 `api/meal.js`）
    - **重要**：写调用后端接口或修改接口调用之前，**必须先扫描后端代码**（`/Users/xutianzhe/czsj` 下的后端项目）
    - 找到对应的 Controller、DTO、接口规范和参数定义后，再写前端代码
    - 这样避免参数不匹配或接口变更导致的问题
  - 数据：先用 ref + mock 数据让 UI 跑起来，API 调用留 TODO 注释
  - 国际化：暂不做，中文硬编码

  ## 目录结构

  frontend/
  ├── pages/                # 页面
  │   ├── index/            # 首页
  │   ├── login/            # 微信登录
  │   ├── profile/          # 宝宝档案
  │   ├── setup/            # 初始设置引导
  │   ├── mother-profile/   # 妈妈档案
  │   ├── mine/             # 我的
  │   ├── meal-record/      # 记一餐（主路径）
  │   ├── camera/           # 拍照识食材
  │   ├── meal-list/        # 历史记录
  │   ├── allergy/          # 过敏管理
  │   ├── plan/             # AI 周计划
  │   ├── growth-record/    # 宝宝生长记录
  │   └── weight-record/    # 妈妈体重记录
  ├── components/           # 公共组件
  │   ├── SubjectSelector.vue
  │   └── camera/           # 拍照识食材子组件
  │       ├── RecognitionResult.vue   # 高置信度识别结果确认
  │       ├── IngredientPicker.vue    # 低置信度 fallback 食材勾选
  │       └── RecordActions.vue       # 动作按钮组（记录/记录我的/记录多个）
  ├── api/                  # 后端 API 封装
  │   ├── request.js        # 基础请求封装
  │   ├── auth.js           # wxLogin、getUserInfo
  │   ├── baby.js           # getBabyList、createBaby、updateBaby、deleteBaby、getGrowthRecords、addGrowthRecord
  │   ├── meal.js           # quickRecord、checkMultiRecordWarning、recordMultiple、getMealList、getIngredientsByAge、getDailySummary、getWeekSummary、deleteMeal、updateMeal、getFrequentIngredients
  │   ├── ai.js             # photoRecord、getWeeklyPlan、getLatestPlan
  │   ├── allergy.js        # getAllergyList、addAllergy、removeAllergy
  │   └── mother.js         # getMother、createMother、updateMother、getWeightRecords、addWeightRecord
  ├── store/                # Pinia 状态
  ├── utils/                # 工具函数
  ├── static/               # 图片字体等
  │   ├── empty/            # 空状态插图
  │   │   ├── no-meals.png
  │   │   ├── no-allergy.png
  │   │   ├── no-plan.png
  │   │   └── no-records.png
  │   └── ...
  ├── App.vue
  ├── main.js
  ├── manifest.json
  └── pages.json

  ## TabBar 结构

  - 首页 → `pages/index/index`
  - 记录 → `pages/meal-list/index`
  - 计划 → `pages/plan/index`
  - 我的 → `pages/mine/index`

  **注**：过敏管理从 TabBar 降为「我的」页面的子入口

  ## 关键产品决策

  1. **拍照识食材 + 智能 fallback**：拍照 → AI 识别 + 置信度判定 → 高置信度直接
  显示；低置信度无缝切换到「快速勾选」UI（不要弹「识别失败」的负面提示）
  2. **过敏预警必须显眼**：任何展示食材的地方，过敏食材要红色 + 警告 icon
  3. **温暖共情语气**：所有提示文案用温暖、不焦虑的话术（参考 PRD 5.1 AI
  对话风格）
  4. **免责声明**：AI 评分/建议结尾必须有「仅供参考，请咨询医生」

  ## 角色

  - 用户身份：Java 后端开发者，不熟前端
  - 你（Claude Code）的角色：直接写出可运行的代码，不要让他自己改
  - 写完代码后简短说明：改了哪些文件、关键变更是什么
  - 不要写 TypeScript（除非他要求），用 JavaScript 简化

  ## 不要做的事

  - ❌ 不要用 element-plus / vant 等其他 UI 库
  - ❌ 不要写 px 单位
  - ❌ 不要在文案里用「医生/治疗/诊断/营养师」等敏感词
  - ❌ 不要弹「错误」「失败」类负面提示，用温和措辞
  - ❌ 不要添加 TypeScript（除非明确要求）
  - ❌ 不要写过度复杂的状态管理（简单 ref 够用）

  ## 已实现的关键功能

  1. **多主体支持**：`SubjectSelector` 组件，支持宝宝+妈妈档案切换
  2. **首页营养概览**：调用 daily-summary 接口展示餐次/均分/食材/覆盖率四个指标
  3. **食材库**：从后端接口加载，支持搜索+分类+自定义输入
  4. **常用食材**：食材选择弹窗顶部展示最近 14 天高频食材
  5. **餐食编辑/删除**：meal-list 页支持删除，meal-record 页支持编辑
  6. **生长记录**：记录宝宝身高体重，查看历史
  7. **体重记录**：记录妈妈体重（支持孕周/产后天数），查看历史
  8. **Loading 状态**：所有异步加载页面均有 loading 提示，区分"加载中"和"确实为空"
  9. **返回确认**：meal-record 页有 onBackPress 防误触
  10. **camera 组件拆分**：拍照识食材页面拆为 3 个子组件（RecognitionResult / IngredientPicker / RecordActions），主页面仅负责拍照和 stage 调度
  11. **过敏页 tab 布局**：过敏管理页改为「已标记 / 添加新的」tab 切换，收纳四段式内容
  12. **妈妈营养标签卡片**：妈妈模式首页营养提示改为营养素标签 + 一句话口诀 + 折叠详情，视觉更轻盈
  13. **空状态插图**：各页面空状态从 emoji 升级为情感化插图（static/empty/ 目录）