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
  
  let key = (publicKey || '').trim();
  // sm-crypto doEncrypt 需要 130 位的 04 开头的十六进制字符串作为公钥
  if (!key.startsWith('04') && key.length === 128) {
    key = '04' + key;
  }
  
  // 使用 cipherMode: 0 代表 C1C2C3 字节排列顺序，匹配后端 CIPHER_MODE_BC (0)
  const cipherMode = 0; 
  
  // 执行加密，并返回密文十六进制字符串
  return sm2.doEncrypt(text, key, cipherMode);
}
