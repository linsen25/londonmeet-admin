<script setup lang="ts">
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import {
  createAdminTag,
  deleteAdminTag,
  fetchAdminTags,
  updateAdminTag,
  type AdminTag,
} from '../api/admin'

const loading = ref(false)
const rows = ref<AdminTag[]>([])
const dialogOpen = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', enabled: true, sortOrder: 0 })

async function load() {
  loading.value = true
  try {
    rows.value = await fetchAdminTags()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', enabled: true, sortOrder: 0 })
  dialogOpen.value = true
}

function openEdit(row: AdminTag) {
  editingId.value = row.id
  Object.assign(form, { name: row.name, enabled: row.enabled, sortOrder: row.sortOrder })
  dialogOpen.value = true
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  saving.value = true
  try {
    const data = { name: form.name.trim(), enabled: form.enabled, sortOrder: form.sortOrder }
    if (editingId.value) await updateAdminTag(editingId.value, data)
    else await createAdminTag(data)
    ElMessage.success(editingId.value ? '标签已更新' : '标签已添加')
    dialogOpen.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function toggle(row: AdminTag) {
  try {
    await updateAdminTag(row.id, {
      name: row.name,
      enabled: !row.enabled,
      sortOrder: row.sortOrder,
    })
    ElMessage.success(row.enabled ? '标签已停用' : '标签已启用')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}

async function remove(row: AdminTag) {
  try {
    await ElMessageBox.confirm(
      row.activityCount
        ? `该标签被 ${row.activityCount} 个活动使用，无法删除，建议停用。`
        : `确定彻底删除标签“${row.name}”吗？`,
      '删除标签',
      {
        type: 'warning',
        confirmButtonText: row.activityCount ? '知道了' : '确认删除',
        showCancelButton: !row.activityCount,
      },
    )
    if (row.activityCount) return
    await deleteAdminTag(row.id)
    ElMessage.success('标签已删除')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error instanceof Error ? error.message : '删除失败')
    }
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">标签管理</h1>
        <p class="page-subtitle">管理活动分类、排序和可选状态；已被使用的标签只能停用。</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">添加标签</el-button>
      </div>
    </div>

    <section class="panel table-panel">
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="标签名称" min-width="180">
          <template #default="{ row }"><el-tag effect="plain">{{ row.name }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="100" />
        <el-table-column prop="activityCount" label="使用活动数" width="130" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.enabled ? 'warning' : 'success'" @click="toggle(row)">
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogOpen" :title="editingId ? '编辑标签' : '添加标签'" width="430px">
      <el-form label-position="top">
        <el-form-item label="标签名称">
          <el-input v-model="form.name" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
          <span class="form-tip">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; }
.head-actions { display: flex; gap: 10px; }
.table-panel { margin-top: 24px; padding: 10px 18px 18px; }
.form-tip { margin-left: 12px; color: #8a93a5; font-size: 12px; }
</style>
