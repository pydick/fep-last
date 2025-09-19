<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <FileText class="size-5" />
          选择输出模版
        </DialogTitle>
        <DialogDescription>
          选择示例模版或上传自定义docx文件，AI将按照模版格式生成回答
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- 模版类型选择 -->
        <div class="space-y-4">
          <Label class="text-base font-medium">模版选择</Label>
          <Tabs v-model="templateType" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="examples">示例模版</TabsTrigger>
              <TabsTrigger value="upload">上传模版</TabsTrigger>
            </TabsList>

            <!-- 示例模版选择 -->
            <TabsContent value="examples" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="template in exampleTemplates" 
                  :key="template.id"
                  class="border rounded-lg p-4 transition-all"
                  :class="{
                    'ring-2 ring-primary': selectedTemplate?.id === template.id && template.docId,
                    'cursor-pointer hover:shadow-md': template.docId,
                    'cursor-not-allowed opacity-50': !template.docId,
                    'bg-gray-50': !template.docId
                  }"
                  @click="template.docId ? selectTemplate(template) : null"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <FileText class="size-5" :class="template.docId ? 'text-primary' : 'text-gray-400'" />
                      <h3 class="font-medium" :class="template.docId ? '' : 'text-gray-500'">{{ template.name }}</h3>
                      <Badge v-if="!template.docId" variant="secondary" class="text-xs text-gray-500 bg-gray-200">
                        暂不可用
                      </Badge>
                    </div>
                    <Button
                      v-if="template.downloadUrl && template.docId"
                      variant="ghost"
                      size="sm"
                      @click.stop="downloadTemplate(template)"
                      class="opacity-60 hover:opacity-100"
                    >
                      <Download class="size-4" />
                    </Button>
                  </div>
                  <p class="text-sm text-muted-foreground mb-3">{{ template.description }}</p>
                </div>
              </div>
            </TabsContent>

            <!-- 上传自定义模版 -->
            <TabsContent value="upload" class="space-y-4">
              <div class="space-y-4">
                <!-- 文件上传区域 -->
                <div 
                  class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4 transition-colors hover:border-muted-foreground/50"
                  :class="{'border-primary bg-primary/5': isDragging}"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                  @click="uploadInput?.click()"
                >
                  <div class="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Upload class="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p class="text-base font-medium">拖拽文件到此处或点击上传</p>
                    <p class="text-sm text-muted-foreground">仅支持 .docx 格式文件，最大 50MB</p>
                  </div>
                </div>

                <!-- 隐藏的文件上传输入 -->
                <input 
                  ref="uploadInput"
                  type="file"
                  class="hidden"
                  accept=".docx"
                  @change="handleFileSelect"
                />

                <!-- 上传的文件显示 -->
                <div v-if="uploadedTemplate" class="border rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText class="size-5 text-primary" />
                      </div>
                      <div>
                        <p class="font-medium">{{ uploadedTemplate.name }}</p>
                        <p class="text-sm text-muted-foreground">
                          {{ formatFileSize(uploadedTemplate.size) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <div v-if="uploadStatus === 'uploading'" class="flex items-center gap-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span class="text-sm">上传中...</span>
                      </div>
                      <div v-else-if="uploadStatus === 'success' && uploadedTemplate?.parseStatus === 1" class="flex items-center gap-2 text-blue-600">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span class="text-sm">解析中 {{ uploadedTemplate?.parseProgress || 0 }}%</span>
                      </div>
                      <div v-else-if="uploadStatus === 'success' && uploadedTemplate?.parseStatus === 2" class="flex items-center gap-2 text-green-600">
                        <Check class="size-4" />
                        <span class="text-sm">解析完成</span>
                      </div>
                      <div v-else-if="uploadStatus === 'success' && uploadedTemplate?.parseStatus === 3" class="flex items-center gap-2 text-red-600">
                        <X class="size-4" />
                        <span class="text-sm">解析失败</span>
                      </div>
                      <div v-else-if="uploadStatus === 'error'" class="flex items-center gap-2 text-red-600">
                        <X class="size-4" />
                        <span class="text-sm">上传失败</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="removeUploadedTemplate"
                      >
                        <Trash2 class="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          取消
        </Button>
        <Button 
          @click="confirmSelection"
          :disabled="!canConfirmSelection"
        >
          确认选择
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Upload, Download, Check, X, Trash2 } from 'lucide-vue-next'
import { toast } from '@/components/ui/toast'
// @ts-ignore
import { get_doc_api } from '@/api/common.js'

interface ExampleTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  downloadUrl: string
  docId: string | null
}

interface UploadedTemplate {
  name: string
  size: number
  file: File
  docId?: string
  parseStatus?: number // 0: 待解析, 1: 解析中, 2: 解析完成, 3: 解析失败
  parseProgress?: number
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'template-selected': [templateId: string, templateName: string]
  'template-cleared': []
}>()

const templateType = ref('examples')
const selectedTemplate = ref<ExampleTemplate | null>(null)
const uploadedTemplate = ref<UploadedTemplate | null>(null)
const uploadStatus = ref<'idle' | 'uploading' | 'success' | 'error'>('idle')
const isDragging = ref(false)
const uploadInput = ref<HTMLInputElement>()
const parseTimer = ref<ReturnType<typeof setInterval> | null>(null)
const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

// 判断是否可以确认选择
const canConfirmSelection = computed(() => {
  if (selectedTemplate.value) {
    // 示例模版需要有 docId 才能选择
    return !!selectedTemplate.value.docId
  }
  if (uploadedTemplate.value) {
    // 只有解析完成(状态为2)且有docId才允许选择
    return uploadedTemplate.value.parseStatus === 2 && !!uploadedTemplate.value.docId
  }
  return false
})

// 示例模版数据
const exampleTemplates: ExampleTemplate[] = [
  {
    id: 'project-research-report',
    name: '产品信息调研报告输出模版',
    description: '基于非专利药立项调研模板，生成结构化的产品调研报告',
    tags: ['立项', '调研', '产品信息'],
    downloadUrl: '/examples/产品信息调研报告输出模版.docx',
    docId: '248639394386830549188993334421974705399'
  },
  {
    id: 'research-report',
    name: '靶点调研模版',
    description: '适用于靶点调研、药物发现等详细报告',
    tags: ['靶点', '调研', '药物'],
    downloadUrl: '/examples/靶点调研模版.docx',
    docId: '10502768986010758793708493208179823394'
  },
  {
    id: 'project-evaluation',
    name: '项目立项评估模版',
    description: '根据用户上传的项目立项材料，生成结构化的项目立项评估报告',
    tags: ['项目', '立项', '评估'],
    downloadUrl: '/examples/项目立项评估模版.docx',
    docId: '13195906043847926582596082419938584192'
  },
  {
    id: 'milestone-evaluation',
    name: '关键节点项目评估模版',
    description: '根据用户上传的关键节点项目评估材料，生成结构化的项目评估报告',
    tags: ['关键节点', '项目评估', '里程碑'],
    downloadUrl: '/examples/关键节点项目评估模版.docx',
    docId: '708672566175231990880360187668246183'
  },
  {
    id: 'competitive-analysis',
    name: '关键竞品的差异化分析模版',
    description: '根据用户输入的信息，生成结构化的差异化分析报告',
    tags: ['竞品分析', '差异化', '市场分析'],
    downloadUrl: '/examples/关键竞品的差异化分析报告模版.docx',
    docId: '3835326437495474490612387416427147398'
  }
]

if (if_ldap.value) {
  exampleTemplates[0].docId = '325778451705368106961250666048732116079'
  exampleTemplates[1].docId = '2507627616283571681816425772369766376'
  exampleTemplates[2].docId = '264934883269764116744937011851153192228'
  exampleTemplates[3].docId = '337545720599270079843655774144700649871'
  exampleTemplates[4].docId = '96223395793727970245733518005030399681'
}

const selectTemplate = (template: ExampleTemplate) => {
  selectedTemplate.value = template
  uploadedTemplate.value = null
}

const downloadTemplate = async (template: ExampleTemplate) => {
  if (!template.downloadUrl) {
    toast({
      title: "暂未开放",
      description: "该模版还在开发中，敬请期待",
      variant: "destructive"
    })
    return
  }

  try {
    toast({
      title: "下载开始",
      description: `正在下载 ${template.name}...`,
    })

    // 使用fetch获取文件，对中文文件名进行编码
    const encodedUrl = encodeURI(template.downloadUrl)
    const response = await fetch(encodedUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // 获取文件内容作为blob
    const blob = await response.blob()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${template.name}.docx`
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "下载完成",
      description: `${template.name} 下载完成`,
    })
  } catch (error) {
    console.error('Download error:', error)
    toast({
      title: "下载失败",
      description: "请检查文件是否存在或稍后重试",
      variant: "destructive"
    })
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    handleFile(target.files[0])
  }
}

const handleFile = async (file: File) => {
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.docx')) {
    toast({
      title: "文件格式错误",
      description: "仅支持 .docx 格式文件",
      variant: "destructive"
    })
    return
  }

  // 验证文件大小 (50MB)
  if (file.size > 50 * 1024 * 1024) {
    toast({
      title: "文件过大",
      description: "文件大小不能超过 50MB",
      variant: "destructive"
    })
    return
  }

  uploadedTemplate.value = {
    name: file.name,
    size: file.size,
    file: file,
    parseStatus: 0, // 待解析
    parseProgress: 0
  }
  
  selectedTemplate.value = null
  await uploadTemplateFile(file)
}

const uploadTemplateFile = async (file: File) => {
  uploadStatus.value = 'uploading'
  
  try {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('folder_id', 'folder_for_template')
    formData.append('close_parse', 'false')
    formData.append('is_template', 'true')

    const response = await fetch('/api/v1/knowledge_base/upload?folder_id=folder_for_template', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': getCookie('csrf_access_token')
      },
      body: formData
    })

    const result = await response.json()
    
    if (result.success && result.data.name_id) {
      const docId = result.data.name_id.find((item: any) => item.name === file.name)?.docId
      if (uploadedTemplate.value) {
        uploadedTemplate.value.docId = docId
        uploadedTemplate.value.parseStatus = 1 // 解析中
      }
      uploadStatus.value = 'success'
      
      toast({
        title: "上传成功",
        description: "模版文件上传成功，正在解析...",
      })
      
      // 开始监控解析状态
      if (docId) {
        watchParseStatus(docId, file.name)
      }
    } else {
      throw new Error('Upload failed')
    }
  } catch (error) {
    uploadStatus.value = 'error'
    toast({
      title: "上传失败",
      description: "请稍后重试",
      variant: "destructive"
    })
  }
}

const removeUploadedTemplate = () => {
  // 清除解析定时器
  if (parseTimer.value) {
    clearInterval(parseTimer.value)
    parseTimer.value = null
  }
  
  uploadedTemplate.value = null
  uploadStatus.value = 'idle'
  if (uploadInput.value) {
    uploadInput.value.value = ''
  }
}

const confirmSelection = () => {
  let templateDocId = ''
  let templateName = ''
  
  if (selectedTemplate.value) {
    if (!selectedTemplate.value.docId) {
      toast({
        title: "无法选择模版",
        description: "该示例模版暂不可用，请选择其他模版或上传自定义模版",
        variant: "destructive"
      })
      return
    }
    templateDocId = selectedTemplate.value.docId
    templateName = selectedTemplate.value.name
  } else if (uploadedTemplate.value && uploadedTemplate.value.docId && uploadedTemplate.value.parseStatus === 2) {
    templateDocId = uploadedTemplate.value.docId
    templateName = uploadedTemplate.value.name
  } else {
    let errorMessage = "请选择示例模版或上传自定义模版"
    
    if (uploadedTemplate.value) {
      if (uploadedTemplate.value.parseStatus === 1) {
        errorMessage = "模版正在解析中，请等待解析完成"
      } else if (uploadedTemplate.value.parseStatus === 3) {
        errorMessage = "模版解析失败，请重新上传"
      } else if (!uploadedTemplate.value.docId) {
        errorMessage = "模版上传失败，请重新上传"
      }
    }
    
    toast({
      title: "无法选择模版",
      description: errorMessage,
      variant: "destructive"
    })
    return
  }
  
  emit('template-selected', templateDocId, templateName)
  emit('update:open', false)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 监控解析状态
const watchParseStatus = (docId: string, name: string) => {
  if (!uploadedTemplate.value) return
  
  // 清除之前的定时器
  if (parseTimer.value) {
    clearInterval(parseTimer.value)
  }
  
  parseTimer.value = setInterval(async () => {
    try {
      const doc_res = await get_doc_api(docId)
      
      if (uploadedTemplate.value) {
        uploadedTemplate.value.parseStatus = doc_res.data.data.parseStatus
        uploadedTemplate.value.parseProgress = doc_res.data.data.parse_progress || 0
        
        // 解析完成或失败时清除定时器
        if (doc_res.data.data.parseStatus === 2) {
          // 解析成功
          if (parseTimer.value) {
            clearInterval(parseTimer.value)
            parseTimer.value = null
          }
          toast({
            title: "解析完成",
            description: `模版 ${name} 解析完成，可以选择使用`,
          })
        } else if (doc_res.data.data.parseStatus === 3) {
          // 解析失败
          if (parseTimer.value) {
            clearInterval(parseTimer.value)
            parseTimer.value = null
          }
          toast({
            title: "解析失败",
            description: `模版 ${name} 解析失败，请重新上传`,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Parse status check error:', error)
      if (parseTimer.value) {
        clearInterval(parseTimer.value)
        parseTimer.value = null
      }
    }
  }, 1000)
}

// 获取CSRF token的函数
const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
  return ''
}

// 组件销毁时清理定时器
onUnmounted(() => {
  if (parseTimer.value) {
    clearInterval(parseTimer.value)
    parseTimer.value = null
  }
})
</script> 