/**
 * 安全区域 Hook，统一导航栏顶部安全距离计算。
 * 优先使用胶囊按钮位置（更精准），降级使用 statusBarHeight。
 */
export function useSafeArea() {
  const sys = uni.getSystemInfoSync()
  const menu = uni.getMenuButtonBoundingClientRect?.()
  const safeTop = (menu ? menu.bottom + 8 : sys.statusBarHeight + 44) + 'px'
  return { safeTop }
}
