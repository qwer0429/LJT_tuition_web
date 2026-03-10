import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'
import http from '@/utils/http'

const getDefaultState = () => {
  return {
    token: getToken(),
    name: '',
    avatar: '',
    userInfo: null,
    roles: []
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_USER_INFO: (state, userInfo) => {
    state.userInfo = userInfo
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  }
}

const actions = {
  // 用户登录
  login({ commit }, userInfo) {
    const { username, password, encrypted } = userInfo
    return new Promise((resolve, reject) => {
      http.post('/susers/auth/login/', {
        username: username.trim(),
        password: password,
        encrypted: encrypted || false
      }).then(response => {
        const { code, data, message } = response
        if (code === 200 && data) {
          const { token, user } = data
          commit('SET_TOKEN', token)
          setToken(token)
          // 保存用户信息
          commit('SET_USER_INFO', user)
          commit('SET_NAME', user.name || user.username)
          commit('SET_ROLES', user.is_superuser ? ['admin'] : ['user'])
          resolve(user)
        } else {
          reject(new Error(message || '登录失败'))
        }
      }).catch(error => {
        reject(error)
      })
    })
  },

  // 获取用户信息
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      http.get('/susers/auth/info/').then(response => {
        const { code, data, message } = response
        if (code === 200 && data) {
          commit('SET_USER_INFO', data)
          commit('SET_NAME', data.name || data.username)
          commit('SET_AVATAR', data.avatar || '')
          commit('SET_ROLES', data.roles || [])
          resolve(data)
        } else {
          reject(new Error(message || '获取用户信息失败'))
        }
      }).catch(error => {
        reject(error)
      })
    })
  },

  // 用户登出
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      http.post('/susers/auth/logout/').then(() => {
        removeToken()
        resetRouter()
        commit('RESET_STATE')
        resolve()
      }).catch(error => {
        // 即使请求失败也清除本地状态
        removeToken()
        resetRouter()
        commit('RESET_STATE')
        reject(error)
      })
    })
  },

  // 移除token（用于修改密码后重新登录）
  resetToken({ commit }) {
    return new Promise(resolve => {
      removeToken()
      commit('RESET_STATE')
      resolve()
    })
  },

  // 刷新token
  refreshToken({ commit, state }) {
    return new Promise((resolve, reject) => {
      // 从cookie或其他存储中获取refresh_token
      const refreshToken = state.userInfo?.refresh_token
      if (!refreshToken) {
        reject(new Error('没有刷新token'))
        return
      }
      
      http.post('/susers/auth/refresh-token/', {
        refresh_token: refreshToken
      }).then(response => {
        const { code, data, message } = response
        if (code === 200 && data && data.token) {
          commit('SET_TOKEN', data.token)
          setToken(data.token)
          resolve(data.token)
        } else {
          reject(new Error(message || '刷新token失败'))
        }
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
