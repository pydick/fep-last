<template>
  <div class="flex flex-col h-screen relative">
    <!-- Main content area that adjusts width when sidebar is open on wide screens -->
    <div 
      class="flex-grow bg-muted/40 overflow-auto transition-all duration-300" 
      ref="scrollContainerRef"
      :class="{ 'md:w-[65%]': isRightSidebarOpen && isWideScreen }"
    >
      <div 
        class="flex flex-col space-y-8 p-8"
        :class="[
          isRightSidebarOpen && isWideScreen 
            ? 'max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto transition-all duration-300' 
            : 'max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto'
        ]"
      >
        <div v-for="(item, index) in questionList" :key="index" class="flex flex-col space-y-6">
          <!-- User question -->
          <div class="flex justify-end group">
            <Button 
              variant="ghost"
              class="w-8 h-8 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors bg-background/80 hover:bg-background shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 mr-2 self-end"
              @click="copyQuestionText(item.question)"
              title="复制问题"
              size="icon"
            >
              <Copy />
            </Button>
            <Card class="max-w-[calc(100%-43px)] bg-primary/10 border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent class="p-5">
                <p class="text-sm text-foreground leading-relaxed font-medium flex items-center gap-2">
                  <Microscope v-if="item.deepresearch" class="size-4 text-primary" />
                  <span>
                    {{ item.question }}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
          <ask_append :item_data="item" style="margin-top: 6px;"/>

          <!-- GPT response -->
          <div class="flex justify-start items-start gap-3">
            <a
              class="group flex h-9 w-9 mb-8 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base p-1"
            >
              <img v-if="if_ldap" src="@/assets/imgs/qilu_logo_white.png" alt="logo" class="w-full" />
              <img v-else src="@/assets/imgs/top_logo.png" alt="logo" class="w-full" />
            </a>
            <Card class="max-w-[calc(100%-3rem)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent class="px-5 py-0 space-y-3">
                <answer_ref :item_data="item" />
                <thinking_card :item_data="item" />
                <pipeline_card :item_data="item" v-model:cite_id_click="cite_id_click" @change_current_pipeline="change_current_pipeline" />
                <mol_card :item_data="item" @change_current_pipeline="change_current_pipeline" v-model:cite_id="cite_id_click"/>
                <docking_molstar_card :item_data="item" v-model:cite_id="cite_id_click" />
                <molstar_card :item_data="item" v-if="if_ldap" />
                <wemol_download_card :item_data="item" v-if="if_ldap"/>
                <pptx_download_card :item_data="item" />
                <img_card :item_data="item" v-if="if_ldap"/>
                <div class="prose max-w-none dark:prose-invert prose-pre:bg-gray-700 prose-pre:border prose-pre:border-border prose-pre:rounded-lg 
                            prose-table:border prose-table:border-collapse prose-td:border prose-td:border-border prose-td:p-2
                            prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted/50
                            prose-a:bg-primary/10 prose-a:px-1 prose-a:rounded-md prose-a:text-primary prose-a:cursor-pointer
                            prose-hr:mt-8 prose-hr:mb-8 overflow-x-auto">
                  <div v-if="item.content" 
                    :id="'question_' + index"
                    class="text-sm text-foreground leading-[2]"
                    v-html="marked.render(process_content(item.content, item.pipeline, item.questionId))"
                  ></div>
                  <div v-if="!item.start_answer && item.answerStatus == 1" class="flex items-center gap-3 py-2">
                    <Loader2 class="h-5 w-5 animate-spin text-primary" />
                    <p class="text-sm text-muted-foreground font-medium">请稍等...</p>
                  </div>
                </div>
                <!-- Action buttons -->
                <div class="flex justify-between items-center gap-2 py-2 border-t">
                  <div v-if="item.answerStatus === 3" class="text-sm text-destructive">
                    回答已停止
                  </div>
                  <div v-else class="flex-1"></div>
                  <div class="flex gap-2">
                    <button
                      v-if="index === questionList.length - 1 && item.answerStatus !== 1"
                      class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      @click="regenerateAnswer"
                      title="重新回答"
                    >
                      <RefreshCw class="h-4 w-4" />
                    </button>
                    <button 
                      class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" @click="copyContent('question_'+ index)"
                      title="复制回答"
                    >
                      <Copy class="h-4 w-4" />
                    </button>
                    <button 
                      class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" 
                      @click="exportToDocx(item, index)"
                      title="导出DOCX"
                    >
                      <FileDown class="h-4 w-4" />
                    </button>
                    <button 
                      class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" 
                      @click="generatePptx(item)"
                      title="生成PPTX"
                    >
                      <Presentation class="h-4 w-4" />
                    </button>
                    <button class="p-2 hover:bg-muted rounded-md transition-colors" 
                      :class="item.effect === '1' ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'"
                      @click="likeAnswer(item)"
                      title="点赞"
                    >
                      <ThumbsUp class="h-4 w-4" :fill="item.effect === '1' ? 'currentColor' : 'none'" />
                    </button>
                    <button 
                      class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" 
                      :class="item.effect === '2' ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'"
                      @click="dislikeDialog(item)"
                      title="反馈"
                    >
                      <MessageSquare class="h-4 w-4" :fill="item.effect === '2' ? 'currentColor' : 'none'" />
                    </button>
                    <button 
                      title="删除"
                      class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" @click="showDeleteDialog(item)">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom input area that adjusts width when sidebar is open -->
    <div 
      class="flex-shrink-0 w-full transition-all duration-300 bg-muted/40 px-8"
      :class="{ 'md:w-[65%]': isRightSidebarOpen && isWideScreen }"
    >
      <div :class="[
          isRightSidebarOpen && isWideScreen 
            ? 'max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto transition-all duration-300' 
            : 'max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto'
        ]"
      >
        <ask_button 
          @get_questionlist="get_questionlist" 
          @closeSider="closeSider" 
          @stop="stop_question(undefined, true)" 
          ref="askButtonRef" 
        />
      </div>
    </div>

    <!-- Right sidebar - fixed on mobile, part of layout on desktop -->
    <div 
      v-if="isRightSidebarOpen"
      class="fixed md:absolute top-0 right-0 h-screen bg-background border-l border-border shadow-lg z-50 overflow-y-auto transition-all duration-300"
      :class="[
        isWideScreen ? 'w-[35%]' : 'w-[85%]'
      ]"
    >
      <div>
        <Button variant="ghost" size="icon" @click="toggleRightSidebar(false)" class="absolute top-3 right-4">
          <XCircle class="h-5 w-5" />
        </Button>
        <right_sidebar_card :item_data="selected_item" :cite_id="cite_id_click" />
        <!-- Right sidebar content goes here -->
      </div>
    </div>

  </div>
  <!-- Delete confirmation dialog -->
  <Dialog :open="showDialog" @update:open="showDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>确认删除</DialogTitle>
        <DialogDescription>
          您确定要删除这条对话吗？此操作无法撤销。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="showDialog = false">取消</Button>
        <Button variant="destructive" @click="handleDelete">删除</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <!-- Feedback dialog -->
  <Dialog :open="showDislikeDialog" @update:open="showDislikeDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>评价反馈</DialogTitle>
        <DialogDescription>
          请对回答质量进行评价，帮助我们改进服务。
        </DialogDescription>
      </DialogHeader>
      <div class="py-4 space-y-4">
        <!-- Star Rating -->
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-medium">评分:</label>
          <div class="flex items-center gap-2">
            <button 
              v-for="star in 5" 
              :key="star" 
              @click="ratingValue = star"
              class="text-2xl focus:outline-none"
              :class="star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'"
            >
              ★
            </button>
          </div>
        </div>
        
        <!-- Problem Categories -->
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-medium">问题类型:</label>
          <div class="grid grid-cols-3 gap-2">
            <Button 
              v-for="(category, index) in feedbackCategories" 
              :key="index"
              variant="outline"
              @click="toggleCategory(category)"
              :class="selectedCategories.includes(category) 
                ? 'bg-primary/10 border-primary text-primary' 
                : ''"
            >
              {{ category }}
            </Button>
          </div>
        </div>

        <!-- Additional Comments -->
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-medium">补充说明:</label>
          <Textarea 
            v-model="dislikeFeedback"
            class="w-full min-h-[100px] p-3 rounded-md border border-input bg-transparent"
            placeholder="请输入详细反馈..."
          ></Textarea>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showDislikeDialog = false">取消</Button>
        <Button variant="default" @click="handleDislike">提交</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  
  <!-- PPT generation confirmation dialog -->
  <Dialog :open="showPptxDialog" @update:open="showPptxDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>生成PPT确认</DialogTitle>
        <DialogDescription>
          确定要根据当前回答内容生成PPT吗？系统将自动发起一个新的提问来制作PPT。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="showPptxDialog = false">取消</Button>
        <Button variant="default" @click="handlePptxGeneration">确认生成</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  get_questionlist_api, add_effect_api, delete_question_api, stop_question_api
} from '@/api/common.js'
import { useStore } from '@/stores/index.js'
import markdownit from 'markdown-it'
import markdownitExternalLink from 'markdown-it-external-link'
import hljs from 'highlight.js'
import mk from '@xtthaop/markdown-it-katex'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import ask_button from '@/pages/ask/ask_button.vue'
import { Loader2, Copy, ThumbsUp, ThumbsDown, Trash2, XCircle, PanelRight, Microscope, RefreshCw, MessageSquare, FileDown, Presentation } from 'lucide-vue-next'
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getCookie } from '@/utils/request.js'
import ask_append from './ask_append.vue'
import answer_ref from './answer_ref.vue'
import thinking_card from './thinking_card.vue'
import pipeline_card from './pipeline_card.vue'
import right_sidebar_card from './right_sidebar_card.vue'
import wemol_download_card from './wemol_download_card.vue'
import pptx_download_card from './pptx_download_card.vue'
import molstar_card from './molstar_card.vue'
import markdownitCodeCopy from 'markdown-it-code-copy'
import mol_card from './mol_card.vue'
import docking_molstar_card from './docking_molstar_card.vue'
import img_card from './img_card.vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'

const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

const { toast } = useToast()

const marked = markdownit({
  html: true,
  linkify: true,
  typographer: false, // 禁用自动排版以避免SMILES分子式中的(C)被替换为©
  langPrefix: 'language-',
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  }
})

marked.use(markdownitExternalLink, {
  'hosts': [
    'https://ai.drugflow.com',
    'https://inplat.drugflow.com', 
  ]
});

marked.use(mk);
// marked.use(markdownitCodeCopy, {
//   element: '<svg fill="currentColor" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M878.272 981.312H375.36a104.64 104.64 0 0 1-104.64-104.64V375.36c0-57.792 46.848-104.64 104.64-104.64h502.912c57.792 0 104.64 46.848 104.64 104.64v502.912c-1.6 56.192-48.448 103.04-104.64 103.04z m-502.912-616.96a10.688 10.688 0 0 0-10.944 11.008v502.912c0 6.208 4.672 10.88 10.88 10.88h502.976c6.208 0 10.88-4.672 10.88-10.88V375.36a10.688 10.688 0 0 0-10.88-10.944H375.36z"></path><path d="M192.64 753.28h-45.312a104.64 104.64 0 0 1-104.64-104.64V147.328c0-57.792 46.848-104.64 104.64-104.64h502.912c57.792 0 104.64 46.848 104.64 104.64v49.92a46.016 46.016 0 0 1-46.848 46.912 46.08 46.08 0 0 1-46.848-46.848v-49.984a10.688 10.688 0 0 0-10.944-10.944H147.328a10.688 10.688 0 0 0-10.944 10.88v502.976c0 6.208 4.672 10.88 10.88 10.88h45.312a46.08 46.08 0 0 1 46.848 46.912c0 26.496-21.824 45.248-46.848 45.248z"></path></svg>',
//   // onSuccess toast
//   onSuccess: () => {
//     toast({
//       title: '复制成功',
//       description: '已复制到剪贴板',
//     })
//   }
// });

const store = useStore()

interface questionListType {
  questionId: string,
  answerStatus: number,
  channel_id: string,
  client: number,
  content: string,
  createTime: string,
  docIdList: string[],
  docIdListKnowledge: string[],
  effect: null | string,
  intends: number,
  kb_ids: string[],
  question: string,
  search_type: string,
  if_search_online: boolean,
  if_thinking: boolean,
  pipeline: any[],
  start_answer?: boolean,
  deepresearch: boolean,
  answerId?: string,
  effectContent?: string,
  effectRating?: number,
  effectCategory?: string,
  tools_name?: string,
  templateId?: string,
}


const questionList = ref<questionListType[]>([])
const showDialog = ref(false)
const showDislikeDialog = ref(false)
const showPptxDialog = ref(false)
const itemToDelete = ref<questionListType | null>(null)
const itemToDislike = ref<questionListType | null>(null)
const itemToPptx = ref<questionListType | null>(null)
const dislikeFeedback = ref('')
const ratingValue = ref(0)
const feedbackCategories = ref([
  '答非所问', 
  '搜索内容不准确',
  '回答过于冗长',
  '回答过于简单',
  '时效性不足',
  '缺失关键信息',
  '专业深度不够',
  '上下文理解不足',
  '回答存在事实性错误',
  '其他'
])
const selectedCategories = ref<string[]>([])
const scrollContainerRef = ref<HTMLElement | null>(null)
const { isRightSidebarOpen } = storeToRefs(store)
const isWideScreen = useMediaQuery('(min-width: 768px)')
const selected_item = ref<questionListType | null>(null)
const cite_id_click = ref(0)
// 添加节流函数
const throttle = (fn: Function, delay: number) => {
  let lastTime = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(null, args)
      lastTime = now
    }
  }
}

// 修改后的 scrollToBottom 函数
const scrollToBottom = throttle((force: boolean = false) => {
  nextTick(() => {
    if (!scrollContainerRef.value) return
    const max_height = 150
    if (force || (scrollContainerRef.value.scrollHeight - (scrollContainerRef.value.scrollTop + scrollContainerRef.value.clientHeight) < max_height)) {
      scrollContainerRef.value.scrollTo({
        top: scrollContainerRef.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}, 2000) // 100ms 的节流延迟

const controller = ref<AbortController | null>(null)
const eventSource = ref<EventSource | null>(null)
const askButtonRef = ref<InstanceType<typeof ask_button> | null>(null)

const get_questionlist = () => {
  const ques_params = {
    channel_id: store.channel_id,
    page: 1,
    size: 100
  }
  if (!store.channel_id) {
    return
  }
  get_questionlist_api(ques_params)
    .then((res: any) => {
      if (res.data.success == true) {
        questionList.value = res.data.data.items
        const flag = questionList.value.every((item) => { return item.answerStatus != 1 })
        selected_item.value = questionList.value[questionList.value.length - 1]
        if (!flag) {
          // 设置回答相关的store
          let params = {}
          questionList.value.map(item => {
            if(item.answerStatus == 1){
              params = {
                questionId: item.questionId,
                question: item.question,
                docIdList: item.docIdList || [],
                docIdListKnowledge: item.docIdListKnowledge || [],
                channel_id: store.channel_id,
                user_id: store.user_id,
                knowledgeCSAIDefault: store.knowledgeCSAIDefault,
                kb_ids: item?.kb_ids,
                if_thinking: item?.if_thinking,
                templateId: item?.templateId
              }
            }
          })

          askButtonRef.value?.open_isLoading()

          let fetchUrl = '/api/v1/channel/stream_pipeline'
          
          controller.value = new AbortController()
          let csrfAccessToken = getCookie('csrf_access_token')
          scrollToBottom(true)

          eventSource.value = fetchEventSource(fetchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': csrfAccessToken || ''
            },
            credentials: 'include',
            body: JSON.stringify(params),
            signal: controller.value.signal,
            openWhenHidden: true,
            onmessage(event: any) {
              if (questionList.value[questionList.value.length - 1].content == null){
                questionList.value[questionList.value.length - 1].content = ''
              }
              if (event.event) {
                questionList.value[questionList.value.length - 1].start_answer = true
              }

              if (event.event == 'message') {
                if (!questionList.value[questionList.value.length - 1].content.includes('</thinking>')) {
                  questionList.value[questionList.value.length - 1].content += '</thinking>'
                }
                const tmp_content = JSON.parse(event.data)
                questionList.value[questionList.value.length - 1].content += tmp_content.data == '<<<end>>>' ? '' : tmp_content.data
              } else if (event.event == 'tool_decision' || event.event == 'tool_description') {
                const tool_data = JSON.parse(event.data)
                questionList.value[questionList.value.length - 1].pipeline.push(tool_data)
                const show_tool_name = ['网络搜索', '页面爬取', '情报数据库搜索', 'execute_code', 'DrugFlow-ADMET计算']
                // ldap模式，默认关闭右侧栏
                if (!if_ldap.value) {
                  if (show_tool_name.includes(tool_data.tool_name) && event.event == 'tool_description' && tool_data.status && !tool_data.param_description) {
                    store.isRightSidebarOpen = true
                  }
                }
              } else if (event.event == 'error') {
                stop_question(undefined, true)
              } else if (event.event == 'thinking') {
                if (!questionList.value[questionList.value.length - 1].content.includes('<thinking>')) {
                  questionList.value[questionList.value.length - 1].content += '<thinking>'
                }
                questionList.value[questionList.value.length - 1].content += event.data
              }
              if (event.data == '<<<end>>>') {
                // stop_question(undefined, true)
                askButtonRef.value?.close_isLoading()
              }
              scrollToBottom()
            },
            onclose() {
              scrollToBottom()
              stop_question(undefined, true)
              askButtonRef.value?.close_isLoading()
            },
            onerror(error) {
              scrollToBottom()
              stop_question(undefined, true)
              askButtonRef.value?.close_isLoading()
            }
          })
        } 
      } else {
        askButtonRef.value?.close_isLoading()
        toast({
          title: "Error",
          description: res.data.message,
          variant: "destructive"
        })
      }
    })
    .catch((err: any) => {
      console.log(err)
    })
}

const stop_question = (channel_id: string | undefined, need_update: boolean = true) => {
  if (controller.value != null) {
    controller.value.abort()
    controller.value = null
  }
  if (eventSource.value != null) {
    eventSource.value = null
  }

  let stop_channel_id = store.channel_id
  if (channel_id) {
    stop_channel_id = channel_id
  }

  stop_question_api(stop_channel_id)
    .then((res: any) => {
      askButtonRef.value?.close_isLoading()
      if (need_update) {
        setTimeout(() => {
          get_questionlist()
        }, 300)
      }
      try {
        console.log('stop_question_api ask_button_ref')
      } catch (err) {
        console.log('stop_question_api ask_button_ref error', err)
      }
    })
    .catch((err: any) => {
      console.log('stop_question_api error', err)
      if (err.response?.status !== 422) {
        toast({
          title: "Error",
          description: err.response?.data,
          variant: "destructive"
        })
      }
    })
}

const process_content = (content: string, pipeline: any, question_id: string) => {
  const split_var = '<======>'
  const end_var = '<<<end>>>'
  if (content == null) {
    return ''
  } 
  // 去掉<not_show>和</not_show>之间的内容
  content = content.replace(/<not_show>.*?<\/not_show>/g, '')
  content = transfer_citation_pipeline(content, pipeline, question_id)
  // 统一数学公式格式
  content = standardizeMathExpressions(content)
  content = transfer_task(content)
  
  if (content.split(split_var).length > 2) {
    const tmp = transfer_citation(content.split(split_var)[1], content.split(split_var)[2])
    
    if (tmp.split('</thinking>').length == 2) {
      return tmp.split('</thinking>')[1].split(end_var)[0]
    }
    if (tmp.includes('<thinking>')) {
      return ''
    } else {
      return tmp.split(end_var)[0]
    }
  } else if (content.split(split_var).length == 1) {
    if (content.split('</thinking>').length >= 2) {
      return content.split('</thinking>')[content.split('</thinking>').length - 1].split(end_var)[0]
    } else {
      if (content.includes('<thinking>')) {
        return ''
      } else {
        return content.split(end_var)[0]
      }
    }
  } else {
    return ''
  }
}

// 添加新函数来统一数学公式格式
const standardizeMathExpressions = (content: string) => {
  // 处理 \[ \] 到 $$ $$ 的转换 (块级数学公式)
  content = content.replace(/\\\[([\s\S]*?)\\\]/g, (match, p1) => `$$${p1}$$`);
  
  // 处理 \( \) 到 $ $ 的转换 (行内数学公式)
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, p1) => `$${p1}$`);

  return content;
}

const transfer_task = (content: string) => {
  let regex = /<task\s+task_id=(?:"|')?([a-zA-Z0-9_-]+)(?:"|')?\s*(?:\/?>)/g;
  content = content.replace(regex, (match: string, taskId: string) => {
    return `<a class="task" onclick="ask_task('${taskId}')">点击查询任务状态和结果</a>`;
  });
  
  // Handle wemol_task tags
  let wemolRegex = /<wemol_task\s+task_id=(?:"|')?([a-zA-Z0-9_-]+)(?:"|')?\s*(?:\/?>)/g;
  content = content.replace(wemolRegex, (match: string, taskId: string) => {
    return `<a class="task" onclick="ask_wemol_task('${taskId}')">点击查询任务状态和结果</a>`;
  });
  
  return content;
}

declare global {
  interface Window {
    ask_task: (task_id: string) => void;
    ask_wemol_task: (task_id: string) => void;
    download_pdf: (docId: string) => void;
    show_citation: (cite_id: string, question_id: string) => void;
  }
}

window.ask_task = (task_id: string) => {
  console.log('ask_task', task_id)
  // 继续提问
  askButtonRef.value?.ask_question('帮我查询并分析任务状态和结果，任务ID是：' + task_id)
}

window.ask_wemol_task = (task_id: string) => {
  console.log('ask_wemol_task', task_id)
  // 继续提问
  askButtonRef.value?.ask_question('使用molecular agent，帮我查询任务状态和结果，wemol任务ID是：' + task_id)
}

window.download_pdf = (docId: string) => {
  const url = window.location.origin + '/pdf_viewer?docId=' + docId
  window.open(url, '_blank');
}

const transfer_citation = (dict_string: string, originalString: string) => {
  if (dict_string == '') {
    return originalString
  }
  const search_list = JSON.parse(dict_string).search_data
  let regex = /\[citation\s?:\s?(\d+)\]/g;

  originalString = originalString.replace(regex, (match: string, number: number) => {
    const citation = search_list[number - 1];
    if (citation && citation.type == '1') {
      return `<a class="citation" onclick="download_pdf('${citation.docId}')">${number}</a>`;
    }
    return `<a class='citation' href="${citation?.url}" target="_blank">${number}</a>`;
  });

  return originalString
}

const transfer_citation_pipeline = (originalString: string, pipeline: any, question_id: string='') => {
  // Updated regex to match both <citation cite_id=X> and <cite_id=X> formats
  let regex = /(?:<citation\s+cite_id=|<cite_id=)(?:"|')?(\d+)(?:"|')?\s*(?:\/?>)/g;
  const cite_list: any[] = []
  let cite_list_index = 1
  pipeline.map((item: any) => {
    if (item.description?.type == 'pdf' || item.description?.type == 'url' || item.description?.type == 'code' || item.description?.type == 'mol') {
      cite_list.push( { ...item.description, cite_id: cite_list_index })
      cite_list_index += 1
    }
  })

  originalString = originalString.replace(regex, (match: string, number: number) => {
    const citation = cite_list[number - 1]
    // console.log('citation', citation)
    if (citation) {
      if (citation.cite_id) {
        return `<a class="citation" onclick="show_citation('${citation.cite_id}', '${question_id}')">${number}</a>`;
      }
    } 
    return '';
  });

  return originalString
}

window.show_citation = (cite_id: string, question_id: string) => {
  // console.log('show_citation', cite_id, question_id)
  // 找到这个question_id的item
  const item = questionList.value.find((item) => item.questionId == question_id)
  if (item) {
    selected_item.value = item
    cite_id_click.value = cite_id
    store.if_highlight_card = true
    store.isSidebarOpen = false
    store.isRightSidebarOpen = true
  }
}

const copyContent = (elementid: string) => {
  const element = document.getElementById(elementid)
  if (!element) {
    toast({
      title: "复制失败",
      description: "未找到要复制的内容",
      variant: "destructive"
    })
    return
  }

  // Create a range to select the content
  const range = document.createRange()
  range.selectNodeContents(element)

  // Create a selection to hold the range
  const selection = window.getSelection()
  if (!selection) {
    toast({
      title: "复制失败", 
      description: "浏览器不支持复制功能",
      variant: "destructive"
    })
    return
  }

  selection.removeAllRanges()
  selection.addRange(range)

  try {
    // Execute the copy command
    document.execCommand('copy')
    toast({
      title: "复制成功",
      description: "文本已复制到剪贴板"
    })
  } catch (error) {
    toast({
      title: "复制失败",
      description: "复制过程中发生错误",
      variant: "destructive" 
    })
  }

  // Clear the selection
  selection.removeAllRanges()
}

const likeAnswer = async (item: questionListType) => {
  try {
    await add_effect_api({
      questionId: item.questionId,
      answerId: item.answerId,
      effect: '1'
    })
    item.effect = '1'
    toast({
      title: "点赞成功",
      description: "感谢您的反馈",
    })
  } catch (err) {
    toast({
      title: "点赞失败", 
      description: "操作过程中发生错误",
      variant: "destructive"
    })
  }
}

const dislikeDialog = (item: questionListType) => {
  itemToDislike.value = item
  dislikeFeedback.value = item?.effectContent || ''
  ratingValue.value = item?.effectRating || 0
  selectedCategories.value = item?.effectCategory?.split(',') || []
  showDislikeDialog.value = true
}

const handleDislike = async () => {
  if (itemToDislike.value) {
    try {
      await add_effect_api({
        questionId: itemToDislike.value.questionId,
        answerId: itemToDislike.value.answerId,
        effect: '2',
        effectContent: dislikeFeedback.value,
        effectRating: ratingValue.value,
        effectCategory: selectedCategories.value.join(',')
      })
      itemToDislike.value.effect = '2'
      itemToDislike.value.effectContent = dislikeFeedback.value
      itemToDislike.value.effectRating = ratingValue.value
      itemToDislike.value.effectCategory = selectedCategories.value.join(',')
      toast({
        title: "反馈成功",
        description: "感谢您的评价",
      })
      showDislikeDialog.value = false
      itemToDislike.value = null
    } catch (err) {
      toast({
        title: "反馈失败",
        description: "操作过程中发生错误", 
        variant: "destructive"
      })
    }
  }
}

const showDeleteDialog = (item: questionListType) => {
  itemToDelete.value = item
  showDialog.value = true
}

const change_current_pipeline = (item: questionListType) => {
  selected_item.value = item
}

const handleDelete = () => {
  // 关闭右边栏
  isRightSidebarOpen.value = false
  if (itemToDelete.value) {
    delete_question_api({
      question_id: itemToDelete.value.questionId
    }).then(() => {
      get_questionlist()
      showDialog.value = false
      itemToDelete.value = null
    })
  }
}

const recover_params = (params: any) => {
  askButtonRef.value?.recover_params(params)
}

const closeSider = () => {
  // 关闭侧边栏
  store.isSidebarOpen = false
}

// Toggle the right sidebar
const toggleRightSidebar = (value: boolean) => {
  isRightSidebarOpen.value = value
  
  // If opening right sidebar, ensure left sidebar is closed
}

const copyQuestionText = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      toast({
        title: "复制成功",
        description: "问题已复制到剪贴板"
      })
    })
    .catch(() => {
      toast({
        title: "复制失败",
        description: "复制过程中发生错误",
        variant: "destructive" 
      })
    })
}

// Updated regenerateAnswer function
const regenerateAnswer = async () => {
  if (questionList.value.length === 0) return;

  const lastItem = questionList.value[questionList.value.length - 1];
  const originalQuestion = lastItem.question;

  // Ensure we have a valid question ID
  if (!lastItem.questionId) {
    toast({
      title: "Error",
      description: "Cannot regenerate, missing question ID.",
      variant: "destructive"
    });
    return;
  }

  try {
    // 1. Delete the last question
    await delete_question_api({ question_id: lastItem.questionId });

    // 2. Ask the same question again
    // Use nextTick to ensure the DOM potentially updates after deletion 
    // before asking again, although it might not be strictly necessary here.
    nextTick(() => {
      askButtonRef.value?.ask_question(originalQuestion);
    });

  } catch (error) {
    console.error("Error regenerating answer:", error);
    toast({
      title: "Regeneration Failed",
      description: "Could not delete the previous question or ask again.",
      variant: "destructive"
    });
  }
};

const toggleCategory = (category: string) => {
  if (selectedCategories.value.includes(category)) {
    selectedCategories.value = selectedCategories.value.filter(c => c !== category)
  } else {
    selectedCategories.value.push(category)
  }
}

const exportToDocx = async (item: questionListType, index: number) => {
  try {
    if (!item.content) {
      toast({
        title: "导出失败",
        description: "缺少问题内容",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "正在导出...",
      description: "正在生成DOCX文件，请稍等"
    });

    // 使用前端生成DOCX，传递pipeline参数以生成引用列表
    const { generateDocx } = await import('@/utils/docxGenerator')
    await generateDocx(item.content, item.pipeline || [])
    
    toast({
      title: "导出成功",
      description: "DOCX文件已开始下载"
    });

  } catch (error) {
    console.error('导出DOCX失败:', error);
    toast({
      title: "导出失败",
      description: error instanceof Error ? error.message : "导出过程中发生错误",
      variant: "destructive"
    });
  }
}

const generatePptx = (item: questionListType) => {
  if (!item.questionId) {
    toast({
      title: "生成失败",
      description: "缺少问题ID",
      variant: "destructive"
    });
    return;
  }

  // 设置要生成PPT的项目并显示确认对话框
  itemToPptx.value = item;
  showPptxDialog.value = true;
}

const handlePptxGeneration = () => {
  if (itemToPptx.value) {
    // 构造提问内容
    const question = `根据questionid ${itemToPptx.value.questionId} 帮我制作一个PPT`;
    
    // 调用 ask_button 的 ask_question 方法
    askButtonRef.value?.ask_question(question);
    
    toast({
      title: "开始生成PPT",
      description: "正在根据问题内容生成PPT，请稍等..."
    });

    // 关闭对话框并重置状态
    showPptxDialog.value = false;
    itemToPptx.value = null;
  }
}

onMounted(() => {
  get_questionlist()
})

watch(() => store.channel_id, () => {
  get_questionlist()
  setTimeout(() => {
    scrollToBottom(true)
  }, 600)
})

defineExpose({
  recover_params,
  toggleRightSidebar
})

</script>

<style>
.katex-html {
  display: none;
}

/* Custom scrollbar styling */
.bg-muted\/40::-webkit-scrollbar {
  width: 8px;
}

.bg-muted\/40::-webkit-scrollbar-track {
  background: transparent;
}

.bg-muted\/40::-webkit-scrollbar-thumb {
  background-color: rgba(140, 140, 140, 0.3);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.bg-muted\/40::-webkit-scrollbar-thumb:hover {
  background-color: rgba(140, 140, 140, 0.5);
}

/* Firefox scrollbar */
.bg-muted\/40 {
  scrollbar-width: thin;
  scrollbar-color: rgba(140, 140, 140, 0.3) transparent;
}

.task {
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  color: #2563eb;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.task:hover {
  background-color: #eff6ff;
}

.task:active {
  transform: translateY(0);
}

/* Add styles for code copy button */
/* .markdown-it-code-copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.875rem;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  background-color: #374151;
  opacity: 0;
  transition: opacity 0.2s;
}

.markdown-it-code-copy span {
  opacity: 0.75!important;
} */

/* Show button on hover */
/* .prose div:hover > .markdown-it-code-copy {
  opacity: 1;
} */

/* .markdown-it-code-copy:hover {
  background-color: #222;
} */

/* Style for copied state */
/* .markdown-it-code-copy.success {
  color: #059669;
  background-color: #ecfdf5;
  border-color: #a7f3d0;
} */

/* Ensure code blocks have relative positioning */
/* .prose pre {
  position: relative;
} */

/* Ensure parent container is relative for absolute positioning */
.relative {
  position: relative;
}
</style>