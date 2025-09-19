<template>
  <div v-if="!pipeline">
    <div class="text-lg font-semibold mb-4">结果等待...</div>
    <!-- 分割线 -->
    <div class="w-full h-[1px] bg-border mb-4"></div>
    <div class="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-dashed">
      <div class="text-sm text-muted-foreground">请稍等片刻，结果将很快显示在这里</div>
    </div>
  </div>
  <div v-else>
    <pdb_card :pipeline="pipeline" />
    <csv_card :pipeline="pipeline" />
    <sdf_card :pipeline="pipeline" />
    <admet_card :pipeline="pipeline" />
    <url_card :pipeline="pipeline" :cite_id_click="cite_id" />
    <mnc_card :pipeline="pipeline" :cite_id_click="cite_id" />
    <knowledge_card :pipeline="pipeline" :cite_id_click="cite_id" />
    <code_card :pipeline="pipeline" />
    <docking_card :pipeline="pipeline" />
  </div>
  
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import admet_card from './admet_card.vue'
import url_card from './url_card.vue'
import mnc_card from './mnc_card.vue'
import knowledge_card from './knowledge_card.vue'
import code_card from './code_card.vue'
import docking_card from './docking_card.vue'
import { useStore } from '@/stores/index.js'
const store = useStore()

const props = defineProps<{
  item_data: any,
  cite_id: Number
}>()

interface calced_pipeline_type {
  tool_name: string,
  iteration: number,
  param_description?: Object,
  description_list: string[] | Object[],
  info?: string,
  status: boolean,
}

const pipeline = computed(() => {
  let calced_pipeline: calced_pipeline_type[] = []
  let iterationMap = new Map<number, number>()  // Maps iteration to index in ret array
  if (!props.item_data?.pipeline || props.item_data?.pipeline.length === 0) {
    store.isRightSidebarOpen = false
    return calced_pipeline
  }
  for (let i = 0; i < props.item_data.pipeline.length; i++) {
    const item = props.item_data.pipeline[i]
    const iteration = item.iteration
    // If this is a new tool_name + iteration combination or has status=true with no description
    if (item.status && !item.description) {
      // Check if we already have an item with this iteration
      if (!iterationMap.has(iteration)) {
        // Create new entry
        iterationMap.set(iteration, calced_pipeline.length)
        calced_pipeline.push({
          ...item,
          description_list: []
        })
      }
    }
    
    // Add description to the corresponding iteration group
    if (item.description) {
      const index = iterationMap.get(iteration)
      if (index !== undefined) {
        calced_pipeline[index].description_list.push(item.description)
        if (!item.status) {
          calced_pipeline[index].status = false
        }
      }
    }
    
    // Add param_description to the corresponding iteration group
    if (item.param_description) {
      const index = iterationMap.get(iteration)
      if (index !== undefined) {
        calced_pipeline[index].param_description = item.param_description
        if (!item.status) {
          calced_pipeline[index].status = false
        }
      }
    }
  }

  const show_tool_names = ['页面爬取', '网络搜索', '情报数据库搜索', 'DrugFlow-MNC情报数据库搜索', 'execute_code', 'DrugFlow-ADMET计算', '知识检索', 'DrugFlow任务查询']
  let cite_id = 1
  for (let i = 0; i < calced_pipeline.length; i++) {
    if (show_tool_names.includes(calced_pipeline[i].tool_name)) {
      for (let j = 0; j < calced_pipeline[i].description_list.length; j++) {
        if (typeof calced_pipeline[i].description_list[j] === 'object') {
          calced_pipeline[i].description_list[j].cite_id = cite_id
          cite_id++
        }
      }
    }
  }

  let ret = null
  for (let i = 0; i < calced_pipeline.length; i++) {
    if (show_tool_names.includes(calced_pipeline[i].tool_name) && calced_pipeline[i].description_list.length > 0) {
      if (props.cite_id > 0) {
        if (calced_pipeline[i].description_list[0].cite_id <= props.cite_id && calced_pipeline[i].description_list[calced_pipeline[i].description_list.length - 1].cite_id >= props.cite_id) {
          ret = calced_pipeline[i]
          break
        }
      } else {
        ret = calced_pipeline[i]
      }
    }
  }
  return ret
})


</script>