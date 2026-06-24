<script setup lang="ts">
import { Calendar, Check, Download, Flag, Tickets, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import {
  downloadRecentReport,
  fetchDashboard,
  type DashboardData,
} from '../api/admin'

use([CanvasRenderer, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

const loading = ref(true)
const downloading = ref(false)
const data = ref<DashboardData | null>(null)

const cards = computed(() => [
  { label: '用户总数', value: data.value?.userCount ?? 0, icon: User, tone: 'blue' },
  { label: '活动总数', value: data.value?.activityCount ?? 0, icon: Calendar, tone: 'violet' },
  { label: '累计报名', value: data.value?.registrationCount ?? 0, icon: Tickets, tone: 'green' },
  { label: '待处理举报', value: data.value?.pendingReportCount ?? 0, icon: Flag, tone: 'red' },
])

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 34, right: 18, top: 28, bottom: 28 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.value?.activityTrend.map((item) => item.date.slice(5)) ?? [],
    axisLine: { lineStyle: { color: '#e6eaf1' } },
    axisLabel: { color: '#8a93a5' },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: '#eef1f5' } },
    axisLabel: { color: '#8a93a5' },
  },
  series: [{
    type: 'line',
    smooth: true,
    symbolSize: 8,
    data: data.value?.activityTrend.map((item) => item.count) ?? [],
    lineStyle: { width: 3, color: '#1f2633' },
    itemStyle: { color: '#ffd43b', borderColor: '#1f2633', borderWidth: 2 },
    areaStyle: { color: 'rgba(255, 212, 59, .16)' },
  }],
}))

const statusOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle' },
  series: [{
    type: 'pie',
    radius: ['52%', '72%'],
    center: ['50%', '45%'],
    label: { show: false },
    data: [
      { name: '未开始', value: data.value?.upcomingActivityCount ?? 0, itemStyle: { color: '#6c8cff' } },
      { name: '进行中', value: data.value?.ongoingActivityCount ?? 0, itemStyle: { color: '#24b47e' } },
      { name: '已结束', value: data.value?.endedActivityCount ?? 0, itemStyle: { color: '#c7ccd6' } },
    ],
  }],
}))

onMounted(async () => {
  try {
    data.value = await fetchDashboard()
  } finally {
    loading.value = false
  }
})

async function downloadReport() {
  downloading.value = true
  try {
    await downloadRecentReport()
    ElMessage.success('近30天Excel报告已开始下载')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '下载报告失败')
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div v-loading="loading">
    <div class="page-head">
      <div>
        <h1 class="page-title">数据概览</h1>
        <p class="page-subtitle">快速了解用户、活动、报名与举报的整体情况。</p>
      </div>
      <div class="head-actions">
        <div class="updated"><el-icon><Check /></el-icon> 数据来自当前数据库</div>
        <el-button
          type="primary"
          :icon="Download"
          :loading="downloading"
          @click="downloadReport"
        >下载近30天Excel</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <article v-for="card in cards" :key="card.label" class="metric-card panel">
        <div class="metric-icon" :class="card.tone"><el-icon><component :is="card.icon" /></el-icon></div>
        <div>
          <div class="metric-label">{{ card.label }}</div>
          <strong>{{ card.value.toLocaleString() }}</strong>
        </div>
      </article>
    </div>

    <div class="chart-grid">
      <section class="panel chart-panel trend-panel">
        <div class="panel-head">
          <div><h3>近 7 天新增活动</h3><p>按活动创建日期统计</p></div>
        </div>
        <VChart class="chart" :option="trendOption" autoresize />
      </section>

      <section class="panel chart-panel">
        <div class="panel-head">
          <div><h3>活动状态分布</h3><p>按当前时间自动计算</p></div>
        </div>
        <VChart class="chart" :option="statusOption" autoresize />
      </section>
    </div>

  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; }
.updated { color: #7b8498; font-size: 13px; display: flex; align-items: center; gap: 7px; }
.head-actions { display: flex; align-items: center; gap: 16px; }
.metric-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.metric-card { padding: 22px; display: flex; align-items: center; gap: 18px; }
.metric-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; font-size: 22px; }
.metric-icon.blue { background: #edf2ff; color: #5578ee; }
.metric-icon.violet { background: #f4efff; color: #8158d8; }
.metric-icon.green { background: #e9f8f1; color: #1b9b69; }
.metric-icon.red { background: #fff0ef; color: #e15149; }
.metric-label { color: #7c8598; font-size: 13px; }
.metric-card strong { display: block; margin-top: 6px; font-size: 27px; }
.chart-grid { margin-top: 20px; display: grid; grid-template-columns: 1.7fr 1fr; gap: 20px; }
.chart-panel { min-height: 390px; padding: 22px; }
.panel-head h3 { margin: 0; font-size: 17px; }
.panel-head p { margin: 7px 0 0; color: #929aab; font-size: 12px; }
.chart { height: 310px; margin-top: 12px; }
</style>
