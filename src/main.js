import {
  createApp
} from 'vue';
import App from './App.vue';
import router from './router'; // 导入路由
import store from './store'; // 导入 store 主文件
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import * as Icons from '@ant-design/icons-vue';

import zhCN from 'ant-design-vue/es/locale/zh_CN'; // 引入中文语言包
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn'); // 设置 dayjs 的语言为中文

const app = createApp(App);

// 全局注册 Ant Design 图标
for (const i in Icons) {
  app.component(i, Icons[i]);
}

// 使用 .use() 来安装插件
// 必须在 .mount() 之前调用
app.use(store);
app.use(router);
// --- 传入语言包配置 ---
app.use(Antd, {
  locale: zhCN
});

app.mount('#app');