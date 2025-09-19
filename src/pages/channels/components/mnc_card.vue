<template>
  <div v-if="url_list.length > 0" class="flex flex-col h-[100vh]">
    <!-- 顶部增加标题 -->
    <div class="text-lg font-semibold mt-3 mb-3 px-4">数据库搜索</div>
    <!-- 分割线 -->
    <div class="px-4">
      <div class="w-full h-[1px] bg-border mb-4"></div>
    </div>
    <ScrollArea class="px-4 flex-1 min-h-0">
      <div v-for="url in url_list" :key="url.url" :id="'mnc_card_' + url.cite_id" class="mb-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
        <div class="flex justify-between items-start mb-2">
          <div class="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded-md">
            {{ url.category }}
          </div>
          
          <span class="text-xs font-bold text-black bg-blue-100 px-2 py-1 rounded-md">{{ url.cite_id }}</span>
        </div>
        
        <a v-if="url.url" :href="url.url" target="_blank" class="block">
          <h3 class="text-md font-medium text-blue-600 hover:underline mb-1">{{ url.title }}</h3>
        </a>
        <div v-else class="text-md font-medium text-blue-600 hover: mb-1">
          {{ url.title }}
        </div>

        <!-- 显示labels -->
        <div class="flex items-center flex-wrap">
          <div v-for="label in url?.labels?.slice(0, 5)" :key="label" class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md mr-2 mb-2 whitespace-nowrap">{{ label }}</div>
        </div>

        <div class="mt-2">
          <p class="text-sm text-gray-600 line-clamp-3">{{ url.snippets }}</p>
        </div>
        
        <div class="flex justify-between items-center mt-2">
          <span v-if="url.published_time" class="text-xs text-gray-400">{{ get_time(url.published_time) }}</span>
        </div>
      </div>
    </ScrollArea>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { useStore } from '@/stores/index.js'
import { ScrollArea } from "@/components/ui/scroll-area"

const store = useStore()

const props = defineProps<{
  pipeline: any,
  cite_id_click: Number
}>()

interface URL_TYPE {
  category: string,
  title: string,
  url: string,
  published_time: string,
  labels: string[],
  snippets: string,
  cite_id: string,
}

const url_list = computed(() => {
  const url_list: URL_TYPE[] = []
  if ((props.pipeline.tool_name === '情报数据库搜索' || props.pipeline.tool_name === 'DrugFlow-MNC情报数据库搜索') && props.pipeline.description_list) {
    for (let i = 0; i < props.pipeline.description_list.length; i++) {
      const tool = props.pipeline.description_list[i] 
      const url_item: URL_TYPE = {
        category: tool?.category,
        title: tool?.title,
        url: tool?.url,
        published_time: tool?.published_time,
        labels: tool?.labels,
        snippets: tool?.snippets,
        cite_id: tool?.cite_id,
      }
      url_list.push(url_item)
    }
  }
  return url_list
})

const get_time = (time: string) => {
  return time.split('T')[0]
}

const expandedLabels = ref<Record<string, boolean>>({})

const toggleExpand = (citeId: string) => {
  expandedLabels.value[citeId] = !expandedLabels.value[citeId]
}

// 当cite_id_click发生变化时，滑动到对应的mnc_card
watch(() => props.cite_id_click, (newVal) => {
  if (newVal) {
    nextTick(() => {
      const mnc_card = document.getElementById('mnc_card_' + newVal)
      if (mnc_card) {
        mnc_card.scrollIntoView({ behavior: 'smooth' })
        if (store.if_highlight_card) {
          // 添加高亮效果并使用动画过渡
          mnc_card.classList.add('highlight-citation')
          // 3秒后移除高亮效果
          setTimeout(() => {
            mnc_card.classList.remove('highlight-citation')
          }, 3000)
        }
      }
    })
  }
})

onMounted(() => {
  if (props.cite_id_click) {
    nextTick(() => {
      const mnc_card = document.getElementById('mnc_card_' + props.cite_id_click)
      if (mnc_card) {
        mnc_card.scrollIntoView({ behavior: 'smooth' })
        if (store.if_highlight_card) {
          mnc_card.classList.add('highlight-citation')
          // 3秒后移除高亮效果
          setTimeout(() => {
            mnc_card.classList.remove('highlight-citation')
          }, 3000)
        }
      }
    })
  }
})
</script>

<style scoped>
.highlight-citation {
  animation: highlight 3s ease-in-out;
}

@keyframes highlight {
  0% { background-color: #f0f0f0; }
  50% { background-color: #d0f0d0; }
  100% { background-color: #f0f0f0; }
}
</style>