import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'

const service = axios.create({
  baseURL: '/sljt',
  timeout: 600000
})

service.interceptors.request.use(
  config => {
    if (store.getters.token) {
      // config.headers['Authorization'] = 'Bearer ' + getToken()
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (response.status >= 200 && response.status < 300) {
      if (res.code === 0) {
        Message({
          message: res.message || '操作失败',
          type: 'error',
          duration: 3 * 1000
        })
        return Promise.reject(res)
      } else {
        return res
      }
    }
    return res
  },
  error => {
    console.log('err' + error)
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
