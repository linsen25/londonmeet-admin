import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import ActivitiesView from './views/ActivitiesView.vue'
import DashboardView from './views/DashboardView.vue'
import LoginView from './views/LoginView.vue'
import ReportsView from './views/ReportsView.vue'
import ReviewsView from './views/ReviewsView.vue'
import SettingsView from './views/SettingsView.vue'
import TagsView from './views/TagsView.vue'
import UsersView from './views/UsersView.vue'
import ActivityAnalyticsView from './views/ActivityAnalyticsView.vue'
import UserAnalyticsView from './views/UserAnalyticsView.vue'

function clearAdminSession() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_username')
}

function isJwtExpired(token: string) {
  try {
    const payloadSegment = token.split('.')[1]
    const base64 = payloadSegment
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, '=')
    const payload = JSON.parse(atob(base64)) as {
      exp?: number
    }
    return !payload.exp || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: DashboardView },
      { path: 'analytics/activities', name: 'activity-analytics', component: ActivityAnalyticsView },
      { path: 'analytics/users', name: 'user-analytics', component: UserAnalyticsView },
      { path: 'activities', name: 'activities', component: ActivitiesView },
      { path: 'tags', name: 'tags', component: TagsView },
      { path: 'users', name: 'users', component: UsersView },
      { path: 'reports', name: 'reports', component: ReportsView },
      { path: 'reviews', name: 'reviews', component: ReviewsView },
      { path: 'feedback', name: 'feedback', component: () => import('./views/FeedbackView.vue') },
      { path: 'settings', name: 'settings', component: SettingsView },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  if (token && isJwtExpired(token)) {
    clearAdminSession()
    if (to.name !== 'login') return { name: 'login' }
  }
  if (to.name !== 'login' && !token) return { name: 'login' }
  if (to.name === 'login' && token) return { name: 'dashboard' }
})

export default router
