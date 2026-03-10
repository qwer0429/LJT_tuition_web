import Cookies from 'js-cookie'

const TokenKey = 'vue_admin_template_token'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  // 设置 cookie，path 为根路径，确保所有页面都能访问
  return Cookies.set(TokenKey, token, { path: '/' })
}

export function removeToken() {
  return Cookies.remove(TokenKey, { path: '/' })
}
