<script setup lang="ts">
import {
  Calendar,
  Collection,
  DataAnalysis,
  Expand,
  Fold,
  Message,
  Setting,
  User,
  Warning,
  TrendCharts,
} from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const username = localStorage.getItem('admin_username') || 'Admin'
const activeMenu = computed(() => route.path)

function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_username')
  router.replace('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="brand">
        <div class="brand-mark">LM</div>
        <div v-if="!collapsed" class="brand-copy">
          <strong>LondonMeet</strong>
          <span>Admin Console</span>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        class="side-menu"
        :collapse="collapsed"
        background-color="transparent"
        text-color="#98a2b8"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>鏁版嵁姒傝</template>
        </el-menu-item>
        <el-sub-menu index="/analytics">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>鏁版嵁鍒嗘瀽</span>
          </template>
          <el-menu-item index="/analytics/activities">娲诲姩鍒嗘瀽</el-menu-item>
          <el-menu-item index="/analytics/users">鐢ㄦ埛鍒嗘瀽</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/activities">
          <el-icon><Calendar /></el-icon>
          <template #title>娲诲姩绠＄悊</template>
        </el-menu-item>
        <el-menu-item index="/tags">
          <el-icon><Collection /></el-icon>
          <template #title>Tags</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>Users</template>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><Warning /></el-icon>
          <template #title>Governance</template>
        </el-menu-item>
        <el-menu-item index="/feedback">
          <el-icon><Message /></el-icon>
          <template #title>Feedback</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>Settings</template>
        </el-menu-item>
      </el-menu>

      <button class="collapse-button" @click="collapsed = !collapsed">
        <el-icon><component :is="collapsed ? Expand : Fold" /></el-icon>
        <span v-if="!collapsed">Collapse</span>
      </button>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div>
          <span class="environment-dot"></span>
          Production
        </div>
        <el-dropdown trigger="click">
          <button class="admin-user">
            <span class="admin-avatar">{{ username.slice(0, 1).toUpperCase() }}</span>
            <span>{{ username }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="logout">Logout</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>

      <section class="content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-shell { min-height: 100vh; display: flex; }
.sidebar {
  position: sticky; top: 0; width: 248px; height: 100vh; padding: 22px 16px;
  background: #121722; color: #fff; transition: width 180ms ease; display: flex;
  flex-direction: column; z-index: 10;
}
.sidebar.collapsed { width: 80px; }
.brand { height: 64px; padding: 0 8px; display: flex; align-items: center; gap: 12px; }
.brand-mark {
  width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center;
  border-radius: 12px; color: #121722; background: #ffd43b; font-weight: 900;
}
.brand-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.brand-copy strong { white-space: nowrap; font-size: 15px; }
.brand-copy span { color: #6f7a91; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
.side-menu { margin-top: 22px; border: 0; }
.side-menu :deep(.el-menu-item) { height: 48px; margin: 5px 0; border-radius: 10px; }
.side-menu :deep(.el-menu-item.is-active) { background: #252c3b; }
.collapse-button {
  width: 100%; height: 44px; margin-top: auto; border: 0; border-radius: 10px;
  background: transparent; color: #7f899e; display: flex; align-items: center;
  justify-content: center; gap: 10px; cursor: pointer;
}
.collapse-button:hover { background: #202634; color: #fff; }
.main-area { min-width: 0; flex: 1; }
.topbar {
  height: 72px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e7eaf0; background: rgba(255,255,255,.88);
  backdrop-filter: blur(12px); color: #768096; font-size: 13px;
}
.environment-dot {
  display: inline-block; width: 8px; height: 8px; margin-right: 8px;
  border-radius: 50%; background: #24b47e; box-shadow: 0 0 0 4px rgba(36,180,126,.12);
}
.admin-user {
  border: 0; background: transparent; display: flex; align-items: center;
  gap: 10px; color: #30384a; cursor: pointer;
}
.admin-avatar {
  width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px;
  background: #202633; color: #fff; font-weight: 800;
}
.content { padding: 30px 32px 48px; }
</style>
