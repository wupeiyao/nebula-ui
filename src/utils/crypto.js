import { sm2 } from 'sm-crypto';
import securityConfig from '../config/security';

/**
 * 使用国密 SM2 公钥加密文本
 * @param {string} text 需要加密的明文文本（通常为登录请求的 JSON 字符串）
 * @param {string} [publicKey] 可选的 SM2 公钥，如果不传则默认使用 security.js 中的公钥
 * @returns {string} 加密后的十六进制字符串
 */
export function encryptSM2(text, publicKey = securityConfig.publicKey) {
  if (!text) return '';
  
  let key = publicKey;
  // sm-crypto 库进行加密时，如果公钥为 130 位的 04 开头的十六进制字符串，
  // 需要先去除前导的 '04'，保留 128 位点坐标 (x, y) 传入进行加密
  if (key.startsWith('04') && key.length === 130) {
    key = key.substring(2);
  }
  
  // 使用 cipherMode: 0 代表 C1C2C3 字节排列顺序，匹配后端 CIPHER_MODE_BC (0)
  const cipherMode = 0; 
  
  // 执行加密，并返回密文十六进制字符串
  return sm2.doEncrypt(text, key, cipherMode);
}
