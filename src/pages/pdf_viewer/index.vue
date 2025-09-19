<template>
   <GPT_Page>
      <!-- 左侧预览区域 -->
      <div class="h-[100vh] w-[calc(100vw-3.5rem)] flex">
         <div class="w-1/2 h-full overflow-auto">
            <!-- Loading state -->
            <div v-if="fileLoading" class="h-full flex items-center justify-center">
               <div class="flex flex-col items-center gap-2">
                  <Loader2 class="h-8 w-8 animate-spin" />
                  <p class="text-sm text-muted-foreground">Loading {{ fileType }}...</p>
               </div>
            </div>
            
            <!-- Error state -->
            <div v-else-if="fileError" class="h-full flex items-center justify-center">
               <div class="flex flex-col items-center gap-2">
                  <AlertCircle class="h-8 w-8 text-destructive" />
                  <p class="text-sm text-destructive">Failed to load {{ fileType }}</p>
                  <Button variant="outline" size="sm" @click="downloadFile">
                     Retry
                  </Button>
               </div>
            </div>

            <!-- DOCX文件预览 -->
            <div v-else-if="fileType === 'DOCX'" class="h-full">
               <vue-office-docx 
                  :src="docxContent" 
                  style="height: 100%;" 
                  @rendered="onDocxRendered"
                  @error="onDocxError"
                  v-if="docxContent"
               />
            </div>

            <!-- PPTX文件预览 -->
            <div v-else-if="fileType === 'PPTX'" class="h-full">
               <vue-office-pptx 
                  :src="pptxContent" 
                  style="height: 100%;" 
                  @rendered="onPptxRendered"
                  @error="onPptxError"
                  v-if="pptxContent"
               />
            </div>

            <!-- PDB文件预览 -->
            <div v-else-if="fileType === 'PDB'" class="h-full">
               <!-- PDB Molstar组件占位符 - 用户会替换这个 -->
               <div class="h-full w-full flex items-center justify-center">
                  <protein3d_molstar ref="protein3d_molstar_ref" :refer_pdb_string="pdbContent" v-if="pdbContent" />
               </div>
            </div>

            <!-- FASTA文件预览 -->
            <div v-else-if="fileType === 'FASTA'" class="h-full">
               <div class="bg-white h-full flex flex-col">
                  <div class="bg-gray-50 px-4 py-3 border-b rounded-t-lg">
                     <h3 class="text-lg font-semibold flex items-center gap-2">
                        <span class="text-blue-600">🧬</span>
                        FASTA Sequence
                     </h3>
                  </div>
                  <div class="p-4 flex-1 overflow-auto">
                     <div v-if="fastaContent.trim()" class="font-mono text-sm">
                        <div v-html="formatFastaSequence(fastaContent)"></div>
                     </div>
                     <div v-else class="text-gray-400 text-sm">
                        FASTA序列加载中...
                     </div>
                  </div>
                  
                  <!-- 序列颜色说明 -->
                  <div v-if="fastaContent.trim()" class="mt-4 mx-4 mb-4 p-3 bg-blue-50 rounded-md">
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
               </div>
            </div>

            <!-- 图片预览 -->
            <div v-else-if="fileType === 'IMAGE'" class="h-full flex items-center justify-center">
               <img :src="imageUrl || ''" class="max-w-full max-h-full object-contain" alt="Preview" />
            </div>

            <!-- PDF预览 -->
            <div v-else-if="fileType === 'PDF'" class="h-full relative">
               <!-- PDF组件 -->
               <VuePdfEmbed 
                 :source="pdfDoc" 
                 v-if="pdfDoc"
                 ref="pdfEmbedRef"
                 class="pdf-embed-container"
                 @rendered="onPdfRendered"
               />
               
               <!-- Bbox overlay容器 -->
               <div 
                 v-if="showBboxOverlay"
                 id="bbox-overlay-container"
                 class="absolute inset-0 z-10"
                 style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;"
               >
                 <!-- 渲染所有可见的bbox -->
                 <div
                   v-for="bbox in visibleBboxes"
                   :key="`bbox-${bbox.molecule_key}-${bbox.page_idx}`"
                   class="absolute border-2 transition-all duration-300 rounded cursor-pointer hover:shadow-lg"
                   :class="bbox.highlighted ? 'border-red-500 bg-red-100 bg-opacity-40 shadow-lg' : 'border-blue-500 bg-blue-100 bg-opacity-20 hover:bg-blue-200 hover:bg-opacity-30'"
                   @click="onBboxClick(bbox)"
                   :style="{
                     left: `${bbox.screenX}px`,
                     top: `${bbox.screenY}px`,
                     width: `${bbox.screenWidth}px`,
                     height: `${bbox.screenHeight}px`,
                     zIndex: bbox.highlighted ? 100 : 50,
                     transform: bbox.highlighted ? 'scale(1.02)' : 'scale(1)',
                     borderWidth: bbox.highlighted ? '3px' : '2px',
                     pointerEvents: 'auto'
                   }"
                   :title="`分子: ${bbox.molecule_key}, 页面: ${bbox.page_idx + 1}`"
                 >
                   <!-- 高亮时显示分子key -->
                   <div 
                     v-if="bbox.highlighted" 
                     class="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                   >
                     {{ bbox.molecule_key.substring(0, 8) }}...
                   </div>
                 </div>
               </div>
            </div>

                         <!-- TXT文件预览 -->
             <div v-else-if="fileType === 'TXT'" class="h-full overflow-auto">
                <div class="bg-white h-full flex flex-col">
                   <div class="bg-gray-50 px-4 py-3 border-b rounded-t-lg">
                      <h3 class="text-lg font-semibold flex items-center gap-2">
                         <span class="text-blue-600">📄</span>
                         TXT 文件内容
                      </h3>
                   </div>
                   <div class="p-4 flex-1 overflow-auto">
                      <div v-if="txtContent.trim()" class="font-mono text-sm whitespace-pre-wrap break-words">
                         {{ txtContent }}
                      </div>
                      <div v-else class="text-gray-400 text-sm">
                         TXT内容加载中...
                      </div>
                   </div>
                </div>
             </div>
         </div>

         <!-- 分隔线 -->
         <div class="w-1 h-full bg-gray-200 cursor-col-resize"></div>

         <!-- 右侧markdown解析结果 -->
         <div class="w-1/2 h-full overflow-auto flex flex-col">
            <!-- Tab 导航栏 -->
            <div class="flex-shrink-0 border-b">
               <div class="flex justify-between items-center p-3">
                  <div class="flex">
                     <button 
                        @click="activeTab = 'original'"
                        :class="[
                           'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                           activeTab === 'original' 
                              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        ]"
                     >
                        原文解析
                     </button>
                     <button 
                        @click="activeTab = 'molecular'"
                        :class="[
                           'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ml-1',
                           activeTab === 'molecular' 
                              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        ]"
                     >
                        分子表格
                     </button>
                  </div>
                  
                  <!-- 仅在原文tab时显示的按钮 -->
                  <div v-if="activeTab === 'original'" class="flex gap-2">
                     <Button variant="default" size="sm" @click="translate_markdown" class="text-xs px-3 py-1">
                        {{ show_ori_markdown ? '翻译' : '原文' }}
                     </Button>
                     <Button variant="outline" size="sm" @click="copyMarkdown" class="text-xs px-3 py-1">
                        复制
                     </Button>
                     <Button variant="outline" size="sm" @click="exportDocx" :disabled="exportingDocx" class="text-xs px-3 py-1">
                        {{ exportingDocx ? '导出中...' : '导出' }}
                     </Button>
                  </div>
               </div>
            </div>
            
            <!-- Tab 内容区域 -->
            <div class="flex-1 overflow-auto">
               <!-- 原文 Tab -->
               <div v-show="activeTab === 'original'">
                  <div v-if="markdownLoading" class="h-full flex items-center justify-center">
                     <div class="flex flex-col items-center gap-2">
                        <Loader2 class="h-8 w-8 animate-spin" />
                        <p class="text-sm text-muted-foreground">Loading content...</p>
                     </div>
                  </div>
                  <div v-else-if="markdownError" class="h-full flex items-center justify-center">
                     <div class="flex flex-col items-center gap-2">
                        <AlertCircle class="h-8 w-8 text-destructive" />
                        <p class="text-sm text-destructive">Failed to load content</p>
                        <Button variant="outline" size="sm" @click="get_markdown">
                           Retry
                        </Button>
                     </div>
                  </div>
                  <markdown-viewer 
                     v-else 
                     :content="markdown_content" 
                     :docId="docId" 
                     :isTranslateMode="!show_ori_markdown"
                     ref="markdown_ref"
                  />
               </div>
               
               <!-- 分子表格 Tab -->
               <div v-show="activeTab === 'molecular'">
                  <MoleculeTable 
                     :content="markdown_content" 
                     :docId="docId" 
                     @molecules-processed="onMoleculesProcessed"
                     @molecule-selected="onMoleculeSelected"
                     ref="molecule_table_ref"
                  />
               </div>
            </div>
         </div>
      </div>
   </GPT_Page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import GPT_Page from '@/components/Layout/GPT_Page.vue'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useToast } from '@/components/ui/toast'
import VuePdfEmbed, { useVuePdfEmbed } from 'vue-pdf-embed'
import MarkdownViewer from './components/markdown_viewer.vue'
import MoleculeTable from './components/molecule_table.vue'
// @ts-ignore
import { get_doc_markdown_api, open_knowledge_api } from '@/api/common.js'
import { Loader2, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useStore } from '@/stores/index.js'
import { preview_pdf_from_s3, arrayBufferToBase64, decryptFile } from '@/utils/common.js'
// @ts-ignore
import protein3d_molstar from '@/components/molecule/protein3d_molstar.vue'

// 导入vue-office组件
import VueOfficeDocx from '@vue-office/docx'
import VueOfficePptx from '@vue-office/pptx'
// 导入样式
import '@vue-office/docx/lib/index.css'

// 导入文件保存库
// @ts-ignore
import { saveAs } from 'file-saver'

type FileType = 'PDF' | 'IMAGE' | 'FASTA' | 'PDB' | 'DOCX' | 'PPTX' | 'TXT'

const route = useRoute()
const docId = route.query.docId as string
const if_img = route.query?.if_img
const download_url = route.query?.download_url as string
const download_key = route.query?.download_key as string

// 文件类型检测
const fileType = computed<FileType>(() => {
  if (if_img) return 'IMAGE'
  if (!download_key) return 'PDF'
  
  const key = download_key.toLowerCase()
  if (key.includes('.pdb') || key.includes('pdb')) return 'PDB'
  if (key.includes('.fasta') || key.includes('.fst') || key.includes('fasta')) return 'FASTA'
  if (key.includes('.png') || key.includes('.jpg') || key.includes('.jpeg') || key.includes('image')) return 'IMAGE'
  if (key.includes('.docx') || key.includes('docx')) return 'DOCX'
  if (key.includes('.pptx') || key.includes('pptx')) return 'PPTX'
  if (key.includes('.txt') || key.includes('txt')) return 'TXT'
  return 'PDF'
})

// 状态管理
const fileLoading = ref(true)
const fileError = ref(false)
const markdownLoading = ref(true)
const markdownError = ref(false)
const show_ori_markdown = ref(true)
const first_translate = ref(true)
const exportingDocx = ref(false)
const activeTab = ref('original') // 新增：当前激活的tab
const processedMolecules = ref<string[]>([]) // 已处理的分子keys

// bbox相关状态
const currentHighlightedMolecule = ref<string | null>(null)
const allMoleculeBboxes = ref<Map<string, {
  page_idx: number
  bbox: number[]
}>>(new Map())
const pdfEmbedRef = ref<InstanceType<typeof VuePdfEmbed> | null>(null)
const showBboxOverlay = ref(false)
const visibleBboxes = ref<Array<{
  molecule_key: string
  page_idx: number
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
  highlighted: boolean
}>>([])
const pdfDoc = ref<any>(null)
const imageUrl = ref<string | null>(null)
const fastaContent = ref<string>('')
const pdbContent = ref<string>('')
const docxContent = ref<any>(null)
const pptxContent = ref<any>(null)
const txtContent = ref<string>('')
const protein3d_molstar_ref = ref<InstanceType<typeof protein3d_molstar> | null>(null)

// 其他
const markdown_content = ref('## 这里是Markdown解析器\n\n文档仍在解析中，请在解析完成后查看结果')
const markdown_ref = ref<InstanceType<typeof MarkdownViewer> | null>(null)
const molecule_table_ref = ref<InstanceType<typeof MoleculeTable> | null>(null)
const key = ref('XAEhg51aKKSMHgFUSQJr6hEkWv5gCYJ8j7kfQixCV8c=')
const { toast } = useToast()
const store = useStore()

store.isSidebarOpen = false

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

// DOCX 处理回调
const onDocxRendered = () => {
  console.log('DOCX rendered successfully')
}

const onDocxError = (error: any) => {
  console.error('DOCX render error:', error)
  toast({
    title: "Error",
    description: "DOCX 文件渲染失败",
    variant: "destructive"
  })
}

// PPTX 处理回调
const onPptxRendered = () => {
  console.log('PPTX rendered successfully')
}

const onPptxError = (error: any) => {
  console.error('PPTX render error:', error)
  toast({
    title: "Error",
    description: "PPTX 文件渲染失败",
    variant: "destructive"
  })
}

const translate_markdown = () => {
  show_ori_markdown.value = !show_ori_markdown.value
  if (first_translate.value && markdown_ref.value) {
    first_translate.value = false
    markdown_ref.value.split_content()
    markdown_ref.value.translate_content_continue()
  }
}

const copyMarkdown = async () => {
  if (!markdown_content.value) {
    toast({
      title: "提示",
      description: "没有可复制的内容",
      variant: "default"
    })
    return
  }
  
  try {
    await navigator.clipboard.writeText(markdown_content.value)
    toast({
      title: "成功",
      description: "Markdown内容已复制到剪贴板",
      variant: "default"
    })
  } catch (error) {
    toast({
      title: "错误",
      description: "复制失败，请重试",
      variant: "destructive"
    })
  }
}

const exportDocx = async () => {
  if (!markdown_ref.value) {
    toast({
      title: "错误",
      description: "文档内容未加载",
      variant: "destructive"
    })
    return
  }
  
  exportingDocx.value = true
  
  try {
    // 获取当前显示的markdown内容（可能是翻译后的）
    const currentContent = markdown_ref.value.getCurrentMarkdownContent()
    
    if (!currentContent) {
      toast({
        title: "错误",
        description: "文档内容为空",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "正在导出...",
      description: "正在生成DOCX文件，请稍等"
    })

    // 使用前端生成DOCX
    const { generateDocx } = await import('@/utils/docxGenerator')
    await generateDocx(currentContent)
    
    toast({
      title: "成功",
      description: "DOCX文档已导出",
      variant: "default"
    })
  } catch (error) {
    console.error('导出DOCX失败:', error)
    toast({
      title: "错误",
      description: error instanceof Error ? error.message : "导出失败，请重试",
      variant: "destructive"
    })
  } finally {
    exportingDocx.value = false
  }
}

const get_markdown = () => {
  markdownLoading.value = true
  markdownError.value = false
  
  get_doc_markdown_api(docId)
    .then((res: any) => {
      if (res.data?.data?.markdown) {
        markdown_content.value = res.data.data.markdown
      }
    })
    .catch(() => {
      markdownError.value = true
      toast({
        title: "Error",
        description: "Markdown 获取失败",
        variant: "destructive"
      })
    })
    .finally(() => {
      markdownLoading.value = false
    })
}

const downloadFile = async () => {
  fileLoading.value = true
  fileError.value = false

  try {
    if (download_url) {
      if (fileType.value === 'PDF') {
        // 只有PDF需要下载并解密
        const arrayBuffer = await preview_pdf_from_s3(download_url, download_key)
        const encryptedBytes = new Uint8Array(arrayBuffer)
        const iv = encryptedBytes.slice(0, 16)
        const ciphertext = encryptedBytes.slice(16)
        const ivBase64 = arrayBufferToBase64(iv.buffer)
        const ciphertextBase64 = arrayBufferToBase64(ciphertext.buffer)
        const decrypted = await decryptFile(ciphertextBase64, key.value, ivBase64)
        console.log('decrypted', decrypted)
        await handleDecryptedContent(decrypted)
      } else {
        // 其他文件类型直接下载，不解密
        const arrayBuffer = await preview_pdf_from_s3(download_url, download_key)
        await handleRawContent(arrayBuffer)
      }
    } else {
      // 使用API下载
      const res = await open_knowledge_api(docId)
      await handleApiResponse(res)
    }
  } catch (error) {
    fileError.value = true
    toast({
      title: "Error",
      description: "文件下载失败",
      variant: "destructive"
    })
  } finally {
    fileLoading.value = false
  }
}

const handleDecryptedContent = async (decrypted: any) => {
  switch (fileType.value) {
    case 'PDF':
      const { doc } = useVuePdfEmbed({ source: decrypted })
      pdfDoc.value = doc
      break
  }
}

const handleRawContent = async (arrayBuffer: ArrayBuffer) => {
  switch (fileType.value) {
    case 'IMAGE':
      const imageBlob = new Blob([arrayBuffer], { type: "image/png" })
      imageUrl.value = window.URL.createObjectURL(imageBlob)
      break
    case 'FASTA':
      fastaContent.value = new TextDecoder().decode(arrayBuffer)
      break
    case 'PDB':
      pdbContent.value = new TextDecoder().decode(arrayBuffer)
      setTimeout(() => {
        if (protein3d_molstar_ref.value) {
          protein3d_molstar_ref.value.draw_refer()
        }
      }, 1000)
      break
    case 'DOCX':
      // DOCX 文件可以直接传递 ArrayBuffer
      docxContent.value = arrayBuffer
      break
    case 'PPTX':
      // PPTX 文件可以直接传递 ArrayBuffer
      pptxContent.value = arrayBuffer
      break
    case 'TXT':
      txtContent.value = new TextDecoder().decode(arrayBuffer)
      break
  }
}

const handleApiResponse = async (res: any) => {
  switch (fileType.value) {
    case 'IMAGE':
      const imageBlob = new Blob([res.data], { type: "image/jpeg" })
      imageUrl.value = window.URL.createObjectURL(imageBlob)
      break
    case 'PDF':
      const pdfBlob = new Blob([res.data], { type: "application/pdf" })
      const pdfFile = new File([pdfBlob], 'pdf.pdf', { type: pdfBlob.type })
      const pdfUrl = window.URL.createObjectURL(pdfFile)
      const { doc } = useVuePdfEmbed({ source: pdfUrl })
      pdfDoc.value = doc
      break
    case 'FASTA':
      // 假设API返回文本内容
      fastaContent.value = new TextDecoder().decode(res.data)
      break
    case 'PDB':
      // 假设API返回文本内容
      pdbContent.value = new TextDecoder().decode(res.data)
      break
    case 'DOCX':
      // DOCX 文件可以直接传递 ArrayBuffer
      docxContent.value = res.data
      break
    case 'PPTX':
      // PPTX 文件可以直接传递 ArrayBuffer
      pptxContent.value = res.data
      break
    case 'TXT':
      txtContent.value = new TextDecoder().decode(res.data)
      break
  }
}

// 分子处理完成回调
const onMoleculesProcessed = (moleculeKeys: string[]) => {
  processedMolecules.value = moleculeKeys
  
  // 收集所有分子的bbox信息
  if (molecule_table_ref.value?.molecules) {
    allMoleculeBboxes.value.clear()
    molecule_table_ref.value.molecules.forEach((molecule: any) => {
      if (molecule.page_idx !== undefined && molecule.bbox) {
        allMoleculeBboxes.value.set(molecule.key, {
          page_idx: molecule.page_idx,
          bbox: molecule.bbox
        })
      }
    })
    showBboxOverlay.value = true
    updateVisibleBboxes()
  }
}

// 分子选择回调
const onMoleculeSelected = (selection: {
  key: string
  page_idx?: number
  bbox?: number[]
  molecule: any
}) => {
  currentHighlightedMolecule.value = selection.key
  
  if (selection.page_idx !== undefined && selection.bbox) {
    // 跳转到对应页面
    navigateToPage(selection.page_idx)
    
    // 更新bbox显示
    updateVisibleBboxes()
  } else {
    console.log('条件不满足:', {
      'page_idx存在': selection.page_idx !== undefined,
      'bbox存在': !!selection.bbox,
      'pdfDoc存在': !!pdfDoc.value
    })
  }
}

// bbox点击处理
const onBboxClick = (bbox: {
  molecule_key: string
  page_idx: number
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
  highlighted: boolean
}) => {
  
  // 切换到分子表格tab
  activeTab.value = 'molecular'
  
  // 高亮当前分子
  currentHighlightedMolecule.value = bbox.molecule_key
  
  // 通知分子表格组件跳转到对应条目
  if (molecule_table_ref.value) {
    molecule_table_ref.value.scrollToMolecule(bbox.molecule_key)
  }
  
  // 更新bbox显示
  updateVisibleBboxes()
}

// PDF渲染完成回调
const onPdfRendered = () => {
  showBboxOverlay.value = true
  updateVisibleBboxes()
}

// 跳转到指定页面
const navigateToPage = (pageIndex: number) => {

  // 先获取PDF容器，然后找到它的滚动父元素
  let pdfContainer = document.querySelector('.pdf-embed-container')
  if (!pdfContainer) {
    pdfContainer = document.querySelector('.vue-pdf-embed')
  }
  if (!pdfContainer && pdfEmbedRef.value) {
    pdfContainer = pdfEmbedRef.value.$el
  }
  
  if (!pdfContainer) {
    console.warn('未找到PDF容器')
    return
  }
  // 找到左侧预览区域（PDF容器的滚动父元素）
  const leftPanel = pdfContainer.closest('.overflow-auto')
  if (!leftPanel) {
    console.warn('未找到滚动容器')
    return
  }
  
  // 获取所有页面元素
  const allPages = pdfContainer.querySelectorAll('[class*="page"], [id*="page"], canvas, .vue-pdf-embed > div')

  if (pageIndex >= allPages.length) {
    console.warn(`页面索引 ${pageIndex} 超出范围，总页面数: ${allPages.length}`)
    return
  }
  
  // 计算累积高度到目标页面
  let scrollToPosition = 0
  for (let i = 0; i < pageIndex; i++) {
    if (allPages[i]) {
      const pageRect = allPages[i].getBoundingClientRect()
      scrollToPosition += pageRect.height
    }
  }
  
  // 平滑滚动到目标位置
  leftPanel.scrollTo({
    top: scrollToPosition,
    behavior: 'smooth'
  })
}

// 计算并更新可见的bbox
const updateVisibleBboxes = () => {
  if (!pdfEmbedRef.value || !showBboxOverlay.value) {
    visibleBboxes.value = []
    return
  }

  const newVisibleBboxes: typeof visibleBboxes.value = []
  
  // 获取PDF容器 - 先尝试几种可能的选择器
  let pdfContainer = document.querySelector('.pdf-embed-container')
  if (!pdfContainer) {
    pdfContainer = document.querySelector('.vue-pdf-embed')
  }
  if (!pdfContainer) {
    pdfContainer = pdfEmbedRef.value?.$el
  }
  if (!pdfContainer) {
    visibleBboxes.value = []
    return
  }

    // 获取所有页面元素
  const allPages = pdfContainer.querySelectorAll('.vue-pdf-embed > div')
  // 遍历所有bbox数据
  allMoleculeBboxes.value.forEach((bboxInfo, moleculeKey) => {
    const { page_idx, bbox } = bboxInfo
    // 直接通过索引获取页面元素
    const pageElement = allPages[page_idx]
    
    if (pageElement) {
      const pageRect = pageElement.getBoundingClientRect()
      const containerRect = pdfContainer.getBoundingClientRect()
      
      // 检查bbox数据格式
      if (!Array.isArray(bbox) || bbox.length < 4) {
        console.warn(`分子 ${moleculeKey} 的bbox数据格式不正确:`, bbox)
        return
      }
      
      // 验证bbox值的合理性
      const [x1, y1, x2, y2] = bbox
      if (x2 <= x1 || y2 <= y1) {
        console.warn(`分子 ${moleculeKey} 的bbox数据不合理:`, { x1, y1, x2, y2 })
        return
      }
      
      // 计算bbox在PDF容器内的位置
      // bbox格式是 [x1, y1, x2, y2]，需要转换为 x, y, width, height
      const bboxX = x1
      const bboxY = y1
      const bboxWidth = x2 - x1
      const bboxHeight = y2 - y1
      
      // 计算页面偏移：累积前面所有页面的高度
      let pageOffsetY = 0
      for (let i = 0; i < page_idx; i++) {
        if (allPages[i]) {
          const prevPageRect = allPages[i].getBoundingClientRect()
          pageOffsetY += prevPageRect.height
        }
      }
      
      // X偏移通常是页面相对于容器的水平偏移
      const pageOffsetX = pageRect.left - containerRect.left
      // 计算bbox在页面内的像素位置
      const bboxPixelX = bboxX * pageRect.width
      const bboxPixelY = bboxY * pageRect.height
      const bboxPixelWidth = bboxWidth * pageRect.width
      const bboxPixelHeight = bboxHeight * pageRect.height
      
      // 最终位置 = 页面偏移 + bbox在页面内的位置
      const finalX = pageOffsetX + bboxPixelX
      const finalY = pageOffsetY + bboxPixelY

      newVisibleBboxes.push({
        molecule_key: moleculeKey,
        page_idx,
        screenX: finalX,
        screenY: finalY,
        screenWidth: bboxPixelWidth,
        screenHeight: bboxPixelHeight,
        highlighted: moleculeKey === currentHighlightedMolecule.value
      })
    }
  })
  
  visibleBboxes.value = newVisibleBboxes
}

// 设置事件监听器
onMounted(() => {
  // 监听窗口大小变化
  window.addEventListener('resize', updateVisibleBboxes)
  
  // 监听PDF容器滚动 - 使用延迟确保PDF已渲染
  setTimeout(() => {
    let pdfContainer = document.querySelector('.pdf-embed-container')
    if (!pdfContainer) {
      pdfContainer = document.querySelector('.vue-pdf-embed')
    }
    if (!pdfContainer && pdfEmbedRef.value) {
      pdfContainer = pdfEmbedRef.value.$el
    }
    
    if (pdfContainer) {
      pdfContainer.addEventListener('scroll', updateVisibleBboxes)
      
      // 也监听左侧预览区域的滚动
      const leftPanel = pdfContainer.closest('.overflow-auto')
      if (leftPanel) {
        leftPanel.addEventListener('scroll', updateVisibleBboxes)
      }
    }
  }, 2000) // 延迟2秒确保PDF已完全加载
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', updateVisibleBboxes)
  
  // 清理PDF容器监听器
  let pdfContainer = document.querySelector('.pdf-embed-container')
  if (!pdfContainer) {
    pdfContainer = document.querySelector('.vue-pdf-embed')
  }
  if (!pdfContainer && pdfEmbedRef.value) {
    pdfContainer = pdfEmbedRef.value.$el
  }
  
  if (pdfContainer) {
    pdfContainer.removeEventListener('scroll', updateVisibleBboxes)
    
    const leftPanel = pdfContainer.closest('.overflow-auto')
    if (leftPanel) {
      leftPanel.removeEventListener('scroll', updateVisibleBboxes)
    }
  }
})

// 初始化
get_markdown()
downloadFile()
</script>

<route lang="yaml">
   meta:
     layout: blank
 </route>