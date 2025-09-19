<template>
  <div class="flex flex-col h-full">
    <!-- Header Section -->
    <div class="p-2 space-y-2 max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto w-full">
      <div class="text-2xl font-semibold px-2 text-center my-6">历史会话</div>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          class="pl-10 h-14 rounded-xl shadow-sm"
          placeholder="搜索会话..."
          v-model="search_value"
          @keyup.enter="onSearch"
        />
      </div>

      <div class="space-y-6 mx-auto pt-6">
        <!-- Loading Skeleton -->
        <div v-if="isLoading && ask_list.length === 0" class="space-y-4">
          <div v-for="i in 3" :key="i" class="space-y-2">
            <Skeleton class="h-6 w-1/4 mx-3" />
            <div class="space-y-3">
              <div v-for="j in 2" :key="j" class="px-3 py-2 rounded-xl">
                <Skeleton class="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="ask_list.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
          <div class="text-gray-500 mb-4">暂无会话记录</div>
          <Button @click="createNewConversation" class="px-4">
            新建会话
          </Button>
        </div>
        
        <!-- Channels list -->
        <template v-else v-for="(group, groupName) in groupedChannels" :key="groupName">
          <div v-if="group.length > 0" class="mb-8">
            <h3 class="text-xl font-medium text-gray-700 mb-4 pl-3">{{ groupName }}</h3>
            <div class="space-y-3">
              <div v-for="(item, index) in group" 
                  :key="item.id" 
                  class="flex flex-col px-3 py-2 rounded-xl cursor-pointer transition-all bg-white group hover:shadow-lg hover:shadow-gray-200/60 border border-gray-200 min-h-14 justify-center"
                  @click="goQuestionList(item.id, index)">
                <div class="min-w-0 relative flex items-center justify-between">
                  <div class="truncate text-sm" style="text-overflow: inherit">
                    {{ item.name }}
                  </div>
                  <div class="flex items-center gap-1">
                    <TooltipProvider :delay-duration="100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            class="flex items-center justify-start px-2 py-1 transition-colors hover:bg-accent hover:scale-105 hidden group-hover:flex"
                            @click="edit_ask(item, index, $event)"
                          >
                            <Edit class="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>重命名会话</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider :delay-duration="100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost"
                            class="flex items-center justify-start px-2 py-1 text-destructive transition-colors hover:bg-accent hover:text-destructive hover:scale-105 hidden group-hover:flex"
                            @click="openDeleteDialog(item.id, index, $event)"
                          >
                            <Trash class="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>删除会话</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div class="flex items-center space-x-2 group-hover:hidden text-xs text-muted-foreground">
                    <Calendar class="h-3.5 w-3.5" />
                    <span>{{ formatDate(item.createTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Dialogs -->
  <Dialog v-model:open="edit_channel_dialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-xl">重命名会话</DialogTitle>
      </DialogHeader>
      <div class="py-6">
        <input 
          type="text"
          class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
          v-model="editFormChannel.channel_name"
          placeholder="请输入新名称"
          maxlength="50"
          @keydown.enter.prevent="handleEnterKey"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        />
      </div>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="edit_channel_dialog = false">取消</Button>
        <Button @click="submit_edit_channel">确认</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog v-model:open="delete_dialog">
    <AlertDialogContent class="sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle class="text-xl">确认删除</AlertDialogTitle>
        <AlertDialogDescription class="py-2">
          您确定删除此会话记录吗？此操作无法撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="gap-2">
        <AlertDialogCancel class="font-medium">取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmDelete" class="bg-destructive hover:bg-destructive/90">
          确认删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/index.js'
import { useToast } from '@/components/ui/toast'
import { storeToRefs } from 'pinia'
// UI Components
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Icons
import { Search, MoreHorizontal, Edit, Trash, Calendar } from 'lucide-vue-next'

// API
import {
  get_channellist_api, edit_channel_api, delete_channel_api,
} from '@/api/common.js'

const props = defineProps({
  hasQuery: {
    type: Boolean,
    default: false,
  },
  search: {
    type: String,
    default: ''
  }
})

// Store and router
const store = useStore()
const router = useRouter()
const { show_main_router } = storeToRefs(store)
// Search functionality
const search_value = ref('')

const onSearch = () => {
  get_channellist()
}

// Channel listing
const channel_size = ref(50)
const channel_page = ref(1)
const ask_list = ref([])
const ask_count = ref(0)
const ask_active = ref(-1)
const isLoading = ref(false)

// Edit channel dialog
const editFormChannel = ref({
  channel_name: ''
})
const old_channel_name = ref('')
const current_channel_id = ref('')
const edit_channel_dialog = ref(false)
const isComposing = ref(false)

// Delete dialog
const delete_dialog = ref(false)
const pending_delete = ref({ id: '', index: -1 })

// Group conversations by time periods
const groupedChannels = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const result = {
    "今天": [],
    "一周内": [],
    "一月内": [],
    "更早": []
  };
  
  ask_list.value.forEach(item => {
    const createDate = new Date(item.createTime);
    
    if (createDate >= today) {
      result["今天"].push(item);
    } else if (createDate >= oneWeekAgo) {
      result["一周内"].push(item);
    } else if (createDate >= oneMonthAgo) {
      result["一月内"].push(item);
    } else {
      result["更早"].push(item);
    }
  });
  
  return result;
});

// Get channel list
const get_channellist = async () => {
  isLoading.value = true;
  try {
    const response = await get_channellist_api({
      page: 1,
      size: 50,
      search: search_value.value
    });
    
    if (response.data.success) {
      ask_list.value = response.data.data.items;
      ask_count.value = response.data.data.total;
      channel_page.value = 1;
    } else {
      useToast().toast({
        variant: "destructive",
        title: "Error",
        description: response.data.message
      })
    }
  } catch (error) {
    console.error("Failed to get channels:", error);
  } finally {
    isLoading.value = false;
  }
}

const setDefaultChannel = (set_default_channel: boolean = false) => {
  if (!props.hasQuery) {
    const defaultChannel = ask_list.value[0]
    if (defaultChannel) {
      store.channel_id = defaultChannel.id
    }
  }
  if (set_default_channel) {
    store.channel_id = ask_list.value[0].id
  }
}

// Navigate to question list
const goQuestionList = (val: string, index: number) => {
  store.main_status = 2  // 跳转到指定问答页
  store.channel_id = val
  // 只改变url
  const path = `/channels?channel_id=${store.channel_id}`
  const url = `${window.location.origin}${path}`
  window.history.pushState({ path }, '', url)
  store.isSidebarOpen = false
  show_main_router.value = false
}

// Format date to show day of week for today/this week
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  // If date is from today or this week, show day of week
  if (date >= oneWeekAgo) {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[date.getDay()];
  }
  
  // Otherwise, show regular date
  return date.toLocaleDateString();
}

// Channel edit functions
const edit_ask = (item: { name: string; id: string }, index: number, e: Event): void => {
  e.stopPropagation()
  editFormChannel.value.channel_name = item.name
  old_channel_name.value = item.name
  current_channel_id.value = item.id
  edit_channel_dialog.value = true
}

const submit_edit_channel = async () => {
  const { toast } = useToast()
  try {
    const res = await edit_channel_api({
      channel_id: current_channel_id.value,
      name: editFormChannel.value.channel_name
    })
    if (res.data.success) {
      toast({
        title: "Success",
        description: "重命名成功"
      })
      get_channellist()
      // 关闭dialog
      edit_channel_dialog.value = false
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: res.data.message
      })
    }
  } catch (err) {
    console.error(err)
    toast({
      variant: "destructive",
      title: "Error",
      description: "重命名失败"
    })
  }
}

const handleEnterKey = (e: KeyboardEvent) => {
  if (!isComposing.value) {
    submit_edit_channel()
  }
}

// Channel delete functions
const openDeleteDialog = (id: string, index: number, e: Event) => {
  e.stopPropagation()
  pending_delete.value = { id, index }
  delete_dialog.value = true
}

const confirmDelete = () => {
  delete_ask(pending_delete.value.id, pending_delete.value.index, new Event('click'))
  delete_dialog.value = false
}

const delete_ask = (id: string, index: number, e: Event) => {
  e.stopPropagation()
  
  const { toast } = useToast()
  try {
    delete_channel_api({ channel_id: id }).then((res) => {
      if (res.data.success === true) {
        toast({
          title: "Success",
          description: "会话记录删除成功",
        })
        get_channellist()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.data.message
        })
      }
    })
  } catch (err) {
    console.error(err)
    toast({
      variant: "destructive",
      title: "Error",
      description: "删除失败"
    })
  }
}

// 添加一个防抖变量
const isLoadingMore = ref(false)

// 更精确的滚动阈值
const scrollThreshold = ref(10) // 非常接近底部才触发

// 完全重写的滚动检测函数
const handleScroll = () => {
  // 获取可见区域高度、滚动高度和文档总高度
  const windowHeight = window.innerHeight
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  )
  
  // 计算距离底部的距离
  const distanceToBottom = documentHeight - (scrollTop + windowHeight)
  
  // 只有当非常接近底部(10px以内)、未加载中、还有更多内容时才触发
  if (distanceToBottom <= scrollThreshold.value && 
      !isLoading.value && 
      !isLoadingMore.value && 
      channel_page.value * 50 < ask_count.value) {
    
    console.log('Triggering load more, distance to bottom:', distanceToBottom)
    isLoadingMore.value = true
    
    // 使用requestAnimationFrame确保在渲染周期中执行
    requestAnimationFrame(() => {
      channel_load_more()
      
      // 2秒内不允许再次触发加载
      setTimeout(() => {
        isLoadingMore.value = false
      }, 2000)
    })
  }
}

// 确保加载函数是幂等的
const channel_load_more = async () => {
  if (isLoading.value) return // 防止重复加载
  
  const nextPage = channel_page.value + 1
  
  if (nextPage * 50 <= ask_count.value) {
    isLoading.value = true
    console.log('Loading page:', nextPage)
    
    try {
      const response = await get_channellist_api({
        page: nextPage,
        size: 50
      })
      
      if (response.data.success) {
        ask_list.value = [...ask_list.value, ...response.data.data.items]
        ask_count.value = response.data.data.total
        channel_page.value = nextPage
      }
    } catch (error) {
      console.error("Failed to load more channels:", error)
    } finally {
      isLoading.value = false
    }
  }
}

// Setup and cleanup scroll event listener
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Initialize
get_channellist()

// Create new conversation
const createNewConversation = () => {
  // 回到主页
  router.push(path)
}

defineExpose({
  get_channellist
})
</script>