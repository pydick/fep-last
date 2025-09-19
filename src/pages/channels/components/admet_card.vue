<template>
  <div v-if="mol_data?.smiles" class="flex flex-col h-[100vh]">
    <!-- 顶部增加标题 -->
    <div class="text-lg font-semibold mt-3 mb-3 px-4">DrugFlow-ADMET计算</div>
    <!-- 分割线 -->
    <div class="px-4">
      <div class="w-full h-[1px] bg-border mb-4"></div>
    </div>
    
    <ScrollArea class="flex-1 min-h-0 px-4">
      <div class="mol-card flex flex-col gap-4 p-4 border rounded-lg">
        <!-- 顶部显示标题、信息来源和下载按钮 -->
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-medium">{{ mol_data?.smiles || 'Unknown Molecule' }}</h3>
            <p class="text-sm text-primary font-semibold">由DrugFlow提供</p>
          </div>
          <div class="flex items-center gap-2">
            <TooltipProvider :delay-duration="100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" asChild @click="downloadMolecule" class="h-8 w-8 p-1 cursor-pointer">
                    <Download />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>下载分子全部数据</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <!-- cite_id -->
            <span class="text-xs font-bold text-black bg-blue-100 px-2 h-8 flex items-center justify-center rounded-md">{{ mol_data.cite_id }}</span>
          </div>
        </div>

        <!-- 中间显示分子svg -->
        <div class="mol-svg w-full h-[200px] flex-shrink-0">
          <svg_box v-if="mol_data?.smiles" :smiles="mol_data.smiles" :width="250" :height="200" />
        </div>

        <!-- 底部显示分子信息 -->
        <div class="mol-info w-full">
          <div class="flex flex-col gap-4">
            <div v-for="(group, index) in propertiesGrouped" :key="index" class="property-group">
              <h4 class="text-md font-semibold mb-2">{{ group.label }}</h4>
              <div class="flex flex-wrap gap-2">
                <div 
                  v-for="item in group.properties" 
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
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-vue-next"
import svg_box from '@/components/molecule/svg_box.vue'
import { ScrollArea } from "@/components/ui/scroll-area"
const props = defineProps<{
  pipeline: any
}>()

const propertiesGrouped = computed(() => {
  return [
    {
      label: '物化性质',
      properties: [
        { label: 'MW', value: 'MW' },
        { label: 'Volume', value: 'Volume' },
        { label: 'Density', value: 'Density' },
        { label: 'nHA', value: 'nHA' },
        { label: 'nHD', value: 'nHD' },
        { label: 'nRot', value: 'nRot' },
        { label: 'nRing', value: 'nRing' },
        { label: 'MaxRing', value: 'MaxRing' },
        { label: 'nHet', value: 'nHet' },
        { label: 'fChar', value: 'fChar' },
        { label: 'nRig', value: 'nRig' },
        { label: 'Flexibility', value: 'Flexibility' },
        { label: 'Stereo Centers', value: 'Stereo Centers' },
        { label: 'TPSA', value: 'TPSA' },
        { label: 'LogP', value: 'LogP' },
        { label: 'LogD', value: 'LogD' },
        { label: 'LogS', value: 'LogS' },
      ]
    },
    {
      label: '药化性质',
      properties: [
        { label: 'QED', value: 'QED' },
        { label: 'SAscore', value: 'SAscore' },
        { label: 'Fsp3', value: 'Fsp3' },
        { label: 'MCE-18', value: 'MCE-18' },
        { label: 'NPscore', value: 'NPscore' },
      ]
    },
    {
      label: '吸收',
      properties: [
        { label: 'Caco-2', value: 'Caco-2' },
        { label: 'MDCK', value: 'MDCK' },
        { label: 'Pgp-inh', value: 'Pgp-inh' },
        { label: 'Pgp-sub', value: 'Pgp-sub' },
        { label: 'HIA', value: 'HIA' },
        { label: 'F(20%)', value: 'F(20%)' },
        { label: 'F(50%)', value: 'F(50%)' },
      ]
    },
    {
      label: '分布',
      properties: [
        { label: 'PPB', value: 'PPB' },
        { label: 'VDss', value: 'VDss' },
        { label: 'BBB', value: 'BBB' },
        { label: 'Fu', value: 'Fu' },
      ]
    },
    {
      label: '代谢',
      properties: [
        { label: 'CYP1A2-inh', value: 'CYP1A2-inh' },
        { label: 'CYP1A2-sub', value: 'CYP1A2-sub' },
        { label: 'CYP2C19-inh', value: 'CYP2C19-inh' },
        { label: 'CYP2C19-sub', value: 'CYP2C19-sub' },
        { label: 'CYP2C9-inh', value: 'CYP2C9-inh' },
        { label: 'CYP2C9-sub', value: 'CYP2C9-sub' },
        { label: 'CYP2D6-inh', value: 'CYP2D6-inh' },
        { label: 'CYP2D6-sub', value: 'CYP2D6-sub' },
        { label: 'CYP3A4-inh', value: 'CYP3A4-inh' },
        { label: 'CYP3A4-sub', value: 'CYP3A4-sub' },
      ]
    },
    {
      label: '排泄',
      properties: [
        { label: 'CL', value: 'CL' },
        { label: 'T12', value: 'T12' },
        { label: 'MLM', value: 'MLM' },
      ]
    },
    {
      label: '毒性',
      properties: [
        { label: 'hERG', value: 'hERG' },
        { label: 'DILI', value: 'DILI' },
        { label: 'Ames', value: 'Ames' },
        { label: 'ROA', value: 'ROA' },
        { label: 'FDAMDD', value: 'FDAMDD' },
        { label: 'SkinSen', value: 'SkinSen' },
        { label: 'Carcinogenicity', value: 'Carcinogenicity' },
        { label: 'EC', value: 'EC' },
        { label: 'EI', value: 'EI' },
        { label: 'Respiratory', value: 'Respiratory' },
        { label: 'H-HT', value: 'H-HT' },
        { label: 'BCF', value: 'BCF' },
        { label: 'IGC50', value: 'IGC50' },
        { label: 'LC50', value: 'LC50' },
        { label: 'LC50DM', value: 'LC50DM' },
        { label: 'NR-AR', value: 'NR-AR' },
        { label: 'NR-AR-LBD', value: 'NR-AR-LBD' },
        { label: 'NR-AhR', value: 'NR-AhR' },
        { label: 'NR-Aromatase', value: 'NR-Aromatase' },
        { label: 'NR-ER', value: 'NR-ER' },
        { label: 'NR-ER-LBD', value: 'NR-ER-LBD' },
        { label: 'NR-PPAR-gamma', value: 'NR-PPAR-gamma' },
        { label: 'SR-ARE', value: 'SR-ARE' },
        { label: 'SR-ATAD5', value: 'SR-ATAD5' },
        { label: 'SR-HSE', value: 'SR-HSE' },
        { label: 'SR-MMP', value: 'SR-MMP' },
        { label: 'SR-p53', value: 'SR-p53' },
      ]
    },
  ]
})

const mol_data = computed(() => {
  if (props.pipeline.tool_name === 'DrugFlow-ADMET计算' && props.pipeline.description_list) {
    for (let i = 0; i < props.pipeline.description_list.length; i++) {
      const item = props.pipeline.description_list[i]
      return {...item.results, cite_id: item.cite_id}
    }
  }
  return {}
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