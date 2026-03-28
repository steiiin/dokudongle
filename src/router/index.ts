import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/connect'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/connect'
      },
      {
        path: 'connect',
        component: () => import('@/views/TabPageConnect.vue')
      },
      {
        path: 'doku',
        component: () => import('@/views/TabPageDoku.vue')
      },
      {
        path: 'preview',
        component: () => import('@/views/TabPagePreview.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
