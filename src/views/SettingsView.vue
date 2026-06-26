<script setup lang="ts">
import { Clock, DataAnalysis, Lock } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import { fetchAdminSettings, type AdminSettings } from '../api/admin'

const loading = ref(true)
const settings = ref<AdminSettings | null>(null)

onMounted(async () => {
  try {
    settings.value = await fetchAdminSettings()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading">
    <div class="page-head">
      <div>
        <h1 class="page-title">系统设置</h1>
        <p class="page-subtitle">管理后台的数据保留、清理与下载规则。</p>
      </div>
    </div>

    <div class="settings-grid">
      <section class="panel setting-card">
        <div class="setting-icon"><el-icon><Clock /></el-icon></div>
        <div>
          <h3>活动明细保留</h3>
          <strong>{{ settings?.activityDetailRetentionDays ?? 30 }} 天</strong>
          <p>{{ settings?.retentionDescription }}</p>
        </div>
      </section>
      <section class="panel setting-card">
        <div class="setting-icon yellow"><el-icon><DataAnalysis /></el-icon></div>
        <div>
          <h3>数据报告</h3>
          <strong>按需下载</strong>
          <p>{{ settings?.exportDescription }}</p>
        </div>
      </section>
      <section class="panel setting-card">
        <div class="setting-icon green"><el-icon><Lock /></el-icon></div>
        <div>
          <h3>清理方式</h3>
          <strong>清理重资源</strong>
          <p>30天后清理图片、二维码、报名与举报明细，活动骨架和评价永久保留。</p>
        </div>
      </section>
    </div>

    <el-alert
      class="notice"
      title="评价记录永久保留，综合评分仅计算最近30天"
      description="活动详情重资源会在30天后清理；需要完整运营数据时请及时下载Excel。"
      type="info"
      :closable="false"
      show-icon
    />
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; }
.settings-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.setting-card { padding: 24px; display: flex; gap: 17px; }
.setting-icon { width: 46px; height: 46px; flex: 0 0 46px; display: grid; place-items: center; border-radius: 13px; background: #edf2ff; color: #5578ee; font-size: 21px; }
.setting-icon.yellow { background: #fff7d6; color: #c59600; }
.setting-icon.green { background: #e9f8f1; color: #1b9b69; }
h3 { margin: 0; font-size: 15px; }
strong { display: block; margin-top: 10px; font-size: 23px; }
p { margin: 8px 0 0; color: #7c8598; font-size: 13px; line-height: 1.6; }
.notice { margin-top: 20px; }
@media (max-width: 1050px) { .settings-grid { grid-template-columns: 1fr; } }
</style>
