<template>
  <GPT_Page>
    <main_router v-if="show_main_router" />
    <main_list v-else v-model:isSidebarOpen="isSidebarOpen" ref="main_list_ref"/>
  </GPT_Page>
  <get_all_folder />
</template>

<script setup lang="ts">
import GPT_Page from '@/components/Layout/GPT_Page.vue'
// import sidebar_header from './components/sidebar_header.vue'
// import sidebar_content from './components/sidebar_content.vue'
import main_list from './components/main_list.vue'
import get_all_folder from '@/pages/ask/components/get_all_folder.vue'
import { useStore } from '@/stores/index.js'
import { storeToRefs } from 'pinia'
const store = useStore()
const { isSidebarOpen } = storeToRefs(store)
import { useRouter, useRoute } from 'vue-router'
import main_router from '@/pages/channels/components/main_router.vue'
// 获取当前route
const route = useRoute()
const route_query = route.query
const hasQuery = ref(true)
const sidebar_content_ref = ref(null)
const { show_main_router } = storeToRefs(store)

store.isSidebarOpen = false

if (route_query.channel_id) {
  show_main_router.value = false
  store.channel_id = route_query.channel_id
} else {
  // 如果query没有channel_id
  if (store.channel_id) {
    hasQuery.value = true
    // 设置query
    const path = `/channels?channel_id=${store.channel_id}`
    const url = `${window.location.origin}${path}`
    window.history.pushState({ path }, '', url)
  } else {
    hasQuery.value = false
    show_main_router.value = true
  }
}

const main_list_ref = ref(null)

const onSearch = (value: string) => {
  if (sidebar_content_ref.value) {
    sidebar_content_ref.value.get_channellist(value)
  }
}

onMounted(() => {
  if (route_query.closeSider) {
    main_list_ref.value.recover_params(route_query)
  }
})

</script>

<route lang="yaml">
  meta:
    layout: blank
</route>
