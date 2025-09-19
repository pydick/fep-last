<template>
  <GPT_Page>
    <main_list class="bg-muted/40"/>
  </GPT_Page>
</template>

<script setup lang="ts">
import GPT_Page from '@/components/Layout/GPT_Page.vue';
import main_list from '@/pages/public_folder/components/main_list.vue';
import { useStore } from '@/stores/index.js'
import { storeToRefs } from 'pinia'
const store = useStore()
const { isSidebarOpen } = storeToRefs(store)
isSidebarOpen.value = false

</script>

<route lang="yaml">
  meta:
    layout: blank
</route>
