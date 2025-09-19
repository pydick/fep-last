<template>
  <ScrollArea class="w-full p-4 max-h-[calc(100vh-120px)]">
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>分享类别</TableHead>
            <TableHead>分享内容</TableHead>
            <TableHead>分享动作</TableHead>
            <TableHead>分享对象</TableHead>
            <TableHead>分享权限</TableHead>
            <TableHead>分享时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody v-if="!loading && shareRecordList.length > 0">
          <TableRow v-for="record in shareRecordList" :key="record.id" class="hover:bg-gray-50">
            <TableCell>{{ record.share_type == 'doc' ? '文件' : '知识库' }}</TableCell>
            <TableCell>{{ record.share_content_name }}</TableCell>
            <TableCell>{{ record.share_action == 'share' ? '分享' : '取消分享' }}</TableCell>
            <TableCell>{{ record.shared_to_name }}</TableCell>
            <TableCell>{{ record?.shared_permission_type == 'read' ? '只读' : '管理' }}</TableCell>
            <TableCell>{{ new Date(record.created_at).toLocaleDateString() }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <div v-if="loading" class="flex justify-center items-center p-8">
        <Loader2 class="w-6 h-6 text-primary" />
        <span class="ml-2 text-sm text-gray-500">加载中...</span>
      </div>
      
      <div v-if="!loading && shareRecordList.length === 0" class="py-8 text-center text-sm text-gray-500">
        暂无分享记录
      </div>
    </div>
    
    <div class="flex items-center justify-center space-x-2 py-4" v-if="total > 0">
      <Button 
        variant="outline" 
        size="sm" 
        :disabled="page === 1"
        @click="handlePageChange(page - 1)"
      >
        上一页
      </Button>
      <div class="text-sm text-gray-500">
        第 {{ page }} 页，共 {{ Math.ceil(total / page_size) }} 页
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        :disabled="page >= Math.ceil(total / page_size)"
        @click="handlePageChange(page + 1)"
      >
        下一页
      </Button>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { get_shared_record_api } from '@/api/common.js'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-vue-next'

interface ShareRecord {
  id: string
  // 分享类别
  share_type: string  // 知识库 或 文件
  share_content_id: string  // docId 或 kbId
  share_content_name: string  // 分享内容名称
  // 分享动作
  share_action: string  // 分享 或 取消分享
  // 分享对象
  shared_to_type: string  // user 或 department
  shared_to_name: string  // 分享对象的名称
  shared_to_id: string | null  // 分享对象的id
  // 分享权限
  shared_permission_type: string  // read / admin
  // 分享人
  created_by: string  // 分享人 user_id
  // 时间
  created_at: string
}

const shareRecordList = ref<ShareRecord[]>([])
const page = ref(1)
const page_size = ref(10)
const total = ref(0)
const loading = ref(false)

const getSharedRecord = async () => {
  loading.value = true
  try {
    const res = await get_shared_record_api({
      page: page.value,
      page_size: page_size.value,
    })

    shareRecordList.value = res.data.data.items
    total.value = res.data.data.total

  } catch (error) {
    console.error('获取分享记录失败', error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  getSharedRecord()
}

getSharedRecord()
</script>