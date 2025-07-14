import {
  createApp
} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 引入 Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import * as Icons from '@ant-design/icons-vue'

// 引入权限控制逻辑
import './permission'

import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

const app = createApp(App)

// 全局注册 Ant Design 图标
for (const i in Icons) {
  app.component(i, Icons[i])
}

// 使用插件
app.use(store)
app.use(router)
app.use(Antd, {
  locale: zhCN
})

app.mount('#app')
