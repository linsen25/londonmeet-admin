<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { fetchAdminFeedback, handleAdminFeedback, type AdminFeedback } from '../api/admin'

const loading = ref(false)
const rows = ref<AdminFeedback[]>([])
const total = ref(0)
const query = reactive({ status: '', page: 1, pageSize: 20 })

function formatDate(value: number) {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-'
}

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminFeedback({
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

async function handle(row: AdminFeedback, status: 'RESOLVED' | 'IGNORED') {
  try {
    const { value } = await ElMessageBox.prompt(
      status === 'RESOLVED' ? '填写处理备注' : '填写忽略原因',
      status === 'RESOLVED' ? '标记已处理' : '忽略意见',
      {
        inputType: 'textarea',
        inputValidator: (text) => Boolean(text?.trim()) || '请填写处理说明',
      },
    )
    await handleAdminFeedback(row.id, status, value.trim())
    ElMessage.success('意见状态已更新')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error instanceof Error ? error.message : '处理失败')
    }
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="page-title">意见箱管理</h1>
    <p class="page-subtitle">查看用户提交的功能建议、问题反馈和其他意见。</p>
    <section class="filter panel">
      <el-select v-model="query.status" clearable placeholder="全部状态" @change="query.page=1; load()">
        <el-option label="待处理" value="PENDING" />
        <el-option label="已处理" value="RESOLVED" />
        <el-option label="已忽略" value="IGNORED" />
      </el-select>
    </section>
    <section class="panel table">
      <el-table v-loading="loading" :data="rows">
        <el-table-column label="用户" width="180">
          <template #default="{ row }">
            <div class="user"><el-avatar :src="row.avatarUrl" :size="34" /><div><strong>{{ row.nickname }}</strong><span>ID {{ row.userId }}</span></div></div>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="意见主题" min-width="170" />
        <el-table-column prop="content" label="意见内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PENDING' ? 'warning' : row.status === 'RESOLVED' ? 'success' : 'info'">
              {{ row.status === 'PENDING' ? '待处理' : row.status === 'RESOLVED' ? '已处理' : '已忽略' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="155"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column>
        <el-table-column prop="adminNote" label="处理备注" min-width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button link type="success" @click="handle(row, 'RESOLVED')">已处理</el-button>
              <el-button link type="info" @click="handle(row, 'IGNORED')">忽略</el-button>
            </template>
            <span v-else class="muted">已完成</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <span>共 {{ total }} 条意见</span>
        <el-pagination v-model:current-page="query.page" :page-size="query.pageSize" :total="total" layout="prev, pager, next" @current-change="load" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.filter { margin-top: 24px; padding: 16px; width: 220px; }
.table { margin-top: 16px; padding: 8px 18px 18px; }
.user { display: flex; align-items: center; gap: 10px; }
.user div { display: flex; flex-direction: column; gap: 3px; }
.user span, .muted { color: #929aab; font-size: 11px; }
.pagination { padding-top: 18px; display: flex; justify-content: space-between; color: #8b93a3; font-size: 12px; }
</style>
