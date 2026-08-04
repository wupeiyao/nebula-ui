<template>
  <div class="home-container">
    <div class="welcome-card">
      <!-- 简约游戏陪玩元素插画 -->
      <div class="illustration">
        <svg viewBox="0 0 300 160" width="300" height="160" xmlns="http://www.w3.org/2000/svg">
          <!-- 底部投影框 -->
          <rect x="40" y="30" width="220" height="110" rx="10" fill="#e0f2fe" opacity="0.6"/>
          <!-- 主界面框 -->
          <rect x="30" y="20" width="240" height="120" rx="10" fill="#ffffff" stroke="#bae6fd" stroke-width="2"/>
          <!-- 顶部状态栏 -->
          <line x1="30" y1="40" x2="270" y2="40" stroke="#bae6fd" stroke-width="2"/>
          <circle cx="50" cy="30" r="3" fill="#93c5fd"/>
          <circle cx="60" cy="30" r="3" fill="#93c5fd"/>
          <!-- 左侧边栏 -->
          <rect x="40" y="55" width="40" height="70" rx="4" fill="#f1f8ff"/>
          <rect x="45" y="65" width="30" height="4" rx="2" fill="#bae6fd"/>
          <rect x="45" y="75" width="20" height="4" rx="2" fill="#bae6fd"/>
          <rect x="45" y="85" width="25" height="4" rx="2" fill="#bae6fd"/>
          <!-- 居中陪玩卡片1 (类似大神名片) -->
          <rect x="90" y="55" width="80" height="30" rx="4" fill="#3b82f6" opacity="0.1"/>
          <circle cx="105" cy="70" r="8" fill="#3b82f6"/>
          <rect x="120" y="65" width="40" height="4" rx="2" fill="#3b82f6" opacity="0.5"/>
          <rect x="120" y="73" width="20" height="4" rx="2" fill="#3b82f6" opacity="0.3"/>
          <!-- 居中陪玩卡片2 -->
          <rect x="90" y="95" width="80" height="30" rx="4" fill="#f1f8ff"/>
          <circle cx="105" cy="110" r="8" fill="#93c5fd"/>
          <rect x="120" y="105" width="35" height="4" rx="2" fill="#bfdbfe"/>
          <rect x="120" y="113" width="25" height="4" rx="2" fill="#bfdbfe"/>
          <!-- 右侧语音/游戏区域 (波形图代表语音交友) -->
          <rect x="180" y="55" width="80" height="70" rx="4" fill="#3b82f6" opacity="0.05"/>
          <!-- 麦克风 / 语音波形示意 -->
          <rect x="195" y="80" width="4" height="20" rx="2" fill="#3b82f6"/>
          <rect x="203" y="70" width="4" height="30" rx="2" fill="#3b82f6"/>
          <rect x="211" y="75" width="4" height="25" rx="2" fill="#3b82f6"/>
          <rect x="219" y="85" width="4" height="15" rx="2" fill="#3b82f6"/>
          <rect x="227" y="78" width="4" height="22" rx="2" fill="#3b82f6"/>
          <!-- 底部座子 -->
          <path d="M120 140 L180 140 L170 150 L130 150 Z" fill="#bae6fd"/>
          <rect x="110" y="150" width="80" height="4" rx="2" fill="#93c5fd"/>
        </svg>
      </div>

      <div class="welcome-header">
        <!-- 按照要求显示系统Logo与系统名称 -->
        <img v-if="systemConfigStore.sysLogo" :src="systemConfigStore.sysLogo" class="sys-logo" alt="Logo" />
        <h1 class="welcome-title">欢迎进入{{ systemConfigStore.sysName || '桃桃陪伴平台' }}</h1>
      </div>

      <p class="welcome-desc">
        您的专属游戏交友与娱乐社区。我们汇聚众多优质游戏大神与声优玩家，<br/>
        为您提供专业陪练、娱乐开黑、语音连麦等丰富体验。<br/>
        无论您是想提升技术还是寻找默契队友，在这里，让每一次游戏都不再孤单。
      </p>
    </div>
  </div>
</template>

<script setup>
import { useSystemConfigStore } from '../../../store/systemConfig.js';

const systemConfigStore = useSystemConfigStore();
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: calc(100vh - 150px);
  background-color: transparent;
}

.welcome-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 60px 80px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  text-align: center;
  max-width: 800px;
  width: 100%;
  margin: 0 20px;
}

.illustration {
  margin-bottom: 35px;
  display: flex;
  justify-content: center;
}

.welcome-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.sys-logo {
  height: 36px;
  width: auto;
  border-radius: 6px;
  object-fit: contain;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: 0.5px;
}

.welcome-desc {
  font-size: 16px;
  color: #64748b;
  line-height: 1.8;
  margin: 0 auto;
}
</style>
