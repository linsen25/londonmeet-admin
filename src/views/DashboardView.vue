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
const periodDays = ref(30)

const cards = computed(() => [
  { label: 'Users', value: data.value?.userCount ?? 0, icon: User, tone: 'blue' },
  { label: 'Activities', value: data.value?.activityCount ?? 0, icon: Calendar, tone: 'violet' },
  { label: 'Registrations', value: data.value?.registrationCount ?? 0, icon: Tickets, tone: 'green' },
  { label: 'Pending Reports', value: data.value?.pendingReportCount ?? 0, icon: Flag, tone: 'red' },
])

const periodCards = computed(() => [
  { label: `New users in ${periodDays.value} days`, value: data.value?.newUserCount ?? 0 },
  { label: `Active users in ${periodDays.value} days`, value: data.value?.activeUserCount ?? 0 },
  { label: `New activities in ${periodDays.value} days`, value: data.value?.newActivityCount ?? 0 },
  { label: `Registrations in ${periodDays.value} days`, value: data.value?.periodRegistrationCount ?? 0 },
  { label: 'Approved', value: data.value?.approvedRegistrationCount ?? 0 },
  { label: 'Cancelled', value: data.value?.cancelledRegistrationCount ?? 0 },
  { label: 'Pending Appeals', value: data.value?.pendingAppealCount ?? 0 },
])

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 34, right: 18, top: 28, bottom: 28 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.value?.dailyTrend.map((item) => item.date.slice(5)) ?? [],
    axisLine: { lineStyle: { color: '#e6eaf1' } },
    axisLabel: { color: '#8a93a5' },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: '#eef1f5' } },
    axisLabel: { color: '#8a93a5' },
  },
  legend: { top: 0 },
  series: [
    { name: 'New users', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.newUsers) ?? [] },
    { name: 'Active users', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.activeUsers) ?? [] },
    { name: 'New activities', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.activities) ?? [] },
    { name: 'Registrations', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.registrations) ?? [] },
    { name: 'Approved', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.approved) ?? [] },
  ],
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
      { name: 'Upcoming', value: data.value?.upcomingActivityCount ?? 0, itemStyle: { color: '#6c8cff' } },
      { name: 'Ongoing', value: data.value?.ongoingActivityCount ?? 0, itemStyle: { color: '#24b47e' } },
      { name: 'Ended', value: data.value?.endedActivityCount ?? 0, itemStyle: { color: '#c7ccd6' } },
      { name: 'Hidden', value: data.value?.hiddenActivityCount ?? 0, itemStyle: { color: '#e15149' } },
      { name: 'Cancelled', value: data.value?.cancelledActivityCount ?? 0, itemStyle: { color: '#f59e0b' } },
    ],
  }],
}))

async function load() {
  loading.value = true
  try {
    data.value = await fetchDashboard(periodDays.value)
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function downloadReport() {
  downloading.value = true
  try {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - periodDays.value + 1)
    const format = (value: Date) => value.toISOString().slice(0, 10)
    await downloadRecentReport(format(start), format(end))
    ElMessage.success(`${periodDays.value}-day Excel report download started`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to download report')
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div v-loading="loading">
    <div class="page-head">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Track users, activities, registrations and governance metrics.</p>
      </div>
      <div class="head-actions">
        <el-select v-model="periodDays" style="width: 110px" @change="load">
          <el-option label="7 days" :value="7" />
          <el-option label="30 days" :value="30" />
        </el-select>
        <div class="updated"><el-icon><Check /></el-icon> Updated just now</div>
        <el-button
          type="primary"
          :icon="Download"
          :loading="downloading"
          @click="downloadReport"
        >Download Excel</el-button>
      </div>
    </div>

    <div class="period-grid">
      <article v-for="card in periodCards" :key="card.label" class="period-card panel">
        <span>{{ card.label }}</span>
        <strong>{{ card.value.toLocaleString() }}</strong>
      </article>
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
          <div><h3>{{ periodDays }} day trend</h3><p>Daily activity and registration trend</p></div>
        </div>
        <VChart class="chart" :option="trendOption" autoresize />
      </section>

      <section class="panel chart-panel">
        <div class="panel-head">
          <div><h3>Activity status</h3><p>Current activity distribution</p></div>
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
.period-grid { margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.period-card { padding: 17px 20px; }
.period-card span { color: #7c8598; font-size: 12px; }
.period-card strong { display: block; margin-top: 7px; font-size: 23px; }
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
