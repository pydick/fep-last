<template>
  <!-- 一个input，左边输入，右边是一个按钮，输入后0.5秒执行搜索操作，搜索完下面会展示搜索结果 -->
  <div class="w-full max-w-2xl mx-auto">
    <div class="flex justify-between mb-4">
      <div class="flex w-full items-center flex-wrap p-1 border rounded-md">
        <div v-for="(item, index) in selectedItems" :key="index" 
             class="flex items-center bg-primary/10 rounded-md px-1 py-1 mx-1 my-1">
          <Building v-if="item.type === 'department'" class="h-3 w-3 mr-1 text-orange-500" />
          <UserRound v-else class="h-3 w-3 mr-1 text-blue-500" />
          <span class="text-xs" v-if="item.show_name">{{ item.show_name + '(' + item.name + ')' }}</span>
          <span class="text-xs" v-else>{{ item.name }}</span>
          <button @click="removeItem(index)" class="ml-1 text-muted-foreground hover:text-foreground">
            <X class="h-3 w-3" />
          </button>
        </div>
        <Input 
          v-model="searchQuery" 
          placeholder="输入搜索内容" 
          class="flex-1 min-w-[150px] border-none h-8"
          @blur="debouncedSearch"
          @input="debouncedSearch"
        />
        <Button @click="open_share_template_dialog" class="px-2 h-10 ml-2">
          <UserRoundPlus class="h-4 w-4" />
        </Button>

      </div>
      
    </div>
    
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <Loader class="w-6 h-6 text-blue-500 animate-spin" />
      <span class="text-muted-foreground">加载中...</span>
    </div>
    
    <div v-else-if="searchResults?.departments?.length || searchResults?.users?.length" class="space-y-2 mt-4 max-h-[200px] overflow-y-auto">
      <div v-for="(result, index) in searchResults.departments" :key="index" 
           class="overflow-hidden p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
           @click="addItem(result, 'department')">
        <div class="flex items-center gap-2">
          <Building class="h-4 w-4 text-orange-500" />
          <p class="text-sm">{{ result.name }}</p>
        </div>
      </div>
      <div v-for="(result, index) in searchResults.users" :key="index" 
           class="overflow-hidden p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
           @click="addItem(result, 'user')">
        <div class="flex items-center gap-2">
          <UserRound class="h-4 w-4" />
          <p class="text-sm" v-if="result.show_name">{{ result.show_name + '(' + result.name + ')' }}</p>
          <p class="text-sm" v-else>{{ result.name }}</p>
        </div>
      </div>
    </div>
    
    <div v-else-if="hasSearched" class="flex justify-center items-center py-2">
      <span class="text-muted-foreground italic text-sm">没有找到相关结果</span>
    </div>
  </div>
  
  <!-- 分享对话框 -->
  <Dialog v-model:open="showShareDialog">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>选择部门或人员</DialogTitle>
        <DialogDescription>选择您要分享的部门或人员</DialogDescription>
      </DialogHeader>
      
      <div class="flex gap-4 h-[400px]">
        <!-- 左侧部门和人员选择区域 -->
        <div class="w-1/2 border rounded-md overflow-hidden flex flex-col">
          <div class="p-2 border-b">
            <div class="relative">
              <SearchIcon class="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                v-model="searchQuery"
                placeholder="搜索部门或人员" 
                class="pl-8 h-8 text-sm"
                @blur="debouncedSearch"
                @keydown.enter="debouncedSearch"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 h-[340px]">
            <div v-if="loadingDepartments" class="flex justify-center items-center py-8">
              <Loader class="w-6 h-6 animate-spin" />
              <span class="ml-2">加载中...</span>
            </div>
            <div v-else class="p-2">
              <div v-if="searchResults?.departments?.length > 0 || searchResults?.users?.length > 0" class="space-y-2">
                <div v-for="(result, index) in searchResults.departments" :key="index" 
                    class="overflow-hidden p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    @click="toggleSelect(result, 'department')">
                  <div class="flex items-center gap-2">
                    <Building class="h-4 w-4 text-primary" />
                    <p class="text-sm" v-if="result.show_name">{{ result.show_name + '(' + result.name + ')' }}</p>
                    <p class="text-sm" v-else>{{ result.name }}</p>
                  </div>
                </div>
                <div v-for="(result, index) in searchResults.users" :key="index" 
                    class="overflow-hidden p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    @click="toggleSelect(result, 'user')">
                  <div class="flex items-center gap-2">
                    <UserRound class="h-4 w-4" />
                    <p class="text-sm" v-if="result.show_name">{{ result.show_name + '(' + result.name + ')' }}</p>
                    <p class="text-sm" v-else>{{ result.name }}</p>
                  </div>
                </div>
              </div>
              <div v-else>
                <TreeItem 
                  v-for="item in filteredDepartments" 
                  :key="item" 
                  :item="item"
                  :selected-ids="getSelectedIds()"
                  @toggle="toggleExpand"
                  @select="toggleSelect"
                />
              </div>
            </div>
          </ScrollArea>
        </div>
        
        <!-- 右侧已选择的部门和人员 -->
        <div class="w-1/2 border rounded-md p-2">
          <h3 class="text-sm font-medium mb-2" v-if="dialogSelectedItems.length > 0">已选择</h3>
          <ScrollArea className="h-[320px]">
            <div v-if="dialogSelectedItems.length === 0" class="text-center text-muted-foreground py-4 text-sm">
              请从左侧选择部门或人员
            </div>
            <div v-else class="space-y-2">
              <div v-for="(item, index) in dialogSelectedItems" :key="index" 
                   class="flex items-center justify-between p-2 border rounded-md">
                <div class="flex items-center">
                  <Building v-if="item.type === 'department'" class="h-4 w-4 mr-2 text-orange-500" />
                  <UserRound v-else class="h-4 w-4 mr-2 text-blue-500" />
                  <span v-if="item.show_name">{{ item.show_name + '(' + item.name + ')' }}</span>
                  <span v-else>{{ item.name }}</span>
                </div>
                <button @click="removeDialogItem(index)" class="text-muted-foreground hover:text-destructive">
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="showShareDialog = false">取消</Button>
        <Button @click="confirmSelection">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SearchIcon, Loader, UserRoundPlus, Building, UserRound, X } from 'lucide-vue-next'
import { search_person_department_api, get_department_tree_api } from '@/api/common.js'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import TreeItem from './TreeItem.vue'
// 你可能需要创建一个Spinner组件，或者从某个库导入
// 这里假设你有一个Spinner组件

const searchQuery = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const hasSearched = ref(false)
const selectedItems = ref([])
let searchTimeout = null

// 分享对话框相关状态
const showShareDialog = ref(false)
const departmentTree = ref([])
const loadingDepartments = ref(false)
const dialogSelectedItems = ref([])
const departmentSearchQuery = ref('')
const filteredDepartments = ref([])

const emit = defineEmits(['update:share-object'])

// 添加项目到选择列表
const addItem = (item, type) => {
  // 检查是否已存在
  const exists = selectedItems.value.some(i => 
    i.type === type && ((type === 'department' && i.name === item.name) || 
    (type === 'user' && i.email === item.email))
  )
  
  if (!exists) {
    selectedItems.value.push({ ...item, type })
  }
  emit('update:share-object', selectedItems.value)
  
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false  // Reset the hasSearched flag when a result is selected
}

// 移除已选项目
const removeItem = (index) => {
  selectedItems.value.splice(index, 1)
  emit('update:share-object', selectedItems.value)
}

// 防抖搜索函数
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    search()
  }, 500) // 0.5秒后执行搜索
}

// 搜索函数
const search = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }
  isLoading.value = true
  hasSearched.value = true
  try {
    // 这里替换为实际的API调用
    const res = await search_person_department_api(searchQuery.value)
    searchResults.value = res.data
  } catch (error) {
    console.error('搜索出错:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

// 打开分享对话框
const open_share_template_dialog = async () => {
  searchResults.value = []
  dialogSelectedItems.value = []
  showShareDialog.value = true
  await fetchLevelDepartments()
}

// 获取顶级部门
const fetchLevelDepartments = async () => {
  loadingDepartments.value = true
  try {
    // 替换为实际的API调用
    const res = await get_department_tree_api()
    console.log(res)
    departmentTree.value = res.data.data
    // 遍历departmentTree.value.children，如果children.name为空，则删除该children
    if (departmentTree.value.children) {
      departmentTree.value.children = departmentTree.value.children.filter(item => item.name !== '')
      filteredDepartments.value = departmentTree.value.children // Initialize filteredDepartments
    }
  } catch (error) {
    console.error('获取部门失败:', error)
    departmentTree.value = []
    filteredDepartments.value = []
  } finally {
    loadingDepartments.value = false
  }
}

// 展开/折叠部门
const toggleExpand = async (item) => {
  item.expanded = !item.expanded
  // 如果展开且未加载子项，则加载
  if (item.expanded && !item.loaded) {
    item.loaded = true
  }
}

// 获取所有已选项的ID列表
const getSelectedIds = () => {
  return dialogSelectedItems.value.map(item => item.id)
}

// 选择/取消选择项
const toggleSelect = (item, type='user') => {
  const index = dialogSelectedItems.value.findIndex(i => i.id === item.id && i.type === item.type)
  
  if (index > -1) {
    dialogSelectedItems.value.splice(index, 1)
  } else {
    dialogSelectedItems.value.push({
      id: item.id,
      name: item.name,
      show_name: item.show_name,
      type: item.type || type,
      email: item.email || null
    })
  }
}

// 从已选择列表中移除项
const removeDialogItem = (index) => {
  dialogSelectedItems.value.splice(index, 1)
}

// 确认选择
const confirmSelection = () => {
  // 将对话框中选择的项目添加到主界面中
  dialogSelectedItems.value.forEach(item => {
    addItem(item, item.type)
  })
  
  // 关闭对话框
  showShareDialog.value = false
  emit('update:share-object', selectedItems.value)
}

// 搜索部门树
const searchDepartments = () => {
  if (!departmentSearchQuery.value) {
    filteredDepartments.value = departmentTree.value.children || []
    return
  }
  
  // 递归搜索部门树
  const searchRecursive = (items, query) => {
    const results = []
    if (!items) return results
    
    for (const item of items) {
      // 检查当前项是否匹配
      const nameMatch = item.name && item.name.toLowerCase().includes(query.toLowerCase())
      
      if (nameMatch) {
        // 如果当前项匹配，添加到结果中
        results.push({ ...item })
      } else if (item.children && item.children.length) {
        // 如果当前项不匹配但有子项，搜索子项
        const childResults = searchRecursive(item.children, query)
        if (childResults.length) {
          // 如果子项有匹配，则添加当前项及其匹配的子项
          results.push({
            ...item,
            children: childResults
          })
        }
      }
    }
    return results
  }
  
  filteredDepartments.value = searchRecursive(departmentTree.value.children, departmentSearchQuery.value)
}
</script>

<style scoped>
/* 添加TreeItem组件的样式 */
</style>

