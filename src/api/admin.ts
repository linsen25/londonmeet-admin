import http from './http'

export interface AdminLoginResult {
  token: string
  username: string
  role: string
}

export interface DashboardData {
  userCount: number
  activityCount: number
  registrationCount: number
  pendingReportCount: number
  upcomingActivityCount: number
  ongoingActivityCount: number
  endedActivityCount: number
  activityTrend: Array<{ date: string; count: number }>
}

export interface AdminSettings {
  activityDetailRetentionDays: number
  retentionDescription: string
  exportDescription: string
}

export interface AdminTag {
  id: number
  name: string
  enabled: boolean
  sortOrder: number
  activityCount: number
  createdAt: number
  updatedAt: number
}

export interface AdminActivity {
  id: number
  title: string
  creatorUserId: number
  authorName: string
  status: 'upcoming' | 'ongoing' | 'ended' | 'hidden'
  joinedCount: number
  pendingCount: number
  recruitCount: number
  progressPct: number
  startAt: number
  endAt: number
  locationText: string
  favoriteCount: number
  reportCount: number
}

export interface AdminParticipant {
  registrationId: number
  userId: number
  nickname: string
  avatarUrl: string
  status: string
  applicationText: string
  appliedAt: number
}

export interface AdminActivityDetail {
  id: number
  title: string
  content: string
  creatorUserId: number
  authorName: string
  avatarUrl: string
  status: string
  timeStatus: string
  recruitCount: number
  joinedCount: number
  pendingCount: number
  startAt: number
  endAt: number
  locationText: string
  tagIds: number[]
  tags: string[]
  imageUrls: string[]
  reportCount: number
  governanceAction?: string
  governanceReason?: string
  governedAt?: number
  participants: AdminParticipant[]
}

export interface AdminReport {
  id: number
  activityId: number
  activityTitle: string
  reporterUserId: number
  reporterName: string
  reportedUserId: number
  reportedUserName: string
  reason: string
  status: string
  adminNote: string
  createdAt: number
  handledAt: number
}

export interface AdminUser {
  id: number
  nickname: string
  avatarUrl: string
  status: string
  createdAt: number
  lastLoginAt: number
  createdActivityCount: number
  joinedActivityCount: number
  reportCount: number
}

export interface AdminFeedback {
  id: number
  userId: number
  nickname: string
  avatarUrl: string
  subject: string
  content: string
  status: 'PENDING' | 'RESOLVED' | 'IGNORED'
  adminNote: string
  createdAt: number
  handledAt: number
}

export interface PageResult<T> {
  list: T[]
  page: number
  pageSize: number
  total: number
}

export interface ActivityPage {
  list: AdminActivity[]
  page: number
  pageSize: number
  total: number
}

export function loginAdmin(username: string, password: string) {
  return http.post<never, AdminLoginResult>('/admin/auth/login', { username, password })
}

export function fetchDashboard() {
  return http.get<never, DashboardData>('/admin/dashboard')
}

export function fetchAdminSettings() {
  return http.get<never, AdminSettings>('/admin/settings')
}

export async function downloadRecentReport() {
  const token = localStorage.getItem('admin_token')
  const response = await fetch('/api/admin/dashboard/export', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('下载报告失败')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  anchor.href = url
  anchor.download = `晚些去哪里呀-近30天数据-${date}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function fetchAdminActivities(params: {
  keyword?: string
  status?: string
  page: number
  pageSize: number
}) {
  return http.get<never, ActivityPage>('/admin/activities', { params })
}

export function fetchAdminActivityDetail(id: number) {
  return http.get<never, AdminActivityDetail>(`/admin/activities/${id}`)
}

export function updateAdminActivity(id: number, action: 'hide' | 'restore' | 'force-end', reason: string) {
  return http.post<never, AdminActivityDetail>(`/admin/activities/${id}/${action}`, { reason })
}

export function updateAdminActivityTags(id: number, tagIds: number[]) {
  return http.put<never, AdminActivityDetail>(`/admin/activities/${id}/tags`, { tagIds })
}

export function fetchAdminTags() {
  return http.get<never, AdminTag[]>('/admin/tags')
}

export function createAdminTag(data: { name: string; enabled: boolean; sortOrder: number }) {
  return http.post<never, AdminTag>('/admin/tags', data)
}

export function updateAdminTag(id: number, data: { name: string; enabled: boolean; sortOrder: number }) {
  return http.put<never, AdminTag>(`/admin/tags/${id}`, data)
}

export function deleteAdminTag(id: number) {
  return http.delete(`/admin/tags/${id}`)
}

export function fetchAdminReports(params: { status?: string; page: number; pageSize: number }) {
  return http.get<never, PageResult<AdminReport>>('/admin/reports', { params })
}

export function handleAdminReport(id: number, status: 'RESOLVED' | 'DISMISSED', reason: string) {
  return http.post(`/admin/reports/${id}/handle`, { status, reason })
}

export function fetchAdminUsers(params: {
  keyword?: string
  status?: string
  page: number
  pageSize: number
}) {
  return http.get<never, PageResult<AdminUser>>('/admin/users', { params })
}

export function updateAdminUserStatus(id: number, status: 'ACTIVE' | 'DISABLED', reason: string) {
  return http.post(`/admin/users/${id}/status`, { status, reason })
}

export function sendAdminNotification(userId: number, title: string, content: string) {
  return http.post(`/admin/users/${userId}/notifications`, { title, content })
}

export function fetchAdminFeedback(params: { status?: string; page: number; pageSize: number }) {
  return http.get<never, PageResult<AdminFeedback>>('/admin/feedback', { params })
}

export function handleAdminFeedback(id: number, status: 'RESOLVED' | 'IGNORED', reason: string) {
  return http.post(`/admin/feedback/${id}/handle`, { status, reason })
}
