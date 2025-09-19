<template>
  <div>
    <Label for="message" class="sr-only">Message</Label>
    <Textarea
      id="message"
      v-model="messageInput"
      @compositionstart="isComposing = true"
      @compositionend="isComposing = false"
      placeholder="输入您的问题..."
      class="resize-none border-0 p-3 shadow-none focus-visible:ring-0"
      :class="{'min-h-[100px]': props.height === 'high', 'min-h-12': props.height === 'normal'}"
      @keydown="handleKeyDown"
      @paste="handlePaste"
      :disabled="isLoading"
    />
    <div class="flex items-center p-3 pt-0">
      <!-- 深度思考按钮 -->
      <TooltipProvider :delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button 
              variant="outline" 
              size="sm" 
              @click="$emit('toggle-thinking')" 
              class="gap-1.5 mr-2 bg-gray-100"
              :class="{
                'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100': isThinking,
                'opacity-50 cursor-not-allowed': shouldForceThinking && isThinking
              }"
              :disabled="shouldForceThinking && isThinking"
            >
              <Brain class="size-4" />
              <span class="hidden sm:inline">{{ isThinking ? '深度思考' : '快速回答' }}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span v-if="shouldForceThinking && isThinking">
              使用知识库或上传文档时必须开启深度思考
            </span>
            <span v-else>
              {{ isThinking ? '开启深度思考模式，分析更全面但耗时较长' : '快速回答模式，响应更快' }}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider :delay-duration="300">
        <Tooltip>
          <TooltipTrigger as-child>
            <!-- 当已选择模版时显示模版信息和取消按钮 -->
            <div v-if="isTemplateMode && templateName" class="flex items-center gap-1 mr-2">
              <Button
                variant="outline"
                size="sm"
                class="gap-1.5 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                @click="$emit('toggle-template')"
              >
                <FileText class="size-4" />
                <span class="hidden sm:inline">{{ templateName }}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-blue-600 hover:text-red-600 hover:bg-red-50"
                @click="$emit('clear-template')"
              >
                <X class="size-4" />
              </Button>
            </div>
            <!-- 未选择模版时显示选择按钮 -->
            <Button
              v-else
              variant="ghost"
              size="sm"
              class="mr-2 gap-1.5"
              :class="{'bg-blue-100': isTemplateMode, 'hover:bg-blue-100': isTemplateMode, 'bg-gray-100': !isTemplateMode, 'hover:bg-gray-100': !isTemplateMode}"
              @click="$emit('toggle-template')"
            >
              <FileText class="size-4" />
              <span class="hidden sm:inline">{{ !isTemplateMode ? '已关闭模版' : '模版输出' }}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span v-if="isTemplateMode && templateName">
              当前模版：{{ templateName }}，点击可重新选择或点击 × 取消
            </span>
            <span v-else>
              按照模版格式输出回答，支持上传自定义docx模版或选择示例模版
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div class="flex items-center gap-2 ml-auto">

        <!-- 增加化学编辑器的按钮，点击后打开化学编辑器 -->
        <TooltipProvider :delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button 
                variant="outline" 
                size="sm" 
                @click="$emit('chemical-editor')" 
                class="gap-1.5"
              >
                <Atom class="size-4" />
                <span class="hidden sm:inline">分子编辑器</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              分子编辑器
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider :delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button 
                variant="outline" 
                size="sm" 
                @click="$emit('file-upload')" 
                class="gap-1.5"
                :disabled="isLoading"
              >
                <Paperclip class="size-4" />
                <span class="hidden sm:inline">文件</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              支持拖拽上传PDF,图片,PDB和SDF文件
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button 
          type="submit" 
          size="sm" 
          class="gap-1.5"
          :variant="isLoading ? 'destructive' : 'default'"
          @click="handleButtonClick"
        >
          <span v-if="isLoading">停止</span>
          <span v-else>发送</span>
          <CornerDownLeft v-if="!isLoading" class="size-3.5" />
          <X v-else class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Paperclip, CornerDownLeft, X, Brain, Atom, Wrench, Search, Code, ScrollText, Dna, Microscope, FileText } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Tool {
  id: string
  icon: keyof typeof iconMap
  label: string
  enabled: boolean
  ldap_disabled?: boolean
}

interface Tools {
  [key: string]: Tool[]
}

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

const props = defineProps<{
  messageText: string
  isLoading: boolean
  isOnline: boolean
  isThinking: boolean
  isTemplateMode: boolean
  isToolsOpen: boolean
  searchType: string
  height: string
  tools: Tools
  templateName?: string
  selectedFiles?: FileItem[]
  selectedKbs?: KnowledgeBase[]
}>()

const emit = defineEmits<{
  'update:messageText': [value: string]
  'update:searchType': [value: string]
  'update:tools': [value: Tools]
  'toggle-network': []
  'toggle-thinking': []
  'toggle-tools': []
  'file-upload': []
  'submit': []
  'stop': []
  'chemical-editor': []
  'file-pasted': [file: File]
  'toggle-template': []
  'clear-template': []
}>()

// 计算是否应该强制开启深度思考
const shouldForceThinking = computed(() => {
  // 检查是否选择了知识库
  const hasSelectedKbs = props.selectedKbs && props.selectedKbs.length > 0
  
  // 检查是否上传了需要强制深度思考的文件类型
  const hasRequiredFiles = props.selectedFiles && props.selectedFiles.some(file => {
    const fileName = file.title.toLowerCase()
    return fileName.endsWith('.pdf') || 
           fileName.endsWith('.docx') || 
           fileName.endsWith('.pptx') || 
           fileName.endsWith('.txt')
  })
  
  return hasSelectedKbs || hasRequiredFiles
})

const if_ldap = ref(false)
if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

const messageInput = ref('')
const isComposing = ref(false)
const searchTypeOwn = ref('all')
const isHoverCardOpen = ref(false)
const hoverCardCloseTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

// Create an object that maps icon names to components
const iconMap = {
  Search,
  Code,
  Brain,
  Wrench,
  Atom,
  Paperclip,
  ScrollText,
  Dna,
  Microscope,
  FileText,
  // Add any other icons you might use in tools
} as const

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !isComposing.value && !e.ctrlKey) {
    e.preventDefault()
    emit('update:searchType', searchTypeOwn.value)
    emit('update:messageText', messageInput.value)
    // messageInput.value = ''
    emit('submit')
  } else if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    messageInput.value += '\n\n'
  }
}

const handleButtonClick = () => {
  if (props.isLoading) {
    emit('stop')
  } else {
    emit('update:searchType', searchTypeOwn.value)
    emit('update:messageText', messageInput.value)
    // messageInput.value = ''
    emit('submit')
  }
}

const handlePaste = (e: ClipboardEvent) => {
  // Check if clipboard has images
  if (e.clipboardData?.items) {
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          // Emit event to parent component to handle the image
          emit('file-pasted', file)
          return
        }
      }
    }
  }

  // Handle text paste as before
  const text = e.clipboardData?.getData('text/plain') || ''
  const cleanedText = text.replace(/<[^>]*>?/gm, '')
  const target = e.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd
  const newValue = props.messageText.substring(0, start) + cleanedText + props.messageText.substring(end)
  emit('update:messageText', newValue)
}

const handleToolClick = (tool: Tool) => {
  // Create a new copy of the tools array
  const updatedTools = { ...props.tools };
  const category = Object.keys(updatedTools).find(key => 
    updatedTools[key]?.some((t: Tool) => t.id === tool.id)
  );
  
  if (category && updatedTools[category]) {
    updatedTools[category] = updatedTools[category].map((t: Tool) => {
      if (t.id === tool.id) {
        // Toggle enabled property for the clicked tool
        return { ...t, enabled: !t.enabled };
      }
      return t;
    });
  }
  
  // Emit the updated array
  emit('update:tools', updatedTools);
}

const toggleTools = () => {
  emit('toggle-tools')
  isHoverCardOpen.value = true
}

const onMouseLeave_hovercard = () => {
  hoverCardCloseTimeout.value = setTimeout(() => {
    isHoverCardOpen.value = false
  }, 700)
}

const onMouseEnterContent = () => {
  console.log('onMouseEnterContent')
  if (hoverCardCloseTimeout.value !== null) {
    clearTimeout(hoverCardCloseTimeout.value)
    hoverCardCloseTimeout.value = null
  }
}

const onMouseLeaveContent = () => {
  onMouseLeave_hovercard()
}

defineExpose({
  searchTypeOwn,
  messageInput
})
</script> 
