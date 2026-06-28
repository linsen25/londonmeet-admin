<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { fetchAdminUsers, sendAdminNotification, updateAdminUserStatus, type AdminUser } from '../api/admin'

const loading = ref(false)
const rows = ref<AdminUser[]>([])
const total = ref(0)
const query = reactive({ keyword: '', status: '', page: 1, pageSize: 20 })
const notificationOpen = ref(false)
const notificationSending = ref(false)
const notificationUser = ref<AdminUser | null>(null)
const notificationForm = reactive({ title: '', content: '' })

function formatDate(value: number) {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-'
}

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminUsers({
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

async function changeStatus(row: AdminUser) {
  const target = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  const label = target === 'DISABLED' ? '禁用账号' : '恢复账号'
  try {
    const { value } = await ElMessageBox.prompt(`请输入“${label}”的原因`, label, {
      inputType: 'textarea',
      inputValidator: (text) => Boolean(text?.trim()) || '必须填写原因',
    })
    await updateAdminUserStatus(row.id, target, value.trim())
    ElMessage.success(`${label}成功`)
    load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('操作失败')
  }
}

function openNotification(row: AdminUser) {
  notificationUser.value = row
  notificationForm.title = ''
  notificationForm.content = ''
  notificationOpen.value = true
}

async function sendNotification() {
  if (!notificationUser.value) return
  if (!notificationForm.title.trim() || !notificationForm.content.trim()) {
    ElMessage.warning('请填写通知标题和内容')
    return
  }
  notificationSending.value = true
  try {
    await sendAdminNotification(
      notificationUser.value.id,
      notificationForm.title.trim(),
      notificationForm.content.trim(),
    )
    ElMessage.success('通知已发送')
    notificationOpen.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '发送失败')
  } finally {
    notificationSending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="page-title">用户管理</h1>
    <p class="page-subtitle">查看用户活动记录、被举报次数和账号状态。</p>
    <section class="user-filter panel">
      <el-input v-model="query.keyword" clearable :prefix-icon="Search" placeholder="搜索昵称或用户ID" @keyup.enter="query.page=1; load()" />
      <el-select v-model="query.status" clearable placeholder="全部状态">
        <el-option label="正常" value="ACTIVE" />
        <el-option label="已禁用" value="DISABLED" />
      </el-select>
      <el-button type="primary" @click="query.page=1; load()">查询</el-button>
    </section>
    <section class="panel user-table">
      <el-table v-loading="loading" :data="rows">
        <el-table-column label="用户" min-width="190">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :src="row.avatarUrl" />
              <div><strong>{{ row.nickname }}</strong><span>用户ID {{ row.publicId }}</span></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="105">
          <template #default="{ row }"><el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">{{ row.status === 'ACTIVE' ? '正常' : '已禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createdActivityCount" label="发起活动" width="100" />
        <el-table-column prop="joinedActivityCount" label="参与活动" width="100" />
        <el-table-column prop="reportCount" label="被举报" width="90" />
        <el-table-column label="注册时间" width="150"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column>
        <el-table-column label="最后登录" width="150"><template #default="{ row }">{{ formatDate(row.lastLoginAt) }}</template></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="openNotification(row)">发通知</el-button>
            <el-button link :type="row.status === 'ACTIVE' ? 'danger' : 'success'" @click="changeStatus(row)">
              {{ row.status === 'ACTIVE' ? '禁用' : '恢复' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <span>共 {{ total }} 位用户</span>
        <el-pagination v-model:current-page="query.page" :page-size="query.pageSize" :total="total"
          layout="prev, pager, next" @current-change="load" />
      </div>
    </section>

    <el-dialog v-model="notificationOpen" :title="`发送通知给 ${notificationUser?.nickname || ''}`" width="480px">
      <el-form label-position="top">
        <el-form-item label="通知标题">
          <el-input v-model="notificationForm.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="通知内容">
          <el-input v-model="notificationForm.content" type="textarea" :rows="6" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="notificationOpen = false">取消</el-button>
        <el-button type="primary" :loading="notificationSending" @click="sendNotification">发送通知</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-filter { margin-top: 24px; padding: 16px; display: grid; grid-template-columns: 360px 180px auto 1fr; gap: 12px; }
.user-table { margin-top: 16px; padding: 8px 18px 18px; }
.user-cell { display: flex; align-items: center; gap: 11px; }
.user-cell div { display: flex; flex-direction: column; gap: 4px; }
.user-cell span { color: #929aab; font-size: 11px; }
.pagination { padding-top: 18px; display: flex; justify-content: space-between; color: #8b93a3; font-size: 12px; }
</style>
