/**
 * RSA 加密工具类
 * 用于前端密码加密传输
 */
import { JSEncrypt } from 'jsencrypt'
import http from './http'

// RSA 公钥缓存
let cachedPublicKey = null
let keyFetchTime = null
const KEY_CACHE_DURATION = 30 * 60 * 1000 // 公钥缓存30分钟

/**
 * 获取 RSA 公钥
 * @returns {Promise<string>} 公钥字符串
 */
export async function getPublicKey() {
  // 检查缓存是否有效
  if (cachedPublicKey && keyFetchTime && (Date.now() - keyFetchTime < KEY_CACHE_DURATION)) {
    console.log('[Crypto] Using cached public key')
    return cachedPublicKey
  }
  
  try {
    console.log('[Crypto] Fetching public key from server...')
    const res = await http.get('/susers/auth/public-key/')
    if (res.code === 200 && res.data && res.data.public_key) {
      cachedPublicKey = res.data.public_key
      keyFetchTime = Date.now()
      console.log('[Crypto] Public key fetched successfully')
      console.log('[Crypto] Key format:', cachedPublicKey.includes('RSA PUBLIC KEY') ? 'PKCS#1' : 'PKCS#8')
      return cachedPublicKey
    }
    throw new Error('获取公钥失败: 响应格式不正确')
  } catch (error) {
    console.error('[Crypto] 获取公钥失败:', error)
    throw error
  }
}

/**
 * 使用 RSA 加密数据
 * @param {string} data 要加密的明文
 * @returns {Promise<string>} 加密后的 base64 字符串
 */
export async function encryptWithRSA(data) {
  try {
    const publicKey = await getPublicKey()
    console.log('[Crypto] Got public key, length:', publicKey.length)
    
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(publicKey)
    
    // 检查密钥是否设置成功
    if (!encryptor.getKey()) {
      throw new Error('JSEncrypt 密钥设置失败')
    }
    
    const encrypted = encryptor.encrypt(data)
    if (!encrypted) {
      throw new Error('JSEncrypt 加密返回空值')
    }
    
    console.log('[Crypto] Encrypted successfully, length:', encrypted.length)
    return encrypted
  } catch (error) {
    console.error('[Crypto] RSA 加密失败:', error)
    throw error
  }
}

/**
 * 清除公钥缓存
 */
export function clearPublicKeyCache() {
  cachedPublicKey = null
  keyFetchTime = null
}

/**
 * 检查公钥是否已缓存
 * @returns {boolean}
 */
export function hasPublicKey() {
  return !!cachedPublicKey
}

export default {
  getPublicKey,
  encryptWithRSA,
  clearPublicKeyCache,
  hasPublicKey
}
