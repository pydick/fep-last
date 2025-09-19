<template>
  <ScrollArea class="flex flex-col bg-muted/40 h-screen">
    <!-- Main content area with flex-grow to push button to bottom -->
    <div class="w-full px-4 md:px-8 py-6">
      <div class="max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
        <div class="text-[#162448]">
          <div class="flex flex-col items-center mt-[16vh]">
            <div v-if="if_ldap" class="mt-2 text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              齐鲁大脑
            </div>
            <div v-else class="mt-2 text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SciGPT
            </div>

            <!-- Moved ask_button here -->
            <div class="w-full mt-8">
              <div class="max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
                <ask_button :docIds="props.docIds" height="high" ref="ask_button_ref"/>
              </div>
            </div>

            <div class="w-full mt-16">
              <Tabs :defaultValue="if_ldap ? 'general' : 'database'" class="w-full">
                <TabsList class="grid max-w-[890px] mx-auto mb-8 p-2 grid-cols-7 h-12" :class="{'grid-cols-6': !if_ldap, 'max-w-[790px]': !if_ldap}">
                  <TabsTrigger value="general" class="text-sm font-medium">常规对话和查询</TabsTrigger>
                  <TabsTrigger value="knowledge" class="text-sm font-medium">知识库查询</TabsTrigger>
                  <TabsTrigger value="database" class="text-sm font-medium">医药数据库查询</TabsTrigger>
                  <TabsTrigger value="protein" v-if="if_ldap" class="text-sm font-medium">大分子工具</TabsTrigger>
                  <TabsTrigger value="molecule" class="text-sm font-medium">小分子工具</TabsTrigger>
                  <TabsTrigger value="research" class="text-sm font-medium">信息调研及项目评估工具</TabsTrigger>
                  <TabsTrigger value="phrases" class="text-sm font-medium">常用语</TabsTrigger>
                </TabsList>
                
                <TabsContent value="database" class="space-y-0">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Example example_title="临床试验搜索" @ask_question="ask_question" @show_question="show_question" example_intro="中美ClinicTrials数据库中搜索临床试验的相关信息" text_input="急性白血病的临床试验有什么" icon_name="FlaskConical" />
                    <Example example_title="专利信息搜索" @ask_question="ask_question" @show_question="show_question" example_intro="Google Patent等专利数据库中搜索专利信息" text_input="靶点SEZ6的授权专利有哪些" icon_name="Hospital" />
                    <Example example_title="管线数据搜索" @ask_question="ask_question" @show_question="show_question" example_intro="自建数据库中搜索管线数据" text_input="介绍一下的Menin抑制剂的研发进展" icon_name="Pill" />
                  </div>
                </TabsContent>
                
                <TabsContent value="molecule" class="space-y-0">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Example example_title="ADMET计算" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="预测ADMET相关性质，支持17种物化性质、5种药化性质、6种成药性规则、21种ADME性质、27种毒性性质的系统性评价。" text_input="请帮计算图片中分子的Caco-2的值" icon_name="Atom" :file_upload_list="['molecule.png']" />
                    <Example example_title="对接计算" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="使用DrugFlow的CarsiDock评估蛋白-配体的结合构象和结合亲和力。" text_input="请帮我对接，并打开异构体" icon_name="Dna" :file_upload_list="['for_docking.pdb', 'for_docking.sdf']" />
                    <Example :disabled="if_ldap" example_title="结构提取" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro_header="(调试中)" example_intro="该功能用于快速获取图中分子结构的信息，得到的结构式和分析结果可随时导出为计算机可读的各类格式(SDF/CSV等类型)。" text_input="请帮我提取PDF中分子的结构" icon_name="LayoutDashboard" :file_upload_list="['molecule.pdf']" />
                  </div>
                </TabsContent>
                
                <TabsContent value="protein" v-if="if_ldap" class="space-y-0">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Example example_title="抗体开发分析WorkFlow" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Antibody Developability and TCE Analysis Workflow 抗体开发性和TCE分析工作流。这是一个综合的抗体分析工作流，包含多个分析步骤：FASTA文件处理、蛋白质理化性质分析、Patch分析和免疫原性预测。" text_input="请帮我跑一下抗体开发分析工作流" icon_name="Workflow" :file_upload_list="['antibody_workflow.fasta']" />
                    <Example example_title="蛋白物化性质计算" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Protein Physico Chemical Properties 计算蛋白等电点、消光系数等属性。" text_input="请帮我预测该蛋白分子的物理化学性质" icon_name="Atom" :file_upload_list="['example.fasta']" />
                    <Example example_title="PTM预测" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol PTM Hotspot by Sequence 扫描抗体序列发现潜在的翻译后修饰（PTM）风险位点， PTM 位点是生物制剂开发的常见风险。" text_input="请帮我预测该蛋白的PTM位点" icon_name="Dna" :file_upload_list="['ptm_example.fasta']" />
                    <Example example_title="Patch分析" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Patch Analysis 分析蛋白质表面的Patch的大小和分布，用于解决蛋白质的聚集等问题。" text_input="请帮我预测该蛋白的Patch位点" icon_name="LayoutDashboard" :file_upload_list="['patch_example.pdb']" />
                    <Example example_title="免疫原性风险" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Immunogenicity Prediction (AlphaMHC v3.0 beta)实现了从序列到临床免疫原性风险的端到端的预测。" text_input="请帮我预测该蛋白的免疫原性风险" icon_name="LayoutDashboard" :file_upload_list="['example.fasta']" />
                    <Example example_title="多序列比对" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Multiple Sequence Alignment 基于渐进（progressive）比对算法进行多重序列比对" text_input="请帮我比对这些蛋白的序列" icon_name="AlignCenterHorizontal" :file_upload_list="['multi_alignment.fasta']" />
                    <!-- <Example example_title="序列聚类" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Sequence Clustering 使用DBSCAN算法对多序列比对（MSA）后的结果进行聚类分析" text_input="请帮我聚类这些蛋白的序列" icon_name="Boxes" :file_upload_list="['ptm_example.fasta']" /> -->
                    <Example example_title="溶解度预测" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Solubility Score 根据三种不同方法计算蛋白溶解度" text_input="请帮我预测该蛋白的溶解度" icon_name="Waves" :file_upload_list="['example.fasta']" />
                    <Example example_title="聚集倾向预测" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Aggregation Score 用于预测蛋白质结构中的聚集倾向和易聚集的位点" text_input="请帮我预测该蛋白的聚集倾向" icon_name="Boxes" :file_upload_list="['aggregation.pdb']" />
                    <Example example_title="CDR专利检索" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Patent BLAST 该模块可以从现有专利库中检索到与目标CDR最接近的序列" text_input="请帮我检索该蛋白的专利" icon_name="FileSearch2" :file_upload_list="['example.fasta']" />
                    <Example example_title="专利序列提取" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Patent Sequence Listing 是批量从专利文本文件中提取序列的工具" text_input="请帮我提取该专利的序列" icon_name="RailSymbol" :file_upload_list="['patent.png']" />
                    <Example example_title="抗体编号" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Antibody Numbering 是抗体编号模块，用于注释抗体可变区（Fv）或恒定区（包括 Fc）" text_input="请帮我注释该抗体的编号" icon_name="ArrowUp01" :file_upload_list="['antibody.fasta']" />
                    <Example example_title="germline分布" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Germline AA Distribution Frequency 模块输出抗体各位置的germline的氨基酸频率分布" text_input="请帮我输出该抗体的germline分布" icon_name="LayoutDashboard" :file_upload_list="['demo_aa.fasta']" />
                    <Example example_title="germline比对" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol Germline Blast，通过序列比对从数据库中搜索与目标抗体序列最接近的同源模板" text_input="请帮我比对该抗体的germline" icon_name="AlignCenterHorizontal" :file_upload_list="['demo_aa.fasta']" />
                    <Example example_title="结构预测（开源）" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="Wemol提供不同工具（ESMFold, Boltz-1, Protinex）预测蛋白结构" text_input="使用Boltz帮我预测下该fasta的蛋白结构" icon_name="Dna" :file_upload_list="['example.fasta']" />
                    <Example example_title="结构预测（AF3）" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="AlphaFold3工具预测蛋白结构" text_input="使用AF3帮我预测下该fasta的蛋白结构" icon_name="Dna" :file_upload_list="['example.fasta']" />
                  </div>
                </TabsContent>
                
                <TabsContent value="knowledge" class="space-y-0">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Example example_title="文献总结" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="使用高精度PDF解析和多路智能召回，精准查询知识库信息" text_input="请帮我总结这篇文献的主要内容" icon_name="FileText" :file_upload_list="['example.pdf']" />
                    <Example example_title="表格提取" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="使用高精度PDF解析和多路智能召回，精准查询知识库信息" text_input="请帮我提取这个文献表2的内容" icon_name="Table2" :file_upload_list="['example_table.pdf']" />
                    <Example example_title="知识库查询" @ask_question="ask_question" @show_question="show_question" @select_knowledge="select_knowledge" example_intro="使用高精度PDF解析和多路智能召回，精准查询知识库信息" text_input="帮我比较知识库中不同模型的效果" icon_name="SquareSplitHorizontal" :knowledge_create="true" :knowledge_select="true" />
                  </div>
                </TabsContent>
                
                <TabsContent value="general" class="space-y-0">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Example example_title="互联网查询" @ask_question="ask_question" @show_question="show_question" example_intro="自动判断需要使用的工具，联合各个搜索引擎查询结果" text_input="请分析下PTHR1靶点的市场机会" icon_name="BookOpen" />
                    <Example example_title="PPT制作" @ask_question="ask_question" @show_question="show_question" example_intro="自动生成专业的PPT演示文稿" text_input="帮我制作一个关于人工智能发展的PPT" icon_name="Presentation" />
                    <Example example_title="图片问答" @ask_question="ask_question" @show_question="show_question" @load_example_file="load_example_file" example_intro="自动解析图片中的分子和文字" text_input="解析图片内容" icon_name="Bot" :file_upload_list="['molecule.png']" />
                    <Example example_title="页面分析" @ask_question="ask_question" @show_question="show_question" example_intro="自动爬取页面内容，并进行分析" text_input="https://go.drugbank.com/drugs/DB00684 请解析该链接内容" icon_name="LayoutTemplate" />
                  </div>
                </TabsContent>
                
                <TabsContent value="research" class="space-y-0">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Example 
                      example_title="立项调研助手" 
                      @ask_question="ask_question" 
                      @show_question="show_question" 
                      @select_template="select_template"
                      text_input="帮我调研下卡替拉韦Cabotegravir" 
                      icon_name="FileText" 
                      template_name="产品信息调研报告输出模版" 
                      icon_before_text="基于非专利药立项调研模板，生成结构化的产品调研报告。输出完成后可以点击下方下载按钮"
                      icon_after_text="进行文档导出。"
                      :template_select="true"
                      :show_download_icon="true"
                    />
                    <Example 
                      example_title="靶点调研助手" 
                      @ask_question="ask_question" 
                      @show_question="show_question" 
                      @select_template="select_template"
                      icon_before_text="基于靶点调研模版，生成结构化的靶点研究报告。输出完成后可以点击下方下载按钮"
                      icon_after_text="进行文档导出。"
                      text_input="帮我调研下PTHR1靶点" 
                      icon_name="FileText"
                      :template_select="true"
                      template_name="靶点调研模版"
                      :show_download_icon="true"
                    />
                    <Example 
                      example_title="项目立项评估" 
                      @ask_question="ask_question" 
                      @show_question="show_question" 
                      @select_template="select_template"
                      example_intro_header="(调试中)"
                      icon_before_text="根据用户上传的项目立项材料，生成结构化的项目立项评估报告。输出完成后可以点击下方下载按钮"
                      icon_after_text="进行文档导出。"
                      text_input="帮我进行项目立项评估" 
                      icon_name="FileText"
                      :template_select="true"
                      template_name="项目立项评估模版"
                      :show_download_icon="true"
                    />
                    <Example 
                      example_title="关键节点项目评估" 
                      @ask_question="ask_question" 
                      @show_question="show_question" 
                      @select_template="select_template"
                      example_intro_header="(调试中)"
                      icon_before_text="根据用户上传的关键节点项目评估材料，生成结构化的项目评估报告。输出完成后可以点击下方下载按钮"
                      icon_after_text="进行文档导出。"
                      text_input="帮我进行关键节点项目评估" 
                      icon_name="FileText"
                      :template_select="true"
                      template_name="关键节点项目评估模版"
                      :show_download_icon="true"
                    />
                    <Example 
                      example_title="与关键竞品的差异化分析" 
                      @ask_question="ask_question" 
                      @show_question="show_question" 
                      @select_template="select_template"
                      example_intro_header="(调试中)"
                      icon_before_text="根据用户输入的信息，生成结构化的差异化分析报告。输出完成后可以点击下方下载按钮"
                      icon_after_text="进行文档导出。"
                      text_input="帮我进行与XXXX(请填写需要分析的一个或多个关键竞品)的差异化分析" 
                      icon_name="FileText"
                      :template_select="true"
                      template_name="关键竞品的差异化分析模版"
                      :show_download_icon="true"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="phrases" class="space-y-0">
                  <div class="space-y-6">
                    <!-- Add phrase button -->
                    <div class="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                      <h3 class="text-lg font-semibold text-gray-800">我的常用语</h3>
                      <Button 
                        @click="showAddPhraseDialog = true"
                        class="flex items-center gap-2 h-10 px-4"
                      >
                        <Plus class="h-4 w-4" />
                        添加常用语
                      </Button>
                    </div>
                    
                    <!-- Loading state -->
                    <div v-if="isLoadingPhrases" class="flex items-center justify-center py-12">
                      <Loader2 class="h-6 w-6 animate-spin text-gray-500" />
                      <span class="ml-2 text-gray-500">加载中...</span>
                    </div>
                    
                    <!-- Empty state -->
                    <div v-else-if="phrases.length === 0" class="text-center py-16">
                      <div class="text-gray-400 mb-4">
                        <MessageSquare class="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p class="text-lg font-medium">暂无常用语</p>
                        <p class="text-sm mt-2 text-gray-500">点击上方"添加常用语"按钮开始创建</p>
                      </div>
                    </div>
                    
                    <!-- Phrases grid -->
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <PhraseCard
                        v-for="phrase in phrases"
                        :key="phrase.id"
                        :phrase="phrase"
                        @copy-phrase="handleCopyPhrase"
                        @delete-phrase="handleDeletePhrase"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
             
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Phrase Dialog -->
    <AddPhraseDialog
      v-model:open="showAddPhraseDialog"
      @phrase-added="handleAddPhrase"
    />
  </ScrollArea>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import ask_button from '@/pages/ask/ask_button.vue'
import { useStore } from '@/stores/index.js'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Example from './components/example.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, MessageSquare } from 'lucide-vue-next'
import PhraseCard from './components/PhraseCard.vue'
import AddPhraseDialog from './components/AddPhraseDialog.vue'
import { get_phrases_api, delete_phrase_api } from '@/api/common.js'
import { useToast } from '@/components/ui/toast'
import { ref, onMounted, type PropType } from 'vue'

const store = useStore()
const { toast } = useToast()

const props = defineProps({
  docIds: {
    type: Array as PropType<string[]>,
    default: () => []
  }
})

const ask_button_ref = ref<any>(null)
store.channel_id = ''

const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

// 常用语相关状态
const phrases = ref<any[]>([])
const isLoadingPhrases = ref(false)
const showAddPhraseDialog = ref(false)

const select_knowledge = () => {
  // 跳转至知识库中心页面
  console.log('ssselect_knowledge')
  ask_button_ref.value.show_knowledge = true
  ask_button_ref.value.show_files = false
  ask_button_ref.value.currentTab = 'knowledge'
}

const select_template = () => {
  // 引导用户选择模版
  console.log('select_template')
  // 触发模版选择对话框
  ;(ask_button_ref.value as any)?.open_template_dialog()
}

const load_example_file = async (name: string) => {
  // 前端直接获取该文件
  // emit 加载文件
  // 直接加载public里面文件
  try {
    const file = await fetch(`/examples/${name}`)
    const blob = await file.blob()
    const newFile = new File([blob], name, { type: blob.type })
    ask_button_ref.value?.handleFiles([newFile])
  } catch (error) {
    console.error('Failed to load example file:', error)
  }
}

const ask_question = (question: string) => {
  console.log('ask_question', question)
  ask_button_ref.value?.ask_question(question)
}

const show_question = (question: string) => {
  console.log('show_question', question)
  ask_button_ref.value?.show_question(question)
}

// 常用语相关方法
const loadPhrases = async () => {
  isLoadingPhrases.value = true
  try {
    const response = await get_phrases_api()
    phrases.value = response.data?.data?.items || []
  } catch (error) {
    console.error('Load phrases error:', error)
    // toast({
    //   title: '加载失败',
    //   description: '无法加载常用语列表',
    //   variant: 'destructive'
    // })
  } finally {
    isLoadingPhrases.value = false
  }
}

const handleCopyPhrase = (content: string) => {
  show_question(content)
}

const handleDeletePhrase = async (phraseId: string) => {
  try {
    await delete_phrase_api(phraseId)
    
    // 删除成功后从本地列表中移除
    phrases.value = phrases.value.filter(p => p.id !== phraseId)
    
    toast({
      title: '删除成功',
      description: '常用语已删除'
    })
  } catch (error) {
    console.error('Delete phrase error:', error)
    toast({
      title: '删除失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  }
}

const handleAddPhrase = async () => {
  // get_phrases_api
  const response = await get_phrases_api()
  phrases.value = response.data?.data?.items || []
}

// 组件挂载时加载常用语
onMounted(() => {
  loadPhrases()
})

</script>