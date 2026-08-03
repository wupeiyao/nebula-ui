import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';

// 引入重置/全局 CSS
import './style.css';
import App from './App.vue';
import router from './router';
import { hasPermi, checkPermi } from './directive/permission/hasPermi.js';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus, {
  locale: zhCn,
});

// 注册全局按钮权限指令与全局方法
app.directive('hasPermi', hasPermi);
app.config.globalProperties.$checkPermi = checkPermi;

app.mount('#app');
