<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import {
  fetchAdminActivities,
  fetchAdminActivityDetail,
  fetchAdminTags,
  updateAdminActivity,
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
const savingTags = ref(false)
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
  savingTags.value = true
  try {
    detail.value = await updateAdminActivityTags(detail.value.id, selectedTagIds.value)
    selectedTagIds.value = [...(detail.value.tagIds || [])]
    ElMessage.success('活动标签已更新')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '标签更新失败')
  } finally {
    savingTags.value = false
  }
}

async function govern(action: 'hide' | 'restore' | 'force-end', label: string) {
  if (!detail.value) return
  try {
    const { value } = await ElMessageBox.prompt(`请输入“${label}”的处理原因`, '确认管理操作', {
      confirmButtonText: '确认执行',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputValidator: (text) => Boolean(text?.trim()) || '必须填写处理原因',
    })
    detail.value = await updateAdminActivity(detail.value.id, action, value.trim())
    ElMessage.success(`${label}成功`)
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error instanceof Error ? error.message : '操作失败')
    }
  }
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
              <el-button
                v-if="detail.status !== 'HIDDEN'"
                type="danger"
                plain
                @click="govern('hide', '隐藏活动')"
              >隐藏活动</el-button>
              <el-button v-else type="success" plain @click="govern('restore', '恢复活动')">恢复活动</el-button>
              <el-button
                v-if="detail.timeStatus !== 'ended'"
                type="warning"
                plain
                @click="govern('force-end', '强制结束')"
              >强制结束</el-button>
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

          <h3 class="section-title">报名与参与者（{{ detail.participants.length }}）</h3>
          <el-table :data="detail.participants" border>
            <el-table-column label="用户" min-width="160">
              <template #default="{ row }">
                <div class="participant-user">
                  <el-avatar :src="row.avatarUrl" :size="34">{{ row.nickname?.slice(0, 1) }}</el-avatar>
                  <div><strong>{{ row.nickname }}</strong><span>ID {{ row.userId }}</span></div>
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
</style>
