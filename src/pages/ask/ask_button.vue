<template>
  <Tabs v-model="currentTab" class="relative">
    <TabsList class="grid w-full grid-cols-2 w-[120px]">
      <TabsTrigger 
        value="files" 
        class="text-xs px-2"
        @click.stop="show_files = !show_files; show_knowledge = false;"
      >
        <span class="text-xs">文件</span>
      </TabsTrigger>

      <TabsTrigger 
        value="knowledge" 
        class="text-xs px-2"
        @click.stop="show_knowledge = !show_knowledge; show_files = false;"
      >
        <span class="text-xs">知识库</span>
      </TabsTrigger>
    </TabsList>
    
    <!-- Selected items tags -->
    <SelectedItems 
      :selectedFiles="selectedFiles"
      :selectedKbs="selectedKbs"
      @remove-file="removeFile"
      @remove-knowledge="removeKnowledge"
    />

    <div 
      class="relative overflow-hidden rounded-xl border bg-background focus-within:ring-1 focus-within:ring-ring"
      style="box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave" 
      @drop.prevent="handleDrop"
      :class="{ 'drag-over': isDragging }"
    >
      <!-- File uploader component -->
      <FileUploader
        v-if="show_files"
        v-model:files="files"
        v-model:selectedFiles="selectedFiles"
        :selectedKbs="selectedKbs"
        @update:showUploadDialog="showUploadDialog = $event"
        @update:uploadingFiles="uploadingFiles = $event"
      />

      <!-- Knowledge selector component -->
      <KnowledgeSelector
        v-if="show_knowledge"
        v-model:selectedKbs="selectedKbs"
        :selectedFiles="selectedFiles"
        :knowledgeFolders="store.knowledge_folders"
        :sharedKnowledgeFolders="sharedKnowledgeFolders"
      />
      
      <!-- Message input component -->
      <MessageInput
        ref="message_input_ref"
        v-model:messageText="messageText"
        :isLoading="isLoading"
        :isOnline="isOnline"
        v-model:searchType="searchType"
        v-model:isThinking="isThinking"
        v-model:isToolsOpen="isToolsOpen"
        :isTemplateMode="isTemplateMode"
        :templateName="templateName || undefined"
        :height="props.height"
        :selectedFiles="selectedFiles"
        :selectedKbs="selectedKbs"
        v-model:tools="tools as any"
        @submit="handleSubmit"
        @stop="handleStop"
        @toggle-network="toggleNetwork"
        @toggle-thinking="toggleThinking"
        @file-upload="handleFileUpload"
        @file-pasted="handlePastedFile"
        @toggle-tools="toggleTools"
        @toggle-template="toggleTemplate"
        @clear-template="clearTemplate"
        @chemical-editor="showChemicalEditor = true"
      />

      <!-- Hidden file input -->
      <input 
        type="file"
        ref="fileInput"
        class="hidden"
        accept=".pdf,.PDF,.jpg,.JPG,.jpeg,.JPEG,.png,.PNG,.pdb,.PDB,.sdf,.SDF,.fasta,.FASTA,.fst,.FST,.pptx,.PPTX,.docx,.DOCX,.TXT,.txt"
        multiple
        @change="onFileSelected"
      />

      <!-- Upload progress dialog -->
      <UploadDialog
        v-model:show="showUploadDialog"
        :uploadingFiles="uploadingFiles"
        :totalProgress="totalProgress"
      />

      <!-- Template selection dialog -->
      <TemplateDialog 
        v-model:open="showTemplateDialog"
        @template-selected="onTemplateSelected"
        @template-cleared="clearTemplate"
      />

      <!-- Parse dialog for PDF files -->
      <Dialog :open="showParseDialog" @update:open="handleParseDialogClose">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
            <DialogDescription>
              {{ uploadCompleted ? '文件上传完成，请选择是否解析分子' : '正在上传您的文件，请稍候...' }}
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-2" v-if="uploadedFiles.length > 0">
            <div v-for="file in uploadedFiles" :key="file.title" class="flex items-center justify-between">
              <span class="text-sm truncate max-w-[350px]">{{ file.title }}</span>
              <Badge 
                :variant="file.parseStatus === 0 ? 'secondary' : file.parseStatus === 3 ? 'destructive' : 'default'"
              >
                {{ file.parseStatus === 0 ? '待解析' : file.parseStatus === 3 ? '上传失败' : '已上传' }}
              </Badge>
            </div>
          </div>
          
          <!-- 解析选项 -->
          <div v-if="uploadCompleted && hasPdfFiles" class="space-y-4 pt-4 border-t">
            <div class="flex items-center space-x-2">
              <Switch 
                id="parse-molecule" 
                v-model:checked="parseMolecule"
              />
              <Label for="parse-molecule" class="text-sm font-medium">
                解析分子结构
              </Label>
            </div>
            <p class="text-xs text-gray-500">
              开启后将自动识别和解析PDF中的分子结构信息
            </p>
            
            <DialogFooter class="flex justify-end">
              <Button 
                @click="startParsing" 
                :disabled="parseLoading"
              >
                开始解析
              </Button>
            </DialogFooter>
          </div>
          
          <!-- 非PDF文件直接关闭 -->
          <DialogFooter v-else-if="uploadCompleted && !hasPdfFiles" class="flex justify-end">
            <Button @click="closeParseDialog">
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </Tabs>
  <get_channel_docs v-model:files="files" />

  <!-- 化学编辑器 -->
  <Dialog v-model:open="showChemicalEditor">
    <DialogContent class="max-w-[1200px]">
      <DialogHeader>
        <DialogTitle>分子编辑器</DialogTitle>
        <DialogDescription>请粘贴FASTA序列上传文件，或在化学编辑器中绘制化学结构</DialogDescription>
      </DialogHeader>
      
      <Tabs v-model="chemicalEditorTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="fasta">粘贴FASTA</TabsTrigger>
          <TabsTrigger value="molecule">化学编辑器</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fasta" class="mt-6">
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 左侧输入区域 -->
              <div>
                <Label for="fasta-content">FASTA序列</Label>
                <Textarea
                  id="fasta-content"
                  v-model="fastaContent"
                  placeholder=">sequence_1
ATGCGTACGTAGCTAGCTAGCTAGCTAG
CGTACGTAGCTAGCTAGCTAGCTAGCTAG

或者蛋白质序列：
>protein_1
MVLSEGEWQLVLHVWAKVEADVAGHGQDILIR
LFKSHPETLEKFDRFKHLKTEAEMKASED"
                  class="mt-2 min-h-[300px] font-mono text-sm"
                />
              </div>
              
              <!-- 右侧预览区域 -->
              <div>
                <Label>预览</Label>
                <div class="mt-2 min-h-[300px] p-3 border rounded-md bg-gray-50 overflow-auto">
                  <div v-if="fastaContent.trim()" class="font-mono text-sm">
                    <div v-html="formatFastaSequence(fastaContent)"></div>
                  </div>
                  <div v-else class="text-gray-400 text-sm">
                    粘贴FASTA序列后，这里会显示带颜色的预览
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 序列颜色说明 -->
            <div v-if="fastaContent.trim()" class="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 class="text-sm font-semibold mb-2">
                {{ getCurrentSequenceType() === 'dna' ? 'DNA/RNA碱基颜色说明：' : '氨基酸颜色说明：' }}
              </h4>
              
              <!-- DNA/RNA颜色说明 -->
              <div v-if="getCurrentSequenceType() === 'dna'" class="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #FF6B6B;"></span>
                  <span>腺嘌呤 (A)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #4ECDC4;"></span>
                  <span>胸腺嘧啶 (T)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #45B7D1;"></span>
                  <span>鸟嘌呤 (G)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #FFA07A;"></span>
                  <span>胞嘧啶 (C)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #98D8C8;"></span>
                  <span>尿嘧啶 (U)</span>
                </div>
              </div>
              
              <!-- 蛋白质颜色说明 -->
              <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #FF6B6B;"></span>
                  <span>疏水性 (A,V,I,L,M,F,W,Y)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #4ECDC4;"></span>
                  <span>极性 (S,T,N,Q)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #45B7D1;"></span>
                  <span>碱性 (K,R,H)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #FFA07A;"></span>
                  <span>酸性 (D,E)</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" style="background-color: #98D8C8;"></span>
                  <span>特殊 (G,P,C)</span>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end gap-4">
              <Button 
                variant="outline"
                @click="showChemicalEditor = false"
              >
                取消
              </Button>
              <Button 
                @click="uploadFasta()"
                :disabled="!fastaContent.trim() || fastaUploading"
              >
                <span v-if="fastaUploading">上传中...</span>
                <span v-else>上传FASTA</span>
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="molecule" class="mt-6">
          <div class="relative">
            <div v-if="isIframeLoading" class="absolute inset-0 flex items-center justify-center bg-background">
              <div class="flex flex-col items-center gap-2">
                <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p class="text-sm text-muted-foreground">加载中...</p>
              </div>
            </div>
            <iframe 
              class="frame" 
              id="idKetcher" 
              src="./static/file/standalone/index.html" 
              width="100%" 
              height="500" 
              @load="isIframeLoading = false"
            />
          </div>
          <div class="flex justify-end gap-4 mt-4">
            <Button 
              variant="outline"
              @click="showChemicalEditor = false"
            >
              取消
            </Button>
            <Button 
              @click="getsmiles()"
            >
              确定
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { useStore } from '@/stores/index.js'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
// @ts-ignore
import { upload_knowledge_api, getimgbase64_api, check_folder_api, create_channel_api, create_gpt_question_api, get_doc_api, get_share_folder_api, parse_knowledge_api } from '@/api/common.js'

import FileUploader from './components/FileUploader.vue'
import KnowledgeSelector from './components/KnowledgeSelector.vue'
import MessageInput from './components/MessageInput.vue'
import UploadDialog from './components/UploadDialog.vue'
import SelectedItems from './components/SelectedItems.vue'
import TemplateDialog from './components/TemplateDialog.vue'
import get_channel_docs from './components/get_channel_docs.vue'
import { getCookie } from '@/utils/request.js'
import { init_ketcher_module } from './components/utils.js'

interface FileItem {
  title: string
  size: number
  parseStatus: number
  parse_progress: number
  parseProgress: number
  progress: number
  progress_texts: string[]
  raw?: File
  docId?: string
  timer?: any
  type?: number
  img_base64?: string
  img_id?: string
  download_url?: string
  download_key?: string
}

interface KnowledgeBase {
  id: string
  name: string
}

const router = useRouter()
const store = useStore()
const { toast } = useToast()
const emit = defineEmits(['get_questionlist', 'closeSider', 'stop'])
const show_files = ref(false)
const show_knowledge = ref(false)
// State
const files = ref<FileItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const messageText = ref('')
const isLoading = ref(false)
const channel_id = ref('')
const docIdList = ref<string[]>([])
const isOnline = ref(true)
const searchType = ref('all')
const selectedKbs = ref<KnowledgeBase[]>([])
const selectedFiles = ref<FileItem[]>([])
const showUploadDialog = ref(false)
const uploadingFiles = ref<FileItem[]>([])
const currentTab = ref('files')
const isThinking = ref(true)
const isTemplateMode = ref(false)
const templateId = ref<string | null>(null)
const templateName = ref<string | null>(null)
const isToolsOpen = ref(true)
const isDragging = ref(false)
const showChemicalEditor = ref(false)
const showTemplateDialog = ref(false)
const isIframeLoading = ref(true)
const showParseDialog = ref(false)
const uploadedFiles = ref<FileItem[]>([])
const uploadCompleted = ref(false)
const parseMolecule = ref(false)
const parseLoading = ref(false)
const chemicalEditorTab = ref('fasta')
const fastaContent = ref('')
const fastaUploading = ref(false)

const totalProgress = computed(() => {
  if (uploadingFiles.value.length === 0) return 0
  const total = uploadingFiles.value.reduce((sum, file) => sum + file.progress, 0)
  return Math.round(total / uploadingFiles.value.length)
})

const hasPdfFiles = computed(() => {
  return uploadedFiles.value.some(file => file.title.toLowerCase().endsWith('.pdf'))
})

const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

const tools = ref({
  '搜索': [
    {
      id: '1',
      label: '数据库搜索',
      value: '情报数据库搜索',
      description: '数据库搜索',
      icon: 'Search',
      enabled: true,
      ldap_disabled: false
    },
    {
      id: '2',
      label: '网络搜索',
      value: '网络搜索',
      description: '网络搜索',
      icon: 'Search',
      enabled: true,
      ldap_disabled: false
    },
    {
      id: '3',
      label: '页面爬取',
      value: '页面爬取',
      description: '页面爬取',
      icon: 'Search',
      enabled: true,
      ldap_disabled: false
    }
  ],
  '小分子和蛋白质': [
    {
      id: '5',
      label: 'DrugFlow-ADMET计算',
      value: 'DrugFlow-ADMET计算',
      description: 'DrugFlow-ADMET计算',
      icon: 'Atom',
      enabled: true,
      ldap_disabled: false
    },
    {
      id: '6',
      label: '分子专利查询',
      value: '分子专利查询',
      description: '分子专利查询',
      icon: 'ScrollText',
      enabled: true,
      ldap_disabled: false
    },
    {
      id: '7',
      label: '化学名转SMILES',
      value: 'chemname2smiles',
      description: '化学名转SMILES',
      icon: 'Atom',
      enabled: true,
      ldap_disabled: false
    },
    {
      id: '8',
      label: 'SMILES信息补全',
      value: 'smiles_info_completion',
      description: 'SMILES信息补全',
      icon: 'Atom',
      enabled: true,
      ldap_disabled: false
    },
    {
      id: '9',
      label: 'DrugFlow分子对接',
      value: 'DrugFlow分子对接--任务提交',
      description: 'DrugFlow分子对接--任务提交',
      icon: 'Dna',
      enabled: true
    },
    {
      id: '10',
      label: 'DrugFlow结构提取',
      value: '结构提取--任务提交',
      description: 'DrugFlow结构提取',
      icon: 'Dna',
      enabled: true
    },
    {
      id: '11',
      label: 'DrugFlow任务查询',
      value: 'DrugFlow任务查询',
      description: 'DrugFlow任务查询',
      icon: 'Dna',
      enabled: true
    }
  ],
  '其他': [
    {
      id: '12',
      label: '代码生成和执行',
      value: 'execute_code',
      description: '代码生成和执行',
      icon: 'Code',
      enabled: true,
      ldap_disabled: false
    }
  ]
})

if (if_ldap.value) {
  tools.value = {
    '搜索': [
      {
        id: '1',
        label: '数据库搜索',
        value: '情报数据库搜索',
        description: '数据库搜索',
        icon: 'Search',
        enabled: true,
        ldap_disabled: false
      },
      {
        id: '2',
        label: '网络搜索',
        value: '网络搜索',
        description: '网络搜索',
        icon: 'Search',
        enabled: true,
        ldap_disabled: false
      },
      {
        id: '3',
        label: '页面爬取',
        value: '页面爬取',
        description: '页面爬取',
        icon: 'Search',
        enabled: true,
        ldap_disabled: false
      }
    ],
    '小分子和蛋白质': [
      {
        id: '5',
        label: 'ADMET计算',
        value: 'DrugFlow-ADMET计算',
        description: 'ADMET计算',
        icon: 'Atom',
        enabled: true,
        ldap_disabled: false
      },
      {
        id: '6',
        label: '分子专利查询',
        value: '分子专利查询',
        description: '分子专利查询',
        icon: 'ScrollText',
        enabled: true,
        ldap_disabled: false
      },
      {
        id: '7',
        label: '化学名转SMILES',
        value: 'chemname2smiles',
        description: '化学名转SMILES',
        icon: 'Atom',
        enabled: true,
        ldap_disabled: false
      },
      {
        id: '8',
        label: 'SMILES信息补全',
        value: 'smiles信息补全',
        description: 'SMILES信息补全',
        icon: 'Atom',
        enabled: true,
        ldap_disabled: false
      },
    ],
    '其他': [
      {
        id: '12',
        label: '代码生成和执行',
        value: 'execute_code',
        description: '代码生成和执行',
        icon: 'Code',
        enabled: true,
        ldap_disabled: false
      }
    ]
  }
}

const toggleNetwork = () => {
  isOnline.value = !isOnline.value
}

const toggleThinking = () => {
  // 检查是否应该强制开启深度思考
  const shouldForceThinking = checkShouldForceThinking()
  
  if (shouldForceThinking && isThinking.value) {
    // 如果需要强制开启且当前是开启状态，则不允许关闭
    toast({
      title: "无法关闭深度思考",
      description: "使用知识库或上传文档时必须开启深度思考",
      variant: "destructive"
    })
    return
  }
  
  isThinking.value = !isThinking.value
}

// 检查是否应该强制开启深度思考
const checkShouldForceThinking = () => {
  // 检查是否选择了知识库
  const hasSelectedKbs = selectedKbs.value.length > 0
  
  // 检查是否上传了需要强制深度思考的文件类型
  const hasRequiredFiles = selectedFiles.value.some(file => {
    const fileName = file.title.toLowerCase()
    return fileName.endsWith('.pdf') || 
           fileName.endsWith('.docx') || 
           fileName.endsWith('.pptx') || 
           fileName.endsWith('.txt')
  })
  
  return hasSelectedKbs || hasRequiredFiles
}

const toggleTemplate = () => {
  // Show template selection dialog
  showTemplateDialog.value = true
}

const onTemplateSelected = (selectedTemplateId: string, selectedTemplateName: string) => {
  templateId.value = selectedTemplateId
  templateName.value = selectedTemplateName
  isTemplateMode.value = true
  
  toast({
    title: "模版已选择",
    description: `已选择模版：${selectedTemplateName}`,
  })
}

const clearTemplate = () => {
  templateId.value = null
  templateName.value = null
  isTemplateMode.value = false
  
  toast({
    title: "已取消模版",
    description: "已取消模版输出功能",
  })
}

const props = defineProps({
  docIds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  height: {
    type: String,
    default: 'normal'
  }
})

watch(props.docIds, (newVal) => {
  // 获取文件列表
  update_docs(newVal)
})

const update_docs = (docIds: string[], show_files_window: boolean = false) => {
  Promise.all(docIds.map(async (item) => {
    const res = await get_doc_api(item)
    return res.data.data
  })).then(res => {
    files.value = res
    selectedFiles.value = files.value.filter(item => item.docId && docIds.includes(item.docId))
    if (show_files_window) {
      show_files.value = true
    }
  })
}

if (props.docIds.length > 0) {
  update_docs(props.docIds, true)
}

// 监听标签变化
// watch(currentTab, (newValue) => {
//   if (newValue === 'files') {
//     show_files.value = true
//     show_knowledge.value = false
//   } else if (newValue === 'knowledge') {
//     show_knowledge.value = true
//     show_files.value = false
//   }
// })

// 监听选中的文件和知识库变化，自动开启深度思考
watch([selectedFiles, selectedKbs], () => {
  const shouldForceThinking = checkShouldForceThinking()
  
  if (shouldForceThinking && !isThinking.value) {
    isThinking.value = true
    toast({
      title: "已自动开启深度思考",
      description: "使用知识库或上传文档时自动开启深度思考模式",
    })
  }
}, { deep: true })

// File upload handlers
const handleFileUpload = () => {
  fileInput.value?.click()
}

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return
  
  const newFiles = Array.from(target.files)
  handleFiles(newFiles, false)
  target.value = '' // Reset input
}

const handleFiles = async (newFiles: File[], isPastedImage: boolean = false) => {
  // Validate files
  if (newFiles.length > 6) {
    toast({
      title: "上传失败",
      description: "多文档问答的上限是6篇，如需处理更多文档，请创建知识库后再提问",
      variant: "destructive"
    })
    return
  }

  // Show upload dialog first
  showUploadDialog.value = true
  uploadingFiles.value = []
  
  // Reset parse dialog state
  showParseDialog.value = false
  uploadedFiles.value = []
  uploadCompleted.value = false
  parseMolecule.value = false

  const validFiles: File[] = []
  const formData = new FormData()

  // Validate all files first
  for (const file of newFiles) {
    // Check file type
    const file_type = (file.name.split('.').pop() || '').toLowerCase()
    if (!['pdf', 'jpg', 'jpeg', 'png', 'pdb', 'sdf', 'fasta', 'fst', 'pptx', 'docx', 'txt'].includes(file_type)) {
      toast({
        title: "上传失败",
        description: "仅支持PDF、JPEG、JPG、PNG、PDB、FASTA、SDF、PPTX、DOCX和TXT文件格式",
        variant: "destructive"
      })
      continue
    }

    // Check file size (150MB limit)
    if (file.size > 150 * 1024 * 1024) {
      toast({
        title: "上传失败", 
        description: "文件大小不能超过150MB",
        variant: "destructive"
      })
      continue
    }

    // Check duplicate filename
    if (files.value.some(f => f.title === file.name)) {
      // For image files, auto-rename with a numeric suffix
      if (['png', 'jpg', 'jpeg'].includes(file_type.toLowerCase())) {
        let counter = 1
        let newFilename = file.name
        // Keep incrementing counter until we find a unique name
        while (files.value.some(f => f.title === newFilename)) {
          const baseName = file.name.substring(0, file.name.lastIndexOf('.'))
          const extension = file.name.substring(file.name.lastIndexOf('.'))
          newFilename = `${baseName}_${counter}${extension}`
          counter++
        }
        // Create a new File object with the renamed file
        const renamedFile = new File([file], newFilename, { type: file.type })
        validFiles.push(renamedFile)
        formData.append('files', renamedFile)
        
        // Add file to uploadingFiles list with new name
        const fileItem = {
          title: newFilename,
          size: file.size,
          parseStatus: 1,
          parse_progress: 0,
          parseProgress: 0,
          progress: 0,
          progress_texts: [],
          raw: renamedFile
        }
        uploadingFiles.value.push(fileItem)
        files.value.unshift(fileItem)
        continue
      } else {
        toast({
          title: "上传失败",
          description: "文件名重复，请重新上传",
          variant: "destructive"
        })
        continue
      }
    }

    validFiles.push(file)
    formData.append('files', file)

    // Add file to uploadingFiles list
    const fileItem = {
      title: file.name,
      size: file.size,
      parseStatus: 1,
      parse_progress: 0,
      parseProgress: 0,
      progress: 0,
      progress_texts: [],
      raw: file
    }
    uploadingFiles.value.push(fileItem)
    files.value.unshift(fileItem)
  }

  if (validFiles.length === 0) {
    showUploadDialog.value = false
    return
  }

  // Upload all valid files together
  formData.append('folder_id', 'folder_for_question_channel')
  // 设置不自动解析，上传完成后让用户选择
  formData.append('close_parse', 'true')

  try {
    const response = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // 监听上传进度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          // 更新所有正在上传文件的进度
          validFiles.forEach(file => {
            const fileItem = uploadingFiles.value.find(f => f.title === file.name)
            if (fileItem) {
              fileItem.progress = Math.round(progress)
            }
          })
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } else {
          reject(new Error('Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))

      xhr.open('POST', '/api/v1/knowledge_base/upload?folder_id=folder_for_question_channel')  // 请替换为实际的上传 API 地址
      // xhr.setRequestHeader('Authorization', `Bearer ${store.token}`)  // 如果需要认证
      xhr.setRequestHeader('X-CSRF-TOKEN', getCookie('csrf_access_token'))
      xhr.send(formData)
    })

    show_files.value = true
    show_knowledge.value = false
    const name_id = response.data.name_id
    
    // Prepare uploaded files for parse dialog
    uploadedFiles.value = []
    for (const file of validFiles) {
      const docId = name_id.find((item: any) => item.name === file.name)?.docId
      const fileItem = files.value.find(f => f.title === file.name)
      const uploadingFileItem = uploadingFiles.value.find(f => f.title === file.name)
      
      // Create uploaded file item
      const uploadedFile = {
        title: file.name,
        size: file.size,
        parseStatus: 0, // 待解析
        parse_progress: 0,
        parseProgress: 0,
        progress: 100,
        progress_texts: [],
        docId: docId,
        raw: file
      }
      uploadedFiles.value.push(uploadedFile)
      
      // Update files list
      if (fileItem) {
        fileItem.parseStatus = 0 // 待解析状态
        fileItem.parse_progress = 0
        fileItem.progress_texts = []
        fileItem.docId = docId
      }
      if (uploadingFileItem) {
        uploadingFileItem.parseStatus = 0 // 待解析状态
        uploadingFileItem.parse_progress = 0
        uploadingFileItem.progress_texts = []
        uploadingFileItem.docId = docId
      }
    }
    
    // Close upload dialog
    showUploadDialog.value = false
    uploadCompleted.value = true
    
    // 检查是否需要自动开始解析
    const shouldAutoStartParsing = isPastedImage
    
    if (shouldAutoStartParsing) {
      // 粘贴图片或ldap环境下自动开始解析
      if (hasPdfFiles.value) {
        // 对于PDF文件，设置解析参数并直接开始解析
        parseMolecule.value = false // ldap环境不勾选分子解析
        // 确保uploadedFiles包含正确的文件信息
        uploadedFiles.value = validFiles.map(file => {
          const docId = name_id.find((item: any) => item.name === file.name)?.docId
          return {
            title: file.name,
            size: file.size,
            parseStatus: 0, // 待解析
            parse_progress: 0,
            parseProgress: 0,
            progress: 100,
            progress_texts: [],
            docId: docId,
            raw: file
          }
        })
        
        // 显示自动解析提示
        if (isPastedImage) {
          toast({
            title: "图片已上传",
            description: "正在自动解析图片内容...",
            variant: "default"
          })
        }
        
        await startParsing()
      } else {
        // 对于非PDF文件，直接开始解析
        // 确保uploadedFiles包含正确的文件信息
        uploadedFiles.value = validFiles.map(file => {
          const docId = name_id.find((item: any) => item.name === file.name)?.docId
          return {
            title: file.name,
            size: file.size,
            parseStatus: 0, // 待解析
            parse_progress: 0,
            parseProgress: 0,
            progress: 100,
            progress_texts: [],
            docId: docId,
            raw: file
          }
        })
        
        // 显示自动解析提示
        if (isPastedImage) {
          toast({
            title: "图片已上传",
            description: "正在自动解析图片内容...",
            variant: "default"
          })
        }
        
        await startParsingNonPdf()
      }
    } else {
      // 正常流程：只有PDF文件时才显示解析对话框
      if (hasPdfFiles.value) {
        showParseDialog.value = true
      } else {
        // For non-PDF files, directly start parsing without dialog
        await startParsingNonPdf()
      }
    }
    
    // 自动勾选上
    if (selectedKbs.value.length === 0) {
      // selectedFiles.value = 当前上传的files
      selectedFiles.value = uploadingFiles.value
    }
  } catch (error:any) {
    console.log(error)
    if (error.response?.status === 403 || error.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive"
      })
      return
    }
    // Mark all files as failed
    for (const file of validFiles) {
      const fileItem = files.value.find(f => f.title === file.name)
      const uploadingFileItem = uploadingFiles.value.find(f => f.title === file.name)
      if (fileItem) {
        fileItem.parseStatus = 3
      }
      if (uploadingFileItem) {
        uploadingFileItem.parseStatus = 3
      }
    }
    toast({
      title: "上传失败",
      description: "文件上传过程中发生错误",
      variant: "destructive"
    })
  }

  // Auto close dialog if all files uploaded successfully
  if (uploadingFiles.value.every(f => f.parseStatus === 2)) {
    setTimeout(() => {
      showUploadDialog.value = false
    }, 1000)
  }
}

const watch_status = (datalist:any) => {
  for (let i = 0; i < datalist.length; i++ ) {
    const docId = datalist[i].docId
    const name = datalist[i].name
    const item = files.value.find(item => item.title === name)
    if (!item) continue
    item.docId = docId
    // 启动状态查询 setinterval
    item.timer = setInterval(() => {
      get_doc_api(docId).then((doc_res:any) => {
        const it = files.value.find(item => item.docId === docId)
        if (!it) return
        it.parseStatus = doc_res.data.data.parseStatus
        it.progress_texts = doc_res.data.data.progress_texts
        it.parse_progress = doc_res.data.data.parse_progress
        it.type = doc_res.data.data.type
        if (doc_res.data.data?.img_id) {
          it.img_id = doc_res.data.data.img_id
        }
        if (doc_res.data.data?.download_url) {
          it.download_url = doc_res.data.data.download_url
        }
        if (doc_res.data.data?.download_key) {
          it.download_key = doc_res.data.data.download_key
        }
        if (doc_res.data.data.parseStatus != 1) {
          clearInterval(it.timer)
          it.timer = null
        }
      })
    }, 1000)
  }
}

const removeFile = (file: FileItem) => {
  // 清除定时器
  console.log('ss', file)
  // const fileInFiles = files.value.find(f => f.title === file.title)
  if (file.timer) {
    clearInterval(file.timer)
    file.timer = null
  }
  
  const index = selectedFiles.value.findIndex(f => f.title === file.title)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  }
}

const handleStop = () => {
  emit('stop')
}

const createChannelIfNeeded = async () => {
  const param = {
    name: messageText.value.slice(0, 50)
  }

  try {
    const res = await create_channel_api(param)
    if (res.data.success) {
      channel_id.value = res.data.data.id
      return true
    } else {
      toast({
        title: "创建频道失败",
        description: res.data.message,
        variant: "destructive"
      })
      return false
    }
  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive" 
      })
    } else {
      toast({
        title: "创建频道失败",
        description: "请稍后重试",
        variant: "destructive"
      })
    }
    return false
  }
}

const sendQuestion = async () => {
  if (!messageText.value.trim()) return

  // Check if login needed
  if (store.need_login) {
    router.push('/auth/sign-in')
    return
  }

  // Get selected doc IDs
  docIdList.value = selectedFiles.value
        .filter(file => file.parseStatus === 2)
        .map(file => file.docId)
        .filter((id): id is string => id !== undefined)

  try {
    // Create question params
    const questionParams = {
      question: messageText.value,
      channel_id: channel_id.value || store.channel_id,
      docIdList: docIdList.value || store.docIdList,
      user_id: store.user_id,
      docIdListKnowledge: [], // TODO: Add knowledge doc IDs if needed
      knowledgeCSAIDefault: false,
      client: 0, // TODO: Add LLM selection if needed
      kb_ids: selectedKbs.value.map(kb => kb.id),
      if_search_online: isOnline.value,
      search_type: searchType.value, // 'all'：全网搜索，'academic'：学术搜索
      if_thinking: isThinking.value,
      templateId: templateId.value,
      tools_name: Object.values(tools.value).flat().filter(tool => tool.enabled && !tool.ldap_disabled).map(tool => tool.value)
    }

    // Send question API request
    const res = await create_gpt_question_api(questionParams)

    if (res.data.success) {
      // Store channel info in global store
      store.docIdList = docIdList.value
      store.selectedKbs = selectedKbs.value
      store.isOnline = isOnline.value
      store.searchType = searchType.value
      store.question = messageText.value
      store.isThinking = isThinking.value
      store.isTemplateMode = isTemplateMode.value
      store.templateId = templateId.value
      store.templateName = templateName.value

      // Clear state
      messageText.value = ''
      docIdList.value = []
    } else {
      toast({
        title: "发送失败",
        description: res.data.message,
        variant: "destructive"
      })
    }

  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive" 
      })
    } else {
      toast({
        title: "发送失败", 
        description: "请稍后重试",
        variant: "destructive"
      })
    }
    throw err
  }
}

const check_knowledge = async () => {
  const params = {'folder_ids': [] as string[]}
  for (let i = 0; i < selectedKbs.value.length; i++) {
    params.folder_ids.push(selectedKbs.value[i].id)
  }
  try {
    const res = await check_folder_api(params)
    if (res.data.success) {
      return true
    } else {
      return false
    }
  } catch (err) {
    return false
  }
}

const handleSubmit = async () => {
  if (!messageText.value.trim()) return
  
  isLoading.value = true
  
  try {
    // Check file upload status
    // 如果parseStatus为1，则不发送
    if (selectedFiles.value.some(file => file.parseStatus === 1)) {
      toast({
        title: "无法发送",
        description: "文件正在解析中，请等待上传完成",
        variant: "destructive"
      })
      return
    }

    // 如果存在===3的文件，则不发送
    if (selectedFiles.value.some(file => file.parseStatus === 3)) {
      toast({
        title: "无法发送",
        description: "文件解析失败，请删除或重新上传",
        variant: "destructive"
      })
      return
    }
    // 检查知识库是否都解析完成
    const knowledge_parsed = await check_knowledge()
    if (!knowledge_parsed) {
      toast({
        title: "无法发送",
        description: "知识库解析中，请等待解析完成",
        variant: "destructive"
      })
      return
    }

    // Create channel if needed
    if (router.currentRoute.value.path !== '/channels') {
      const channelCreated = await createChannelIfNeeded()
      if (!channelCreated) {
        isLoading.value = false
        return
      }
    }
    // 关闭file和knowledge
    show_files.value = false
    show_knowledge.value = false

    // Send question
    await sendQuestion()
    
    // Clear input
    messageText.value = ''
    if (message_input_ref.value) {
      message_input_ref.value.messageInput = ''
    }
    // 判断当前route是否是/channels
    if (router.currentRoute.value.path !== '/channels') {
      router.push(
        '/channels?channel_id=' + channel_id.value + 
        '&closeSider=true'
      )
    } else {
      // 关闭侧边栏
      emit('closeSider')
    }
    
  } catch (error) {
    console.error('handleSubmit error', error)
    toast({
      title: "发送失败",
      description: "请稍后重试",
      variant: "destructive"
    })
  } finally {
    isLoading.value = false
    // 发送事件，通知父组件获取问题列表
    emit('get_questionlist')
  }
}

const checkFilesStatus = () => {
  const uploading = files.value.some(f => f.parseStatus === 1)

  if (uploading) {
    toast({
      title: "无法发送",
      description: "文件正在解析，请等待解析完成",
      variant: "destructive"
    })
    return false
  }
  
  return true
}

const removeKnowledge = (knowledge: KnowledgeBase) => {
  const index = selectedKbs.value.findIndex(kb => kb.id === knowledge.id)
  if (index > -1) {
    selectedKbs.value.splice(index, 1)
  }
}

const open_isLoading = () => {
  isLoading.value = true
}

const message_input_ref = ref<{
  searchTypeOwn: string
  messageInput: string
} | null>(null)

const recover_params = (params: any) => {
  update_docs(store.docIdList)
  selectedKbs.value = store.selectedKbs
  searchType.value = store.searchType
  isThinking.value = store.isThinking
  isTemplateMode.value = store.isTemplateMode || false
  templateId.value = store.templateId || null
  templateName.value = store.templateName || null
  if (message_input_ref.value) {
    message_input_ref.value.searchTypeOwn = store.searchType
  }
  isOnline.value = store.isOnline
}

const ask_question = (question: string) => {
  messageText.value = question
  handleSubmit()
}

const show_question = (question: string) => {
  messageText.value = question
  if (message_input_ref.value) {
    message_input_ref.value.messageInput = question
  }
}

const open_template_dialog = () => {
  showTemplateDialog.value = true
}

const close_isLoading = () => {
  isLoading.value = false
}

const clear_state = () => {
  files.value = []
  selectedFiles.value = []
  selectedKbs.value = []
  docIdList.value = []
  messageText.value = ''
  isLoading.value = false
  isOnline.value = true
  isThinking.value = true
  searchType.value = 'all'
  store.docIdList = []
  store.selectedKbs = []
  store.searchType = 'all'
  store.isOnline = true
  store.isThinking = true
  store.question = ''
}

const getsmiles = async() => {
  await init_ketcher_module('idKetcher')
  console.log('ketcher', (window as any).ketcher)
  ;(window as any).ketcher.getSmiles()
    .then((res: string) => {
      console.log('ketcher', res)
      messageText.value = res
      if (message_input_ref.value) {
        message_input_ref.value.messageInput = res
      }
      showChemicalEditor.value = false
    })
    .catch((e: any) => {
      console.log('ketcher error', e)
      toast({
        title: "获取SMILES失败",
        description: "获取SMILES失败" + e,
        variant: "destructive"
      })
    })
}

const uploadFasta = async() => {
  if (!fastaContent.value.trim()) {
    toast({
      title: "请输入FASTA序列",
      description: "请先粘贴FASTA序列内容",
      variant: "destructive"
    })
    return
  }

  // 检查文件数量限制
  if (files.value.length >= 6) {
    toast({
      title: "上传失败",
      description: "多文档问答的上限是6篇，如需处理更多文档，请创建知识库后再提问",
      variant: "destructive"
    })
    return
  }

  fastaUploading.value = true
  
  try {
    // 创建一个虚拟的File对象
    const timestamp = Date.now()
    const filename = `fasta_${timestamp}.fasta`
    const blob = new Blob([fastaContent.value], { type: 'text/plain' })
    const file = new File([blob], filename, { type: 'text/plain' })
    
    // 检查文件名重复
    if (files.value.some(f => f.title === filename)) {
      toast({
        title: "上传失败",
        description: "文件名重复，请重试",
        variant: "destructive"
      })
      return
    }

    // 创建FormData，使用与handleFiles相同的格式
    const formData = new FormData()
    formData.append('files', file)
    formData.append('folder_id', 'folder_for_question_channel')
    formData.append('close_parse', 'true')
    
    // 创建文件项并添加到列表
    const fileItem: FileItem = {
      title: filename,
      size: blob.size,
      parseStatus: 1, // 上传中
      parse_progress: 0,
      parseProgress: 0,
      progress: 0,
      progress_texts: [],
      raw: file,
      type: 1
    }
    
    files.value.unshift(fileItem)
    uploadingFiles.value.push(fileItem)
    
    // 显示上传对话框
    showUploadDialog.value = true
    
    // 使用与handleFiles相同的上传方式
    const response = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // 监听上传进度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          fileItem.progress = Math.round(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } else {
          reject(new Error('Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))

      xhr.open('POST', '/api/v1/knowledge_base/upload?folder_id=folder_for_question_channel')
      xhr.setRequestHeader('X-CSRF-TOKEN', getCookie('csrf_access_token'))
      xhr.send(formData)
    })
    
    // 处理上传响应
    if (response.data.name_id) {
      const name_id = response.data.name_id
      const docId = name_id.find((item: any) => item.name === filename)?.docId
      
      // 更新文件状态
      fileItem.parseStatus = 0 // 待解析
      fileItem.docId = docId
      fileItem.progress = 100
      
      // 开始监控解析状态
      if (docId) {
        watch_status([{ docId, name: filename }])
      }
      
      // 自动选中文件
      if (selectedKbs.value.length === 0) {
        selectedFiles.value.push(fileItem)
      }
      
      // 切换到文件标签页
      show_files.value = true
      show_knowledge.value = false
      
      toast({
        title: "上传成功",
        description: `FASTA文件 ${filename} 上传成功，正在解析...`
      })
      
      // 清空内容并关闭弹窗
      fastaContent.value = ''
      showChemicalEditor.value = false
    } else {
      throw new Error('No docId in response')
    }
    
  } catch (error: any) {
    console.error('上传FASTA失败:', error)
    
    // 标记文件上传失败
    const fileItem = files.value.find(f => f.title.startsWith('fasta_'))
    if (fileItem) {
      fileItem.parseStatus = 3
    }
    
    toast({
      title: "上传失败",
      description: "网络错误，请重试",
      variant: "destructive"
    })
  } finally {
    fastaUploading.value = false
    showUploadDialog.value = false
    uploadingFiles.value = []
  }
}

const startParsing = async () => {
  if (uploadedFiles.value.length === 0) return
  
  parseLoading.value = true
  try {
    const formData = new FormData()
    formData.append('docIds', uploadedFiles.value.map(file => file.docId).filter(Boolean).join(','))
    formData.append('mol_detect', parseMolecule.value ? 'true' : 'false')
    let res = null
    res = await parse_knowledge_api(formData)

    if (res.data.status) {
      toast({
        title: "解析已开始",
        description: "正在解析文档内容..."
      })
      
      // Update file status to parsing
      uploadedFiles.value.forEach(file => {
        const fileItem = files.value.find(f => f.docId === file.docId)
        const uploadingFileItem = uploadingFiles.value.find(f => f.docId === file.docId)
        if (fileItem) {
          fileItem.parseStatus = 1 // 解析中
        }
        if (uploadingFileItem) {
          uploadingFileItem.parseStatus = 1 // 解析中
        }
      })
      
      // Start watching parse status
      const name_id = uploadedFiles.value.map(file => ({ 
        docId: file.docId, 
        name: file.title 
      })).filter(item => item.docId)
      watch_status(name_id)
      
      // Clean up parse dialog state (but don't remove files since parsing started)
      showParseDialog.value = false
      uploadCompleted.value = false
      parseMolecule.value = false
      uploadedFiles.value = []
      parseLoading.value = false
    } else {
      toast({
        title: "解析失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    toast({
      title: "解析失败",
      description: "网络错误，请重试",
      variant: "destructive"
    })
    console.error(err)
  } finally {
    parseLoading.value = false
  }
}

const startParsingNonPdf = async () => {
  // For non-PDF files, start parsing immediately (original logic)
  const nonPdfFiles = uploadedFiles.value.filter(file => !file.title.toLowerCase().endsWith('.pdf'))
  
  if (nonPdfFiles.length > 0) {
    // Update file status to parsing for non-PDF files
    nonPdfFiles.forEach(file => {
      const fileItem = files.value.find(f => f.docId === file.docId)
      const uploadingFileItem = uploadingFiles.value.find(f => f.docId === file.docId)
      if (fileItem) {
        fileItem.parseStatus = 1 // 解析中
      }
      if (uploadingFileItem) {
        uploadingFileItem.parseStatus = 1 // 解析中
      }
    })
    
    // Start watching parse status for non-PDF files
    const name_id = nonPdfFiles.map(file => ({ 
      docId: file.docId, 
      name: file.title 
    })).filter(item => item.docId)
    
    if (name_id.length > 0) {
      watch_status(name_id)
    }
  }
  
  // Clean up
  uploadedFiles.value = []
  uploadCompleted.value = false
}

const handleParseDialogClose = (open: boolean) => {
  if (!open && showParseDialog.value && uploadedFiles.value.length > 0) {
    // User closed dialog without starting parsing, remove PDF files
    removePendingPdfFiles()
  }
  showParseDialog.value = open
}

const removePendingPdfFiles = () => {
  const pdfFiles = uploadedFiles.value.filter(file => file.title.toLowerCase().endsWith('.pdf'))
  
  if (pdfFiles.length > 0) {
    // Remove PDF files from files list
    pdfFiles.forEach(pdfFile => {
      // Remove from files list
      const fileIndex = files.value.findIndex(f => f.docId === pdfFile.docId)
      if (fileIndex > -1) {
        // Clear timer if exists
        if (files.value[fileIndex].timer) {
          clearInterval(files.value[fileIndex].timer)
        }
        files.value.splice(fileIndex, 1)
      }
      
      // Remove from selectedFiles if it exists there
      const selectedIndex = selectedFiles.value.findIndex(f => f.docId === pdfFile.docId)
      if (selectedIndex > -1) {
        selectedFiles.value.splice(selectedIndex, 1)
      }
      
      // Remove from uploadingFiles if it exists there
      const uploadingIndex = uploadingFiles.value.findIndex(f => f.docId === pdfFile.docId)
      if (uploadingIndex > -1) {
        uploadingFiles.value.splice(uploadingIndex, 1)
      }
    })
    
    toast({
      title: "已取消",
      description: `已删除 ${pdfFiles.length} 个未解析的PDF文件`,
      variant: "default"
    })
  }
  
  // Clean up
  uploadedFiles.value = []
  uploadCompleted.value = false
  parseMolecule.value = false
  parseLoading.value = false
}

const closeParseDialog = () => {
  showParseDialog.value = false
  uploadCompleted.value = false
  parseMolecule.value = false
  uploadedFiles.value = []
  parseLoading.value = false
}

const toggleTools = () => {
  Object.values(tools.value).flat().forEach(tool => {
    tool.enabled = !isToolsOpen.value
  })
  isToolsOpen.value = !isToolsOpen.value
}

// 氨基酸颜色映射
const aminoAcidColors = {
  // 疏水性氨基酸 - 红色系
  'A': '#FF6B6B', 'V': '#FF6B6B', 'I': '#FF6B6B', 'L': '#FF6B6B', 
  'M': '#FF6B6B', 'F': '#FF6B6B', 'W': '#FF6B6B', 'Y': '#FF6B6B',
  // 极性氨基酸 - 青色系
  'S': '#4ECDC4', 'T': '#4ECDC4', 'N': '#4ECDC4', 'Q': '#4ECDC4',
  // 碱性氨基酸 - 蓝色系
  'K': '#45B7D1', 'R': '#45B7D1', 'H': '#45B7D1',
  // 酸性氨基酸 - 橙色系
  'D': '#FFA07A', 'E': '#FFA07A',
  // 特殊氨基酸 - 绿色系
  'G': '#98D8C8', 'P': '#98D8C8', 'C': '#98D8C8'
}

// DNA碱基颜色映射
const dnaBaseColors = {
  'A': '#FF6B6B', // 腺嘌呤 - 红色
  'T': '#4ECDC4', // 胸腺嘧啶 - 青色
  'G': '#45B7D1', // 鸟嘌呤 - 蓝色
  'C': '#FFA07A', // 胞嘧啶 - 橙色
  'U': '#98D8C8'  // 尿嘧啶 (RNA) - 绿色
}

// 检测序列类型
const detectSequenceType = (sequence: string) => {
  const cleanSeq = sequence.replace(/[^A-Za-z]/g, '').toUpperCase()
  if (cleanSeq.length === 0) return 'unknown'
  
  // 统计各种字符的出现次数
  const dnaChars = cleanSeq.split('').filter(char => 'ATGCU'.includes(char)).length
  const proteinChars = cleanSeq.split('').filter(char => 'ACDEFGHIKLMNPQRSTVWY'.includes(char)).length
  
  // 如果序列只包含DNA/RNA字符，且至少有一个T或U，则认为是DNA/RNA
  if (dnaChars === cleanSeq.length && (cleanSeq.includes('T') || cleanSeq.includes('U'))) {
    return 'dna'
  }
  
  // 如果序列包含蛋白质特有的氨基酸，则认为是蛋白质
  if (cleanSeq.split('').some(char => 'DEFHIKLMNPQRSVWY'.includes(char))) {
    return 'protein'
  }
  
  // 其他情况默认为蛋白质
  return 'protein'
}

// 格式化FASTA序列，添加颜色
const formatFastaSequence = (fastaText: string) => {
  if (!fastaText.trim()) return ''
  
  const lines = fastaText.trim().split('\n')
  let currentSequence = ''
  let sequenceType = 'unknown'
  
  const formattedLines = lines.map(line => {
    const trimmedLine = line.trim()
    
    // 如果是序列名称行（以>开头）
    if (trimmedLine.startsWith('>')) {
      return `<div class="font-bold text-purple-600 mb-1">${trimmedLine}</div>`
    }
    
    // 如果是序列内容行
    if (trimmedLine.length > 0) {
      // 累积序列内容用于类型检测
      currentSequence += trimmedLine
      sequenceType = detectSequenceType(currentSequence)
      
      const coloredSequence = trimmedLine.split('').map(char => {
        const upperChar = char.toUpperCase()
        let color = ''
        
        // 根据序列类型选择颜色映射
        if (sequenceType === 'dna') {
          color = dnaBaseColors[upperChar as keyof typeof dnaBaseColors] || ''
        } else {
          color = aminoAcidColors[upperChar as keyof typeof aminoAcidColors] || ''
        }
        
        if (color) {
          return `<span style="color: ${color}; font-weight: bold; background-color: ${color}20; padding: 1px 2px; border-radius: 2px;">${char}</span>`
        } else if (char.match(/[A-Za-z]/)) {
          // 未知字符，用灰色显示
          return `<span style="color: #999; background-color: #f0f0f0; padding: 1px 2px; border-radius: 2px;">${char}</span>`
        } else {
          // 非字母字符（如空格、数字等）
          return char
        }
      }).join('')
      
      return `<div class="mb-1 leading-relaxed">${coloredSequence}</div>`
    }
    
    return ''
  }).filter(line => line !== '')
  
  return formattedLines.join('')
}

// 获取当前序列类型用于UI显示
const getCurrentSequenceType = () => {
  if (!fastaContent.value.trim()) return 'unknown'
  const sequenceLines = fastaContent.value.trim().split('\n').filter(line => !line.startsWith('>'))
  const sequence = sequenceLines.join('')
  return detectSequenceType(sequence)
}

// 监听化学编辑器弹窗关闭，重置状态
watch(showChemicalEditor, (newValue) => {
  if (!newValue) {
    // 弹窗关闭时重置状态
    chemicalEditorTab.value = 'fasta'
    fastaContent.value = ''
    fastaUploading.value = false
    isIframeLoading.value = true
  }
})

defineExpose({
  open_isLoading,
  close_isLoading,
  recover_params,
  clear_state,
  ask_question,
  show_question,
  show_knowledge,
  show_files,
  currentTab,
  open_template_dialog,
  handleFiles: (files: File[]) => handleFiles(files, false)
})

// Add drag event handlers
const handleDragOver = (e: DragEvent) => {
  isDragging.value = true
  e.dataTransfer!.dropEffect = 'copy'
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const droppedFiles = Array.from(e.dataTransfer?.files || [])
  handleFiles(droppedFiles, false)
}

// Add this function before component is unmounted
onBeforeUnmount(() => {
  // Clear all active timers
  files.value.forEach(file => {
    if (file.timer) {
      clearInterval(file.timer)
      file.timer = null
    }
  })
})

const handlePastedFile = (file: File) => {
  // 检查是否是图片文件
  const isImage = file.type.startsWith('image/')
  handleFiles([file], isImage)
}

// Add shared knowledge folders state
const sharedKnowledgeFolders = ref<KnowledgeBase[]>([])
const shareFolderPage = ref(1)
const shareFolderSize = ref(100)

// Function to fetch shared knowledge folders
const fetchSharedKnowledgeFolders = async () => {
  try {
    const share_param = {
      page: shareFolderPage.value,
      size: shareFolderSize.value,
      sort: '-createTime' // Default sort by newest first
    }
    const share_res = await get_share_folder_api(share_param)
    if (share_res.data.success) {
      // Add isShared property to identify these as shared knowledge bases
      sharedKnowledgeFolders.value = share_res.data.data.items.map((item: any) => ({
        ...item,
        isShared: true
      }))
    }
  } catch (error) {
    console.error("Failed to load shared knowledge folders:", error)
  }
}

// Fetch shared knowledge folders when component is mounted
onMounted(() => {
  fetchSharedKnowledgeFolders()
})

</script>

<style lang="scss">
.drag-over {
  @apply border-2 border-dashed border-primary bg-primary/5;
}
</style>
