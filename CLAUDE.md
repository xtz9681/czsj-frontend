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
- **登录流程规范**：微信登录时调用 `uni.getUserProfile()` 获取用户昵称和头像，与 code 一起发给后端保存到 users 表；getUserProfile 可能返回匿名数据或被拒绝，此时 nickName 和 avatarUrl 为空字符串，不影响登录（fallback 到仅 openid 登录）
- **过敏列表读取规范**：所有页面通过 `useUserStore().allergyList`（computed）读取过敏列表，不再直接 `uni.getStorageSync('allergyList')`。修改过敏后调用 `useUserStore().loadAllergyList()` 刷新 store。过敏检测字段名统一使用 `(a.ingredientName || a.name)`，因为后端 AllergyResponse 返回的字段名是 ingredientName。
- **日期计算规范**：获取本地日期字符串时使用 `const d = new Date(); return \`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}\``，不要用 `toISOString().split('T')[0]`（后者受 UTC 时区偏移影响）。解析后端返回的 ISO 时间字符串时使用 `new Date(isoStr)` 转本地时间再取日期，不要直接 `split('T')[0]`。
- **安全区适配规范**：所有自定义导航栏页面统一使用 `useSafeArea()` 获取 safeTop，不再各自计算 statusBarHeight。useSafeArea 优先使用胶囊按钮位置（更精准），降级使用 statusBarHeight + 44px。
- **错误处理规范**：所有 API 调用的 catch 块都必须使用 `useErrorHandler()` 统一处理，不要硬编码错误提示。后端返回的具体错误信息（如"6个月以下宝宝不能吃蜂蜜"）会自动显示给用户，无需前端重复处理。详见 `ERROR_HANDLING.md`。
- **会员状态管理**：isPaid 由后端 FeatureService.isPaidUser 实时计算并通过登录接口与 GET /auth/me 返回。前端通过 userStore.isPaid（computed）读取，不再有硬编码。sync 方式：App.vue 冷启动调 syncUserInfo，plan 页 onShow 也调一次（因为后台手工 SQL 开通会员，用户不重新登录也要感知）。**严禁用 setLoginResult 处理 /auth/me 的响应，因为该接口 token 为 null，会导致用户掉登录**；改用 syncUserInfo(res)，它只同步 babies / mother / isPaid，不碰 token 和 userId，并会处理宝宝被删的边界情况。
- 数据：先用 ref + mock 数据让 UI 跑起来，API 调用留 TODO 注释
- 国际化：暂不做，中文硬编码

## 目录结构

  frontend/
  ├── pages/                # 页面
  │   ├── index/            # 首页
  │   ├── login/            # 微信登录
  │   ├── profile/          # 宝宝档案
  │   ├── setup/            # 初始设置引导
  │   ├── onboarding/       # 新手引导
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
  │   ├── SubjectSelector.vue       # 档案选择器（含宝妈档案编辑入口）
  │   ├── ScorePoster.vue           # 营养评分海报生成（canvas + mp-painter）
  │   ├── CustomIngredientDialog.vue # 用户自定义食材录入弹窗（名称 + 15 类分类选择）
  │   └── camera/           # 拍照识食材子组件
  │       ├── RecognitionResult.vue   # 高置信度识别结果确认
  │       ├── IngredientPicker.vue    # 低置信度 fallback 食材勾选
  │       └── RecordActions.vue       # 动作按钮组（记录/记录我的/记录多个）
  ├── api/                  # 后端 API 封装
  │   ├── request.js        # 基础请求封装
  │   ├── auth.js           # wxLogin、getUserInfo（校验 token 有效性）
  │   ├── baby.js           # getBabyList、createBaby、updateBaby、deleteBaby、getGrowthRecords、addGrowthRecord、uploadBabyAvatar
  │   ├── meal.js           # record、checkMultiRecordWarning、getMealList(subjectId, subjectType, page, size, date可选)、getIngredients、getDailySummary、getWeekSummary、deleteMeal、updateMeal、getFrequentIngredients、getMealById、parseFoodText(description)、createIngredient(name, category)
  │   ├── ai.js             # photoRecord、getWeeklyPlan、getLatestPlan、askAi、getChatHistory、clearChatHistory
  │   ├── allergy.js        # getAllergyList、addAllergy、removeAllergy
  │   ├── mother.js         # getMother、createMother、updateMother、getWeightRecords、addWeightRecord
  │   ├── reminder.js       # subscribeReminder、getReminderList、toggleReminder、deleteReminder
  │   └── record.js         # deleteGrowthRecord、deleteWeightRecord
  ├── store/                # Pinia 状态
  │   ├── user.js           # 用户状态（token、userId、babies、currentBabyId、mother、allergyList）
  │   └── meal.js           # 餐食状态（pendingMeal）
  ├── composables/          # 组合式函数
  │   ├── useSafeArea.js    # 安全区域 Hook（导航栏顶部安全距离）
  │   └── useAiDisclaimer.js # AI 免责声明 Hook（camera 与 meal-record 共用，storage key ai_disclaimer_confirmed）
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
  - `pages/meal-record/index` - 记一餐（手动 / 拍照 / AI 文字拆食材）
    - **AI 文字拆食材入口**：食材清单上方独立卡片，包含最长 200 字的描述输入框和「AI 帮我拆食材」按钮。调用 api/meal.js 的 parseFoodText 走 POST /meal/parse-text，AI 识别结果（recognized 食材名 + newIngredients 新入库食材）按 name 去重后追加到 form.ingredients，绝不覆盖用户已选食材。后端返回 confidence 为 low 时展示黄色「描述有点模糊，识别结果可能不准，记得核对下食材清单」提示但不阻断使用；newIngredients 非空时显示绿色轻提示「已把 XX 加入食材库」，2 秒后自动消失。复用拍照识别的每日 3 次免费额度，超限或网络异常时走 handleError 提示且消耗额度（后端 @RequiresFeature 前置切面控制）；AI 调用失败不阻断继续手动选食材和保存。
    - **克重（amount）已全部移除**：form.ingredients 不再携带 amount 字段，食材行只显示过敏图标 / emoji / 名称 / 删除按钮。提交给后端的 ingredients 仍是纯食材名称数组。
    - **编辑出口的状态清理**：编辑保存成功（第 823 行）和点取消（cancelEdit 函数）两条出口都会调 resetAiParseState() 重置 usedAiParse / foodDescription / lowConfidenceWarning / newIngredientsAdded 四个 AI 拆食材状态，避免跨页面操作导致来源标记串味。
    - **source 字段传值**：POST /meal/record 的 source 字段规则为 AI 拆食材成功后传 TEXT_AI、有 recognitionId（拍照来源）传 PHOTO、其余传 MANUAL；编辑接口 updateMeal 不传 source。
  - `pages/camera/index` - 拍照识食材，AI 首次使用确认
  - `pages/plan/index` - AI 周计划
  - `pages/profile/index` - 宝宝档案，新建时需监护人确认，阶段根据出生日期自动推断并只读显示；编辑模式下阶段仍可手动修改
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
  11. **过敏页 tab 布局**：过敏管理页改为「已标记 / 添加新的」tab 切换，收纳四段式内容；支持主体切换（BABY/MOTHER），切换后动态重新加载对应主体的过敏数据；BABY 时显示月龄禁忌、MOTHER 时显示哺乳期常见过敏原
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
  18. **营养趋势可视化**：安装 @qiun/ucharts，首页新增近 7 天营养评分折线图卡片，调用 /meal/nutrition-trend 接口（付费功能，402 时静默隐藏）；X 轴用 M/D 短日期格式（8/19、8/20）避免重叠；全部无评分时显示空态文案「这周还没有评分记录，记一餐就能看到趋势啦~」不画图表，部分无评分时仅绘制有评分的天；canvas 宽度取容器实际宽度避免拉伸发糊
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
  32. **Token 有效性校验**：App.vue onLaunch 有 token 时调 GET /auth/me 校验，401 则清除 token 跳登录页，防止过期 token 导致所有请求返回 401
  33. **宝宝头像上传**：profile 页选择头像后上传到 OSS（POST /baby/{id}/avatar），先本地预览再替换为签名 URL；新建档案时头像仅本地预览，保存后才上传；uploadBabyAvatar 已统一解包 ApiResponse（code=0 时 resolve(data)，业务错误时 reject），参照 photoRecord 实现
  34. **新手引导流程**：首次登录后 setup 完成 → profile 完成 → 跳 onboarding 页，分 3 步引导用户选择宝宝阶段、标记常见过敏、记第一餐；完成后标记 onboarded 不再触发
  35. **宝妈档案入口提升**：SubjectSelector 组件中妈妈选项旁增加"编辑我的信息 ›"快捷入口，点击 @tap.stop 跳转 mother-profile 编辑模式
  36. **营养评分一键分享**：meal-record 页面评分结果卡片下方增加"分享给朋友"按钮。海报由两部分组成：
      - type="2d" canvas 根据分数 0-100 动态生成圆弧进度环图片
      - mp-painter 用声明式 JSON 绘制海报主体（container + children）
      - 包含：圆形头像（clip 裁剪）、独立药丸形食材标签、AI 评语气泡
      - 支持保存到相册或分享给微信好友
  37. **档案相关页无宝宝时流畅跳转**：mine 页面点击「宝宝档案」或「生长记录」无宝宝时，直接跳转到宝宝创建页面（而非仅显示 toast），用户可无障碍完成添加操作
  38. **宝宝阶段自动推断**：profile 页新建模式下，宝贝当前阶段根据出生日期自动计算并以只读文本展示（0-6月哺乳期、6-24月辅食期、24-36月幼儿期）；编辑模式下仍可手动修改；toddler 专属字段（断母乳/食物不耐受）在新建模式下也根据 autoPhase 动态显示
  39. **妈妈阶段自动推导与实时更新**：
      - 妈妈档案的 phase 字段由后端按预产期（dueDate）实时推导，边界为医学标准（孕 0-13 周孕早期、14-27 周孕中期、28 周及以上孕晚期），前端不做本地纠正
      - mother 对象新增字段：pregnancyWeek（当前孕周，非孕期为 null）、dueDatePassed（Boolean，预产期是否已过）
      - 首页 onShow 会调用 /mother 刷新 store 中的 mother，保证阶段随时间自动推进；刷新失败（NOT_FOUND 或网络异常）时静默忽略，沿用 storage 缓存
      - 妈妈模式下，若 dueDatePassed 为 true，首页营养卡片会显示"预产期已过啦，去更新一下档案吧～"提示，点击可编辑档案
      - mother-profile 页面删除了本地孕周纠正逻辑，calcPregnancyPhase 函数采用统一的 gestDays 计算（280 - 距今天数），确保前后端口径一致
  40. **AI 文字拆食材**：
      - 入口：meal-record 页面食材清单上方的独立卡片，包含最长 200 字的描述输入框（show-word-limit）和「AI 帮我拆食材」按钮（描述为空时 disabled）
      - API 调用：调用 api/meal.js 的 parseFoodText(description) 走 POST /meal/parse-text
      - 结果处理：后端返回 { recognized, newIngredients, confidence, reason }；recognized 是标准食材名列表，newIngredients 是本次新入库的食材名，confidence 反映描述清晰度（high/medium/low）
      - 去重追加：按 name 比对已选食材，重复项跳过（计数不增），新项追加到 form.ingredients 并按过敏列表标记 isAllergy
      - 用户反馈：全是重复项时提示「这些食材已经在清单里了」；否则提示「已添加 N 种食材」；confidence=low 时显示黄色提示「描述有点模糊，识别结果可能不准，记得核对下食材清单」但不阻断；newIngredients 非空时显示绿色轻提示「已把 XX 加入食材库」（2 秒自动消失）
      - 配额管理：复用拍照识别每日 3 次免费额度（后端 @RequiresFeature 前置切面），超限或网络异常时 handleError 提示且消耗额度；AI 调用失败不阻断继续手动操作
      - 清空输入：成功识别后自动清空 foodDescription
      - 状态追踪：接口成功返回后立即置 usedAiParse = true（用于后续 source 字段判断），两条编辑出口（保存成功、点取消）都会重置该状态
  41. **克重（amount）展示已全部移除**：
      - 界面展示：meal-record 食材行仅显示过敏图标（v-if isAllergy）/ emoji / 名称 / 删除按钮，无加减克重按钮
      - 数据结构：form.ingredients 每项仅含 { id, name, emoji, isAllergy, allergyDesc }，无 amount 字段
      - 后端传值：saveMeal 提交时 ingredients 仅传名称数组 ingredients.map(i => i.name)，克重完全由后端管理
      - 编辑回填：loadMealData 回填历史记录时按 allergyList 动态标记 isAllergy 和 allergyDesc，不硬编码 false/''
  42. **AI 免责声明可复用**：
      - 新增文件：composables/useAiDisclaimer.js，导出 useAiDisclaimer() 函数
      - 实现细节：内部用 ref 缓存 ai_disclaimer_confirmed 状态，首次调用 showAiDisclaimer() 时弹窗确认，用户确认后存储到 localStorage，后续调用直接返回 true 无需再弹
      - 调用方式：camera/index.vue 和 meal-record/index.vue 都通过 const { showAiDisclaimer } = useAiDisclaimer() 引入，在 takePhoto/chooseFromAlbum（camera）和 parseByAi（meal-record）前调用，返回 false 时中断后续 AI 操作
      - 返回值：Promise<boolean>，用户确认返回 true、用户取消返回 false，调用方必须检查返回值决定是否继续
  43. **record 接口 source 字段实时传值**（后端已启用 @RequiresFeature 和 source 解析）：
      - meal-record 的 saveMeal：source 字段由 usedAiParse.value ? 'TEXT_AI' : (form.value.recognitionId ? 'PHOTO' : 'MANUAL') 计算
      - camera 的两处直接调 record：recordToMother 和 onSubjectSelectorConfirm 都固定传 source: 'PHOTO'（recordToBaby 是 setPendingMeal 跳转至 meal-record，走后者的逻辑）
      - updateMeal 编辑接口：不传 source 字段，后端不更新来源
      - 状态清理机制：meal-record 的 cancelEdit 和编辑保存成功分支都调 resetAiParseState() 重置 usedAiParse、foodDescription、lowConfidenceWarning、newIngredientsAdded，避免跨页面操作污染来源标记
  44. **用户自定义食材入库流程**：
      - 触发点：meal-record「手动添加新食材」按钮、camera 高置信度「+ 添加」、camera 低置信度「+ 添加其他食材」
      - 流程：打开 CustomIngredientDialog（名称输入 + 15 类分类芯片网格）→ 用户填名称选分类 → confirm 时调 createIngredient(name, category) → 成功后把返回的食材加入清单 → 失败时 handleError 提示且不加入（保证清单数据一致性）
      - 校验：名称去空白后为空时 toast「请输入食材名称」；未选分类时 toast「请选择食材分类」；重复食材检查确保清单内无同名项
      - 分类选择方案：因微信小程序 uni.showActionSheet 的 itemList 上限 6 项，15 类分类选择采用 chip 网格布局（3 列）而非 actionSheet，视觉一致性与 meal-record 分类 tab 保持一致
      - API 幂等性：后端接口保证同名食材已存在时直接返回已有记录，前端无需额外处理「已存在」错误
      - 代码清理：meal-record 的旧 addCustomIngredient 直接 push 不入库的路径已彻底移除，手动添加食材的唯一入口是 CustomIngredientDialog；camera 页两处入口（高置信度「+ 添加」+ 低置信度「+ 添加其他食材」）共用同一个 openCustomIngredientDialog 函数打开弹窗，confirm 处理函数 handleCustomIngredientConfirm 按 stage 分流到对应清单，对非 high/low 阶段做前置守卫禁用操作
  45. **会员状态管理与动态刷新**：
      - isPaid 来源：后端 FeatureService.isPaidUser 实时计算，通过登录接口与 GET /auth/me 返回。前端通过 store/user.js 的 useUserStore().isPaid（computed）统一读取，不再有硬编码
      - 新增 syncUserInfo(res) 方法：store/user.js 新增此方法专门接收 /auth/me 响应，仅同步 babies / mother / isPaid，不碰 token 和 userId。**严禁用 setLoginResult 处理 /auth/me 的响应，因为该接口 token 为 null，会导致用户掉登录**
      - 两处刷新时机：1) App.vue 冷启动调 syncUserInfo(getUserInfo())；2) plan 页 onShow 也调一次（后台手工 SQL 开通会员，用户不重新登录也要感知）。两处都用 try/catch 静默处理异常，不中断主流程
      - plan 页改造：isPremium 改为 computed（读 userStore.isPaid），删除支付弹窗及相关死代码，banner 改为内测提示文案（「内测期间如需体验，请联系客服开通」），功能清单删除未实现项（PDF 报告、群体对比等）
      - 首页正确使用：index.vue 第 127/630 行的 isPaid 判断已正确，付费判断限制 AI 调用，不需要改动
  46. **plan 页面状态判定口径与日期推算**：
      - planReady 仅在成功解析出非空七天计划时才为 true；接口成功但结果为空时视为「本周还没有计划」
      - generatePlan/loadLatestPlan 中必须先用 `const parsed = parsePlanJson(res?.planJson, res?.weekStart)` 解析，weekStart 是后端返回的计划起始日期（yyyy-MM-dd），作为周一日期传入；weekStart 缺失时退回当前周一；所有日期字符串拼接用本地写法（getFullYear/getMonth+1/getDate + padStart），禁用 toISOString().split('T')[0]
      - generatePlan/loadLatestPlan 成功后赋值 `weekTips.value = res?.planJson?.tips || ''`（根级 tips 字段）；渲染周营养要点卡片（薄荷绿 #A3D9B1 浅色背景）；day.tip 保留做兼容
      - onShow 里的 initSubjectMode 改为只在当前选择无效时初始化（baby 模式但 currentBaby 不存在，或 mother 模式但 mother 档案不存在时重新初始化），否则保持用户当前选择（切到"我的营养"后跳走再回来不被打回宝宝 tab）
      - recordDay(day) 跳转时带 date 参数（如 `/pages/meal-record/index?date=xxx`）
  47. **plan 页面多主体支持（宝宝与妈妈）**：
      - 后端 API 变更：POST /plan/generate 和 GET /plan/latest 现支持 { subjectType, subjectId }，subjectType 可为 'baby' | 'user'，'user' 时 subjectId 传 userId
      - API 签名更新：getWeeklyPlan(subjectType, subjectId) 和 getLatestPlan(subjectType, subjectId)，两个函数均透传主体信息给后端
      - 妈妈版 planJson 结构与宝宝版一致（days[]、breakfast/lunch/dinner/snack、ingredients 等），parsePlanJson 和卡片渲染完全复用，妈妈版不含 grams 字段
      - 页内主体切换：plan 页新增 subjectMode 状态（'baby' | 'mother'），当同时存在宝宝档案和妈妈档案时顶部显示切换器（两个 tab：宝宝名字、我的营养），样式为选中态 #FFF3E6 底色 + #F5A85B 文字
      - 切换行为：切换主体时重置 planReady=false、weekPlan=[]，然后重新查询历史计划；不会自动触发生成（用户需显式点击生成按钮）
      - 付费引导 banner 文案改为通用表述：「结合月龄或孕期阶段、过敏史和近期饮食，自动生成 7 天饮食安排」
      - 核心目标：使纯孕期妈妈（无宝宝档案）也能生成个人周计划
      - 计划卡每餐渲染 note 字段为 💡 建议行（后端 AI note 为建议性语气），note 为空时不渲染
  48. **record 响应 allergyWarning（交叉过敏预警）展示规范**：
      - 后端 record() 返回的 MealResponse.allergyWarning 字段承载交叉过敏预警（如"蟹与已知过敏食材虾可能交叉过敏"）
      - 分工：meal-record 页 saveMeal 成功后收集 res 数组中所有非空 allergyWarning，存入 serverAllergyWarnings ref，在评分结果卡片上方用 allergy-block 暖红样式渲染；camera 页两处直接调 record 的地方（recordToMother、onSubjectSelectorConfirm）在成功返回后若有 allergyWarning，用 uni.showModal（标题"过敏小提醒"，内容拼接预警文案，确认按钮"我知道啦"）展示，用户点确认后再跳转；文案保持温暖不焦虑，禁用"错误""危险"等字眼
  49. **意见反馈自建功能（页面 + API 完整集成）**：
      - 新增页面 `pages/feedback/index` 和 API 模块 `api/feedback.js`，my 页面入口改为自建导航而非微信原生 open-type="feedback"
      - **API 模块** api/feedback.js：
        - uploadFeedbackImage(filePath)：上传单张反馈图片到 POST /feedback/image，使用 uni.uploadFile 与 Authorization Bearer token，成功返回 data.imageKey（后端签名 URL 对应的键）；401 时清 token 跳登录页，其他状态码或解析失败走 catch 返回温和错误提示
        - submitFeedback(data)：POST 请求 /feedback，body 为 { content (required, 最长 500 字), imageKeys (optional, 已上传图片键数组), contact (optional, 最长 64 字, 微信号或手机号) }
      - **反馈页布局**：三层卡片（反馈内容 textarea + 字数计数、截图网格 + 上传状态、联系方式 input）+ 提交按钮（#F5A85B, 88rpx 高）
        - 反馈内容卡片：textarea maxlength 500，实时显示"X/500" 字数，placeholder "描述一下你遇到的问题或建议吧…"
        - 截图卡片：最多 3 张，上传成功后显示缩略图（1:1 aspect-ratio），上传中 / 上传失败都有状态覆盖层，每张图上方有 ✕ 删除按钮（可删除任何状态的图），未达 3 张时显示"＋ 添加图片"占位符（虚线框）
        - 联系方式卡片：input maxlength 64，placeholder "微信号或手机号，方便我们联系你"（选填）
        - 提交按钮禁用条件：内容为空 OR 有图片仍在上传 OR 正在提交中；禁用时 opacity 0.5、pointer-events none
      - **流程**：选择图片后立即调 uploadFeedbackImage 上传（后台并发），不阻断用户继续编辑或删除；提交时检查内容非空、所有图片已完成（done 状态），收集 done 图片的 key 数组，调 submitFeedback；成功后显示 success 类型 toast "感谢你的反馈~"，1500ms 后 navigateBack
      - **页面样式**：#FAF7F2 背景，32rpx padding 卡片，16rpx border-radius，card class 复用，上传失败状态覆盖 rgba(224,122,95,0.3) 暖红色
      - **导航注册**：pages.json 在 /pages/reminder/index 之后注册 /pages/feedback/index
      - **mine 页修改**：反馈入口改从 `<button open-type="feedback">` 改为 `<view class="feature-item card" @tap="goToFeedback">`，完全复用 feature-item 卡片样式，删除 .feedback-btn 的 button 重置样式规则
      - **关键实现细节**：图片条目创建时必须用 reactive() 包裹——若在异步上传回调里直接修改原始对象属性，Vue 响应式系统无法感知，会导致状态遮罩与提交按钮禁用态不更新（本次已修复）

# 变更复检规则

1. 在对变更复检时，结合项目的代码进行复检，不能只根据给出的提示词来检查是否变更对了。

2. 在对变更复检时，结合项目的代码，查看完整代码逻辑是否正确，无业务问题，无编译错误等。

3. 如果变更涉及前端和后端代码，要两边的代码结合起来检查，不能只看一边来。

4. 复检必须**深入业务逻辑**，不能只做"有没有改"的形式检查。必须：

- 读取改动涉及的完整方法/函数代码，理解上下游数据流

- 验证改动后的逻辑是否和原有业务语义一致（如：缓存替换了查库，要确认分子/分母的计算逻辑没被破坏）

- 检查是否引入新的隐患（如：线程安全、空指针、类型不匹配等）

- 检查前后端数据格式变更是否两端一致（如：后端删了字段，前端也要同步删）

5. 复检中发现**可优化的地方或潜在隐患**，必须立即向用户指出并确认是否修复，**不要说"留后续优化"或"当前不阻断"**。由用户决定是否处理，不要替用户做跳过的决定。

# 问题分析规则

1. **禁止猜测**：遇到代码问题时，严禁凭经验或假设给出"可能的原因"。必须通过阅读实际代码、配置文件、依赖声明等来定位真正原因。

2. **深入代码验证**：在给出任何结论前，必须：

- 读取相关文件的完整代码，理解实际实现逻辑

- 检查配置文件（如 pages.json、package.json、main.js 等）确认依赖和注册情况

- 追踪组件/函数的引用链，确认是否被正确引入和使用

- 对比预期行为与实际代码的差异，找出根本原因

3. **结论必须有代码依据**：每个问题诊断结论都必须指出具体的代码位置（文件路径 + 行号或代码片段），不能只说"可能是 XX 问题"。
