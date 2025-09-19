<template>
  <div v-if="url_list.length > 0" class="flex flex-col h-[100vh]">
    <!-- 顶部增加标题 -->
    <div class="text-lg font-semibold mt-3 mb-3 px-4">网络搜索</div>
    <!-- 分割线 -->
    <div class="px-4">
      <div class="w-full h-[1px] bg-border mb-4"></div>
    </div>
    <ScrollArea class="px-4 flex-1 min-h-0">
      <div v-for="url in url_list" :key="url.url" :id="'url_' + url.cite_id" class="mb-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <img v-if="url.icon_url" :src="url.icon_url" alt="Icon" class="w-5 h-5" />
            <Earth v-else class="w-5 h-5 bg-blue-100 rounded-full text-blue-400"></Earth>
            <span class="text-sm text-gray-500">{{ url.domain_url }}</span>
          </div>
          <span class="text-xs font-bold text-black bg-blue-100 px-2 py-1 rounded-md">{{ url.cite_id }}</span>
        </div>
        
        <a :href="url.url" target="_blank" class="block">
          <h3 class="text-md font-medium text-blue-600 hover:underline mb-1">{{ url.title }}</h3>
        </a>
        
        <div class="flex justify-between items-center mt-2">
          <span v-if="url.published_time" class="text-xs text-gray-400">{{ get_time(url.published_time) }}</span>
        </div>
        
        <div class="mt-3 flex gap-4">
          <img v-if="url.thumbnail_url" :src="url.thumbnail_url" alt="Thumbnail" class="rounded-md max-h-24 w-32 object-cover" />
          <p class="text-sm text-gray-600 line-clamp-3" v-html="url.snippets"></p>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/stores/index.js'
import { Earth } from 'lucide-vue-next'
import { ScrollArea } from "@/components/ui/scroll-area"

const store = useStore()

const props = defineProps<{
  pipeline: any,
  cite_id_click: Number
}>()

interface URL_TYPE {
  icon_url: string,
  thumbnail_url: string,
  snippets: string,
  url: string,
  title: string,
  published_time: string,
  domain_url: string,
  cite_id: string,
}

const url_list = computed(() => {
  const url_list: URL_TYPE[] = []

  if (!props.pipeline) {
    return url_list
  }
  
  if (props.pipeline.tool_name === '页面爬取' || props.pipeline.tool_name === '网络搜索') {
    if (Array.isArray(props.pipeline.description_list)) {
      for (const tool of props.pipeline.description_list) {
        const url_item: URL_TYPE = {
          icon_url: tool?.icon_url,
          thumbnail_url: tool?.thumbnail_url,
          snippets: tool?.snippets,
          url: tool?.url,
          title: tool?.title,
          published_time: tool?.published_time,
          domain_url: get_domain(tool?.url),
          cite_id: tool?.cite_id,
        }
        url_list.push(url_item)
      }
    }
  }
  return url_list
})

const get_domain = (url: string) => {
  const domain = url.split('/')[2]
  if (!domain) return ''
  return domain.replace('www.', '').replace('https://', '').replace('http://', '')
}

const get_time = (time: string) => {
  return time.split('T')[0]
}

// 当cite_id_click发生变化时，滑动到对应的url_card
watch(() => props.cite_id_click, (newVal) => {
  if (newVal) {
    nextTick(() => {
      const url_card = document.getElementById('url_' + newVal)
      if (url_card) {
        url_card.scrollIntoView({ behavior: 'smooth' })
        // 添加高亮效果并使用动画过渡
        if (store.if_highlight_card) {
          url_card.classList.add('highlight-citation')
          // 3秒后移除高亮效果
          setTimeout(() => {
            url_card.classList.remove('highlight-citation')
          }, 3000)
        }
      }
    })
  }
})

onMounted(() => {
  if (props.cite_id_click) {
    nextTick(() => {
      const url_card = document.getElementById('url_' + props.cite_id_click)
      if (url_card) {
        url_card.scrollIntoView({ behavior: 'smooth' })
        if (store.if_highlight_card) {
          url_card.classList.add('highlight-citation')
          // 3秒后移除高亮效果
          setTimeout(() => {
            url_card.classList.remove('highlight-citation')
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