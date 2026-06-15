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
  - **过敏列表读取规范**：所有页面通过 `useUserStore().allergyList`（computed）读取过敏列表，不再直接 `uni.getStorageSync('allergyList')`。修改过敏后调用 `useUserStore().loadAllergyList()` 刷新 store。过敏检测字段名统一使用 `(a.ingredientName || a.name)`，因为后端 AllergyResponse 返回的字段名是 ingredientName。
  - **日期计算规范**：获取本地日期字符串时使用 `const d = new Date(); return \`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}\``，不要用 `toISOString().split('T')[0]`（后者受 UTC 时区偏移影响）。解析后端返回的 ISO 时间字符串时使用 `new Date(isoStr)` 转本地时间再取日期，不要直接 `split('T')[0]`。
  - **安全区适配规范**：所有自定义导航栏页面统一使用 `useSafeArea()` 获取 safeTop，不再各自计算 statusBarHeight。useSafeArea 优先使用胶囊按钮位置（更精准），降级使用 statusBarHeight + 44px。
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
  │   ├── meal.js           # quickRecord、checkMultiRecordWarning、recordMultiple、getMealList(babyId, page, size, date可选)、getIngredientsByAge、getDailySummary、getWeekSummary、deleteMeal、updateMeal、getFrequentIngredients、getMealById
  │   ├── ai.js             # photoRecord、getWeeklyPlan、getLatestPlan、askAi、getChatHistory、clearChatHistory
  │   ├── allergy.js        # getAllergyList、addAllergy、removeAllergy
  │   ├── mother.js         # getMother、createMother、updateMother、getWeightRecords、addWeightRecord
  │   ├── reminder.js       # subscribeReminder、getReminderList、toggleReminder、deleteReminder
  │   └── record.js         # deleteGrowthRecord、deleteWeightRecord
  ├── store/                # Pinia 状态
  │   ├── user.js           # 用户状态（token、userId、babies、currentBabyId、mother、allergyList）
  │   └── meal.js           # 餐食状态（pendingMeal）
  ├── composables/          # 组合式函数
  │   └── useSafeArea.js    # 安全区域 Hook（导航栏顶部安全距离）
  ├── utils/                # 工具函数
  │   └── age.js            # calcAgeMonths(birthday) 计算月龄、formatAge(birthday) 格式化为"X 个月"或"X 岁 X 个月"
  ├── constants/            # 常量枚举
  │   └── phase.js          # phaseMap 妈妈阶段枚举值到中文的映射（备孕/孕早/孕中/孕晚/哺乳/日常）
  ├── static/               # 图片字体等
  │   ├── empty/            # 空状态插图
  │   │   ├── no-meals.png
  │   │   ├── no-allergy.png
  │   │   ├── no-plan.png
  │   │   └── no-records.png
  │   ├── icons/            # UI 图标（替代 emoji）
  │   │   ├── avatar-girl.png
  │   │   ├── avatar-boy.png
  │   │   ├── avatar-mother.png
  │   │   ├── avatar-baby.png
  │   │   ├── icon-camera.png
  │   │   ├── icon-manual.png
  │   │   ├── icon-plan.png
  │   │   ├── icon-bottle.png
  │   │   ├── icon-mother-profile.png
  │   │   ├── icon-allergy.png
  │   │   ├── icon-growth.png
  │   │   ├── icon-weight.png
  │   │   ├── meal-breakfast.png
  │   │   ├── meal-lunch.png
  │   │   ├── meal-dinner.png
  │   │   └── meal-snack.png
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

  ## 页面列表

  - `pages/login/index` - 微信登录，勾选隐私政策确认
  - `pages/index/index` - 首页，宝宝成长卡片、快速记餐
  - `pages/meal-list/index` - 饮食记录列表
  - `pages/meal-record/index` - 记一餐（手动/拍照）
  - `pages/camera/index` - 拍照识食材，AI 首次使用确认
  - `pages/plan/index` - AI 周计划
  - `pages/profile/index` - 宝宝档案，新建时需监护人确认
  - `pages/mother-profile/index` - 妈妈档案
  - `pages/growth-record/index` - 生长记录
  - `pages/weight-record/index` - 体重记录
  - `pages/allergy/index` - 过敏管理
  - `pages/reminder/index` - 用餐提醒
  - `pages/privacy/index` - 隐私政策
  - `pages/ai-chat/index` - AI 营养师
  - `pages/setup/index` - 初始化流程
  - `pages/mine/index` - 我的

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
  14. **图标替换**：头像、功能入口、餐次类型、妈妈阶段、性别选择、登录/设置页的 emoji 全部替换为 AI 生成的风格统一图标（static/icons/ 目录，共 29 张）
  15. **样式规范统一**：
      - Loading/空状态样式提取到 App.vue 全局
      - 卡片样式复用全局 .card class
      - 灰色文字色统一（#3D3935 主文字、#666 辅助、#999 弱提示）
      - 自造颜色收敛到设计系统（#E87D3F/#C04B32/#D4644C/#B07030 统一为标准色）
      - 页面水平间距统一为 40rpx
  16. **数据传递规范统一**：pendingMeal 从 uni.storage 迁移到 Pinia store（store/meal.js），URL 仅传 ID 类参数，storage 仅做持久化
  17. **动画优化**：评分圆圈缩放弹入 + 数字滑入、列表卡片依次淡入上滑、页面切换 slide-in-right 过渡（全局 CSS 动画 class 定义在 App.vue）
  18. **营养趋势可视化**：安装 @qiun/ucharts，首页新增近 7 天营养评分折线图卡片，调用 /meal/nutrition-trend 接口（付费功能，402 时静默隐藏）
  19. **月龄里程碑提醒**：首页新增里程碑卡片，根据宝宝月龄展示当前阶段饮食建议和下一个里程碑预告（8 个月龄节点：4/6/8/10/12/15/18/24 月，纯前端硬编码）
  20. **AI 即时问答**：支持多轮对话，前端维护最近 5 轮历史传给后端；对话持久化到 ai_chat_messages 表，进入页面自动加载历史，"开启新对话"清空前后端历史
  21. **用餐提醒**：「我的」页面新增用餐提醒入口，用户可设置早/午/晚餐提醒时间，通过 wx.requestSubscribeMessage 授权后，后端定时发送微信订阅消息提醒记餐（需微信小程序环境，模板 ID 待配置）
  22. **多档案异步评分轮询**：多档案提交后，前端轮询 GET /meal/{mealId} 接口等待 AI 评分完成，3 秒间隔，30 秒超时；单档案提交仍为同步返回评分结果
  23. **删除记录**：growth-record 和 weight-record 页面删除功能已接入后端 DELETE API
  24. **合规确认机制**：
      - 隐私政策页面（pages/privacy/index）：完整的数据收集、使用、存储、安全、用户权利、儿童保护、AI 免责声明
      - 登录页勾选：用户需勾选《隐私政策》才能登录，登录按钮动态启用/禁用
      - 宝宝档案监护人确认：新建宝宝时需勾选"我确认是该宝宝的监护人"，编辑模式下不需要
      - AI 首次使用提示：首次使用拍照识食材或拍照记餐时，弹出 AI 使用须知，用户确认后存储到本地缓存，后续使用不再提示
  25. **过敏列表 Store 统一管理**：allergyList 从 Storage 缓存改为 Pinia store（user.js 的 allergyList state + loadAllergyList action）。4 个页面（camera、meal-record、mine、allergy）统一从 store 读取，allergy 页修改后调用 store.loadAllergyList() 刷新。过敏检测字段名统一用 (a.ingredientName || a.name) 兼容后端返回格式。
  26. **meal-list 触底分页**：历史记录改为初始拉 20 条 + 触底加载下一页，有 noMore 标志位和 loading 态。删除记录和页面重入时通过 resetAndLoad() 重置分页状态再刷新。
  27. **首页按日筛选**：loadTodayMeals 改为传 date 参数给后端筛选今日记录，删除前端 .filter() 过滤。date 用本地日期计算（getFullYear/getMonth+1/getDate + padStart），避免 UTC 时区偏移。
  28. **mealTime 时区兼容**：meal-list 中解析后端返回的 Instant 格式 mealTime 时，改用 new Date(isoStr) 转本地日期再取年月日（toLocalDateStr 函数），不再用 split('T')[0] 取 UTC 日期。
  29. **photoRecord 401 处理**：uni.uploadFile 的 success 回调增加 401 状态码处理（清除 token + reLaunch 跳转登录页），不再走 else 通用错误分支导致用户被锁死在无效会话。
  30. **ai-chat 安全区适配**：导航栏加 :style="{ paddingTop: safeTop }" 动态绑定（statusBarHeight + 44px），与 camera 页面写法一致。
  31. **用餐提醒模板 ID**：MEAL_REMINDER_TPL_ID 当前为占位符 'your-template-id-here'，需在上线前替换为微信公众平台申请的真实模板 ID（上线阻断项）。
