import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || '/sljt',
  timeout: 600000
})

// 不需要token的白名单路径
const whiteList = [
  '/susers/auth/login/',
  '/susers/auth/check-password-strength/',
  '/susers/auth/public-key/',
  '/api/token/',
  '/api/refresh/'
]

// 判断请求是否在白名单中
function isWhiteList(url) {
  return whiteList.some(path => url.includes(path))
}

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 非白名单请求添加token
    if (!isWhiteList(config.url)) {
      const token = getToken()
      console.log('[HTTP] Request to:', config.url)
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token
        console.log('[HTTP] Added Authorization header')
      } else {
        console.warn('[HTTP] No token available for:', config.url)
      }
    } else {
      console.log('[HTTP] Whitelist URL, no token needed:', config.url)
    }
    return config
  },
  error => {
    console.log('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    const url = response.config.url
    
    // 如果返回的是文件流，直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    
    console.log('[HTTP] Response from:', url, 'has code:', res.code !== undefined)
    
    // 处理后端返回的格式
    // 格式1: 新接口格式 {code: 200/1, data: ..., message: ...}
    if (res.code !== undefined) {
      // code === 200 或 code === 1 都表示成功（兼容旧接口）
      if (res.code === 200 || res.code === 1) {
        return res
      }
      
      // code === 401 未登录或token过期
      if (res.code === 401) {
        MessageBox.confirm('登录状态已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
        return Promise.reject(new Error(res.message || '登录已过期'))
      }
      
      // code === 403 无权限
      if (res.code === 403) {
        Message({
          message: res.message || '没有权限执行此操作',
          type: 'error',
          duration: 3 * 1000
        })
        return Promise.reject(new Error(res.message || '没有权限'))
      }
      
      // 其他错误（code !== 200 且 code !== 1）
      console.error('[HTTP] API error from:', url, res)
      Message({
        message: res.message || '操作失败',
        type: 'error',
        duration: 3 * 1000
      })
      return Promise.reject(new Error(res.message || '操作失败'))
    }
    
    // 格式2: DRF 默认格式，直接返回数据
    // 例如: [{...}, {...}] 或 {...} 或 {count: 10, results: [...]}
    return res
  },
  error => {
    console.log('Response Error:', error)
    
    // 处理HTTP状态码错误
    const { response } = error
    if (response) {
      const status = response.status
      
      switch (status) {
        case 400:
          Message({
            message: response.data?.message || response.data?.detail || '请求参数错误',
            type: 'error',
            duration: 3 * 1000
          })
          break
        case 401:
          MessageBox.confirm('登录状态已过期，请重新登录', '提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            store.dispatch('user/resetToken').then(() => {
              location.reload()
            })
          })
          break
        case 403:
          Message({
            message: '没有权限执行此操作',
            type: 'error',
            duration: 3 * 1000
          })
          break
        case 404:
          Message({
            message: '请求的资源不存在',
            type: 'error',
            duration: 3 * 1000
          })
          break
        case 500:
          Message({
            message: '服务器内部错误',
            type: 'error',
            duration: 3 * 1000
          })
          break
        default:
          Message({
            message: error.message || '网络错误',
            type: 'error',
            duration: 3 * 1000
          })
      }
    } else {
      // 网络错误或请求超时
      Message({
        message: error.message || '网络请求失败，请检查网络连接',
        type: 'error',
        duration: 3 * 1000
      })
    }
    
    return Promise.reject(error)
  }
)

export default service
