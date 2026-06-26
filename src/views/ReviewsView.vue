<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import {
  fetchAdminActivityReviews,
  fetchAdminReviewActivities,
  updateAdminReviewStatus,
  type AdminReviewActivity,
  type AdminReview,
} from '../api/admin'

const loading = ref(false)
const rows = ref<AdminReviewActivity[]>([])
const details = ref<Record<number, AdminReview[]>>({})
const detailLoading = ref<Record<number, boolean>>({})
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

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminReviewActivities({
      keyword: query.keyword || undefined,
      targetType: query.targetType || undefined,
      status: query.status || undefined,
      page: query.page,
      pageSize: query.pageSize,
    })
    rows.value = result.list
    details.value = {}
    total.value = result.total
  } finally {
    loading.value = false
  }
}

async function onExpand(row: AdminReviewActivity, expanded: AdminReviewActivity[]) {
  if (!expanded.some((item) => item.activityId === row.activityId) || details.value[row.activityId]) return
  detailLoading.value[row.activityId] = true
  try {
    const result = await fetchAdminActivityReviews(row.activityId)
    details.value[row.activityId] = result.list
  } finally {
    detailLoading.value[row.activityId] = false
  }
}

function matchesDetailFilter(item: AdminReview) {
  return (!query.status || item.status === query.status)
    && (!query.targetType || item.targetType === query.targetType)
}

function activityReviews(activityId: number) {
  return (details.value[activityId] || [])
    .filter((item) => item.targetType === 'activity')
    .filter(matchesDetailFilter)
}

function memberReviews(activityId: number) {
  return (details.value[activityId] || [])
    .filter((item) => item.targetType === 'member')
    .filter(matchesDetailFilter)
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
    ElMessage.success(targetStatus.value === 'EXCLUDED' ? '该评价已忽略，不再计分' : '该评价已保留并计分')
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
        <h1 class="page-title">评分治理</h1>
        <p class="page-subtitle">以活动为中心查看四维活动评分、发起人给参与者的三维评分和待审核低分。</p>
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
        <el-option label="低分待审核" value="PENDING" />
        <el-option label="已排除" value="EXCLUDED" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </section>

    <section class="table panel">
      <el-table v-loading="loading" :data="rows" row-key="activityId" @expand-change="onExpand">
        <el-table-column type="expand">
          <template #default="{ row: group }">
            <div v-loading="detailLoading[group.activityId]" class="review-detail">
              <el-tabs>
                <el-tab-pane v-if="query.targetType !== 'member'" :label="`活动与发起人评价（${activityReviews(group.activityId).length}）`">
                  <el-table :data="activityReviews(group.activityId)" border>
                    <el-table-column prop="reviewerName" label="评分者" width="150" />
                    <el-table-column label="四维评分" min-width="310">
                      <template #default="{ row }">
                        <div class="scores">
                          <span v-for="score in row.scores" :key="score.key"
                            :class="{ low: score.value < 3 }">
                            {{ scoreLabels[score.key] || score.label }} {{ score.value }}/5
                          </span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="reason" label="低分原因" min-width="220" />
                    <el-table-column label="状态" width="120">
                      <template #default="{ row }">{{ row.status }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="170">
                      <template #default="{ row }">
                        <template v-if="row.status === 'PENDING'">
                          <el-button link type="success" @click="openGovern(row, 'NORMAL')">保留并计分</el-button>
                          <el-button link type="danger" @click="openGovern(row, 'EXCLUDED')">忽略</el-button>
                        </template>
                        <el-button v-else-if="row.status === 'NORMAL'" link type="danger"
                          @click="openGovern(row, 'EXCLUDED')">忽略</el-button>
                        <el-button v-else link type="success"
                          @click="openGovern(row, 'NORMAL')">恢复</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
                <el-tab-pane v-if="query.targetType !== 'activity'" :label="`发起人评价参与者（${memberReviews(group.activityId).length}）`">
                  <el-table :data="memberReviews(group.activityId)" border>
                    <el-table-column label="评价关系" min-width="230">
                      <template #default="{ row }">{{ row.reviewerName }} → {{ row.targetName }}</template>
                    </el-table-column>
                    <el-table-column label="三维评分" min-width="280">
                      <template #default="{ row }">
                        <div class="scores">
                          <span v-for="score in row.scores" :key="score.key"
                            :class="{ low: score.value < 3 }">
                            {{ scoreLabels[score.key] || score.label }} {{ score.value }}/5
                          </span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="方式" width="110">
                      <template #default="{ row }">{{ row.batchGood ? '一键好评' : '单独评价' }}</template>
                    </el-table-column>
                    <el-table-column prop="reason" label="低分原因" min-width="200" />
                    <el-table-column label="状态/操作" width="190">
                      <template #default="{ row }">
                        <template v-if="row.status === 'PENDING'">
                          <el-button link type="success" @click="openGovern(row, 'NORMAL')">保留</el-button>
                          <el-button link type="danger" @click="openGovern(row, 'EXCLUDED')">忽略</el-button>
                        </template>
                        <span v-else>{{ row.status }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动" min-width="260">
          <template #default="{ row }">
            <strong>{{ row.activityTitle }}</strong>
            <div class="muted">活动 ID {{ row.activityId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="发起人近30天" min-width="210">
          <template #default="{ row }">
            <strong>{{ row.creatorRecentAverage == null ? '5.0/5' : `${row.creatorRecentAverage.toFixed(1)}/5` }}</strong>
            <div class="muted">
              {{ row.creatorRecentReviewCount ? `${row.creatorRecentReviewCount} 条有效评价` : '暂无真实评分' }}
            </div>
            <div v-if="row.creatorRecentReviewCount" class="dimension-summary">
              <span v-for="(value, key) in row.creatorRecentDimensions" :key="key">
                {{ scoreLabels[key] || key }} {{ Number(value).toFixed(1) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动平均分" width="150">
          <template #default="{ row }">
            {{ row.activityAverage == null ? '5.0/5 · 暂无真实评分' : `${row.activityAverage.toFixed(1)}/5` }}
          </template>
        </el-table-column>
        <el-table-column label="活动评分人数" width="135">
          <template #default="{ row }">{{ row.activityReviewCount }}</template>
        </el-table-column>
        <el-table-column label="参与者评分" width="135">
          <template #default="{ row }">{{ row.participantReviewedCount }}/{{ row.participantCount }}</template>
        </el-table-column>
        <el-table-column label="待审核低分" width="135">
          <template #default="{ row }">
            <el-tag :type="row.pendingCount ? 'danger' : 'success'">{{ row.pendingCount }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <span>共 {{ total }} 个有评价的活动</span>
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
      :title="targetStatus === 'EXCLUDED' ? '忽略评价' : '保留并计分'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="targetStatus === 'EXCLUDED'
          ? '原始评分不会删除，但将不再参与综合评分计算。'
          : '确认后，该评价将参与最近30天综合评分计算。'"
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
.muted { color: #8d96a8; font-size: 12px; }
.scores { display: flex; flex-wrap: wrap; gap: 5px 12px; color: #596377; font-size: 12px; }
.scores .low { color: #e5484d; font-weight: 800; }
.review-detail { padding: 14px 22px 24px; background: #f7f8fb; }
.dimension-summary { margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px 9px; color: #7a8498; font-size: 11px; }
.pagination { padding-top: 18px; display: flex; justify-content: space-between; color: #8b93a3; font-size: 12px; }
.govern-form { margin-top: 18px; }
</style>
