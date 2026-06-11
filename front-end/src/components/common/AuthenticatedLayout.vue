<script setup lang="ts">
import Header from '@/components/common/Header.vue'
</script>

<template>
  <div>
    <Header />
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>
