<template>
  <div class="w-fit border rounded-lg p-2 bg-slate-50 dark:bg-slate-900" v-if="pipeline_calced && pipeline_calced.length > 0">
    <!-- 渲染tool -->
    <div v-for="(tool, index) in pipeline_calced" :key="index" class="last:mb-0">
      <Collapsible @click="cite_id_emit(typeof tool.description_list[0] === 'object' ? tool.description_list[0]?.cite_id || 0 : 0)" v-model:open="openStates[index]" :disabled="!tool.description_list || tool.description_list.length === 0">
        <CollapsibleTrigger class="w-full flex items-center justify-between p-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          <div class="flex items-center gap-2">
            <div v-if="isLoading(index)" class="flex items-center justify-center" title="加载中">
              <Loader class="w-4 h-4 text-blue-500 animate-spin" />
            </div>
            <div v-else-if="tool.status" class="w-2 h-2 rounded-full bg-green-500" title="成功"></div>
            <div v-else class="w-2 h-2 rounded-full bg-red-500" title="失败"></div>
            <div class="font-medium text-slate-500 dark:text-slate-300">{{ name_transform(tool.tool_name) }}</div>
            <div class="flex flex-wrap gap-1 max-w-md">
              <template v-for="(value, key) in tool.param_description" :key="key">
                <Badge v-if="value_transform(value) !== 'all'" class="font-normal max-w-[200px]" :title="value_transform(value)">
                  <span class="truncate">
                    {{ value_transform(value) }}
                  </span>
                </Badge>
              </template>
            </div>
          </div>
          <ChevronDown 
            class="h-4 w-4 transition-transform duration-200" 
            :class="{ 'rotate-180': openStates[index] }" 
            v-if="tool.description_list && tool.description_list.length > 0 && (tool.tool_name != '网络搜索' && tool.tool_name != '页面爬取' && tool.tool_name != '情报数据库搜索' && tool.tool_name != 'DrugFlow-MNC情报数据库搜索' && tool.tool_name != '知识检索')"
          />
        </CollapsibleTrigger>
        <CollapsibleContent 
          class="px-4 text-sm" :class="{ 'py-1': tool.description_list && tool.description_list.length > 0 }"
          v-if="tool.description_list && tool.description_list.length > 0 && (tool.tool_name != '网络搜索' && tool.tool_name != '页面爬取' && tool.tool_name != '情报数据库搜索' && tool.tool_name != 'DrugFlow-MNC情报数据库搜索' && tool.tool_name != '知识检索')"
        >
          <div class="h-auto p-0 text-sm max-w-[480px] truncate text-left cursor-pointer text-primary">
            <div v-if="tool.tool_name == 'DrugFlow-ADMET计算'">
              {{ tool.status ? '已完成计算' : '计算失败' }}
            </div>
            <div v-else-if="tool.tool_name == 'execute_code'">
              {{ tool.status ? '已完成代码生成和执行' : '执行失败' }}
            </div>
            <div v-else>
              {{ tool.description_list[0] }}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, defineEmits } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Loader } from 'lucide-vue-next'
import { useStore } from '@/stores/index.js'
const store = useStore()
// import pmol_card from './pmol_card.vue'

interface DescriptionItem {
  cite_id?: number;
  [key: string]: any;
}

interface ParamDescription {
  [key: string]: string;
}

interface calced_pipeline_type {
  tool_name: string,
  iteration: number,
  param_description?: ParamDescription,
  description_list: (string | DescriptionItem)[],
  info?: string,
  status: boolean,
}

interface ori_pipeline_type {
  tool_name: string,
  iteration: number,
  description: string | DescriptionItem,
  param_description?: ParamDescription,
  info?: string,
  status: boolean,
}

interface questionListType {
  questionId: string,
  answerStatus: number,
  channel_id: string,
  client: number,
  content: string,
  createTime: string,
  docIdList: string[],
  docIdListKnowledge: string[],
  effect: null | string,
  intends: number,
  kb_ids: string[],
  question: string,
  search_type: string,
  if_search_online: boolean,
  if_thinking: boolean,
  pipeline: ori_pipeline_type[]
}

const props = defineProps<{
  item_data: questionListType,
  cite_id_click: Number
}>()

const openStates = reactive<boolean[]>([])
const first_message = ref(true)

const value_transform = (value: string) => {
  const dict = {
    'all': 'all',
    'scholar': 'google scholar',
    'patent': 'google patents',
  }
  if (dict[value]) {
    return dict[value]
  }
  return value
}

const name_transform = (name: string) => {
  const dict = {
    'execute_code': '代码生成和执行',
    'smiles_info_completion': 'SMILES信息补全',
    '情报数据库搜索': '数据库搜索',
  }
  if (dict[name]) {
    return dict[name]
  }
  return name
}

const emit = defineEmits(['update:cite_id_click', 'change_current_pipeline'])

const cite_id_emit = (cite_id: number) => {
  emit('update:cite_id_click', cite_id)
  emit('change_current_pipeline', props.item_data)
  store.if_highlight_card = false
  if (!cite_id) {
    store.isRightSidebarOpen = false
  } else {
    store.isRightSidebarOpen = true
  }
  store.isSidebarOpen = false
}

const pipeline_calced = computed(() => {
  let ret: calced_pipeline_type[] = []
  let iterationMap = new Map<number, number>() // Maps iteration to index in ret array
  
  for (let i = 0; i < props.item_data.pipeline.length; i++) {
    const item = props.item_data.pipeline[i]
    const iteration = item.iteration
    // If this is a new tool_name + iteration combination or has status=true with no description
    if (item.status && !item.description) {
      // Check if we already have an item with this iteration
      if (!iterationMap.has(iteration)) {
        // Create new entry
        iterationMap.set(iteration, ret.length)
        ret.push({
          ...item,
          description_list: []
        })
        openStates.push(true)
      }
    }
    
    // Add description to the corresponding iteration group
    if (item.description) {
      const index = iterationMap.get(iteration)
      if (index !== undefined) {
        ret[index].description_list.push(item.description)
        if (item.tool_name == '网络搜索' || item.tool_name == '页面爬取' || item.tool_name == '情报数据库搜索' || item.tool_name == 'DrugFlow-MNC情报数据库搜索') {
          if (ret[index].param_description) {
            ret[index].param_description.search_num = '已阅读: ' + ret[index].description_list.length + ' 篇页面'
          } else {
            ret[index].param_description = { search_num: '已阅读: ' + ret[index].description_list.length + ' 篇页面' }
          }
        }
        if (item.tool_name == '知识检索') {
          ret[index].param_description = { search_result: '已阅读: ' + ret[index].description_list.length + ' 篇资料' }
        }
        if (!item.status) {
          ret[index].status = false
        }
      }
    }
    
    // Add param_description to the corresponding iteration group
    if (item.param_description) {
      const index = iterationMap.get(iteration)
      if (index !== undefined) {
        ret[index].param_description = item.param_description
        // 删除many default few all academic
        if (ret[index].param_description) {
          delete ret[index].param_description.num_of_web_results
        }
        if (!item.status) {
          ret[index].status = false
        }
      }
    }
  }

  const show_tool_names = ['页面爬取', '网络搜索', '情报数据库搜索', 'DrugFlow-MNC情报数据库搜索', 'execute_code', 'DrugFlow-ADMET计算', '知识检索', 'DrugFlow任务查询']
  let cite_id = 1
  for (let i = 0; i < ret.length; i++) {
    if (show_tool_names.includes(ret[i].tool_name)) {
      for (let j = 0; j < ret[i].description_list.length; j++) {
        if (typeof ret[i].description_list[j] === 'object') {
          (ret[i].description_list[j] as DescriptionItem).cite_id = cite_id
          cite_id++
        }
      }
    }
  }
  
  // Set all openStates to false when content is not empty
  if (props.item_data.content) {
    if (first_message.value) {
      for (let i = 0; i < openStates.length; i++) {
        openStates[i] = false
      }
      first_message.value = false
    }
  }
  
  return ret
})

// Helper function to determine if the current tool is the last one and in loading state
const isLoading = (index: number) => {
  const flag1 = ( index === pipeline_calced.value.length - 1 )
  const flag2 = !props.item_data.content
  const flag3 = props.item_data.answerStatus === 1
  return flag1 && flag2 && flag3
}

</script>