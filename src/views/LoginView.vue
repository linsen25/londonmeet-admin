<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginAdmin } from '../api/admin'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '' })

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入管理员账号和密码')
    return
  }
  loading.value = true
  try {
    const result = await loginAdmin(form.username, form.password)
    localStorage.setItem('admin_token', result.token)
    localStorage.setItem('admin_username', result.username)
    await router.replace('/dashboard')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-story">
      <div class="story-badge">LONDON ACTIVITY NETWORK</div>
      <h1>知道每场活动<br />正在发生什么。</h1>
      <p>从报名进度、活动状态到举报处理，用一套后台把运营脉络看清楚。</p>
      <div class="story-grid">
        <div><strong>实时</strong><span>活动进度</span></div>
        <div><strong>统一</strong><span>运营数据</span></div>
        <div><strong>可信</strong><span>身份追踪</span></div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="login-logo">晚</div>
        <h2>管理后台</h2>
        <p>登录后查看小程序运营数据</p>

        <el-form @submit.prevent="submit">
          <el-form-item>
            <el-input v-model="form.username" size="large" placeholder="管理员账号" :prefix-icon="User" />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              show-password
              placeholder="管理员密码"
              :prefix-icon="Lock"
              @keyup.enter="submit"
            />
          </el-form-item>
          <el-button class="login-button" type="primary" size="large" :loading="loading" @click="submit">
            登录后台
          </el-button>
        </el-form>

        <div class="login-hint">开发默认密码由后端 <code>ADMIN_PASSWORD</code> 控制</div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page { min-height: 100vh; display: grid; grid-template-columns: 1.15fr .85fr; background: #111722; }
.login-story {
  position: relative; overflow: hidden; padding: 10vh 8vw; color: #fff;
  background:
    radial-gradient(circle at 18% 20%, rgba(255,212,59,.18), transparent 28%),
    linear-gradient(145deg, #101620 0%, #192131 100%);
}
.login-story::after {
  content: ""; position: absolute; width: 420px; height: 420px; right: -120px; bottom: -130px;
  border: 1px solid rgba(255,255,255,.08); border-radius: 50%; box-shadow:
  0 0 0 70px rgba(255,255,255,.025), 0 0 0 140px rgba(255,255,255,.018);
}
.story-badge { color: #ffd43b; font-size: 12px; font-weight: 800; letter-spacing: .18em; }
.login-story h1 { margin: 70px 0 26px; font-size: clamp(46px, 5vw, 76px); line-height: 1.08; letter-spacing: -.05em; }
.login-story > p { width: 520px; max-width: 80%; color: #9ca6b9; font-size: 17px; line-height: 1.8; }
.story-grid { margin-top: 84px; display: flex; gap: 54px; }
.story-grid div { display: flex; flex-direction: column; gap: 8px; }
.story-grid strong { font-size: 22px; }
.story-grid span { color: #788398; font-size: 13px; }
.login-panel { display: grid; place-items: center; padding: 50px; background: #f5f6f8; }
.login-card { width: 420px; padding: 44px; border-radius: 22px; background: #fff; box-shadow: 0 24px 70px rgba(23,32,51,.12); }
.login-logo { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 15px; background: #ffd43b; color: #151a24; font-size: 21px; font-weight: 900; }
.login-card h2 { margin: 30px 0 8px; font-size: 30px; }
.login-card > p { margin: 0 0 34px; color: #8a93a5; }
.login-button { width: 100%; margin-top: 8px; background: #171d29; border-color: #171d29; }
.login-button:hover { background: #252d3d; border-color: #252d3d; }
.login-hint { margin-top: 24px; color: #a0a7b5; font-size: 12px; text-align: center; }
.login-hint code { color: #596174; }
</style>
