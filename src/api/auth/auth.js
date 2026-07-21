import request from '../../utils/request.js';
import { encryptSM2 } from '../../utils/crypto.js';

/**
 * 获取图形验证码
 * @returns {Promise} CommonResponse<CaptchaResponse>
 */
export function getCaptcha() {
  return request({
    url: '/authorize/captcha',
    method: 'get',
    skipErrorNotify: true
  });
}

/**
 * 账户密码登录 (使用国密 SM2 加密传输)
 * @param {Object} data 登录表单数据
 * @param {string} data.username 账号
 * @param {string} data.password 密码
 * @param {string} data.captchaCode 验证码值
 * @param {string} data.uuid 验证码唯一标识
 * @returns {Promise} CommonResponse<AuthorizationResponse>
 */
export function login(data) {
  // 1. 构建符合后端 SecurityRequest.java 的数据结构
  const securityRequest = {
    type: 'PRINCIPAL_PASSWORD', // 对应后端 SecurityTypes.PRINCIPAL_PASSWORD
    principal: data.username,
    credential: data.password,
    client: 'WEB', // WEB 端登录来源
    captchaCode: data.captchaCode,
    uuid: data.uuid
  };

  // 2. 将整个请求对象序列化为 JSON 字符串并进行国密 SM2 公钥加密
  const jsonStr = JSON.stringify(securityRequest);
  const encryptedData = encryptSM2(jsonStr);

  // 3. 构建发送给后端的 payload，只携带加密串 loginEncrypt
  const payload = {
    loginEncrypt: encryptedData
  };

  return request({
    url: '/authorize/login',
    method: 'post',
    data: payload
  });
}

/**
 * 获取当前登录用户信息及权限
 * @returns {Promise} CommonResponse<UserInfoResponse>
 */
export function getUserInfo() {
  return request({
    url: '/authorize/getInfo',
    method: 'get'
  });
}
