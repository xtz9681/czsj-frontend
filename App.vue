<script>
  export default {
    onLaunch: function() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.reLaunch({ url: '/pages/login/index' })
        return
      }
      const babies = uni.getStorageSync('babies') || []
      const mother = uni.getStorageSync('mother')
      if (babies.length === 0 && !mother) {
        uni.reLaunch({ url: '/pages/setup/index' })
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
</style>
