<template>
  <div class="px-3 py-2 bg-muted/20 border-b overflow-y-auto max-h-[300px] min-h-[120px]">
    <TabsContent value="knowledge" class="space-y-3">
      <!-- Shared Knowledge Bases Section -->
      <div v-if="sharedKnowledgeFolders.length > 0">
        <div class="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
          <Users class="h-3.5 w-3.5" />
          共享知识库
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div v-for="knowledge in sharedKnowledgeFolders" :key="knowledge.id"
            class="group relative flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/20 rounded-xl border border-blue-100/60 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
            :class="{
              'ring-2 ring-blue-200/60 bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100/40 shadow-md shadow-blue-100/50': selectedKbs.some(kb => kb.id === knowledge.id)
            }"
            @click="toggleKnowledge(!selectedKbs.some(kb => kb.id === knowledge.id), knowledge)"
          >
            <Checkbox 
              :id="knowledge.id"
              :checked="selectedKbs.some(kb => kb.id === knowledge.id)"
              class="mt-0.5 flex-shrink-0 pointer-events-none"
            />
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <div class="relative">
                  <Database class="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                </div>
                <label :for="knowledge.id" class="text-sm font-medium text-gray-900 truncate cursor-pointer group-hover:text-blue-700 transition-colors">
                  {{ knowledge.name }}
                </label>
              </div>
              
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1 px-2 py-1 bg-blue-100/50 text-blue-700 rounded-full">
                  <FileText class="h-3 w-3" />
                  <span class="font-medium">{{ knowledge.count || 0 }}</span>
                </div>
                <div class="flex items-center gap-1 text-gray-500 group-hover:text-gray-600 transition-colors">
                  <Calendar class="h-3 w-3" />
                  <span>{{ formatDate(knowledge.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Personal Knowledge Bases Section -->
      <div v-if="knowledgeFolders.length > 0">
        <div class="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5" 
             :class="{'mt-3': sharedKnowledgeFolders.length > 0}">
          <FolderOpen class="h-3.5 w-3.5" />
          个人知识库
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div v-for="knowledge in knowledgeFolders" :key="knowledge.id"
            class="group relative flex items-start gap-3 p-3 bg-gradient-to-br from-gray-50/80 via-white to-gray-50/40 rounded-xl border border-gray-100/80 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
            :class="{
              'ring-2 ring-gray-200/60 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100/40 shadow-md shadow-gray-100/50': selectedKbs.some(kb => kb.id === knowledge.id)
            }"
            @click="toggleKnowledge(!selectedKbs.some(kb => kb.id === knowledge.id), knowledge)"
          >
            <Checkbox 
              :id="knowledge.id"
              :checked="selectedKbs.some(kb => kb.id === knowledge.id)"
              class="mt-0.5 flex-shrink-0 pointer-events-none"
            />
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <div class="relative">
                  <Database class="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gray-400 rounded-full opacity-50"></div>
                </div>
                <label :for="knowledge.id" class="text-sm font-medium text-gray-900 truncate cursor-pointer group-hover:text-gray-700 transition-colors">
                  {{ knowledge.name }}
                </label>
                <Users v-if="knowledge.isShared" class="h-3 w-3 text-blue-500 flex-shrink-0 animate-pulse" title="共享" />
              </div>
              
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1 px-2 py-1 bg-gray-100/60 text-gray-700 rounded-full">
                  <FileText class="h-3 w-3" />
                  <span class="font-medium">{{ knowledge.count || 0 }}</span>
                </div>
                <div class="flex items-center gap-1 text-gray-500 group-hover:text-gray-600 transition-colors">
                  <Calendar class="h-3 w-3" />
                  <span>{{ formatDate(knowledge.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  </div>
</template>

<script setup lang="ts">
import { TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { User, Users, Calendar, FileText, FolderOpen, Database } from 'lucide-vue-next'
import { ref, computed } from 'vue'

interface KnowledgeBase {
  id: string
  name: string
  createTime: string
  count: number
  description?: string
  isShared?: boolean
}

interface FileItem {
  title: string
  size: number
  parseStatus: number
  parseProgress: number
  raw?: File
  docId?: string
}

const { toast } = useToast()

const props = defineProps<{
  knowledgeFolders: KnowledgeBase[]
  selectedKbs: KnowledgeBase[]
  selectedFiles: FileItem[]
  sharedKnowledgeFolders?: KnowledgeBase[]
}>()

// Provide default empty array for shared knowledge folders
const sharedKnowledgeFolders = computed(() => {
  return props.sharedKnowledgeFolders || []
})

const emit = defineEmits<{
  'update:selectedKbs': [kbs: KnowledgeBase[]]
}>()

// Format date helper function
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit'
    })
  } catch (error) {
    return ''
  }
}

const toggleKnowledge = (checked: boolean, knowledge: KnowledgeBase) => {
  const currentSelected = [...props.selectedKbs]
  if (props.selectedFiles.length > 0) {
    toast({
      title: '已经选择文件，不能选择知识库',
      variant: 'destructive',
    })
    return
  }
  if (checked) {
    if (currentSelected.length < 2) {
      currentSelected.push(knowledge)
    } else {
      toast({
        title: "选择限制",
        description: "最多只能选择2个知识库",
        variant: "destructive"
      })
      return
    }
  } else {
    const index = currentSelected.findIndex(kb => kb.id === knowledge.id)
    if (index > -1) {
      currentSelected.splice(index, 1)
    }
  }
  emit('update:selectedKbs', currentSelected)
}
</script> 