/**
 * 系统安全及接口全局配置文件
 */
export default {
  // 后端接口 Base URL（对应后端 application.yml 中的 12568 端口）
  baseURL: 'http://localhost:12568',

  // 国密 SM2 公钥 (未压缩格式，以 04 开头，十六进制字符串)
  // 后端解密时使用相匹配的私钥进行解密。
  publicKey: '043cc8f2f2b55a6c19c8d1fed1d9a893087700aa75420b8e39130611d977140089cbcf1ce4f5062a63161bce9f800e578ea6a3d223b677d55061b2393ef98891ad'
};
