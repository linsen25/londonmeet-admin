<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { fetchActivityAnalytics, type ActivityAnalyticsItem } from '../api/admin'

const loading = ref(false)
const rows = ref<ActivityAnalyticsItem[]>([])
const total = ref(0)
const today = new Date()
const start = new Date(today)
start.setDate(start.getDate() - 29)
const formatDate = (date: Date) => date.toISOString().slice(0, 10)
const query = reactive({
  range: [formatDate(start), formatDate(today)] as [string, string],
  page: 1,
  pageSize: 20,
})

async function load() {
  loading.value = true
  try {
    const result = await fetchActivityAnalytics({
      startDate: query.range[0],
      endDate: query.range[1],
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

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">活动分析</h1>
        <p class="page-subtitle">复盘活动从列表查看、详情访问、报名审核到查看群码的真实流程表现。</p>
      </div>
    </div>

    <section class="panel filter">
      <el-date-picker
        v-model="query.range"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :clearable="false"
      />
      <el-button type="primary" @click="search">查询</el-button>
    </section>

    <section class="panel table-panel">
      <el-table v-loading="loading" :data="rows" row-key="activityId">
        <el-table-column label="活动" min-width="220" fixed>
          <template #default="{ row }">
            <strong>{{ row.title }}</strong>
            <div class="muted">ID {{ row.activityId }} · {{ row.creatorName }}</div>
            <div class="muted">{{ row.tags || '未设置标签' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="exposureUsers" label="列表查看" width="100" />
        <el-table-column prop="detailUsers" label="详情访问" width="100" />
        <el-table-column label="详情访问率" width="110">
          <template #default="{ row }">{{ row.exposureToDetailRate.toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column prop="favoriteUsers" label="收藏人数" width="100" />
        <el-table-column prop="applicationCount" label="报名数" width="85" />
        <el-table-column label="报名转化率" width="110">
          <template #default="{ row }">{{ row.detailToApplyRate.toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column prop="approvedCount" label="通过数" width="85" />
        <el-table-column label="通过率" width="90">
          <template #default="{ row }">{{ row.approvalRate.toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column prop="groupQrUsers" label="查看群码" width="95" />
        <el-table-column label="群码查看率" width="105">
          <template #default="{ row }">{{ row.groupQrViewRate.toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column prop="cancelledCount" label="取消数" width="85" />
        <el-table-column label="评分" width="110">
          <template #default="{ row }">
            {{ row.averageRating == null ? '暂无' : `${row.averageRating.toFixed(1)}/5` }}
            <div class="muted">{{ row.reviewCount }}人评价</div>
          </template>
        </el-table-column>
        <el-table-column prop="reportCount" label="举报数" width="85" />
      </el-table>
      <div class="pagination">
        <span>共 {{ total }} 个活动</span>
        <el-pagination
          v-model:current-page="query.page"
          :page-size="query.pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="load"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.filter { margin-top: 24px; padding: 16px; display: flex; gap: 12px; }
.table-panel { margin-top: 16px; padding: 8px 18px 18px; }
.muted { margin-top: 4px; color: #8d96a8; font-size: 12px; }
.pagination { padding-top: 18px; display: flex; justify-content: space-between; color: #8b93a3; font-size: 12px; }
</style>
