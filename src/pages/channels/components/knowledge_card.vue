<template>
  <div v-if="knowledge_list.length > 0" class="flex flex-col h-[100vh]">
    <!-- 顶部增加标题 -->
    <div class="text-lg font-semibold mt-3 mb-3 px-4">知识检索</div>
    <!-- 分割线 -->
    <div class="px-4">
      <div class="w-full h-[1px] bg-border mb-4"></div>
    </div>
    <ScrollArea class="px-4 flex-1 min-h-0">
      <div v-for="knowledge_item in knowledge_list" :key="knowledge_item.cite_id"  :id="'knowledge_card_' + knowledge_item.cite_id" class="mb-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
        <div v-if="knowledge_item.type === 'pdf'" @click="open_knowledge(knowledge_item)" class="cursor-pointer">
        <!-- 第一行左边pdf图标 -->
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <img src="@/assets/imgs/pdf_large.png" alt="file" class="w-5 h-6" />
              <!-- 第一行中间期刊名字 -->  
              <span class="text-sm text-gray-600">{{ knowledge_item.published_journal }}</span>
            </div>
            <!-- 第一行右边cite_id --> 
            <span class="text-xs font-bold text-black bg-blue-100 px-2 py-1 rounded-md">{{ knowledge_item.cite_id }}</span>
          </div>
          <!-- 第二行标题 -->
          <div class="font-medium mb-2">{{ knowledge_item.paper_title }}</div>
          <!-- 第三行摘要 -->
          <div class="text-sm text-gray-700">{{ knowledge_item.file_name }}</div>
        </div>
        <div v-else-if="knowledge_item.type === 'png' || knowledge_item.type === 'jpg' || knowledge_item.type === 'jpeg'">
          <!-- 显示图片 -->
          <img :src="knowledge_item.img_base64" alt="file" class="w-full h-auto" />
        </div>
        <!-- 其他显示title就好 -->
        <div v-else>
          <div class="font-medium mb-2 cursor-pointer" @click="open_knowledge(knowledge_item)">{{ knowledge_item.file_name }}</div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect, onMounted, nextTick, watch } from 'vue'
import { useStore } from '@/stores/index.js'
import { getimgbase64_api, get_doc_api } from '@/api/common.js'
import { ScrollArea } from "@/components/ui/scroll-area"

const store = useStore()

const props = defineProps<{
  pipeline: any,
  cite_id_click?: string
}>()

interface KNOWLEDGE_TYPE {
  file_name: string,
  docId: string,
  paper_title: string,
  authors: string,
  published_time: string,
  published_journal: string,
  snippets: string,
  cite_id: string,
  type: string,
  img_base64?: string,
  download_url?: string,
  download_key?: string
}

const knowledge_list = ref<KNOWLEDGE_TYPE[]>([])

watchEffect(async () => {
  const newKnowledgeList: KNOWLEDGE_TYPE[] = []
  if (props.pipeline.tool_name === '知识检索' && props.pipeline.description_list) {
    for (let i = 0; i < props.pipeline.description_list.length; i++) {
      const tool = props.pipeline.description_list[i]
      const knowledge_item: KNOWLEDGE_TYPE = {
        file_name: tool?.title,
        paper_title: tool?.paper_title,
        authors: tool?.authors,
        published_time: tool?.published_time,
        published_journal: tool?.journal_name,
        snippets: tool?.snippets,
        cite_id: tool?.cite_id,
        docId: tool?.docId,
        type: tool?.type
      }
      // 请求后端获取download_url和download_key
      const res = await get_doc_api(tool?.docId)
      knowledge_item.download_url = res?.data?.data?.download_url
      knowledge_item.download_key = res?.data?.data?.download_key
      if (knowledge_item.type === 'png' || knowledge_item.type === 'jpg' || knowledge_item.type === 'jpeg') {
        const res = await getimgbase64_api(tool?.img_id)
        knowledge_item.img_base64 = 'data:image/' + knowledge_item.type + ';base64,' + res?.data?.data?.img_base64
      }
      newKnowledgeList.push(knowledge_item)
    }
  }
  knowledge_list.value = newKnowledgeList
})

const open_knowledge = (knowledge_item: KNOWLEDGE_TYPE) => {
  if (knowledge_item.download_url) {
    store.current_pdf_url = knowledge_item.download_url
  }
  let url = window.location.origin + '/pdf_viewer?docId=' + knowledge_item.docId
  if (knowledge_item.download_url) {
    url += '&download_url=' + knowledge_item.download_url
  }
  if (knowledge_item.download_key) {
    url += '&download_key=' + knowledge_item.download_key
  }
  // if (file.type === 3 || file.title.split('.').pop() === 'jpg' || file.title.split('.').pop() === 'jpeg' || file.title.split('.').pop() === 'png') {
  //   url += '&if_img=true'
  // }
  window.open(url, '_blank');
}

// 当cite_id_click发生变化时，滑动到对应的knowledge_card
watch(() => props.cite_id_click, (newVal) => {
  if (newVal) {
    nextTick(() => {
      const knowledge_card = document.getElementById('knowledge_card_' + newVal)
      if (knowledge_card) {
        knowledge_card.scrollIntoView({ behavior: 'smooth' })
        console.log('knowledge_card', store.if_highlight_card)
        if (store.if_highlight_card) {
          // 添加高亮效果并使用动画过渡
          knowledge_card.classList.add('highlight-citation')
          // 3秒后移除高亮效果
          setTimeout(() => {
            knowledge_card.classList.remove('highlight-citation')
          }, 3000)
        }
      }
    })
  }
})

onMounted(() => {
  if (props.cite_id_click) {
    nextTick(() => {
      const knowledge_card = document.getElementById('knowledge_card_' + props.cite_id_click)
      if (knowledge_card) {
        knowledge_card.scrollIntoView({ behavior: 'smooth' })
        if (store.if_highlight_card) {
          knowledge_card.classList.add('highlight-citation')
          // 3秒后移除高亮效果
          setTimeout(() => {
            knowledge_card.classList.remove('highlight-citation')
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