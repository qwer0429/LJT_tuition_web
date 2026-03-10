<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on" label-position="left">
      <div class="title-container">
        <h3 class="title">XLIS学费管理系统</h3>
        <p class="subtitle">欢迎使用，请登录</p>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <i class="el-icon-user" />
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          placeholder="用户名"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">
          <i class="el-icon-lock" />
        </span>
        <el-input
          :key="passwordType"
          ref="password"
          v-model="loginForm.password"
          :type="passwordType"
          placeholder="密码"
          name="password"
          tabindex="2"
          auto-complete="on"
          @keyup.enter.native="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <i :class="passwordType === 'password' ? 'el-icon-view' : 'el-icon-hide'" />
        </span>
      </el-form-item>

      <!-- 安全传输提示 -->
      <div class="security-tip">
        <p v-if="encryptionReady">
          <i class="el-icon-lock" style="color: #67C23A;" /> 已启用安全传输
        </p>
        <p v-else>
          <i class="el-icon-loading" /> 正在初始化安全连接...
        </p>
      </div>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleLogin">
        <span v-if="!loading">登 录</span>
        <span v-else>登录中...</span>
      </el-button>

      <div class="tips">
        <p>提示：首次登录或默认密码用户需要修改密码</p>
      </div>
    </el-form>

    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      :visible.sync="changePasswordVisible"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
      :close-on-press-escape="false"
    >
      <el-form ref="passwordForm" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" />
        </el-form-item>
      </el-form>
      <!-- 密码强度显示 -->
      <div class="password-strength">
        <span>密码强度：</span>
        <el-progress :percentage="passwordStrength.percentage" :color="passwordStrength.color" :show-text="false" />
        <span :style="{ color: passwordStrength.color }">{{ passwordStrength.text }}</span>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleChangePassword">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getPublicKey, encryptWithRSA, clearPublicKeyCache } from '@/utils/crypto'

export default {
  name: 'Login',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value || value.trim().length < 1) {
        callback(new Error('请输入用户名'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value || value.length < 1) {
        callback(new Error('请输入密码'))
      } else {
        callback()
      }
    }
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined,
      encryptionReady: false,
      // 修改密码相关
      changePasswordVisible: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: {
        oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { validator: this.validateStrongPassword, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      tempToken: '',
      tempUserInfo: null
    }
  },
  computed: {
    passwordStrength() {
      const password = this.passwordForm.newPassword || ''
      let score = 0
      
      if (password.length >= 8) score += 20
      if (/[A-Z]/.test(password)) score += 20
      if (/[a-z]/.test(password)) score += 20
      if (/\d/.test(password)) score += 20
      if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 20
      
      let color = '#F56C6C'
      let text = '弱'
      
      if (score >= 80) {
        color = '#67C23A'
        text = '强'
      } else if (score >= 60) {
        color = '#E6A23C'
        text = '中'
      } else if (score >= 40) {
        color = '#409EFF'
        text = '一般'
      }
      
      return { percentage: score, color, text }
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  mounted() {
    // 页面加载时预获取公钥
    this.initEncryption()
  },
  methods: {
    // 初始化加密
    async initEncryption() {
      try {
        await getPublicKey()
        this.encryptionReady = true
      } catch (error) {
        console.error('初始化加密失败:', error)
        this.encryptionReady = false
        this.$message.warning('安全连接初始化失败，请刷新页面重试')
      }
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    // 强密码校验
    validateStrongPassword(rule, value, callback) {
      if (!value || value.length < 8) {
        callback(new Error('密码长度至少为8位'))
        return
      }
      if (!/[A-Z]/.test(value)) {
        callback(new Error('密码必须包含至少一个大写字母'))
        return
      }
      if (!/[a-z]/.test(value)) {
        callback(new Error('密码必须包含至少一个小写字母'))
        return
      }
      if (!/\d/.test(value)) {
        callback(new Error('密码必须包含至少一个数字'))
        return
      }
      if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(value)) {
        callback(new Error('密码必须包含至少一个特殊字符'))
        return
      }
      callback()
    },
    async handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (valid) {
          this.loading = true
          
          try {
            // 确保公钥已获取
            if (!this.encryptionReady) {
              await this.initEncryption()
            }
            
            // 加密密码
            let encryptedPassword = this.loginForm.password
            let isEncrypted = false
            
            try {
              encryptedPassword = await encryptWithRSA(this.loginForm.password)
              isEncrypted = true
              console.log('[Login] Password encrypted successfully')
            } catch (encryptError) {
              console.error('[Login] 密码加密失败:', encryptError)
              this.$message.warning('密码加密失败，将以明文传输')
              // 加密失败时使用明文（开发调试时使用）
              encryptedPassword = this.loginForm.password
              isEncrypted = false
            }
            
            // 调用登录接口
            const loginData = {
              username: this.loginForm.username.trim(),
              password: encryptedPassword,
              encrypted: isEncrypted
            }
            
            this.$store.dispatch('user/login', loginData).then((res) => {
              this.loading = false
              // 登录成功后清除公钥缓存
              clearPublicKeyCache()
              
              // 检查是否需要修改密码
              if (res && (res.need_reset || res.is_default_password)) {
                this.tempToken = res.token
                this.tempUserInfo = res
                this.changePasswordVisible = true
                this.$message.warning('首次登录或默认密码用户，请修改密码')
              } else {
                this.$router.push({ path: this.redirect || '/' })
                this.$message.success('登录成功')
              }
            }).catch((error) => {
              this.loading = false
              const msg = error && error.message ? error.message : '登录失败'
              this.$message.error(msg)
            })
          } catch (error) {
            this.loading = false
            console.error('登录过程出错:', error)
            this.$message.error('登录过程出错，请重试')
          }
        } else {
          return false
        }
      })
    },
    // 修改密码
    handleChangePassword() {
      this.$refs.passwordForm.validate(valid => {
        if (valid) {
          this.$http.post('/susers/auth/change-password/', {
            old_password: this.passwordForm.oldPassword,
            new_password: this.passwordForm.newPassword
          }).then(res => {
            if (res.code === 200) {
              this.$message.success(res.message || '密码修改成功，请重新登录')
              this.changePasswordVisible = false
              // 清除token，让用户重新登录
              this.$store.dispatch('user/resetToken')
              this.loginForm.password = ''
            } else {
              this.$message.error(res.message || '密码修改失败')
            }
          }).catch(error => {
            const msg = error && error.message ? error.message : '密码修改失败'
            this.$message.error(msg)
          })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss">
$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  background-image: linear-gradient(135deg, #2d3a4b 0%, #1a2a3a 100%);
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;
    text-align: center;
    opacity: 0.7;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 10px auto;
      text-align: center;
      font-weight: bold;
    }

    .subtitle {
      font-size: 14px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      opacity: 0.7;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  .security-tip {
    font-size: 12px;
    color: #67C23A;
    margin-bottom: 15px;
    text-align: center;
    
    p {
      margin: 0;
    }
  }
}

// 密码强度样式
.password-strength {
  display: flex;
  align-items: center;
  margin-top: 10px;
  
  span:first-child {
    margin-right: 10px;
    color: #606266;
    font-size: 14px;
  }
  
  .el-progress {
    flex: 1;
    margin-right: 10px;
  }
  
  span:last-child {
    font-size: 14px;
    font-weight: bold;
  }
}

// 对话框样式调整
::v-deep .el-dialog {
  .el-dialog__header {
    border-bottom: 1px solid #EBEEF5;
    padding: 20px;
  }
  
  .el-dialog__body {
    padding: 20px;
  }
  
  .el-dialog__footer {
    border-top: 1px solid #EBEEF5;
    padding: 15px 20px;
  }
}
</style>
