<!-- molstar分子卡片 -->
<template>
  <div class="w-full" v-if="mol_data && mol_data.length > 0">
    <Card class="w-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div class="flex flex-col">
        <div class="flex justify-between items-center p-4 border-b">
          <div class="flex items-center gap-2">
            <div class="text-sm bg-muted/30 rounded-md px-3 py-1.5">
              <span class="text-muted-foreground font-medium">图片结果展示</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 p-4">
          <div v-for="item in processedImages" :key="item.key" class="w-full rounded-lg overflow-hidden border">
            <img 
              v-if="item.src" 
              :src="item.src" 
              alt="图片结果" 
              class="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div v-else class="w-full h-48 flex items-center justify-center bg-muted">
              <span class="text-muted-foreground">加载中...</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { download_pdf_from_s3 } from '@/utils/common.js'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ItemData {
  content: string
  answerStatus: number
  intends: number
  kb_ids: string[]
  pipeline: any[]
}

const props = defineProps<{
  item_data?: ItemData,
  cite_id?: string
}>()

const processedImages = ref<Array<{ key: string; src?: string }>>([])

const mol_data = computed(() => {
  // 如果<thinking> in props.item_data.content但是没有</thinking> in props.item_data.content，则不显示
  if (props.item_data?.content) {
    if (props.item_data?.content.includes('<thinking>') && !props.item_data?.content.includes('</thinking>')) {
      return null
    }
  } else {
    return null
  }
  let final_ret = []

  let content = props.item_data?.pipeline
  for (let i = 0; i < content.length; i++) {
    const item = content[i]
    if (item.tool_name.indexOf('wemol') != -1 && item.description && item?.description?.results?.files_upload) {
      let uploads = item?.description?.results?.files_upload
      for (let j = 0; j < uploads.length; j++) {
        if (uploads[j].key.endsWith('.png') || 
            uploads[j].key.endsWith('.jpg') || 
            uploads[j].key.endsWith('.jpeg') || 
            uploads[j].key.endsWith('.svg')) {
          final_ret.push({
            key: uploads[j].key
          })
        }
      }
    }
  }
  return final_ret
})

const get_img = async (key: string) => {
  const res = await download_pdf_from_s3(undefined, key, false)
  const type = key.split('.').pop()
  // Convert ArrayBuffer to base64 string
  const base64String = btoa(
    new Uint8Array(res).reduce((data, byte) => data + String.fromCharCode(byte), '')
  )
  return `data:image/${type};base64,${base64String}`
}

// 监听 mol_data 变化，异步加载图片
watch(mol_data, async (newData) => {
  if (newData && newData.length > 0) {
    // 初始化 processedImages，显示加载状态
    processedImages.value = newData.map(item => ({ key: item.key }))
    
    // 异步加载每张图片
    for (let i = 0; i < newData.length; i++) {
      try {
        const src = await get_img(newData[i].key)
        // 更新对应图片的 src
        if (processedImages.value[i]) {
          processedImages.value[i].src = src
        }
      } catch (error) {
        console.error('Failed to load image:', newData[i].key, error)
      }
    }
  } else {
    processedImages.value = []
  }
}, { immediate: true })
</script>

<style scoped>

</style>
