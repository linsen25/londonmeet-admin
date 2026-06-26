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
  hiddenActivityCount: number
  cancelledActivityCount: number
  newUserCount: number
  activeUserCount: number
  newActivityCount: number
  periodRegistrationCount: number
  approvedRegistrationCount: number
  cancelledRegistrationCount: number
  pendingAppealCount: number
  pendingReviewCount: number
  activityTrend: Array<{ date: string; count: number }>
  dailyTrend: Array<{
    date: string
    newUsers: number
    activeUsers: number
    activities: number
    registrations: number
    approved: number
  }>
}

export interface ActivityAnalyticsItem {
  activityId: number
  title: string
  creatorName: string
  tags: string
  exposureUsers: number
  detailUsers: number
  favoriteUsers: number
  applicationCount: number
  approvedCount: number
  joinedGroupCount: number
  groupQrUsers: number
  cancelledCount: number
  reviewCount: number
  averageRating?: number
  reportCount: number
  exposureToDetailRate: number
  detailToApplyRate: number
  approvalRate: number
  groupJoinRate: number
  groupQrViewRate: number
}

export interface ActivityAnalyticsData {
  startDate: string
  endDate: string
  total: number
  list: ActivityAnalyticsItem[]
}

export interface UserAnalyticsData {
  startDate: string
  endDate: string
  newUserCount: number
  activeUserCount: number
  creatorUserCount: number
  applicantUserCount: number
  creatorAndApplicantCount: number
  inactiveUserCount: number
  applicationsPerApplicant: number
  dailyTrend: Array<{
    date: string
    newUsers: number
    activeUsers: number
    activities: number
    applications: number
    approved: number
  }>
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
  status: 'upcoming' | 'ongoing' | 'ended' | 'hidden' | 'cancelled'
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

export interface AdminAuditLog {
  id: number
  adminUserId: number
  adminName: string
  actionType: string
  reason: string
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
  createdAt: number
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
  auditLogs: AdminAuditLog[]
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
  type?: 'FEEDBACK' | 'ACCOUNT_APPEAL'
  userStatus?: 'ACTIVE' | 'DISABLED'
  disableReason?: string
  subject: string
  content: string
  status: 'PENDING' | 'RESOLVED' | 'IGNORED'
  adminNote: string
  createdAt: number
  handledAt: number
}

export interface AdminReviewScore {
  key: string
  label: string
  value: number
}

export interface AdminReview {
  id: number
  targetType: 'activity' | 'member'
  activityId: number
  activityTitle: string
  reviewerUserId: number
  reviewerName: string
  targetId: number
  targetName: string
  overallScore: number
  scores: AdminReviewScore[]
  reason?: string
  batchGood?: boolean
  status: 'PENDING' | 'NORMAL' | 'EXCLUDED'
  adminNote: string
  handledBy?: number
  handledByName?: string
  createdAt: number
  updatedAt: number
  handledAt?: number
}

export interface AdminReviewActivity {
  activityId: number
  activityTitle: string
  creatorUserId: number
  creatorName: string
  activityAverage?: number
  activityReviewCount: number
  memberReviewCount: number
  pendingCount: number
  participantCount: number
  participantReviewedCount: number
  creatorRecentAverage?: number
  creatorRecentReviewCount: number
  creatorRecentDimensions: Record<string, number>
  endAt: number
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

export function fetchDashboard(days = 30) {
  return http.get<never, DashboardData>('/admin/dashboard', { params: { days } })
}

export function fetchActivityAnalytics(params: {
  startDate: string
  endDate: string
  page: number
  pageSize: number
}) {
  return http.get<never, ActivityAnalyticsData>('/admin/analytics/activities', { params })
}

export function fetchUserAnalytics(params: { startDate: string; endDate: string }) {
  return http.get<never, UserAnalyticsData>('/admin/analytics/users', { params })
}

export function fetchAdminSettings() {
  return http.get<never, AdminSettings>('/admin/settings')
}

export async function downloadRecentReport(startDate?: string, endDate?: string) {
  const token = localStorage.getItem('admin_token')
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  const response = await fetch(`/api/admin/dashboard/export?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('下载报告失败')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  anchor.href = url
  anchor.download = `晚些去哪里呀-数据报告-${startDate || '近30天'}-${endDate || date}.xlsx`
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

export function editAdminActivity(id: number, data: {
  status: 'PUBLISHED' | 'HIDDEN' | 'CANCELLED'
  startAt: number
  endAt: number
  locationText: string
  reason: string
  password: string
}) {
  return http.put<never, AdminActivityDetail>(`/admin/activities/${id}`, data)
}

export function updateAdminActivityTags(id: number, tagIds: number[], reason: string) {
  return http.put<never, AdminActivityDetail>(`/admin/activities/${id}/tags`, { tagIds, reason })
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

export function fetchAdminAppeals(params: { status?: string; page?: number; pageSize?: number }) {
  return http.get<never, PageResult<AdminFeedback>>('/admin/appeals', { params })
}

export function handleAdminAppeal(
  id: number,
  status: 'APPROVED' | 'REJECTED',
  reason: string,
) {
  return http.post(`/admin/appeals/${id}/handle`, { status, reason })
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

export function fetchAdminReviewActivities(params: {
  targetType?: string
  status?: string
  keyword?: string
  page: number
  pageSize: number
}) {
  return http.get<never, PageResult<AdminReviewActivity>>('/admin/review-activities', { params })
}

export function fetchAdminActivityReviews(activityId: number) {
  return http.get<never, PageResult<AdminReview>>(`/admin/review-activities/${activityId}`)
}

export function updateAdminReviewStatus(
  id: number,
  status: 'NORMAL' | 'EXCLUDED',
  reason: string,
  password: string,
) {
  return http.post(`/admin/reviews/${id}/status`, { status, reason, password })
}
