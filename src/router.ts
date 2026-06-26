import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import ActivitiesView from './views/ActivitiesView.vue'
import DashboardView from './views/DashboardView.vue'
import FeedbackView from './views/FeedbackView.vue'
import LoginView from './views/LoginView.vue'
import ReportsView from './views/ReportsView.vue'
import ReviewsView from './views/ReviewsView.vue'
import SettingsView from './views/SettingsView.vue'
import TagsView from './views/TagsView.vue'
import UsersView from './views/UsersView.vue'
import ActivityAnalyticsView from './views/ActivityAnalyticsView.vue'
import UserAnalyticsView from './views/UserAnalyticsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
        { path: 'feedback', name: 'feedback', component: FeedbackView },
        { path: 'settings', name: 'settings', component: SettingsView },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  if (to.name !== 'login' && !token) return { name: 'login' }
  if (to.name === 'login' && token) return { name: 'dashboard' }
})

export default router
