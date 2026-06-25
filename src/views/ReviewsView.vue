<script setup lang="ts">
import { StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import {
  fetchAdminReviews,
  updateAdminReviewStatus,
  type AdminReview,
} from '../api/admin'

const loading = ref(false)
const rows = ref<AdminReview[]>([])
const total = ref(0)
const governOpen = ref(false)
const governing = ref(false)
const selected = ref<AdminReview | null>(null)
const targetStatus = ref<'NORMAL' | 'EXCLUDED'>('EXCLUDED')
const query = reactive({
  keyword: '',
  targetType: '',
  status: '',
  page: 1,
  pageSize: 20,
})
const governForm = reactive({
  reason: '',
  password: '',
})

const scoreLabels: Record<string, string> = {
  organization: '组织安排',
  experience: '活动体验',
  atmosphere: '现场氛围',
  match: '描述匹配',
  punctual: '准时守约',
  communication: '沟通配合',
  friendly: '友善礼貌',
  participation: '参与配合',
}

function formatDate(value?: number) {
  return value
    ? new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '-'
}

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminReviews({
      keyword: query.keyword || undefined,
      targetType: query.targetType || undefined,
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
  query.targetType = ''
  query.status = ''
  query.page = 1
  load()
}

function openGovern(row: AdminReview, status: 'NORMAL' | 'EXCLUDED') {
  selected.value = row
  targetStatus.value = status
  governForm.reason = ''
  governForm.password = ''
  governOpen.value = true
}

async function submitGovernance() {
  if (!selected.value) return
  if (!governForm.reason.trim()) {
    ElMessage.warning('请填写处理原因')
    return
  }
  if (!governForm.password) {
    ElMessage.warning('请输入管理员密码')
    return
  }

  governing.value = true
  try {
    await updateAdminReviewStatus(
      selected.value.id,
      targetStatus.value,
      governForm.reason.trim(),
      governForm.password,
    )
    ElMessage.success(targetStatus.value === 'EXCLUDED' ? '该评价已排除计分' : '该评价已恢复计分')
    governOpen.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '评价治理失败')
  } finally {
    governing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">评价管理</h1>
        <p class="page-subtitle">保留用户原始评分，只控制评价是否计入活动或成员综合评分。</p>
      </div>
      <el-button @click="load">刷新数据</el-button>
    </div>

    <section class="filter panel">
      <el-input
        v-model="query.keyword"
        clearable
        placeholder="搜索活动或评价人"
        @keyup.enter="search"
      />
      <el-select v-model="query.targetType" clearable placeholder="全部评价类型">
        <el-option label="活动评价" value="activity" />
        <el-option label="成员评价" value="member" />
      </el-select>
      <el-select v-model="query.status" clearable placeholder="全部计分状态">
        <el-option label="正常计分" value="NORMAL" />
        <el-option label="已排除" value="EXCLUDED" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </section>

    <section class="table panel">
      <el-table v-loading="loading" :data="rows" row-key="id">
        <el-table-column label="评价关系" min-width="250">
          <template #default="{ row }">
            <div class="relation">
              <strong>{{ row.reviewerName }} → {{ row.targetName }}</strong>
              <span>
                评价人 ID {{ row.reviewerUserId }}
                · {{ row.targetType === 'activity' ? '活动评价' : `成员 ID ${row.targetId}` }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关联活动" min-width="190">
          <template #default="{ row }">
            <strong>{{ row.activityTitle }}</strong>
            <div class="muted">活动 ID {{ row.activityId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="原始评分" min-width="250">
          <template #default="{ row }">
            <div class="scores">
              <span v-for="score in row.scores" :key="score.key">
                {{ scoreLabels[score.key] || score.label || score.key }} {{ score.value }}/5
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="综合评分" width="135" align="left">
          <template #default="{ row }">
            <span class="overall">
              <strong>{{ Number(row.overallScore).toFixed(1) }}/5</strong>
              <el-icon><StarFilled /></el-icon>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="计分状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'NORMAL' ? 'success' : 'danger'">
              {{ row.status === 'NORMAL' ? '正常计分' : '已排除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="155">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="治理记录" min-width="180">
          <template #default="{ row }">
            <template v-if="row.handledAt">
              <div>{{ row.handledByName || `管理员 ${row.handledBy}` }}</div>
              <div class="muted">{{ row.adminNote }}</div>
              <div class="muted">{{ formatDate(row.handledAt) }}</div>
            </template>
            <span v-else class="muted">暂无处理</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'NORMAL'"
              link
              type="danger"
              @click="openGovern(row, 'EXCLUDED')"
            >排除计分</el-button>
            <el-button
              v-else
              link
              type="success"
              @click="openGovern(row, 'NORMAL')"
            >恢复计分</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <span>共 {{ total }} 条评价</span>
        <el-pagination
          v-model:current-page="query.page"
          :page-size="query.pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="load"
        />
      </div>
    </section>

    <el-dialog
      v-model="governOpen"
      :title="targetStatus === 'EXCLUDED' ? '排除评价计分' : '恢复评价计分'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="targetStatus === 'EXCLUDED'
          ? '原始评分不会删除，但将不再参与综合评分计算。'
          : '恢复后，该原始评分将重新参与综合评分计算。'"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form label-position="top" class="govern-form">
        <el-form-item label="处理原因">
          <el-input
            v-model="governForm.reason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="例如：评价人连续恶意低分，人工核实后排除"
          />
        </el-form-item>
        <el-form-item label="管理员密码">
          <el-input
            v-model="governForm.password"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="governOpen = false">取消</el-button>
        <el-button
          :type="targetStatus === 'EXCLUDED' ? 'danger' : 'success'"
          :loading="governing"
          @click="submitGovernance"
        >验证密码并确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; }
.filter {
  margin-top: 24px; padding: 16px; display: grid;
  grid-template-columns: minmax(240px, 1fr) 180px 160px auto auto; gap: 12px;
}
.table { margin-top: 16px; padding: 8px 18px 18px; }
.relation { display: flex; flex-direction: column; gap: 5px; }
.relation span, .muted { color: #8d96a8; font-size: 12px; }
.scores { display: flex; flex-wrap: wrap; gap: 5px 12px; color: #596377; font-size: 12px; }
.overall { display: inline-flex; align-items: center; justify-content: flex-start; gap: 5px; }
.overall :deep(.el-icon) { color: #ffd21e; }
.pagination { padding-top: 18px; display: flex; justify-content: space-between; color: #8b93a3; font-size: 12px; }
.govern-form { margin-top: 18px; }
</style>
