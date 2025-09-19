<template>
  <div class="p-4 space-y-2 max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto w-full">
    <div class="flex items-center justify-between mb-6">
      <div class="text-2xl font-semibold mr-8">个人空间</div>
      <div class="flex items-center space-x-2">
        <Button size="sm" variant="ghost" class="text-muted-foreground" @click="shareRecordDialog = true">
          分享记录
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" variant="ghost" class="text-muted-foreground">
              <ArrowDown class="h-4 w-4" />
              排序
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="sort_folder('-createTime')" :class="{ 'text-blue-500': sort === '-createTime' }">创建时间</DropdownMenuItem>
            <DropdownMenuItem @click="sort_folder('-updateTime')" :class="{ 'text-blue-500': sort === '-updateTime' }">修改时间</DropdownMenuItem>
            <DropdownMenuItem @click="sort_folder('name')" :class="{ 'text-blue-500': sort === 'name' }">名称</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div class="relative">
          <Input 
            v-model="personalSearchValue"
            placeholder="搜索知识库" 
            class="w-32 pr-10"
            size="sm"
            @keydown.enter="onPersonalSearch"
            @blur="onPersonalSearch"
          />
          <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button class="w-full" @click="newFolder">
          <Plus class="h-4 w-4 mr-2" />
          新建知识库
        </Button>
      </div>
    </div>
    
    <div class="min-h-[200px]">
      <div v-if="isLoading" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton v-for="n in 8" :key="n" class="h-[120px] w-full rounded-lg" />
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" v-infinite-scroll="folderLoadMore">
        <div class="relative px-3 py-3 rounded-lg cursor-pointer transition-colors bg-white hover:shadow-lg hover:shadow-gray-200/60 group border">
          <div class="flex flex-col space-y-2" @click="goFolderList(personFolder)">
            <div class="flex items-center space-x-2">
              <FolderClosed class="h-6 w-6 text-orange-500 p-1 rounded bg-orange-50" />
              <span class="truncate font-medium leading-normal">个人文件夹</span>
            </div>
            <div class="text-xs text-muted-foreground mb-1">对话框中直接上传的文件会存储在这里</div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <div class="flex items-center space-x-1.5">
                <Calendar class="h-3.5 w-3.5" />
                <span>{{ new Date(personFolder.createTime).toLocaleDateString() }}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <FileText class="h-3.5 w-3.5" />
                <span>{{ personFolder.count }} docs</span>
              </div>
            </div>
          </div>
        </div>
        <div v-for="(item, index) in displayedFolderList" :key="index"
          class="relative px-3 py-3 rounded-lg cursor-pointer transition-colors bg-white hover:shadow-lg hover:shadow-gray-200/60 group border"
          @click="goFolderList(item)">
          <div class="min-w-0">
            <div class="flex flex-col space-y-2">
              <div class="flex items-center space-x-2">
                <BookOpenText class="h-6 w-6 text-blue-500 p-1 rounded bg-blue-50" />
                <span class="truncate font-medium leading-normal">{{ item.name }}</span>
              </div>
              <div class="text-xs text-muted-foreground mb-1">{{ item?.description || '暂无描述' }}</div>
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <div class="flex items-center space-x-1.5">
                  <Calendar class="h-3.5 w-3.5" />
                  <span>{{ new Date(item.createTime).toLocaleDateString() }}</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <FileText class="h-3.5 w-3.5" />
                  <span>{{ item.count }} docs</span>
                </div>
              </div>
            </div>
          </div>
          <div class="absolute right-2 top-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Popover>
              <PopoverTrigger @click.stop>
                <Button variant="ghost" size="icon" class="h-6 w-6 bg-white">
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-48 p-0">
                <div class="flex flex-col">
                  <Button 
                    variant="ghost" 
                    class="flex items-center justify-start px-3 py-2 transition-colors hover:bg-accent"
                    @click="editFolder(item, index, $event)"
                  >
                    <Edit class="mr-2 h-4 w-4" />
                    重命名
                  </Button>
                  <Button 
                    variant="ghost" 
                    class="flex items-center justify-start px-3 py-2 transition-colors hover:bg-accent"
                    @click="editFolder(item, index, $event)"
                  >
                    <Edit class="mr-2 h-4 w-4" />
                    修改描述
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger v-if="item.name !== '默认知识库'" asChild>
                      <Button 
                        variant="ghost"
                        class="flex items-center justify-start px-3 py-2 text-destructive transition-colors hover:bg-accent hover:text-destructive"
                      >
                        <Trash class="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除该知识库吗？此操作不可恢复。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction @click="deleteFolder(item.id, index)">确定</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      <div v-if="folderList.length > 16 && !isExpanded" class="flex justify-center mt-2">
        <Button variant="ghost" @click="expandFolderList" size="sm" class="text-blue-500">
          显示更多
        </Button>
      </div>
      
      <div v-if="isExpanded && folderList.length > 16" class="flex justify-center mt-2">
        <Button variant="ghost" @click="collapseFolderList" size="sm" class="text-blue-500">
          收起
        </Button>
      </div>
    </div>

    <div class="flex items-center justify-between mb-6">
      <div class="text-2xl font-semibold mr-8">共享空间</div>
      <div class="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" variant="ghost" class="text-muted-foreground">
              <ArrowDown class="h-4 w-4" />
              排序
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="sort_share_folder('-createTime')" :class="{ 'text-blue-500': shareSort === '-createTime' }">创建时间</DropdownMenuItem>
            <DropdownMenuItem @click="sort_share_folder('-updateTime')" :class="{ 'text-blue-500': shareSort === '-updateTime' }">修改时间</DropdownMenuItem>
            <DropdownMenuItem @click="sort_share_folder('name')" :class="{ 'text-blue-500': shareSort === 'name' }">名称</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div class="relative">
          <Input 
            v-model="shareSearchValue"
            placeholder="搜索知识库" 
            class="w-32 pr-10"
            size="sm"
            @keydown.enter="onShareSearch"
            @blur="onShareSearch"
          />
          <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>

    <div class="min-h-[200px]">
      <div v-if="isLoading" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton v-for="n in 8" :key="n" class="h-[120px] w-full rounded-lg" />
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" v-infinite-scroll="folderLoadMore">
        <div class="relative px-3 py-3 rounded-lg cursor-pointer transition-colors bg-white hover:shadow-lg hover:shadow-gray-200/60 group border">
          <div class="flex flex-col space-y-2" @click="goFolderList(shareFolder)">
            <div class="flex items-center space-x-2">
              <FolderClosed class="h-6 w-6 text-orange-500 p-1 rounded bg-orange-50" />
              <span class="truncate font-medium leading-normal">共享文件夹</span>
            </div>
            <div class="text-xs text-muted-foreground mb-1">其他人分享的文件会存储在这里</div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <div class="flex items-center space-x-1.5">
                <Calendar class="h-3.5 w-3.5" />
                <span>{{ new Date(shareFolder.createTime).toLocaleDateString() }}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <FileText class="h-3.5 w-3.5" />
                <span>{{ shareFolder.count }} docs</span>
              </div>
            </div>
          </div>
        </div>
        <div v-for="(item, index) in displayedShareFolderList" :key="index"
          class="relative px-3 py-3 rounded-lg cursor-pointer transition-colors bg-white hover:shadow-lg hover:shadow-gray-200/60 group border"
          @click="goFolderList(item)">
          <div class="min-w-0">
            <div class="flex flex-col space-y-2">
              <div class="flex items-center space-x-2">
                <BookOpenText class="h-6 w-6 text-blue-500 p-1 rounded bg-blue-50" />
                <span class="truncate font-medium leading-normal">{{ item.name }}</span>
              </div>
              <div class="text-xs text-muted-foreground mb-1">{{ item?.description || '暂无描述' }}</div>
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <div class="flex items-center space-x-1.5">
                  <Calendar class="h-3.5 w-3.5" />
                  <span>{{ new Date(item.createTime).toLocaleDateString() }}</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <UserRound class="h-3.5 w-3.5 text-blue-500" />
                  <span>{{ item.owner_name }}</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <FileText class="h-3.5 w-3.5" />
                  <span>{{ item.count }} docs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="shareFolderList.length > 16 && !isShareExpanded" class="flex justify-center mt-2">
        <Button variant="ghost" @click="expandShareFolderList" size="sm" class="text-blue-500">
          显示更多
        </Button>
      </div>
      
      <div v-if="isShareExpanded && shareFolderList.length > 16" class="flex justify-center mt-2">
        <Button variant="ghost" @click="collapseShareFolderList" size="sm" class="text-blue-500">
          收起
        </Button>
      </div>
    </div>

  </div>

  <Dialog :open="newFolderDialog" @update:open="newFolderDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>新建知识库</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="space-y-2">
          <Label>知识库名称</Label>
          <Input 
            v-model="newFolderName"
            maxlength="20" 
            placeholder="请输入知识库名称" 
            @keydown.enter.prevent="submitDatabase"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
            style="margin-bottom: 8px;"
          />
          <Label>知识库描述（选填）</Label>
          <Input 
            v-model="newFolderDescription"
            maxlength="50" 
            placeholder="请输入知识库描述" 
            style="margin-bottom: 8px;"
          />
          <Label>选择分享对象(选填)</Label>
          <ShareTemplate @update:share-object="newFolderShareObject = $event" />
          <Label v-if="newFolderShareObject.length > 0">选择分享权限(选填)</Label>
          <Select v-model="newFolderSharePermission" v-if="newFolderShareObject.length > 0">
            <SelectTrigger>
              <SelectValue placeholder="请选择分享权限" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">只读</SelectItem>
              <SelectItem value="admin">管理</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="newFolderDialog = false">取消</Button>
        <Button @click="submitDatabase" :loading="btnLoading">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog :open="editFolderDialog" @update:open="editFolderDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ isEditingName ? '重命名知识库' : '修改知识库描述' }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="space-y-2">
          <Label>{{ isEditingName ? '知识库名称' : '知识库描述' }}</Label>
          <Input 
            v-if="isEditingName"
            v-model="editFolderName"
            maxlength="20" 
            placeholder="请输入知识库名称" 
            @keydown.enter.prevent="submitEdit"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
          />
          <Input 
            v-else
            v-model="editFolderDescription"
            maxlength="50" 
            placeholder="请输入知识库描述" 
            @keydown.enter.prevent="submitEdit"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="editFolderDialog = false">取消</Button>
        <Button @click="submitEdit" :loading="btnLoading">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog :open="shareRecordDialog" @update:open="shareRecordDialog = $event">
    <DialogContent class="w-4/5 max-w-[1440px]">
      <DialogHeader>
        <DialogTitle>分享记录</DialogTitle>
      </DialogHeader>
      <ShareRecord />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { get_folder_api, create_folder_api, delete_folder_api, edit_folder_api, get_share_folder_api, get_folder_by_name_api, get_shared_docs_api } from '@/api/common.js'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Edit, Trash, MoreHorizontal, Calendar, FileText, UserRound, ArrowDown, BookOpenText, FolderClosed, Search } from 'lucide-vue-next'
import { useStore } from '@/stores/index.js'
import ShareTemplate from './share_template.vue'
import ShareRecord from './share_record.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'

const router = useRouter()
const store = useStore()
const { toast } = useToast()
const folderPage = ref(1)
const folderSize = ref(100)
const folderCount = ref(0)
const folderList = ref([])
const shareFolderList = ref([])
const shareFolderPage = ref(1)
const shareFolderSize = ref(100)
const btnLoading = ref(false)
const newFolderDialog = ref(false)
const editFolderDialog = ref(false)

const isLoading = ref(true)
const search_value = ref('')
const personalSearchValue = ref('')
const shareSearchValue = ref('')
const isExpanded = ref(false)
const isShareExpanded = ref(false)
const shareFolder = ref({})
const personFolder = ref({})
// 新建知识库
const newFolderName = ref('')
const newFolderDescription = ref('')
const newFolderSharePermission = ref('read')
const newFolderShareObject = ref([])
// 重命名知识库
const editFolderName = ref('')
const editFolderDescription = ref('')
const editFolderId = ref('')
const isEditingName = ref(true)
// 分享记录
const shareRecordDialog = ref(false)

const props = defineProps<{
  hasQuery: boolean
}>()

const emits = defineEmits(['search', 'hasQuery'])
const changedFolder = ref(false)

const onSearch = () => {
  getFolderList(0, search_value.value)
  emits('search', search_value.value)
}

const onPersonalSearch = () => {
  getFolderList(0, personalSearchValue.value)
}

const onShareSearch = () => {
  getShareFolderList(shareSearchValue.value)
}

const folderLoadMore = () => {
  if(folderPage.value * folderSize.value < folderCount.value){
    folderSize.value += 5
    getFolderList()
  }
}

const sort = ref('-createTime')
const shareSort = ref('-createTime')
const getFolderList = async (activeOffset = 0, search: string='') => {
  try {
    const param = {
      page: folderPage.value,
      size: folderSize.value,
      search: search,
      sort: sort.value
    }
    const res = await get_folder_api(param)
    // if (res.data.data.items.length === 0) {
    //   await create_folder_api({ name: '默认知识库' })
    //   getFolderList(activeOffset)
    // } else {
    folderCount.value = res.data.data.total
    folderList.value = res.data.data.items
    store.knowledge_folders = res.data.data.items

    const person_files = await get_folder_by_name_api('folder_for_question_channel')
    personFolder.value = person_files.data.data

    const share_param = {
      page: shareFolderPage.value,
      size: shareFolderSize.value,
      sort: shareSort.value
    }
    const share_res = await get_share_folder_api(share_param)
    shareFolderList.value = share_res.data.data.items

    const share_files = await get_shared_docs_api()
    shareFolder.value = {
      count: share_files.data.data.total,
      createTime: share_files.data.data?.createTime,
      name: '共享文件夹',
      id: 'shared_folder'
    }
    // setDefaultFolder()
    // }
  } catch (err: any) {
    console.error(err)
    if (err.response?.status === 403 || err.response?.status === 401 || err.response?.data?.message === 'Invalid session key') {
      toast({
        variant: "destructive",
        title: "错误",
        description: "登录已过期，请重新登录"
      })
      router.push('/auth/sign-in')
    }
  } finally {
    isLoading.value = false
  }
}

const setDefaultFolder = () => {
  if(!props.hasQuery && !changedFolder.value){
    const defaultFolder = folderList.value.find(item => item.name === '默认知识库')
    if(defaultFolder){
      store.folder_id = defaultFolder.id
      store.folder_name = defaultFolder.name
      store.folder_file_count = defaultFolder.count
    }
  }
}

const sort_folder = (sort_type: string) => {
  sort.value = sort_type
  getFolderList()
}

const sort_share_folder = (sort_type: string) => {
  shareSort.value = sort_type
  getFolderList()
}

const getShareFolderList = async (search: string = '') => {
  try {
    const share_param = {
      page: shareFolderPage.value,
      size: shareFolderSize.value,
      sort: shareSort.value
    }
    const share_res = await get_share_folder_api(share_param)
    // 如果有搜索关键词，在前端过滤结果
    if (search) {
      shareFolderList.value = share_res.data.data.items.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
      )
    } else {
      shareFolderList.value = share_res.data.data.items
    }
  } catch (err) {
    console.error(err)
  }
}

const newFolder = () => {
  newFolderDialog.value = true
  newFolderName.value = ''
}

const editFolder = (item: any, index: number, event: Event) => {
  editFolderDialog.value = true
  editFolderId.value = item.id
  
  // 根据点击的按钮确定是编辑名称还是描述
  const clickedButton = event.target as HTMLElement
  const isNameEdit = clickedButton.textContent?.trim() === '重命名'
  isEditingName.value = isNameEdit
  
  if (isEditingName.value) {
    editFolderName.value = item.name
  } else {
    editFolderDescription.value = item.description || ''
  }
}

const isComposing = ref(false)

const submitDatabase = async () => {
  if (isComposing.value) {
    return
  }
  if (!newFolderName.value) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "知识库名称不能为空"
    })
    return
  }

  try {
    btnLoading.value = true
    await create_folder_api({ 
      name: newFolderName.value,
      description: newFolderDescription.value,
      share_permission: newFolderSharePermission.value,
      share_object: newFolderShareObject.value
    })
    
    newFolderDialog.value = false
    newFolderName.value = ''
    getFolderList()
    toast({
      title: "成功",
      description: "知识库创建成功"
    })
  } catch (err) {
    toast({
      variant: "destructive", 
      title: "错误",
      description: err.response?.data?.message || "创建失败"
    })
  } finally {
    btnLoading.value = false
  }
}

const submitEdit = async () => {
  if (isComposing.value) {
    return
  }
  
  if (isEditingName.value && !editFolderName.value) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "知识库名称不能为空"
    })
    return
  }

  try {
    btnLoading.value = true
    
    // 根据编辑类型构建不同的请求参数
    const params = {
      folder_id: editFolderId.value
    }
    
    if (isEditingName.value) {
      params.name = editFolderName.value
    } else {
      params.description = editFolderDescription.value
    }
    
    await edit_folder_api(params)
    
    editFolderDialog.value = false
    getFolderList()
    toast({
      title: "成功",
      description: isEditingName.value ? "重命名成功" : "描述修改成功"
    })
  } catch (err) {
    toast({
      variant: "destructive",
      title: "错误", 
      description: isEditingName.value ? "重命名失败" : "描述修改失败"
    })
  } finally {
    btnLoading.value = false
    editFolderName.value = ''
    editFolderDescription.value = ''
  }
}

const deleteFolder = async (id: string, index: number) => {
  try {
    await delete_folder_api({ folder_id: id })
    getFolderList()
    toast({
      title: "成功",
      description: "删除成功"
    })
  } catch (err) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "删除失败" 
    })
  }
}

const goFolderList = (item: any) => {
  store.folder_id = item.id
  store.folder_name = item.name
  // store.folder_file_count = item.count
  const path = `/knowledges?folder_id=${item.id}&folder_name=${encodeURIComponent(item.name)}`
  const url = `${window.location.origin}${path}`
  changedFolder.value = true
  window.history.pushState({ path }, '', url)
  store.show_main_router = false
}

const folder_show_num = ref(window.innerWidth >= 1440 ? 15 : 11)
// Computed property to show either all folders or just the first 20/16
const displayedFolderList = computed(() => {
  if (isExpanded.value) {
    return folderList.value
  } else {
    return folderList.value.slice(0, folder_show_num.value)
  }
})

const displayedShareFolderList = computed(() => {
  if (isShareExpanded.value) {
    return shareFolderList.value
  } else {
    return shareFolderList.value.slice(0, folder_show_num.value)
  }
})

const expandShareFolderList = () => {
  isShareExpanded.value = true
}

const collapseShareFolderList = () => {
  isShareExpanded.value = false
  window.scrollTo({ top: document.querySelector('.grid')?.offsetTop || 0, behavior: 'smooth' })
}

const expandFolderList = () => {
  isExpanded.value = true
}

const collapseFolderList = () => {
  isExpanded.value = false
  // Optionally scroll back to top of the list
  window.scrollTo({ top: document.querySelector('.grid')?.offsetTop || 0, behavior: 'smooth' })
}

// 初始化加载
getFolderList()

defineExpose({
  getFolderList
})
</script>
