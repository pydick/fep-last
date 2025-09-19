<template>
  <div v-if="mol_data?.smiles" class="">
    <div class="mol-card flex gap-4 p-4 border rounded-lg">
      <!-- 左边显示分子svg -->
      <div class="mol-svg w-[250px] h-[200px] flex-shrink-0">
        <svg_box v-if="mol_data?.smiles" :smiles="mol_data.smiles" :width="250" :height="200" />
      </div>

      <!-- 右边显示分子信息 -->
      <div class="mol-info flex-1">
        <!-- 右边上部分显示标题和信息来源和下载按钮 -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-medium">{{ mol_data?.smiles || 'Unknown Molecule' }}</h3>
            <p class="text-sm text-primary font-semibold">由DrugFlow提供</p>
          </div>
          <TooltipProvider :delay-duration="100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" asChild @click="downloadMolecule" class="p-2 cursor-pointer">
                  <Download class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>下载分子全部数据</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <!-- 右边下部分显示分子信息 -->
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="item in properties" 
            :key="item.value" 
            class="text-sm w-[calc(50%-8px)] hover:bg-muted/50 transition-colors"
          >
            <span class="font-semibold text-primary">{{ item.label }}: </span>
            <span>{{ typeof mol_data[item.value] === 'number' ? Number(mol_data[item.value]).toFixed(3) : mol_data[item.value] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-vue-next"
import svg_box from '@/components/molecule/svg_box.vue'

const props = defineProps<{
  results: any
}>()

const properties = computed(() => {
  return [
    { label: 'Weight', value: 'MW' },
    { label: 'LogD', value: 'LogD' },
    { label: 'LogP', value: 'LogP' },
    { label: 'LogS', value: 'LogS' },
    { label: 'QED', value: 'QED' },
    { label: 'SAscore', value: 'SAscore' },
    { label: 'MCE-18', value: 'MCE-18' },
    { label: 'NPscore', value: 'NPscore' },
  ]
})

const mol_data = computed(() => {
  // 获取<not_show>和</not_show>之间的内容
  let content = props.results
  if (typeof content == 'string') {
    try {
      content = JSON.parse(content)
    } catch (error) {
      return {}
    }
  }
  if (!content) {
    return {}
  }
  return content
})

const downloadMolecule = () => {
  // 将mol_data转成csv格式
  const data = mol_data.value
  if (!data) return

  // 获取所有键值对
  const entries = Object.entries(data)
  if (entries.length === 0) return

  // 构建CSV内容
  const csvContent = [
    // 表头
    entries.map(([key]) => key).join(','),
    // 数据行
    entries.map(([_, value]) => {
      // 如果值包含逗号,用引号包裹
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    }).join(',')
  ].join('\n')

  // 创建Blob对象
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  // 创建下载链接
  const a = document.createElement('a')
  a.href = url
  a.download = `molecule_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()

  // 清理
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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