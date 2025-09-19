<!-- molstar分子卡片 -->
<template>
  <div class="w-full" v-if="mol_data">
    <Card class="w-full overflow-hidden">
      <div class="flex flex-row items-center justify-between p-4">
        <div class="flex-grow">
          <h4 class="text-sm font-semibold text-primary mb-1">计算结果下载</h4>
          <p class="text-sm text-muted-foreground">点击右侧按钮下载计算结果压缩包</p>
        </div>
        <Button size="sm" variant="outline" class="ml-4" @click="download_results">
          下载结果
        </Button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from '@/stores/index.js'
import { useToast } from '@/components/ui/toast'
import { download_pdf_from_s3 } from '@/utils/common.js'
const store = useStore()
const { toast } = useToast()

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

const key = ref(null)
const url = ref(null)

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
    if (item.tool_name.indexOf('wemol') != -1 && item.description && item?.description?.results?.zip_results) {
      key.value = item?.description?.results?.zip_results?.key
      // 能否通过url直接下载
    }
  }
  return key.value
})

const download_results = async () => {
  if (key.value) {
    let res = await download_pdf_from_s3(undefined, key.value, false)
    const blob = new Blob([res], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wemol_and_af3_results.zip'
    a.click()
    URL.revokeObjectURL(url)
  } else {
    toast({
      title: '下载链接不存在',
      variant: "destructive"
    })
  }
}

</script>

<style scoped>

</style>
