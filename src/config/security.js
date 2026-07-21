/**
 * 系统安全及接口全局配置文件
 */
export default {
  // 后端接口 Base URL（对应后端 application.yml 中的 12568 端口）
  baseURL: 'http://localhost:12568',

  // 国密 SM2 公钥 (未压缩格式，以 04 开头，十六进制字符串)
  // 后端解密时使用相匹配的私钥进行解密。此密钥对可以由国密工具生成。
  // 提示：请确保这里的公钥与后端配置的私钥是配对的
  publicKey: '04028c40d7c8f8cec3d4571062ef9c0911d27ddd62c0c38c54ffae92b9d72dceb09b934f13fdd016a132dd57b44d2b1cfc68f5ab6a2266de64f3652e257abe3cae'
};
