<!-- molstar分子卡片 (支持PDB和CIF格式) -->
<template>
  <div class="w-full" v-if="mol_data">
    <Card class="w-full overflow-hidden">
      <div class="flex flex-col">
        <div class="flex justify-between items-center p-4">
          <div class="text-sm bg-muted/30 rounded-md overflow-x-auto">
            <span class="text-muted-foreground font-medium mr-1">蛋白展示</span>
          </div>
        </div>
        <div class="w-full">
          <protein3d_molstar ref="protein3d_molstar_ref" :refer_pdb_string="pdb_string" :file_format="file_format" v-if="pdb_string" />
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
  pipeline?: Array<{
    tool_name: string
    description?: {
      results?: {
        files_upload?: Array<{
          key: string
        }>
      }
    }
  }>
}

const props = defineProps<{
  item_data?: ItemData,
  cite_id?: string
}>()

const pdb_string = ref<string | null>(null)
const pdb_get_status = ref(false)
const pdb_key = ref<string | null>(null)
const file_format = ref<string>('pdb') // 添加文件格式状态

const emit = defineEmits(['update:cite_id', 'change_current_pipeline'])

const protein3d_molstar_ref = ref<any>(null)

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
  if (!content) {
    return null
  }
  
  for (let i = 0; i < content.length; i++) {
    const item = content[i]
    if (item.tool_name.indexOf('wemol') != -1 && item.description && item?.description?.results?.files_upload) {
      let uploads = item?.description?.results?.files_upload
      for (let j = 0; j < uploads.length; j++) {
        const fileExtension = uploads[j].key.split('.').pop()?.toLowerCase()
        // 支持pdb和cif格式
        if (fileExtension === 'pdb' || fileExtension === 'cif') {
          pdb_key.value = uploads[j].key
          file_format.value = fileExtension
          if (fileExtension === 'cif') {
            file_format.value = 'mmcif'
          }
          get_pdb_string(uploads[j].key)
          return pdb_key.value
        }
      }
    }
  }
  return null
})

const get_pdb_string = async (file_key: string) => {
  if (pdb_get_status.value) {
    return
  }
  pdb_get_status.value = true
  try {
    const res = await download_pdf_from_s3(undefined, file_key, false)
    pdb_string.value = new TextDecoder().decode(res)
    setTimeout(() => {
      if (protein3d_molstar_ref.value) {
        protein3d_molstar_ref.value.draw_refer()
      }
    }, 1000)
  } catch (error) {
    console.error('Failed to load structure file:', error)
    pdb_get_status.value = false
  }
}

const downloadPDB = async (key: string | null) => {
  if (!key) {
    toast({
      title: '任务ID为空',
      variant: "destructive"
    })
    return
  }
  
  if (!pdb_string.value) {
    toast({
      title: '结构数据未加载',
      variant: "destructive"
    })
    return
  }

  try {
    const blob = new Blob([pdb_string.value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wemol_structure.${file_format.value}`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    
    // Clean up: remove the element and revoke the blob URL for security
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download structure file:', error)
    toast({
      title: '下载失败',
      variant: "destructive"
    })
  }
}

</script>

<style scoped>

</style>
