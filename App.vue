<script>
  import { getUserInfo } from '@/api/auth.js'
  import { useUserStore } from '@/store/user.js'

  export default {
    onLaunch: async function() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.reLaunch({ url: '/pages/login/index' })
        return
      }

      // 校验 token 是否仍然有效，并同步最新的用户档案信息
      try {
        const res = await getUserInfo()
        // token 有效，同步最新的 babies / mother / isPaid
        useUserStore().syncUserInfo(res)

        // 启动时刷新过敏列表，避免依赖过期的 Storage 缓存
        useUserStore().loadAllergyList()

        // 判断是否需要跳转 setup 页面，用 store 当前值而非 storage 快照
        const store = useUserStore()
        if (store.babies.length === 0 && !store.mother) {
          uni.reLaunch({ url: '/pages/setup/index' })
        }
      } catch (e) {
        // token 无效（401 或其他错误），清除并跳登录页
        uni.removeStorageSync('token')
        uni.reLaunch({ url: '/pages/login/index' })
      }
    },
    onShow: function() {},
    onHide: function() {}
  }
</script>

<style lang="scss">
  page {
    background-color: #FAF7F2;
    color: #3D3935;
    font-family: 'PingFang SC', 'OPPO Sans', sans-serif;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .page-container {
    min-height: 100vh;
    background-color: #FAF7F2;
    box-sizing: border-box;
  }

  /* 通用卡片 */
  .card {
    background: #FFFFFF;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    padding: 32rpx;
  }

  /* 主按钮 */
  .btn-primary {
    background: #F5A85B;
    color: #FFFFFF;
    border-radius: 8rpx;
    font-size: 32rpx;
    font-weight: 600;
    border: none;
    height: 96rpx;
    line-height: 96rpx;
    text-align: center;
    display: block;
    width: 100%;
  }

  .btn-primary::after {
    border: none;
  }

  /* 次要按钮 */
  .btn-secondary {
    background: transparent;
    color: #F5A85B;
    border: 2rpx solid #F5A85B;
    border-radius: 8rpx;
    font-size: 30rpx;
    height: 88rpx;
    line-height: 88rpx;
    text-align: center;
    display: block;
    width: 100%;
  }

  /* 标签 */
  .tag {
    display: inline-block;
    padding: 4rpx 16rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
  }

  .tag-primary { background: #FFF3E6; color: #F5A85B; }
  .tag-mint { background: #E8F8EE; color: #5CB87A; }
  .tag-danger { background: #FDEEE9; color: #E07A5F; }

  /* 过敏警告 */
  .allergy-warning {
    color: #E07A5F;
    font-weight: 600;
  }

  /* 分割线 */
  .divider {
    height: 1rpx;
    background: #F0E9DE;
    margin: 24rpx 0;
  }

  /* 免责声明 */
  .disclaimer {
    font-size: 22rpx;
    color: #BBBBBB;
    text-align: center;
    padding: 16rpx 40rpx;
    line-height: 1.6;
  }

  /* Loading 状态（全局公共） */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 40rpx;
  }

  .loading-icon {
    font-size: 56rpx;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .loading-text {
    font-size: 26rpx;
    color: #999;
    margin-top: 16rpx;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* 空状态（全局公共） */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 40rpx;
  }

  .empty-img {
    width: 280rpx;
    height: 280rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 12rpx;
  }

  .empty-sub {
    font-size: 24rpx;
    color: #999;
  }

  /* 渐入上滑 */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30rpx);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 缩放弹入 */
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* 数字滚入（从下方滑入） */
  @keyframes countUp {
    from {
      opacity: 0;
      transform: translateY(20rpx);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 通用入场动画 class */
  .anim-fade-in-up {
    animation: fadeInUp 0.4s ease-out both;
  }

  .anim-scale-in {
    animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .anim-count-up {
    animation: countUp 0.5s ease-out both;
  }
</style>
