<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import {
  fetchAdminActivities,
  fetchAdminActivityDetail,
  fetchAdminTags,
  editAdminActivity,
  updateAdminActivityTags,
  type AdminActivity,
  type AdminActivityDetail,
  type AdminTag,
} from '../api/admin'

const loading = ref(false)
const rows = ref<AdminActivity[]>([])
const total = ref(0)
const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<AdminActivityDetail | null>(null)
const tags = ref<AdminTag[]>([])
const selectedTagIds = ref<number[]>([])
const tagReason = ref('')
const savingTags = ref(false)
const editOpen = ref(false)
const editSaving = ref(false)
const editForm = reactive({
  status: 'PUBLISHED' as 'PUBLISHED' | 'HIDDEN' | 'CANCELLED',
  timeRange: [] as Date[],
  locationText: '',
  reason: '',
  password: '',
})
const query = reactive({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 20,
})

const statusMap = {
  upcoming: { text: '未开始', type: 'primary' },
  ongoing: { text: '进行中', type: 'success' },
  ended: { text: '已结束', type: 'info' },
  hidden: { text: '已隐藏', type: 'danger' },
  cancelled: { text: '已取消', type: 'warning' },
} as const

function statusText(status: AdminActivity['status']) {
  return statusMap[status]?.text || '未知'
}

function statusType(status: AdminActivity['status']) {
  return statusMap[status]?.type || 'info'
}

function governanceActionText(action?: string) {
  return {
    ACTIVITY_FORCE_END: '强制结束',
    ACTIVITY_HIDE: '隐藏活动',
    ACTIVITY_RESTORE: '恢复活动',
    ACTIVITY_TAGS_UPDATE: '修改活动标签',
  }[action || ''] || action || '管理操作'
}

function formatDate(value: number) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminActivities({
      keyword: query.keyword || undefined,
      status: query.status || undefined,
      page: query.page,
      pageSize: query.pageSize,
    })
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() {
  query.page = 1
  load()
}

function reset() {
  query.keyword = ''
  query.status = ''
  query.page = 1
  load()
}

async function openDetail(row: AdminActivity) {
  drawerOpen.value = true
  detailLoading.value = true
  try {
    const [activityDetail, availableTags] = await Promise.all([
      fetchAdminActivityDetail(row.id),
      fetchAdminTags(),
    ])
    detail.value = activityDetail
    tags.value = availableTags
    selectedTagIds.value = [...(activityDetail.tagIds || [])]
    tagReason.value = ''
  } finally {
    detailLoading.value = false
  }
}

async function saveActivityTags() {
  if (!detail.value) return
  if (!selectedTagIds.value.length || selectedTagIds.value.length > 4) {
    ElMessage.warning('请选择1至4个标签')
    return
  }
  if (!tagReason.value.trim()) {
    ElMessage.warning('请填写标签修改原因')
    return
  }
  savingTags.value = true
  try {
    detail.value = await updateAdminActivityTags(
      detail.value.id,
      selectedTagIds.value,
      tagReason.value.trim(),
    )
    selectedTagIds.value = [...(detail.value.tagIds || [])]
    tagReason.value = ''
    ElMessage.success('活动标签已更新并通知发起人')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '标签更新失败')
  } finally {
    savingTags.value = false
  }
}

function openEditActivity() {
  if (!detail.value) return
  editForm.status = (
    ['PUBLISHED', 'HIDDEN', 'CANCELLED'].includes(detail.value.status)
      ? detail.value.status
      : 'PUBLISHED'
  ) as 'PUBLISHED' | 'HIDDEN' | 'CANCELLED'
  editForm.timeRange = [new Date(detail.value.startAt), new Date(detail.value.endAt)]
  editForm.locationText = detail.value.locationText || ''
  editForm.reason = ''
  editForm.password = ''
  editOpen.value = true
}

async function saveActivityEdit() {
  if (!detail.value) return
  if (editForm.timeRange.length !== 2) {
    ElMessage.warning('请选择活动开始和结束时间')
    return
  }
  if (!editForm.locationText.trim()) {
    ElMessage.warning('请填写活动地址')
    return
  }
  if (!editForm.reason.trim()) {
    ElMessage.warning('请填写修改原因')
    return
  }
  if (!editForm.password) {
    ElMessage.warning('请输入管理员密码')
    return
  }

  editSaving.value = true
  try {
    detail.value = await editAdminActivity(detail.value.id, {
      status: editForm.status,
      startAt: editForm.timeRange[0].getTime(),
      endAt: editForm.timeRange[1].getTime(),
      locationText: editForm.locationText.trim(),
      reason: editForm.reason.trim(),
      password: editForm.password,
    })
    editOpen.value = false
    ElMessage.success('活动信息已更新并通知发起人')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '活动修改失败')
  } finally {
    editSaving.value = false
  }
}

function auditActionText(action: string) {
  return {
    ACTIVITY_UPDATE: '修改活动信息',
    ACTIVITY_FORCE_END: '强制结束',
    ACTIVITY_HIDE: '隐藏活动',
    ACTIVITY_RESTORE: '恢复活动',
    ACTIVITY_TAGS_UPDATE: '修改活动标签',
  }[action] || action
}

function auditChanges(log: AdminActivityDetail['auditLogs'][number]) {
  const before = log.beforeState || {}
  const after = log.afterState || {}
  const changes: string[] = []
  if (before.status !== after.status && after.status) {
    changes.push(`状态：${String(before.status || '-')} → ${String(after.status)}`)
  }
  if (before.startAt !== after.startAt && after.startAt) {
    changes.push(`开始时间：${formatDate(Number(before.startAt))} → ${formatDate(Number(after.startAt))}`)
  }
  if (before.endAt !== after.endAt && after.endAt) {
    changes.push(`结束时间：${formatDate(Number(before.endAt))} → ${formatDate(Number(after.endAt))}`)
  }
  if (before.locationText !== after.locationText && after.locationText) {
    changes.push(`地址：${String(before.locationText || '-')} → ${String(after.locationText)}`)
  }
  if (JSON.stringify(before.tags || []) !== JSON.stringify(after.tags || [])) {
    changes.push(
      `标签：${(before.tags as string[] || []).join('、') || '无'} → ${(after.tags as string[] || []).join('、') || '无'}`,
    )
  }
  return changes
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">活动管理</h1>
        <p class="page-subtitle">查看活动时间状态、报名进度、待审核人数与举报数量。</p>
      </div>
      <el-button :icon="Refresh" @click="load">刷新数据</el-button>
    </div>

    <section class="filter-panel panel">
      <el-input
        v-model="query.keyword"
        clearable
        placeholder="搜索活动标题或发起人"
        :prefix-icon="Search"
        @keyup.enter="search"
      />
      <el-select v-model="query.status" clearable placeholder="全部状态">
        <el-option label="未开始" value="upcoming" />
        <el-option label="进行中" value="ongoing" />
        <el-option label="已结束" value="ended" />
        <el-option label="已隐藏" value="hidden" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button type="primary" class="search-button" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </section>

    <section class="table-panel panel">
      <el-table v-loading="loading" :data="rows" row-key="id" class="activity-table">
        <el-table-column label="活动" min-width="250">
          <template #default="{ row }">
            <div class="activity-cell">
              <strong>{{ row.title }}</strong>
              <span>ID {{ row.id }} · {{ row.locationText || '未填写地点' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发起人" min-width="145">
          <template #default="{ row }">
            <div class="creator-cell">
              <strong>{{ row.authorName }}</strong>
              <span>用户 {{ row.creatorUserId || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="105">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报名进度" width="190">
          <template #default="{ row }">
            <div class="progress-cell">
              <div>
                <span>{{ row.joinedCount }}/{{ row.recruitCount || '不限' }}</span>
                <em v-if="row.pendingCount">{{ row.pendingCount }} 待审核</em>
              </div>
              <el-progress
                :percentage="row.progressPct"
                :show-text="false"
                :stroke-width="7"
                :color="row.progressPct >= 100 ? '#e15149' : '#24b47e'"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" width="170">
          <template #default="{ row }">
            <div class="time-cell"><span>{{ formatDate(row.startAt) }}</span><span>{{ formatDate(row.endAt) }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="收藏数" width="90" align="center">
          <template #default="{ row }">
            <span class="favorite-count">★ {{ row.favoriteCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="举报" width="85" align="center">
          <template #default="{ row }">
            <el-badge :value="row.reportCount" :hidden="!row.reportCount">
              <span class="report-pill">{{ row.reportCount ? '查看' : '无' }}</span>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <span>共 {{ total }} 场活动</span>
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          layout="prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </div>
    </section>

    <el-drawer v-model="drawerOpen" title="活动详情与参与者" size="72%">
      <div v-loading="detailLoading" class="detail-wrap">
        <template v-if="detail">
          <div class="detail-head">
            <div>
              <h2>{{ detail.title }}</h2>
              <p>活动 ID {{ detail.id }} · 发起人 {{ detail.authorName }}（用户 {{ detail.creatorUserId }}）</p>
            </div>
            <div class="govern-actions">
              <el-button type="primary" @click="openEditActivity">编辑活动</el-button>
            </div>
          </div>

          <div class="detail-metrics">
            <div><span>已通过</span><strong>{{ detail.joinedCount }}</strong></div>
            <div><span>待审核</span><strong>{{ detail.pendingCount }}</strong></div>
            <div><span>招募人数</span><strong>{{ detail.recruitCount || '不限' }}</strong></div>
            <div><span>举报数量</span><strong>{{ detail.reportCount }}</strong></div>
          </div>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="活动时间">
              {{ formatDate(detail.startAt) }} — {{ formatDate(detail.endAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="地点">{{ detail.locationText || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="活动说明" :span="2">{{ detail.content || '无' }}</el-descriptions-item>
            <el-descriptions-item label="活动标签" :span="2">
              <div class="activity-tag-editor">
                <el-select
                  v-model="selectedTagIds"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :max-collapse-tags="4"
                  placeholder="选择1至4个标签"
                  style="width: 420px"
                >
                  <el-option
                    v-for="tag in tags"
                    :key="tag.id"
                    :label="tag.enabled ? tag.name : `${tag.name}（已停用）`"
                    :value="tag.id"
                    :disabled="!tag.enabled && !selectedTagIds.includes(tag.id)"
                  />
                </el-select>
                <el-button
                  type="primary"
                  :loading="savingTags"
                  @click="saveActivityTags"
                >保存标签</el-button>
                <span>最多4个</span>
              </div>
              <el-input
                v-model="tagReason"
                class="tag-reason-input"
                maxlength="500"
                show-word-limit
                placeholder="填写标签修改原因；保存后会通知活动发起人"
              />
            </el-descriptions-item>
            <el-descriptions-item
              v-if="detail.governanceReason"
              label="最近管理操作"
              :span="2"
            >
              <strong>{{ governanceActionText(detail.governanceAction) }}</strong>
              · {{ detail.governanceReason }}
              <span v-if="detail.governedAt">（{{ formatDate(detail.governedAt) }}）</span>
            </el-descriptions-item>
          </el-descriptions>

          <h3 class="section-title">管理修改记录（{{ detail.auditLogs?.length || 0 }}）</h3>
          <el-empty v-if="!detail.auditLogs?.length" description="暂无管理修改记录" :image-size="72" />
          <el-timeline v-else class="audit-timeline">
            <el-timeline-item
              v-for="log in detail.auditLogs"
              :key="log.id"
              :timestamp="formatDate(log.createdAt)"
              placement="top"
            >
              <div class="audit-card">
                <div class="audit-title">
                  <strong>{{ auditActionText(log.actionType) }}</strong>
                  <span>{{ log.adminName || `管理员 ${log.adminUserId}` }}</span>
                </div>
                <div class="audit-reason">原因：{{ log.reason }}</div>
                <ul v-if="auditChanges(log).length" class="audit-changes">
                  <li v-for="change in auditChanges(log)" :key="change">{{ change }}</li>
                </ul>
              </div>
            </el-timeline-item>
          </el-timeline>

          <h3 class="section-title">报名与参与者（{{ detail.participants.length }}）</h3>
          <el-table :data="detail.participants" border>
            <el-table-column label="用户" min-width="160">
              <template #default="{ row }">
                <div class="participant-user">
                  <el-avatar :src="row.avatarUrl" :size="34">{{ row.nickname?.slice(0, 1) }}</el-avatar>
                  <div><strong>{{ row.nickname }}</strong><span>ID {{ row.displayId }}</span></div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="报名状态" width="125" />
            <el-table-column prop="applicationText" label="报名理由" min-width="230" show-overflow-tooltip />
            <el-table-column label="报名时间" width="145">
              <template #default="{ row }">{{ formatDate(row.appliedAt) }}</template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-drawer>

    <el-dialog
      v-model="editOpen"
      title="编辑活动"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="活动状态">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="正常发布" value="PUBLISHED" />
            <el-option label="隐藏" value="HIDDEN" />
            <el-option label="取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始和结束时间">
          <el-date-picker
            v-model="editForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="活动地址">
          <el-input v-model="editForm.locationText" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="修改原因">
          <el-input
            v-model="editForm.reason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="该内容会记录在管理修改记录中，并作为通知发送给活动发起人"
          />
        </el-form-item>
        <el-form-item label="管理员密码">
          <el-input
            v-model="editForm.password"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="重新输入管理员密码以确认修改"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveActivityEdit">
          验证密码并保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; }
.filter-panel {
  margin-top: 26px; padding: 18px; display: grid;
  grid-template-columns: minmax(260px, 420px) 180px auto auto 1fr; gap: 12px;
}
.search-button { background: #1c2230; border-color: #1c2230; }
.table-panel { margin-top: 18px; padding: 6px 18px 18px; overflow-x: auto; }
.activity-table { min-width: 1300px; }
.activity-cell, .creator-cell { display: flex; flex-direction: column; gap: 6px; }
.activity-cell strong { color: #283044; font-size: 14px; }
.activity-cell span, .creator-cell span { color: #939bad; font-size: 12px; }
.creator-cell strong { font-size: 13px; }
.progress-cell { display: flex; flex-direction: column; gap: 8px; }
.progress-cell > div { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
.progress-cell em { color: #e39b28; font-style: normal; }
.time-cell { display: flex; flex-direction: column; gap: 5px; color: #616a7d; font-size: 12px; }
.report-pill { color: #778095; font-size: 12px; }
.activity-tag-editor { display: flex; align-items: center; gap: 10px; }
.activity-tag-editor > span { color: #8a93a5; font-size: 12px; }
.tag-reason-input { margin-top: 10px; width: 100%; }
.pagination { padding-top: 18px; display: flex; align-items: center; justify-content: space-between; color: #8b93a3; font-size: 12px; }
.detail-wrap { min-height: 420px; }
.detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.detail-head h2 { margin: 0; font-size: 24px; }
.detail-head p { margin: 8px 0 0; color: #8b93a3; font-size: 13px; }
.govern-actions { display: flex; gap: 10px; }
.detail-metrics { margin: 24px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.detail-metrics div { padding: 16px; border-radius: 12px; background: #f5f7fa; display: flex; flex-direction: column; gap: 7px; }
.detail-metrics span { color: #8992a4; font-size: 12px; }
.detail-metrics strong { font-size: 22px; }
.section-title { margin: 28px 0 14px; font-size: 17px; }
.participant-user { display: flex; align-items: center; gap: 10px; }
.participant-user div { display: flex; flex-direction: column; gap: 3px; }
.participant-user span { color: #929aab; font-size: 11px; }
.audit-timeline { margin-top: 16px; }
.audit-card { padding: 14px 16px; border: 1px solid #e9edf3; border-radius: 12px; background: #fafbfc; }
.audit-title { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.audit-title span { color: #8a93a5; font-size: 12px; }
.audit-reason { margin-top: 8px; color: #525c70; font-size: 13px; }
.audit-changes { margin: 10px 0 0; padding-left: 18px; color: #626c7f; font-size: 12px; line-height: 1.8; }
</style>
