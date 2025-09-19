<!-- molstar分子卡片 -->
<template>
  <div class="w-full" v-if="mol_data?.results?.length > 0">
    <Card class="w-full overflow-hidden">
      <div class="flex flex-row">
        <div class="flex-grow w-3/5">
          <protein3d_molstar ref="protein3d_molstar_ref" :refer_pdb_string="pdb_string" :ligand_string="mol_string" :ori_ligand_name="ligand_name" :ligand_site="site" v-if="pdb_string" />
        </div>
        <CardContent class="w-2/5 border-l p-4 flex flex-col">
          <h4 class="text-sm font-semibold text-primary mb-1">{{ mol_data.results[0].smiles }}</h4>
          <div class="text-sm mb-4 bg-muted/30 rounded-md overflow-x-auto max-w-[300px]">
            <span class="text-muted-foreground font-medium mr-1">DrugFlow-Inno-Docking计算</span>
          </div>
          <div class="space-y-3">
            <div class="grid grid-cols-2 text-sm gap-2">
              <div class="flex flex-col">
                <span class="font-semibold text-primary">RTMScore:</span>
                <span class="font-medium">{{ parseFloat(mol_data.results[0].values.RTMS).toFixed(3) }}</span>
              </div>
              <div class="flex flex-col">
                <span class="font-semibold text-primary">CarsiScore:</span>
                <span class="font-medium">{{ parseFloat(mol_data.results[0].values?.carsiscore || 0).toFixed(3) }}</span>
              </div>
            </div>
            <div class="flex justify-between gap-2">
              <Button size="sm" variant="outline" class="w-full text-xs" @click="downloadSDF(task_id)">
                下载SDF
              </Button>
              <Button size="sm" variant="outline" class="w-full text-xs" @click="downloadPDB(task_id)">
                下载PDB
              </Button>
            </div>
            <Button variant="outline" class="w-full" @click="open_right_sidebar">
              查看结果
            </Button>
            <Button variant="outline" class="w-full" @click="go_drugflow" :disabled="!task_id || !ws_id">
              前往DrugFlow
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { get_pdb_string_api, get_mol_string_api, download_drugflow_file_api } from '@/api/common.js'
import { download_pdf_from_s3 } from '@/utils/common.js'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import protein3d_molstar from '@/components/molecule/protein3d_molstar.vue'
import { useStore } from '@/stores/index.js'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()
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
const pdb_string = ref(null)
const mol_string = ref(null)
const ligand_name = ref(null)
const site = ref(null)
const pdb_get_status = ref(false)
const mol_get_status = ref(false)
const task_id = ref(null)
const ws_id = ref(null)

const emit = defineEmits(['update:cite_id', 'change_current_pipeline'])

const protein3d_molstar_ref = ref(null)

const go_drugflow = () => {
  if (import.meta.env.VITE_APP_ENV === 'ldap') {
    window.open(`http://10.25.10.41:9089/#/screen_docking_results/${task_id.value}?ws_id=${ws_id.value}`, '_blank')
  } else {
    window.open(`https://new.drugflow.com/#/screen_docking_results/${task_id.value}?ws_id=${ws_id.value}`, '_blank')
  }
}

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
    if (item.tool_name == 'DrugFlow任务查询' && item.description && item?.description?.results?.pdb_oss_key) {
      let ret = item?.description?.results
      const pdb_oss_key = ret.pdb_oss_key
      task_id.value = ret?.task_id
      ws_id.value = ret?.ws_id
      site.value = ret?.site
      if (site.value) {
        ligand_name.value = site.value.split(':')[1]
      }
      if (!pdb_string.value) {
        get_pdb_string(pdb_oss_key)
      }
      const first_mol_key = ret.results[0]?.extra_val?.dock_lig
      if (!mol_string.value) {
        get_mol_string(first_mol_key)
      }

      return {...ret, cite_id: item?.description?.cite_id}
    }
  }
  return null
})

const get_pdb_string = async (pdb_oss_key: string) => {
  if (pdb_get_status.value) {
    return
  }
  pdb_get_status.value = true
  const res = await download_pdf_from_s3(undefined, pdb_oss_key, false)
  pdb_string.value = new TextDecoder().decode(res)
  setTimeout(() => {
    protein3d_molstar_ref.value.draw_refer()
    setTimeout(() => {
      protein3d_molstar_ref.value.draw_ligand()
    }, 500)
  }, 1000)
}

const get_mol_string = async (mol_key: string) => {
  if (mol_get_status.value) {
    return
  }
  mol_get_status.value = true
  const res = await get_mol_string_api(mol_key)
  mol_string.value = res.data.data
  // protein3d_molstar_ref.value.loadStructure(mol_string.value, 'sdf')
}

const downloadSDF = async (job_id: string) => {
  if (!job_id) {
    toast({
      title: '任务ID为空',
      variant: "destructive"
    })
    return
  }
  const res = await download_drugflow_file_api(job_id, 'sdf')
  const blob = new Blob([res.data], { type: 'application/x-sdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${job_id}.sdf`
  a.click()
}

const downloadPDB = async (job_id: string) => {
  if (!job_id) {
    toast({
      title: '任务ID为空',
      variant: "destructive"
    })
    return
  }
  const res = await download_drugflow_file_api(job_id, 'pdb')
  const blob = new Blob([res.data], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${job_id}.zip`
  a.click()
}

const open_right_sidebar = () => {
  store.isRightSidebarOpen = true
  store.isSidebarOpen = false
  emit('update:cite_id', mol_data.value?.cite_id)
  emit('change_current_pipeline', props.item_data)
}


</script>

<style scoped>

</style>
