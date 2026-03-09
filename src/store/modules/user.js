import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

const getDefaultState = () => {
  return {
    token: getToken(),
    name: '',
    avatar: ''
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
  }
}

const actions = {
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve) => {
      // 模拟登录，实际项目中应调用后端API
      const token = 'admin-token-' + Date.now()
      commit('SET_TOKEN', token)
      setToken(token)
      resolve()
    })
  },

  getInfo({ commit, state }) {
    return new Promise((resolve) => {
      // 模拟获取用户信息
      const data = { name: '管理员', avatar: '' }
      commit('SET_NAME', data.name)
      commit('SET_AVATAR', data.avatar)
      resolve(data)
    })
  },

  logout({ commit, state }) {
    return new Promise((resolve) => {
      removeToken()
      resetRouter()
      commit('RESET_STATE')
      resolve()
    })
  },

  resetToken({ commit }) {
    return new Promise(resolve => {
      removeToken()
      commit('RESET_STATE')
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
