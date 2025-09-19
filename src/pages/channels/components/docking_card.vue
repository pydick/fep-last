<template>
  <div v-if="result_list.length > 0" class="flex flex-col h-[100vh]">
    <!-- 顶部增加标题 -->
    <div class="text-lg font-semibold mt-3 mb-3 px-4">分子对接</div>
    <!-- 分割线 -->
    <div class="px-4">
      <div class="w-full h-[1px] bg-border mb-4"></div>
    </div>
    <ScrollArea class="px-4 flex-1 min-h-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Structure</TableHead>
            <TableHead>RTMScore</TableHead>
            <TableHead>CarsiScore</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in result_list" :key="item.id">
            <TableCell>
              <div class="min-w-[36px]">
                {{ item.id }}
              </div>
            </TableCell>
            <TableCell>
              <div class="w-[120px] h-[120px]">
                <svg_box v-if="item.smiles" :smiles="item.smiles" :width="120" :height="120" />
              </div>
            </TableCell>
            <TableCell>{{ typeof item.RTMScore === 'number' ? Number(item.RTMScore).toFixed(3) : item.RTMScore }}</TableCell>
            <TableCell>{{ typeof item.CarsiScore === 'number' ? Number(item.CarsiScore).toFixed(3) : item.CarsiScore }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ScrollArea } from "@/components/ui/scroll-area"
import svg_box from '@/components/molecule/svg_box.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

const props = defineProps<{
  pipeline: any
}>()

const result_list = computed(() => {
  const result_list = []

  if (!props.pipeline) {
    return result_list
  }
  
  if (props.pipeline.tool_name === 'DrugFlow任务查询') {
    if (Array.isArray(props.pipeline.description_list)) {
      for (const tool of props.pipeline.description_list) {
        for (const mol of tool.results.results) {
          if (mol?.values?.RTMS) {
            const item = {
              id: mol?.values._show_id,
              smiles: mol?.smiles,
              RTMScore: mol?.values.RTMS,
              CarsiScore: mol?.values.carsiscore || 0
            }
            result_list.push(item)
          }
        }
      }
    }
  }
  return result_list
})

</script>

<style scoped>
</style>