<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { fetchUserAnalytics, type UserAnalyticsData } from '../api/admin'

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent])

const loading = ref(false)
const data = ref<UserAnalyticsData | null>(null)
const today = new Date()
const start = new Date(today)
start.setDate(start.getDate() - 29)
const formatDate = (date: Date) => date.toISOString().slice(0, 10)
const query = reactive({ range: [formatDate(start), formatDate(today)] as [string, string] })

const cards = computed(() => [
  ['新增用户', data.value?.newUserCount ?? 0],
  ['活跃用户', data.value?.activeUserCount ?? 0],
  ['发起活动用户', data.value?.creatorUserCount ?? 0],
  ['报名用户', data.value?.applicantUserCount ?? 0],
  ['既发起又报名', data.value?.creatorAndApplicantCount ?? 0],
  ['无活跃行为用户', data.value?.inactiveUserCount ?? 0],
  ['人均报名', data.value?.applicationsPerApplicant ?? 0],
])

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0 },
  grid: { left: 38, right: 20, top: 42, bottom: 28 },
  xAxis: { type: 'category', data: data.value?.dailyTrend.map((item) => item.date.slice(5)) ?? [] },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    { name: '新增用户', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.newUsers) ?? [] },
    { name: '活跃用户', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.activeUsers) ?? [] },
    { name: '新增活动', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.activities) ?? [] },
    { name: '报名', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.applications) ?? [] },
    { name: '审核通过', type: 'line', smooth: true, data: data.value?.dailyTrend.map((item) => item.approved) ?? [] },
  ],
}))

async function load() {
  loading.value = true
  try {
    data.value = await fetchUserAnalytics({
      startDate: query.range[0],
      endDate: query.range[1],
    })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <div class="page-head">
      <div>
        <h1 class="page-title">用户分析</h1>
        <p class="page-subtitle">查看用户新增、活跃行为、发起活动和报名参与情况。</p>
      </div>
    </div>
    <section class="panel filter">
      <el-date-picker v-model="query.range" type="daterange" value-format="YYYY-MM-DD"
        range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :clearable="false" />
      <el-button type="primary" @click="load">查询</el-button>
    </section>
    <section class="metric-grid">
      <article v-for="[label, value] in cards" :key="String(label)" class="panel metric-card">
        <span>{{ label }}</span><strong>{{ value }}</strong>
      </article>
    </section>
    <section class="panel chart-panel">
      <h3>每日趋势</h3>
      <VChart class="chart" :option="trendOption" autoresize />
    </section>
  </div>
</template>

<style scoped>
.filter { margin-top: 24px; padding: 16px; display: flex; gap: 12px; }
.metric-grid { margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.metric-card { padding: 20px; }
.metric-card span { color: #7c8598; font-size: 13px; }
.metric-card strong { display: block; margin-top: 8px; font-size: 26px; }
.chart-panel { margin-top: 16px; padding: 22px; }
.chart-panel h3 { margin: 0; }
.chart { height: 360px; margin-top: 12px; }
</style>
