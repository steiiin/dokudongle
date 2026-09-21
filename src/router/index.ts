import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

import TabsPage from '../views/TabsPage.vue'
import TabPageSettings from '@/views/TabPageSettings.vue'
import TabPageDoku from '@/views/TabPageDoku.vue'
import TabPagePreview from '@/views/TabPagePreview.vue'

// ############################################################################

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/doku'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/doku'
      },
      {
        path: 'connect',
        redirect: '/tabs/settings'
      },
      {
        path: 'settings',
        component: TabPageSettings
      },
      {
        path: 'doku',
        component: TabPageDoku
      },
      {
        path: 'preview',
        component: TabPagePreview
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
