<!-- 分子卡片 -->
<template>
  <div v-if="mol_data?.smiles">
    <div class="mol-card flex gap-4 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <!-- 左边显示分子svg -->
      <div class="mol-svg w-[220px] h-[120px] flex-shrink-0 flex items-center justify-center border border-muted rounded-md overflow-hidden">
        <svg_box v-if="mol_data?.smiles" :smiles="mol_data.smiles" width="170px" height="110px" />
      </div>

      <div class="flex flex-col justify-between flex-1">
        <!-- 显示smiles -->
        <div>
          <h4 class="text-sm font-semibold text-primary mb-1">SMILES: {{ mol_data.smiles }}</h4>
          <div class="text-sm mb-2 bg-muted/30 rounded-md overflow-x-auto max-w-[300px]">
            <span class="text-muted-foreground font-medium mr-1">DrugFlow-ADMET计算</span>
          </div>
        </div>

        <div class="text-sm mb-2 bg-muted/30 rounded-md overflow-x-auto flex flex-wrap gap-2 justify-between">
          <span class="text-muted-foreground font-medium mr-1">
            <span class="font-semibold text-primary">MW: </span> 
            <span>{{ typeof mol_data['MW'] === 'number' ? Number(mol_data['MW']).toFixed(3) : mol_data['MW'] }}</span>
          </span>
          <span class="text-muted-foreground font-medium mr-1">
            <span class="font-semibold text-primary">LogD: </span> 
            <span>{{ typeof mol_data['LogD'] === 'number' ? Number(mol_data['LogD']).toFixed(3) : mol_data['LogD'] }}</span>
          </span>
          <span class="text-muted-foreground font-medium mr-1">
            <span class="font-semibold text-primary">LogP: </span> 
            <span>{{ typeof mol_data['LogP'] === 'number' ? Number(mol_data['LogP']).toFixed(3) : mol_data['LogP'] }}</span></span>
        </div>
        
        <!-- 点击展开右侧 -->
        <Button 
          variant="outline" 
          size="sm"
          class="w-full flex items-center justify-center gap-2 mt-2 hover:bg-primary/10"
          @click="open_right_sidebar()"
        >
          <span>查看所有结果</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m9 18 6-6-6-6"/></svg>
        </Button>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { Button } from "@/components/ui/button"
import svg_box from '@/components/molecule/svg_box.vue'
import { useStore } from '@/stores/index.js'
const store = useStore()

interface ItemData {
  content: string
  answerStatus: number
  intends: number
  kb_ids: string[]
}

const props = defineProps<{
  item_data?: ItemData,
  cite_id?: string
}>()

const emit = defineEmits(['update:cite_id', 'change_current_pipeline'])

const mol_data = computed(() => {
  // 如果<thinking> in props.item_data.content但是没有</thinking> in props.item_data.content，则不显示
  if (props.item_data?.content) {
    if (props.item_data?.content.includes('<thinking>') && !props.item_data?.content.includes('</thinking>')) {
      return null
    }
  } else {
    return null
  }

  let content = props.item_data?.pipeline
  for (let i = 0; i < content.length; i++) {
    const item = content[i]
    if (item.tool_name == 'DrugFlow-ADMET计算' && item.description) {
      let ret = item?.description?.results
      return {...ret, cite_id: item?.description?.cite_id}
    }
  }
  return null
})

const open_right_sidebar = () => {
  store.isRightSidebarOpen = true
  store.isSidebarOpen = false
  emit('update:cite_id', mol_data.value?.cite_id)
  emit('change_current_pipeline', props.item_data)
}

</script>

<style scoped>
.mol-card {
  background-color: white;
}

.mol-svg {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}
</style>