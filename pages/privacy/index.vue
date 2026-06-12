<template>
  <view class="page-container">
    <view class="header">
      <text class="title">隐私政策</text>
    </view>
    <scroll-view class="content-scroll" scroll-y>
      <view class="content">
        <view class="section">
          <text class="section-title">1. 信息收集范围</text>
          <text class="section-text">
            本应用在您使用过程中会收集以下个人信息：
            • 宝宝昵称、出生日期
            • 宝宝喂养记录，包括食材名称、进食时间和进食量
            • 宝宝成长数据，包括身高、体重、测量时间
            • 妈妈体重数据及测量时间
            • 用户登录时的微信账号信息（微信 ID、昵称、头像）

            收集这些信息是为了提供个性化的营养评估和成长记录服务。
          </text>
        </view>

        <view class="section">
          <text class="section-title">2. 信息使用目的</text>
          <text class="section-text">
            收集的个人信息将仅用于以下目的：
            • 提供 AI 营养评分与个性化建议
            • 记录和追踪宝宝及家庭成员的成长轨迹
            • 生成营养趋势分析报告
            • 改进和优化应用服务质量
            • 遵守法律法规要求

            我们不会将您的信息用于上述目的之外的任何用途，也不会向您发送未经同意的营销信息。
          </text>
        </view>

        <view class="section">
          <text class="section-title">3. 第三方服务说明</text>
          <text class="section-text">
            本应用集成以下第三方 AI 服务以提供功能支持：

            • DeepSeek（文本分析）：用于分析食材营养信息和生成营养建议。仅传递食材文本描述，不涉及个人身份信息。

            • 阿里云通义千问（图片识别）：用于识别用户上传的食物照片中的食材。仅传递食物照片和宝宝月龄，不传递个人身份信息或其他敏感数据。

            • 微信登录授权：使用微信官方接口实现账号登录，遵循微信官方隐私政策。

            这些第三方服务提供商已承诺遵守相关数据保护法规。
          </text>
        </view>

        <view class="section">
          <text class="section-title">4. 数据存储与安全</text>
          <text class="section-text">
            • 数据存储：您的所有个人信息存储在阿里云服务器上，位置为中国大陆。

            • 传输安全：应用与服务器间的所有通信均采用 HTTPS 加密传输协议，确保数据在传输过程中的机密性和完整性。

            • 访问认证：系统使用 JWT（JSON Web Token）技术进行身份认证，仅授权用户可访问其自己的数据。

            • 访问控制：我们实施严格的数据访问控制措施，限制员工对用户数据的访问权限。

            虽然我们采取了必要的安全措施，但互联网传输和数据存储无法保证 100% 的安全性。您需要妥善保管账号密码。
          </text>
        </view>

        <view class="section">
          <text class="section-title">5. 用户权利</text>
          <text class="section-text">
            根据相关法律，您享有以下权利：

            • 查看权：您可以访问应用内的"我的"页面查看已记录的所有宝宝信息、成长数据和喂养记录。

            • 修改权：您可以随时修改宝宝档案、成长记录和喂养记录中的信息。

            • 删除权：您可以删除特定的记录或整个宝宝档案。删除后的数据将从活跃数据库中永久移除。

            • 注销权：您可以在"我的"页面的设置中注销账号。注销后，您的所有个人数据将按照法律要求进行处理。

            如需行使这些权利或有任何疑问，请通过应用内反馈功能联系我们。
          </text>
        </view>

        <view class="section">
          <text class="section-title">6. 儿童信息保护</text>
          <text class="section-text">
            根据中华人民共和国《儿童个人信息网络保护规定》：

            • 本应用主要针对监护人使用，用于记录 14 岁以下儿童的成长和营养数据。

            • 在收集、使用、转移儿童个人信息前，我们将征求监护人的同意。

            • 监护人可随时查看、修改或删除其监护的儿童的个人信息。

            • 如您发现我们可能违反了儿童信息保护相关规定，请立即通过反馈功能联系我们。
          </text>
        </view>

        <view class="section">
          <text class="section-title">7. AI 免责声明</text>
          <text class="section-text">
            • AI 生成的食材识别结果、营养评分和营养建议仅供参考，不代表权威医学或营养学意见。

            • AI 不能替代医生、营养师或其他医疗专业人员的专业建议。

            • 如宝宝或家庭成员存在过敏、消化问题或其他健康问题，请在获得专业医生或营养师的建议后再参考 AI 建议。

            • 对于 AI 识别错误或建议不当导致的任何后果，本应用概不负责。使用本应用的用户自行承担所有风险。

            • 我们持续改进 AI 算法，欢迎您反馈 AI 识别或建议中存在的问题，帮助我们提升服务质量。
          </text>
        </view>

        <view class="section">
          <text class="section-title">8. 联系方式</text>
          <text class="section-text">
            如您对本隐私政策有任何疑问、建议或投诉，以及如需行使前述权利，请通过以下方式与我们联系：

            • 应用内反馈：点击"我的"页面中的"意见反馈"功能，向我们提交您的问题或建议。

            我们将在收到您的反馈后 15 个工作日内做出响应。
          </text>
        </view>

        <view class="section">
          <text class="section-title">9. 政策更新</text>
          <text class="section-text">
            • 本隐私政策最后更新于 2026 年 6 月。

            • 我们可能会根据法律变化或业务需要更新本政策。更新后的政策将在应用中发布，重要变更将在更新前通过应用内通知等方式告知用户。

            • 您继续使用本应用即表示您接受更新后的隐私政策。

            感谢您对成长食记的信任与支持！
          </text>
        </view>

        <view class="footer-spacer"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
// Privacy policy page
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
}

.header {
  padding: 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
}

.content {
  padding: 40rpx;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.section-text {
  display: block;
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.footer-spacer {
  height: 40rpx;
}
</style>
