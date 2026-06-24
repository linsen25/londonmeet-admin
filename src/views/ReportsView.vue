<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { fetchAdminReports, handleAdminReport, type AdminReport } from '../api/admin'

const loading = ref(false)
const rows = ref<AdminReport[]>([])
const total = ref(0)
const query = reactive({ status: 'PENDING', page: 1, pageSize: 20 })

function formatDate(value: number) {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-'
}

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminReports({
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

async function handle(row: AdminReport, status: 'RESOLVED' | 'DISMISSED', label: string) {
  try {
    const { value } = await ElMessageBox.prompt(`填写“${label}”的处理说明`, '处理举报', {
      inputType: 'textarea',
      inputValidator: (text) => Boolean(text?.trim()) || '必须填写处理说明',
    })
    await handleAdminReport(row.id, status, value.trim())
    ElMessage.success('举报已处理')
    load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('处理失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="page-title">举报管理</h1>
    <p class="page-subtitle">举报记录绑定活动 ID 和用户 ID，不受昵称修改影响。</p>
    <section class="report-filter panel">
      <el-select v-model="query.status" clearable placeholder="全部状态" @change="query.page = 1; load()">
        <el-option label="待处理" value="PENDING" />
        <el-option label="已成立" value="RESOLVED" />
        <el-option label="不成立" value="DISMISSED" />
      </el-select>
    </section>
    <section class="panel report-table">
      <el-table v-loading="loading" :data="rows">
        <el-table-column label="活动" min-width="190">
          <template #default="{ row }"><strong>{{ row.activityTitle }}</strong><div class="muted">活动 {{ row.activityId }}</div></template>
        </el-table-column>
        <el-table-column label="举报关系" min-width="210">
          <template #default="{ row }">
            <div>{{ row.reporterName }}（{{ row.reporterUserId }}）</div>
            <div class="muted">举报 {{ row.reportedUserName }}（{{ row.reportedUserId }}）</div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="举报原因" min-width="260" />
        <el-table-column label="状态" width="105">
          <template #default="{ row }"><el-tag>{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="提交时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button link type="danger" @click="handle(row, 'RESOLVED', '举报成立')">成立</el-button>
              <el-button link @click="handle(row, 'DISMISSED', '举报不成立')">不成立</el-button>
            </template>
            <span v-else class="muted">{{ row.adminNote }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <span>共 {{ total }} 条</span>
        <el-pagination v-model:current-page="query.page" :page-size="query.pageSize" :total="total"
          layout="prev, pager, next" @current-change="load" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.report-filter { margin-top: 24px; padding: 16px; width: 220px; }
.report-table { margin-top: 16px; padding: 8px 18px 18px; }
.muted { margin-top: 5px; color: #929aab; font-size: 12px; }
.pagination { padding-top: 18px; display: flex; justify-content: space-between; color: #8b93a3; font-size: 12px; }
</style>
