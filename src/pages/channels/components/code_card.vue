<template>
  <div v-if="code_list.length > 0" class="flex flex-col h-[100vh]">
    <!-- 顶部增加标题 -->
    <div class="text-lg font-semibold mt-3 mb-3 px-4">代码生成和执行</div>
    <!-- 分割线 -->
    <div class="px-4">
      <div class="w-full h-[1px] bg-border mb-4"></div>
    </div>
    <ScrollArea class="px-4 flex-1 min-h-0">
      <div v-for="item in code_list" :key="item" class="mb-4 p-4 border rounded-lg transition-colors text-slate-100 bg-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <pre class="text-sm whitespace-pre-wrap text-left">{{ item.code }}</pre>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ScrollArea } from "@/components/ui/scroll-area"
const props = defineProps<{
  pipeline: any
}>()

const code_list = computed(() => {
  const code_list = []

  if (!props.pipeline) {
    return code_list
  }
  
  if (props.pipeline.tool_name === 'execute_code') {
    if (Array.isArray(props.pipeline.description_list)) {
      for (const tool of props.pipeline.description_list) {
        console.log('execute_code', tool)
        const item = {
          code: tool?.code
        }
        code_list.push(item)
      }
    }
  }
  return code_list
})

</script>

<style scoped>
</style>