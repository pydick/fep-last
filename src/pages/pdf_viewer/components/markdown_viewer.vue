<template>
  <div 
    class="prose max-w-none dark:prose-invert prose-pre:bg-gray-700 prose-pre:border prose-pre:border-border prose-pre:rounded-lg 
          prose-table:border prose-table:border-collapse prose-td:border prose-td:border-border prose-td:p-2
          prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted/50 max-w-none dark:prose-invert p-3"
    v-html="renderedContent"
  ></div>
  
  <!-- 翻译按钮（仅在翻译模式下显示） -->
  <div v-if="isTranslateMode" class="flex justify-center mb-2">
    <Button size="sm" v-if="!is_translating && !end_translating" @click="translate_content_continue">
      翻译更多
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
// @ts-ignore
import { download_minio_content } from '@/utils/common.js'
// @ts-ignore
import { translate_content_api } from '@/api/common.js'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'


// 导入工具函数
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
    default: '## 这里是Markdown解析器\n\n文档仍在解析中，请在解析完成后查看结果',
  },
  docId: {
    type: String,
    default: '',
  },
  isTranslateMode: {
    type: Boolean,
    default: false,
  },
})

import markdownit from 'markdown-it'
import markdownitExternalLink from 'markdown-it-external-link'
import hljs from 'highlight.js'
import mk from '@xtthaop/markdown-it-katex'

// 存储已下载的图片缓存
const imageCache = ref<Record<string, string>>({})

// 处理后的内容（处理占位符后的内容）
const processedContent = ref(props.content)

// 翻译相关状态
const is_translating = ref(false)
const content_list = ref<Array<{
  content: string
  translate_content: string
  context: string
  index: number
}>>([])

// 翻译内容的计算属性
const trans_content = computed(() => {
  return content_list.value.map(item => item.translate_content).join('')
})

// 处理后的翻译内容
const processedTransContent = ref('')

// 是否完成翻译
const end_translating = computed(() => {
  return content_list.value.length > 0 && content_list.value.every(item => item.translate_content)
})

// 最终渲染的内容（markdown解析后的内容）
const renderedContent = computed(() => {
  if (props.isTranslateMode) {
    return marked.render(processedTransContent.value)
  } else {
    return marked.render(processedContent.value)
  }
})

// 处理图片占位符的函数
const processImagePlaceholders = async (content: string) => {
  // 匹配 \_placeholder\_imgid\_ 模式（转义后的格式）
  const placeholderRegex = /\\_placeholder\\_imgid\\_([^\\_\s\n]+)/g
  const matches = content.match(placeholderRegex)
  console.log('matches', matches)
  if (!matches) {
    return content
  }
  
  let processedText = content
  
  // 处理每个匹配的占位符
  for (const match of matches) {
    const osskey = match.replace('\\_placeholder\\_imgid\\_', '')
    
    // 检查缓存中是否已有该图片
    if (imageCache.value[osskey]) {
      // 替换占位符为markdown图片语法
      const imgMarkdown = `![Document Image](${imageCache.value[osskey]})`
      processedText = processedText.replace(match, imgMarkdown)
    } else {
      try {
        // 下载图片
        const arrayBuffer = await download_minio_content(props.docId, osskey, 'img')
        
        // 判断图片类型
        let imageType = 'png'
        if (osskey.toLowerCase().includes('.jpg') || osskey.toLowerCase().includes('.jpeg')) {
          imageType = 'jpeg'
        } else if (osskey.toLowerCase().includes('.gif')) {
          imageType = 'gif'
        } else if (osskey.toLowerCase().includes('.webp')) {
          imageType = 'webp'
        }
        
        // 转换为base64
        const base64String = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        const imageUrl = `data:image/${imageType};base64,${base64String}`
        
        // 存储到缓存
        imageCache.value[osskey] = imageUrl
        
        // 替换占位符为markdown图片语法
        const imgMarkdown = `![Document Image](${imageUrl})`
        processedText = processedText.replace(match, imgMarkdown)
      } catch (error) {
        console.error('Failed to load image:', error)
        // 如果加载失败，替换为错误提示的HTML
        const errorHtml = `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0; color: #dc2626; font-size: 14px;">图片加载失败: ${osskey}</div>`
        processedText = processedText.replace(match, errorHtml)
      }
    }
  }
  
  return processedText
}

// 存储已下载的分子缓存
const moleculeCache = ref<Record<string, { smiles: string }>>({})

// 处理分子占位符的函数（简化版，只显示SMILES）
const processSimpleMoleculePlaceholders = async (content: string) => {
  // 匹配 \_placeholder\_molid\_ 模式，现在包含label部分（label可以为空）
  const placeholderRegex = /\\_placeholder\\_molid\\_([^\\_]+)\\_label\\_([^\\_]*)\\_smiles\\_([^\s\n]+)/g
  const matches = content.match(placeholderRegex)
  console.log('molecule matches found:', matches)
  
  if (!matches) {
    console.log('No molecule matches found')
    return content
  }
  
  let processedText = content
  
  // 处理每个匹配的占位符
  for (const match of matches) {
    console.log('Processing molecule match:', match)
    
    // 提取key、label和smiles (使用新的正则表达式的三个捕获组，label可以为空)
    const keyMatch = match.match(/\\_placeholder\\_molid\\_([^\\_]+)\\_label\\_([^\\_]*)\\_smiles\\_([^\s\n]+)/)
    if (!keyMatch || keyMatch.length < 4) {
      console.log('No key match found for:', match)
      continue
    }
    
    const key = keyMatch[1]
    const labelFromPlaceholder = keyMatch[2]
    const smilesFromPlaceholder = keyMatch[3]
    
    // 检查缓存中是否已有该分子，或直接使用占位符中的SMILES
    let smilesData = null
    
    if (moleculeCache.value[key]) {
      console.log('Using cached molecule for key:', key)
      smilesData = moleculeCache.value[key].smiles
    } else if (smilesFromPlaceholder) {
      console.log('Using SMILES from placeholder for key:', key)
      // 将占位符中的SMILES存储到缓存
      moleculeCache.value[key] = {
        smiles: smilesFromPlaceholder
      }
      smilesData = smilesFromPlaceholder
    } else {
      try {
        console.log('Downloading molecule data for key:', key)
        // 下载分子数据
        const res = await download_minio_content(props.docId, key, 'molecule')
        
        // 存储到缓存（只存储SMILES）
        moleculeCache.value[key] = {
          smiles: res.data.smiles
        }
        smilesData = res.data.smiles
      } catch (error) {
        console.error('Failed to load molecule:', error)
        // 如果加载失败，替换为错误提示
        const errorHtml = `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0; color: #dc2626; font-size: 14px;">分子加载失败: ${key}</div>`
        processedText = processedText.replace(match, errorHtml)
        continue
      }
    }
    
    if (smilesData) {
      // 替换占位符为简化的SMILES显示
      const moleculeHtml = `<div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin: 8px 0; background-color: #f8fafc; display: inline-block;">
  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">分子结构</div>
  <div style="font-size: 14px; font-weight: 500; color: #374151; font-family: monospace;">
    <strong>SMILES:</strong> ${smilesData}
  </div>
</div>`
      processedText = processedText.replace(match, moleculeHtml)
      console.log('Replaced molecule placeholder with SMILES content')
    }
  }
  
  return processedText
}

// 处理表格占位符的函数
const processTablePlaceholders = async (content: string) => {
  console.log('Processing table placeholders, content length:', content.length)
  
  // 匹配 \_placeholder\_tableid\_ 开头到 \n 结束的模式
  const placeholderRegex = /\\_placeholder\\_tableid\\_([^\n]+)\n/g
  const matches = content.match(placeholderRegex)
  console.log('table matches found:', matches)
  
  if (!matches) {
    console.log('No table matches found')
    return content
  }
  
  let processedText = content
  
  // 处理每个匹配的占位符
  for (const match of matches) {
    console.log('Processing table match:', match)
    
    // 提取key (tableid_后面到\n前面的部分)
    const keyMatch = match.match(/\\_placeholder\\_tableid\\_([^\n]+)\n/)
    if (!keyMatch) {
      console.log('No key match found for:', match)
      continue
    }
    
    const key = keyMatch[1]
    console.log('Table key:', key)
    
    try {
      // 下载表格HTML
      const res = await download_minio_content(props.docId, key, 'molecule')
      const tableHtml = res.data?.html_content
      
      // 直接替换占位符为HTML内容
      processedText = processedText.replace(match, tableHtml)
      console.log('Replaced table placeholder with HTML content')
    } catch (error) {
      console.error('Failed to load table:', error)
      // 如果加载失败，替换为错误提示
      const errorHtml = `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0; color: #dc2626; font-size: 14px;">表格加载失败: ${key}</div>`
      processedText = processedText.replace(match, errorHtml)
    }
  }
  
  return processedText
}

// 处理所有占位符的函数
const processAllPlaceholders = async (content: string) => {
  console.log('Processing all placeholders')
  let processedText = content
  processedText = await processImagePlaceholders(processedText)
  processedText = await processSimpleMoleculePlaceholders(processedText)
  processedText = await processTablePlaceholders(processedText)
  return processedText
}

// 监听content变化并处理占位符
watch(() => props.content, async (newContent) => {
  processedContent.value = await processAllPlaceholders(newContent)
}, { immediate: true })

// 监听翻译内容变化并处理占位符
watch(() => trans_content.value, async (newTransContent) => {
  if (newTransContent) {
    processedTransContent.value = await processAllPlaceholders(newTransContent)
  }
}, { immediate: true })

const marked = markdownit({
  html: true,
  linkify: true,
  typographer: false,
  langPrefix: 'language-',
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return '';
  }
})

marked.use(markdownitExternalLink, {
  'hosts': [
    'https://ai.drugflow.com',
    'https://aidev.drugflow.com', 
    'https://dev.drugflow.com',
    'http://dev.drugflow.com',
  ]
});

marked.use(mk);

// 复制到剪贴板的函数
const copyToClipboard = async (text: string, button: HTMLElement) => {
  try {
    await navigator.clipboard.writeText(text)
    const originalText = button.textContent
    button.textContent = '已复制!'
    button.style.backgroundColor = '#059669'
    setTimeout(() => {
      button.textContent = originalText
      button.style.backgroundColor = '#3b82f6'
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    
    const originalText = button.textContent
    button.textContent = '已复制!'
    button.style.backgroundColor = '#059669'
    setTimeout(() => {
      button.textContent = originalText
      button.style.backgroundColor = '#3b82f6'
    }, 2000)
  }
}

// 编辑分子的函数（已迁移到分子表格组件）
const editMolecule = (moleculeKey: string) => {
  console.log('分子编辑功能已迁移到分子表格tab，请前往分子表格tab进行编辑')
}

// 保存分子编辑功能已移至分子表格组件
const saveMoleculeEdit = async () => {
  // 分子编辑功能已迁移到分子表格tab
  console.log('分子编辑功能已迁移到分子表格tab')
}

// 分子编辑器相关函数
const { toast } = useToast()

// iframe加载完成回调（已迁移到分子表格组件）
const onKetcherLoad = () => {
  console.log('Ketcher相关功能已迁移到分子表格tab')
}

// 加载分子到编辑器功能已移至分子表格组件
const loadMoleculeToEditor = async () => {
  console.log('分子加载功能已迁移到分子表格tab')
}

// 翻译相关方法
// 将content按照500个字分成多个字符串
const split_content = () => {
  const content = props.content
  const lines = content.split('\n')
  
  content_list.value = [] // 清空现有内容
  
  let currentChunk = ''
  let currentWordCount = 0
  let previousContext = ''
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Check if we're entering or leaving a table
    if (line.trim().startsWith('|')) {
      inTable = true
    } else if (inTable && !line.trim().startsWith('|')) {
      inTable = false
    }
    
    const wordCount = line.trim().split(/\s+/).length
    
    // If in table, keep adding lines until table ends
    if (inTable) {
      currentChunk += (currentChunk ? '\n' : '') + line
      currentWordCount += wordCount
      continue
    }

    // Check if line ends with sentence-ending punctuation
    const isCompleteSentence = /[.!?。！？]$/.test(line.trim())
    
    if (currentWordCount + wordCount > 700 && isCompleteSentence) {
      // Only split at complete sentences
      if (currentChunk) {
        content_list.value.push({
          content: currentChunk.trim(),
          translate_content: '',
          context: previousContext.slice(-128),
          index: content_list.value.length
        })
      }
      previousContext = currentChunk
      currentChunk = line
      currentWordCount = wordCount
    } else {
      // Keep building current chunk
      currentChunk += (currentChunk ? '\n' : '') + line
      currentWordCount += wordCount
      
      // If we're over 400 words and hit a sentence end, consider splitting
      if (currentWordCount > 400 && isCompleteSentence && !inTable) {
        content_list.value.push({
          content: currentChunk.trim(),
          translate_content: '',
          context: previousContext.slice(-128),
          index: content_list.value.length
        })
        previousContext = currentChunk
        currentChunk = ''
        currentWordCount = 0
      }
    }
  }

  // Push final chunk if not empty
  if (currentChunk) {
    content_list.value.push({
      content: currentChunk.trim(), 
      translate_content: '',
      context: previousContext.slice(-128),
      index: content_list.value.length
    })
  }
}

// 持续翻译内容 使用promise all请求三个没翻译过的内容
const translate_content_continue = async () => {
  is_translating.value = true
  // 找到所有未翻译的内容
  const untranslated = content_list.value.filter(item => !item.translate_content)
  
  // 如果没有未翻译的内容，返回
  if (untranslated.length === 0) {
    is_translating.value = false
    return
  }

  // 每次取前3个未翻译的内容
  const batch = untranslated.slice(0, 3)
  
  try {
    // 并行翻译这3个内容
    await Promise.all(batch.map(async (item) => {
      // 先显示翻译中的状态
      item.translate_content = '\n\n第' + (item.index + 1) + '部分内容正在翻译中...\n\n\n\n'
      const res = await translate_content_api({ 
        content: item.content, 
        context: item.context,
        preserve_placeholders: true // 告诉API保持占位符格式
      })
      item.translate_content = process_translate_content(res.data.translate_content)
    }))
  } catch (error) {
    console.error('Translation failed:', error)
    toast({
      title: "Error",
      description: "Markdown 翻译失败",
      variant: "destructive"
    })
  } finally {
    is_translating.value = false
  }
}

// 处理翻译内容
const process_translate_content = (content: string) => {
  // 如果存在```，则只取```包裹的内容
  if (content.includes('```')) {
    return content.split('```')[1]
  }
  return content
}
// 挂载全局函数
onMounted(() => {
  // @ts-ignore
  window.copyToClipboard = copyToClipboard
  // @ts-ignore
  window.editMolecule = editMolecule
  // @ts-ignore
  window.saveMoleculeEdit = saveMoleculeEdit
})

// 清理全局函数
onUnmounted(() => {
  // @ts-ignore
  delete window.copyToClipboard
  // @ts-ignore
  delete window.editMolecule
  // @ts-ignore
  delete window.saveMoleculeEdit
})

// 获取当前显示的原始markdown内容（用于导出）
const getCurrentMarkdownContent = () => {
  if (props.isTranslateMode && processedTransContent.value) {
    return processedTransContent.value
  } else {
    return processedContent.value
  }
}

// 暴露翻译相关方法
defineExpose({
  split_content,
  translate_content_continue,
  getCurrentMarkdownContent
})
</script>

<style>
.katex-html {
  display: none;
}

.molecule-container {
  max-width: 100%;
}

.molecule-svg-container {
  max-height: 300px;
  overflow: auto;
}

.molecule-svg-container svg {
  max-width: 100%;
  height: auto;
}
</style>
