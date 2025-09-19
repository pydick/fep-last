<template>
  <Card class="cursor-pointer shadow-none hover:shadow-lg transition-all duration-300 group overflow-hidden h-full flex flex-col border-2 hover:border-primary/20">
    <!-- Top section with icon on left, title and intro on right -->
    <div class="flex flex-1">
      <!-- Left side - Large SVG icon -->
      <div class="flex justify-center items-start p-6 w-1/4 min-w-[80px]">
        <component 
          :is="icon_list.find(item => item.name === icon_name).icon" 
          class="w-12 h-12 text-primary flex-shrink-0"
        />
      </div>
      
      <!-- Right side - Title and Introduction -->
      <div class="p-4 pl-0 pr-4 flex flex-col justify-start w-3/4 min-h-[120px]">
        <!-- Title -->
        <h3 class="text-lg m-0 font-semibold group-hover:text-primary transition-colors mb-3 line-clamp-2">
          {{ example_title }}
        </h3>

        <!-- Introduction -->
        <div class="text-muted-foreground/80 text-sm flex-1">
          <span v-if="example_intro_header" class="text-orange-600 font-medium">{{ example_intro_header }}</span>
          <!-- 如果有分段文本，使用分段显示 -->
          <template v-if="icon_before_text && icon_after_text">
            <span class="leading-relaxed">
              {{ icon_before_text }}
              <FileDown v-if="show_download_icon" class="inline h-4 w-4 mx-1 text-blue-500" />
              {{ icon_after_text }}
            </span>
          </template>
          <!-- 否则使用原来的显示方式 -->
          <template v-else>
            <span class="leading-relaxed line-clamp-3">{{ example_intro }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Bottom section - Guidance -->
    <CardContent class="p-4 pt-0 mt-auto">
      <!-- 添加一根横线 -->
      <div class="border-t border-muted-foreground/20 mb-4"></div>
      
      <!-- Guidance Section -->
      <div class="space-y-3 text-xs mb-4">
        <!-- File Upload Requirements -->
        <div v-if="file_upload_list.length > 0" class="flex flex-wrap gap-2 items-center">
          <p class="text-muted-foreground/80 font-medium">请先上传:</p>
          <div class="flex flex-wrap gap-2">
            <Badge 
              v-for="file in file_upload_list" 
              :key="file"
              variant="secondary" 
              class="font-normal bg-primary/10 hover:bg-primary/20 transition-all duration-300 cursor-pointer text-xs py-1 px-2"
              @click="load_example_file(file)"
            >
              {{ file }}
            </Badge>
          </div>
        </div>

        <!-- Knowledge Base Requirements -->
        <div v-if="knowledge_create || knowledge_select" class="flex flex-wrap gap-2 items-center">
          <span class="text-muted-foreground/80 font-medium">请先:</span>
          <div class="flex flex-wrap gap-2 items-center">
            <Badge 
              v-if="knowledge_create"
              variant="secondary" 
              class="font-normal bg-primary/10 hover:bg-primary/20 transition-all duration-300 cursor-pointer text-xs py-1 px-2"
              @click="goto_knowledge_page"
            >
              创建知识库并上传资料
            </Badge>
            <span v-if="knowledge_create && knowledge_select" class="text-muted-foreground/80">再</span>
            <Badge
              v-if="knowledge_select"
              variant="secondary"
              class="font-normal bg-primary/10 hover:bg-primary/20 transition-all duration-300 cursor-pointer text-xs py-1 px-2"
              @click="select_knowledge"
            >
              选择知识库
            </Badge>
          </div>
        </div>

        <!-- Template Selection Requirements -->
        <div v-if="template_select" class="flex flex-wrap gap-2 items-center">
          <span class="text-muted-foreground/80 font-medium">请先:</span>
          <div class="flex flex-wrap gap-2 items-center">
            <Badge
              variant="secondary"
              class="font-normal bg-primary/10 hover:bg-primary/20 transition-all duration-300 cursor-pointer text-xs py-1 px-2"
              @click="select_template"
            >
              点击输入框左下角的模版选择按钮
            </Badge>
          </div>
        </div>
      </div>

      <!-- Introduction - Example Input -->
      <div class="flex gap-2 items-start">
        <span class="text-muted-foreground/80 text-xs font-medium min-w-[32px] pt-2">
          {{knowledge_create || knowledge_select || template_select || file_upload_list.length > 0 ? '发送:' : '示例:'}}
        </span>
        <div class="flex-1 flex items-start gap-2">
          <Button 
            variant="outline" 
            :disabled="disabled" 
            class="text-sm font-normal break-all whitespace-pre-wrap min-h-[40px] h-auto flex-1 text-left justify-start p-3 leading-relaxed hover:bg-muted/50" 
            @click="send(text_input)"
          >
            {{ text_input }}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            class="p-2 w-10 h-10 flex-shrink-0" 
            @click="copyToClipboard(text_input)"
            :title="'复制文本'"
          >
            <Copy class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div v-if="second_need_split_line" class="flex items-center my-4">
        <div class="flex-grow border-t border-muted-foreground/20"></div>
        <div class="mx-4 text-xs text-muted-foreground/60 font-medium">或者</div>
        <div class="flex-grow border-t border-muted-foreground/20"></div>
      </div>

      <div v-if="second_need_split_line" class="flex gap-2 items-start">
        <span class="text-muted-foreground/80 text-xs font-medium min-w-[32px] pt-2">
          {{knowledge_create || knowledge_select || template_select || file_upload_list.length > 0 ? '发送:' : '示例:'}}
        </span>
        <div class="flex-1 flex items-start gap-2">
          <Button 
            variant="outline" 
            :disabled="disabled" 
            class="text-sm font-normal whitespace-pre-wrap min-h-[40px] h-auto flex-1 text-left justify-start p-3 leading-relaxed hover:bg-muted/50" 
            @click="send(second_text_input)"
          >
            {{ second_text_input }}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            class="p-2 w-10 h-10 flex-shrink-0" 
            @click="copyToClipboard(second_text_input)"
            :title="'复制文本'"
          >
            <Copy class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Table2, SquareSplitHorizontal, Microscope, Atom, Dna, Database, Hospital, Pill, FlaskConical, BookOpen, LayoutTemplate, Bot, LayoutDashboard, Copy, AlignCenterHorizontal, ArrowUp01, Waves, FileSearch2, Boxes, RailSymbol, FileDown, Presentation, Workflow } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'vue-router'

const router = useRouter()
const { toast } = useToast()
const icon_list = ref([
  {
    name: 'FileText',
    icon: FileText
  },
  {
    name: 'Table2',
    icon: Table2
  },
  {
    name: 'SquareSplitHorizontal',
    icon: SquareSplitHorizontal
  },
  {
    name: 'Microscope',
    icon: Microscope
  },
  {
    name: 'Atom',
    icon: Atom
  },
  {
    name: 'Dna',
    icon: Dna
  },
  {
    name: 'Database',
    icon: Database
  },
  {
    name: 'Hospital',
    icon: Hospital
  },
  {
    name: 'Pill',
    icon: Pill
  },
  {
    name: 'FlaskConical',
    icon: FlaskConical
  },
  {
    name: 'BookOpen',
    icon: BookOpen
  },
  {
    name: 'LayoutTemplate',
    icon: LayoutTemplate
  },
  {
    name: 'LayoutDashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Bot',
    icon: Bot
  },
  {
    name: 'Copy',
    icon: Copy
  },
  {
    name: 'AlignCenterHorizontal',
    icon: AlignCenterHorizontal
  },
  {
    name: 'ArrowUp01',
    icon: ArrowUp01
  },
  {
    name: 'Waves',
    icon: Waves
  },
  {
    name: 'FileSearch2',
    icon: FileSearch2
  },
  {
    name: 'Boxes',
    icon: Boxes
  },
  {
    name: 'RailSymbol',
    icon: RailSymbol
  },
  {
    name: 'Presentation',
    icon: Presentation
  },
  {
    name: 'Workflow',
    icon: Workflow
  }
])

const props = defineProps({
  example_title: {
    type: String,
    required: true,
    default: ''
  },
  example_intro_header: {
    type: String,
    required: false,
    default: ''
  },
  example_intro: {
    type: String,
    required: false,
    default: '这是功能介绍...'
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false
  },
  icon_name: {
    type: String,
    required: false,
    default: 'FileText'
  },
  file_upload_list: {
    type: Array,
    required: false,
    default: []
  },
  knowledge_create: {
    type: Boolean,
    required: false,
    default: false
  },
  knowledge_select: {
    type: Boolean,
    required: false,
    default: false
  },
  template_select: {
    type: Boolean,
    required: false,
    default: false
  },
  template_name: {
    type: String,
    required: false,
    default: ''
  },
  show_download_icon: {
    type: Boolean,
    required: false,
    default: false
  },
  icon_before_text: {
    type: String,
    required: false,
    default: ''
  },
  icon_after_text: {
    type: String,
    required: false,
    default: ''
  },
  text_input: {
    type: String,
    required: true,
    default: ''
  },
  second_text_input: {
    type: String,
    required: false,
    default: ''
  },
  second_need_split_line: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['select_knowledge', 'load_example_file', 'ask_question', 'show_question', 'select_template'])

const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

// This function is no longer needed as we removed the image section
// But keeping it in case it's used elsewhere
const importImage = (imgPath) => {
  if (!imgPath) {
    console.error('Image path is undefined');
    return '';
  }
  const imgUrl = new URL(`../../../assets/imgs/${imgPath}`, import.meta.url).href;
  return imgUrl;
};

const goto_knowledge_page = () => {
  // 跳转至知识库页面
  router.push('/knowledges')
}

const select_knowledge = () => {
  // 跳转至知识库中心页面
  emit('select_knowledge')
}

const select_template = () => {
  // 选择模版
  emit('select_template')
}

const load_example_file = (name) => {
  console.log('sload_example_file', name)
  // 前端直接获取该文件
  // emit 加载文件
  emit('load_example_file', name)
}

const send = (text_input) => {
  // 检查必要条件是否满足
  // emit 发送事件
  emit('ask_question', text_input)
}

const copyToClipboard = async (text) => {
  try {
    emit('show_question', text)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for non-HTTPS or unsupported browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err)
        throw err
      } finally {
        textArea.remove()
      }
    }
    toast({
      title: '复制成功',
      variant: 'success'
    })
  } catch (err) {
    console.error('copyToClipboard error', err)
    toast({
      title: '复制失败',
      variant: 'destructive'
    })
  }
}

</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
