<template>
  <div class="p-4">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-2">
        <Loader2 class="h-8 w-8 animate-spin" />
        <p class="text-sm text-muted-foreground">加载分子数据中...</p>
      </div>
    </div>

    <!-- 分子表格 -->
    <div v-else-if="molecules.length > 0" class="space-y-4">
      <!-- 操作栏 -->
      <div class="flex justify-between items-center">
        <div class="text-sm text-muted-foreground">
          共 {{ molecules.length }} 个分子
        </div>
        <Button 
          variant="outline" 
          size="sm"
          @click="downloadMolTable"
          class="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下载分子表格
        </Button>
      </div>
      
      <div class="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[80px]">序号</TableHead>
              <TableHead class="w-[140px]">原始结构</TableHead>
              <TableHead class="w-[140px]">解析结构</TableHead>
              <TableHead class="min-w-[150px]">SMILES</TableHead>
              <TableHead class="">Label</TableHead>
              <TableHead class="w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="(molecule, index) in molecules" 
              :key="molecule.key" 
              :class="[
                'hover:bg-muted/50 cursor-pointer transition-colors',
                highlightedMoleculeKey === molecule.key ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              ]"
              :data-molecule-key="molecule.key"
              @click="handleMoleculeRowClick(molecule)"
            >
              <TableCell class="font-medium">{{ index + 1 }}</TableCell>
              
              <!-- 原始结构图片 -->
              <TableCell>
                <div class="w-[120px] h-[80px] border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img 
                    :src="molecule.png" 
                    alt="Molecule PNG" 
                    class="max-w-full max-h-full object-contain"
                  />
                </div>
              </TableCell>
              
              <!-- 解析结构SVG -->
              <TableCell>
                <div class="w-[120px] h-[80px] border rounded-md overflow-hidden bg-white flex items-center justify-center">
                  <div 
                    class="max-w-full max-h-full flex items-center justify-center"
                    v-html="molecule.svg"
                  ></div>
                </div>
              </TableCell>
              
              <!-- SMILES -->
              <TableCell>
                <div class="relative group">
                  <div 
                    class="font-mono text-sm bg-gray-50 p-2 rounded border cursor-pointer hover:bg-gray-100 transition-colors"
                    @click="copySmiles(molecule.smiles)"
                    :title="molecule.smiles"
                  >
                    <span class="block truncate max-w-[150px]">
                      {{ molecule.smiles }}
                    </span>
                  </div>
                  <!-- Tooltip -->
                  <div class="absolute bottom-full left-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-[400px] break-all">
                    {{ molecule.smiles }}
                  </div>
                </div>
              </TableCell>

              <!-- Label -->
              <TableCell>
                <div class="relative group">
                  <input
                    v-if="editingLabelKey === molecule.key"
                    :ref="(el) => setLabelInputRef(el, molecule.key)"
                    v-model="editingLabelValue"
                    class="w-full font-mono text-sm bg-white p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    @keydown.enter="handleLabelSave(molecule, $event)"
                    @blur="handleLabelSave(molecule)"
                    @keydown.esc="cancelLabelEdit"
                    :maxlength="200"
                  />
                  <div 
                    v-else
                    class="font-mono text-sm bg-gray-50 p-2 rounded border cursor-pointer hover:bg-gray-100 transition-colors"
                    @click="startLabelEdit(molecule)"
                    :title="molecule.label || '点击编辑标签'"
                  >
                    <span class="block truncate max-w-[150px]">
                      {{ molecule.label || '未设置标签' }}
                    </span>
                  </div>
                  <!-- Tooltip -->
                  <div v-if="editingLabelKey !== molecule.key" class="absolute bottom-full left-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-[400px] break-all">
                    {{ molecule.label || '点击编辑标签' }}
                  </div>
                </div>
              </TableCell>
              
              <!-- 操作按钮 -->
              <TableCell>
                <div class="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    @click="editMolecule(molecule)"
                    class="text-xs px-2"
                  >
                    编辑
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="text-center text-gray-500 py-12">
      <div class="text-lg font-medium mb-2">暂无分子数据</div>
      <div class="text-sm">文档中未检测到分子结构</div>
    </div>
  </div>

  <!-- 分子编辑对话框 -->
  <Dialog v-model:open="isEditDialogOpen">
    <DialogContent class="max-w-[1200px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>编辑分子</DialogTitle>
        <DialogDescription>
          左侧显示原始结构图，右侧为分子编辑器
        </DialogDescription>
      </DialogHeader>
      
      <div class="grid grid-cols-2 gap-6 py-4">
        <!-- 左侧：原始图片 -->
        <div class="space-y-4">
          <div class="text-center">
            <h3 class="text-lg font-semibold mb-2">原始结构图</h3>
            <div class="border border-border rounded-md bg-gray-50">
              <img 
                :src="editingMolecule.png" 
                alt="Molecule Structure" 
                class="max-w-full mx-auto h-[300px]"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="grid grid-cols-3 items-center gap-2">
              <Label class="text-sm font-medium">SMILES:</Label>
              <div class="col-span-2 text-xs p-2 bg-gray-50 rounded border">
                {{ editingMolecule.smiles }}
              </div>
            </div>
            
            <div class="grid grid-cols-3 items-center gap-2">
              <Label class="text-sm font-medium">Molecule Key:</Label>
              <div class="col-span-2 text-xs p-2 bg-gray-50 rounded border">
                {{ editingMolecule.key }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧：分子编辑器 -->
        <div>
          <div class="text-center">
            <h3 class="text-lg font-semibold mb-2">分子编辑器</h3>
          </div>
          
          <div class="relative border border-border rounded-md">
            <div v-if="isIframeLoading" class="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div class="flex flex-col items-center gap-2">
                <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p class="text-sm text-muted-foreground">加载中...</p>
              </div>
            </div>
            <iframe 
              ref="ketcherFrame"
              id="ketcherMoleculeTable" 
              src="./static/file/standalone/index.html" 
              width="100%" 
              height="400" 
              class="rounded-md"
              @load="onKetcherLoad"
            />
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="isEditDialogOpen = false">
          取消
        </Button>
        <Button @click="saveMoleculeEdit">
          保存
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// @ts-ignore
import { download_minio_content } from '@/utils/common.js'
// @ts-ignore
import { update_molecule_block_api, download_mol_table_api } from '@/api/common.js'

// 工具函数
const sleep = (delaytime = 1000) => {
  return new Promise(resolve => setTimeout(resolve, delaytime))
}

const init_ketcher_module = async (domId: string) => {
  try {
    for (let i = 0; i < 3000; i++) {
      const ketcherFrame = document.getElementById(domId) as HTMLIFrameElement

      if (ketcherFrame && 'contentWindow' in ketcherFrame && ketcherFrame.contentWindow) {
        // @ts-ignore
        window.ketcher = ketcherFrame.contentWindow.ketcher
        // @ts-ignore
        if (window.ketcher) {
          return true
        }
      }
      
      console.log('ketcher wait!')
      await sleep(100)
    }
    return false
  } catch (error) {
    console.log('wait ketcher error:', error)
    return false
  }
}

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  docId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['moleculesProcessed', 'moleculeSelected'])

// 状态管理
const loading = ref(false)
const molecules = ref<Array<{
  key: string
  png: string
  svg: string
  smiles: string
  mol_block: string
  label: string
  base64Png: string
  page_idx?: number
  bbox?: number[]
}>>([])

// 编辑对话框状态
const isEditDialogOpen = ref(false)
const editingMolecule = ref({
  key: '',
  png: '',
  svg: '',
  smiles: '',
  mol_block: '',
  base64Png: ''
})

// 高亮状态
const highlightedMoleculeKey = ref<string | null>(null)

// Label编辑状态
const editingLabelKey = ref<string | null>(null)
const editingLabelValue = ref('')
const originalLabelValue = ref('')
const labelInputRefs = ref<{ [key: string]: HTMLInputElement }>({})
const isProcessingSave = ref(false) // 防止重复处理保存

// 分子编辑器相关状态
const isIframeLoading = ref(true)
const ketcherFrame = ref<HTMLIFrameElement | null>(null)

const { toast } = useToast()

// 处理分子占位符并提取分子数据
const processMoleculePlaceholders = async (content: string) => {
  if (!content || !props.docId) return

  loading.value = true
  molecules.value = []

  try {
    // 匹配 \_placeholder\_molid\_ 模式，现在包含label部分（label可以为空）
    const placeholderRegex = /\\_placeholder\\_molid\\_([^\\_]+)\\_label\\_([^\\_]*)\\_smiles\\_([^\s\n]+)/g
    const matches = content.match(placeholderRegex)
    
    if (!matches) {
      console.log('No molecule matches found')
      return
    }

    // 处理每个匹配的占位符
    for (const match of matches) {
      // 提取key、label和smiles (使用新的正则表达式的三个捕获组，label可以为空)
      const keyMatch = match.match(/\\_placeholder\\_molid\\_([^\\_]+)\\_label\\_([^\\_]*)\\_smiles\\_([^\s\n]+)/)
      if (!keyMatch || keyMatch.length < 4) continue
      
      const key = keyMatch[1]
      const labelFromPlaceholder = keyMatch[2]
      const smilesFromPlaceholder = keyMatch[3]
      
      try {
        // 下载分子数据
        const res = await download_minio_content(props.docId, key, 'molecule')
        
        // 转换PNG为base64
        const pngBase64String = res.data.content_base64
        const pngUrl = `data:image/png;base64,${pngBase64String}`
        
        // 处理SVG
        let svg_string = res.data.svg_string
        svg_string = svg_string.replace(/\n$/, '')
        
        // 添加到分子数组 - 包含bbox信息
        molecules.value.push({
          key,
          png: pngUrl,
          svg: svg_string,
          smiles: res.data.smiles,
          mol_block: res.data.mol_block || '',
          label: res.data.label || '',
          base64Png: pngBase64String,
          page_idx: res.data.page_idx,
          bbox: res.data.bbox
        })
      } catch (error) {
        console.error('Failed to load molecule:', error)
      }
    }

    // 通知父组件分子已处理 - 传递完整的分子对象数组
    emit('moleculesProcessed', molecules.value.map(m => m.key))
  } catch (error) {
    console.error('Error processing molecules:', error)
  } finally {
    loading.value = false
  }
}

// 复制SMILES
const copySmiles = async (smiles: string) => {
  try {
    await navigator.clipboard.writeText(smiles)
    toast({
      title: "复制成功",
      description: `SMILES已复制: ${smiles.length > 50 ? smiles.substring(0, 50) + '...' : smiles}`,
      variant: "default"
    })
  } catch (error) {
    // 降级方案
    try {
      const textArea = document.createElement('textarea')
      textArea.value = smiles
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      toast({
        title: "复制成功",
        description: `SMILES已复制: ${smiles.length > 50 ? smiles.substring(0, 50) + '...' : smiles}`,
        variant: "default"
      })
    } catch (fallbackError) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      })
    }
  }
}

// 编辑分子
const editMolecule = (molecule: any) => {
  editingMolecule.value = { ...molecule }
  isEditDialogOpen.value = true
  loadMoleculeToEditor()
}

// 保存分子编辑
const saveMoleculeEdit = async () => {
  try {
    // @ts-ignore
    const new_mol_block = await window.ketcher.getMolfile('v2000')
    const params = {
      doc_id: props.docId,
      molecule_key: editingMolecule.value.key,
      mol_block: new_mol_block
    }
    console.log('xxxxx')
    const res = await update_molecule_block_api(params)
    if (res.data?.success) {
      toast({
        title: "保存成功",
        description: "分子已保存",
        variant: "default"
      })
      isEditDialogOpen.value = false
      // 重新处理分子数据
      await processMoleculePlaceholders(props.content)
    } else {
      toast({
        title: "保存失败",
        description: "分子保存失败",
        variant: "destructive"
      })
    }
  } catch (error) {
    toast({
      title: "保存失败",
      description: "保存时出错",
      variant: "destructive"
    })
  }
}

// iframe加载完成回调
const onKetcherLoad = () => {
  isIframeLoading.value = false
  console.log('Ketcher iframe loaded')
}

// 加载分子到编辑器
const loadMoleculeToEditor = async () => {
  if (!editingMolecule.value.mol_block) {
    toast({
      title: "加载失败",
      description: "没有可用的分子数据",
      variant: "destructive"
    })
    return
  }

  try {
    const success = await init_ketcher_module('ketcherMoleculeTable')
    if (success) {
      // @ts-ignore
      await window.ketcher.setMolecule(editingMolecule.value.mol_block)
      toast({
        title: "加载成功",
        description: "分子已加载到编辑器",
        variant: "default"
      })
    } else {
      toast({
        title: "加载失败",
        description: "无法初始化编辑器",
        variant: "destructive"
      })
    }
  } catch (error) {
    console.error('加载分子失败:', error)
    toast({
      title: "加载失败",
      description: "加载分子时出错",
      variant: "destructive"
    })
  }
}

// 分子行点击处理
const handleMoleculeRowClick = (molecule: any) => {
  console.log('分子表格行被点击:', {
    key: molecule.key,
    page_idx: molecule.page_idx,
    bbox: molecule.bbox,
    'page_idx是否为undefined': molecule.page_idx === undefined,
    'bbox是否为undefined': molecule.bbox === undefined
  })
  
  // 发出分子选择事件
  emit('moleculeSelected', {
    key: molecule.key,
    page_idx: molecule.page_idx,
    bbox: molecule.bbox,
    molecule: molecule
  })
}

// 滚动到指定分子并高亮
const scrollToMolecule = (moleculeKey: string) => {
  // 设置高亮
  highlightedMoleculeKey.value = moleculeKey
  
  // 使用nextTick确保DOM已更新
  nextTick(() => {
    // 通过data-molecule-key属性查找表格行
    const targetRow = document.querySelector(`[data-molecule-key="${moleculeKey}"]`)
    if (targetRow) {
      targetRow.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  })
  
  // 3秒后取消高亮
  setTimeout(() => {
    highlightedMoleculeKey.value = null
  }, 3000)
}

// 开始编辑标签
const startLabelEdit = (molecule: any) => {
  
  editingLabelKey.value = molecule.key
  editingLabelValue.value = molecule.label || ''
  originalLabelValue.value = molecule.label || '' // 保存原始值
  nextTick(() => {
    labelInputRefs.value[molecule.key]?.focus()
  })
}

// 取消标签编辑
const cancelLabelEdit = () => {
  editingLabelKey.value = null
  editingLabelValue.value = ''
  originalLabelValue.value = '' // 取消编辑时也重置原始值
  isProcessingSave.value = false // 重置处理标志
}

// 保存标签编辑
const handleLabelSave = async (molecule: any, event?: Event) => {

  // 防止重复处理
  if (isProcessingSave.value) {
    console.log('already processing, skip')
    return
  }
  
  const isEnterKey = event && event.type === 'keydown'
  if (event) {
    event.preventDefault()
  }
  
  // 如果值没有变化，直接退出编辑状态
  if (editingLabelValue.value === originalLabelValue.value) {
    editingLabelKey.value = null
    editingLabelValue.value = ''
    originalLabelValue.value = ''
    
    // 如果是回车键，聚焦到下一个label
    if (isEnterKey) {
      isProcessingSave.value = true // 设置处理标志
      setTimeout(() => {
        isProcessingSave.value = false // 重置标志
      }, 100)
      focusNextLabel(molecule.key)
    }
    return
  }

  // 设置处理标志
  isProcessingSave.value = true

  try {
    const params = {
      doc_id: props.docId,
      molecule_key: molecule.key,
      label: editingLabelValue.value
    }
    const res = await update_molecule_block_api(params)
    if (res.data?.success) {
      toast({
        title: "保存成功",
        description: "标签已保存",
        variant: "default"
      })
      molecule.label = editingLabelValue.value
      editingLabelKey.value = null
      editingLabelValue.value = ''
      originalLabelValue.value = '' // 保存成功后重置原始值
      
      // 如果是回车键，聚焦到下一个label
      if (isEnterKey) {
        focusNextLabel(molecule.key)
      }
    } else {
      toast({
        title: "保存失败",
        description: "标签保存失败",
        variant: "destructive"
      })
    }
  } catch (error) {
    toast({
      title: "保存失败",
      description: "保存标签时出错",
      variant: "destructive"
    })
  } finally {
    // 重置处理标志
    setTimeout(() => {
      isProcessingSave.value = false
    }, 100)
  }
}

// 设置标签输入框引用
const setLabelInputRef = (el: Element | ComponentPublicInstance | null, key: string) => {
  if (el && 'focus' in el) {
    labelInputRefs.value[key] = el as HTMLInputElement
  }
}

// 聚焦到下一个标签
const focusNextLabel = (currentKey: string) => {
  const currentIndex = molecules.value.findIndex(m => m.key === currentKey)
  if (currentIndex !== -1 && currentIndex < molecules.value.length - 1) {
    const nextMolecule = molecules.value[currentIndex + 1]
    setTimeout(() => {
      startLabelEdit(nextMolecule)
    }, 100)
  }
}

// 下载分子表格
const downloadMolTable = async () => {
  if (!props.docId) {
    toast({
      title: "下载失败",
      description: "缺少文档ID",
      variant: "destructive"
    })
    return
  }

  try {
    toast({
      title: "开始下载",
      description: "正在准备分子表格文件...",
      variant: "default"
    })

    const response = await download_mol_table_api(props.docId)
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/octet-stream' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 尝试从响应头获取文件名，如果没有则使用默认名称
    const contentDisposition = response.headers['content-disposition']
    let filename = 'molecule_table.xlsx' // 默认文件名
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }
    
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast({
      title: "下载成功",
      description: `分子表格已下载: ${filename}`,
      variant: "default"
    })
  } catch (error) {
    console.error('下载分子表格失败:', error)
    toast({
      title: "下载失败",
      description: "下载分子表格时出错，请稍后重试",
      variant: "destructive"
    })
  }
}

// 监听content变化
watch(() => props.content, (newContent) => {
  if (newContent) {
    processMoleculePlaceholders(newContent)
  }
}, { immediate: true })

// 暴露方法给父组件
defineExpose({
  processMoleculePlaceholders,
  molecules,
  scrollToMolecule
})
</script>

<style scoped>
.molecule-svg-container svg {
  max-width: 100%;
  height: auto;
}
</style> 