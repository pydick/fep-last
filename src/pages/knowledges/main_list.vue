<template>
  <div class="flex flex-col h-full px-4 mx-auto w-full max-w-full lg:max-w-screen-xl xl:max-w-screen-2xl">
    <Button 
      variant="ghost" 
      size="sm" 
      @click="go_back" 
      class="border border-gray-200 mb-4 py-1 px-3 rounded-md hover:bg-gray-50 transition-colors w-fit"
    >
      <ArrowLeft class="h-4 w-4 mr-1" />
      <span class="text-xs">返回</span>
    </Button>
    
    <!-- Header section -->
    <div class="flex flex-col mb-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">{{ store.folder_name != 'folder_for_question_channel' ? store.folder_name : '个人文件夹' }}</h1>
        <div class="flex space-x-2">
          <input
            type="file"
            ref="fileInput"
            multiple
            accept=".pdf,.PDF,.jpg,.JPG,.jpeg,.JPEG,.png,.PNG,.pptx,.PPTX,.docx,.DOCX,.TXT,.txt"
            class="hidden"
            @change="handleFileUpload"
          />
          <Button 
            size="sm" 
            variant="default" 
            class="shadow-sm hover:shadow transition-all" 
            :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner"
            @click="$refs.fileInput.click()"
            v-if="store.folder_name != '共享文件夹'"
          >
            <Upload class="mr-2 h-4 w-4" />
            上传文件
          </Button>
        </div>
      </div>
    </div>

    <div class="flex space-x-4 w-full">
      <ScrollArea 
        class="max-h-[calc(100vh-120px)] w-full"
      >
        <div 
          class="w-full transition-all duration-200"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{'border-2 border-dashed border-primary/50 bg-primary/5 p-4': isDragging}"
        >
          <!-- Table section -->
          <Card class="shadow-md overflow-hidden">
            <CardContent class="p-0">
              <div class="flex justify-between items-center border-b border-gray-100 p-1">
                <!-- Batch Operations -->
                <div class="flex items-center space-x-2">
                  <DropdownMenu v-if="selectedFiles.length > 0">
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" class="flex items-center">
                        <Settings class="h-4 w-4 mr-2" />
                        批量操作 ({{ selectedFiles.length }})
                        <ChevronDown class="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" class="w-48">
                      <DropdownMenuLabel>选中 {{ selectedFiles.length }} 个文件</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="batchChat" :disabled="selectedFiles.length > 6">
                        <MessageCirclePlus class="h-4 w-4 mr-2" />
                        <span>批量加入对话</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="batchShare" :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner">
                        <Share2 class="h-4 w-4 mr-2" />
                        <span>批量分享</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="batchMove" :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner">
                        <FolderInput class="h-4 w-4 mr-2" />
                        <span>批量移动</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="batchCopy">
                        <Copy class="h-4 w-4 mr-2" />
                        <span>批量复制</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="batchDownload">
                        <Download class="h-4 w-4 mr-2" />
                        <span>批量下载</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="batchDelete" :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner" class="text-destructive focus:text-destructive">
                        <Trash2 class="h-4 w-4 mr-2" />
                        <span>批量删除</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button v-else variant="outline" size="sm" disabled class="flex items-center text-gray-400">
                    <Settings class="h-4 w-4 mr-2" />
                    批量操作
                    <ChevronDown class="h-4 w-4 ml-2" />
                  </Button>
                </div>
                <!-- Search Bar -->
                <div class="relative">
                  <Input
                    size="sm"
                    class="pl-8 w-48"
                    placeholder="搜索文件..."
                    v-model="searchQuery"
                    @input="debounceSearch"
                  />
                  <Search class="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <div class="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow class="bg-accent border-b border-gray-200">
                      <TableHead class="w-10 shrink-0">
                        <Checkbox 
                          :checked="isAllSelected" 
                          @update:checked="toggleSelectAll" 
                          :indeterminate="hasSelected && !isAllSelected"
                        />
                      </TableHead>
                      <TableHead class="max-w-[50%]">文件名称 / 期刊</TableHead>
                      <TableHead class="w-24 shrink-0">状态</TableHead>
                      <TableHead class="w-32 shrink-0">时间</TableHead>
                      <TableHead class="w-24 shrink-0" v-if="store.folder_name == '共享文件夹'">所属人</TableHead>
                      <TableHead class="min-w-[120px] max-w-[180px]" v-if="store.folder_name !== 'folder_for_question_channel' && store.folder_name !== '共享文件夹'">标签</TableHead>
                      <TableHead class="min-w-[64px] max-w-[96px]">分享<br />对象</TableHead>
                      <TableHead class="w-24 shrink-0">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <template v-if="loading">
                      <TableRow v-for="i in 3" :key="i">
                        <TableCell colspan="7" class="p-4">
                          <div class="space-y-3">
                            <Skeleton class="h-4 w-full" />
                            <Skeleton class="h-4 w-[80%]" />
                          </div>
                        </TableCell>
                      </TableRow>
                    </template>
                    <template v-else-if="filteredFilesList.length === 0">
                      <TableRow>
                        <TableCell colspan="7" class="py-24">
                          <div class="flex flex-col items-center justify-center text-center">
                            <FileX class="h-12 w-12 text-gray-300 mb-2" />
                            <p class="text-gray-500 font-medium text-lg">
                              {{ selectedTagFilter ? `没有找到标签为 "${selectedTagFilter}" 的文件` : '暂无文件' }}
                            </p>
                            <p class="text-gray-400 text-sm mt-1">
                              {{ selectedTagFilter ? '尝试选择其他标签或清除筛选' : '点击上传按钮或拖拽文件到此处上传' }}
                            </p>
                            <div class="flex gap-2 mt-4">
                              <Button 
                                v-if="selectedTagFilter" 
                                variant="outline" 
                                size="sm" 
                                @click="clearTagFilter"
                              >
                                清除筛选
                              </Button>
                              <Button 
                                v-if="!selectedTagFilter"
                                variant="default" 
                                size="sm" 
                                @click="$refs.fileInput.click()"
                              >
                                <Upload class="mr-2 h-4 w-4" />
                                上传文件
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </template>
                    <template v-else>
                      <TableRow 
                        v-for="file in filteredFilesList" 
                        :key="file.docId"
                        class="hover:bg-gray-50 transition-colors"
                        :class="{'bg-primary/5': selectedFiles.includes(file.docId)}"
                      >
                        <TableCell class="py-3 w-10">
                          <Checkbox 
                            :checked="selectedFiles.includes(file.docId)"
                            @update:checked="toggleSelect(file.docId)"
                          />
                        </TableCell>
                        <TableCell class="py-3 max-w-[50%]">
                          <div class="flex flex-col cursor-pointer w-full" @click="download_pdf(file)">
                            <span class="block line-clamp-2 text-gray-900 font-medium break-all">{{ file.title }}</span>
                            <span class="block truncate text-xs text-gray-500 mt-0.5 break-all">{{ file.journal_name }}</span>
                          </div>
                        </TableCell>
                        <TableCell class="p-2 py-3 w-24">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge 
                                  v-if="file.parseStatus === 1" 
                                  class="text-xs"
                                  variant='secondary'
                                >
                                  进度: {{ file.parse_progress }}%
                                </Badge>
                                <Badge
                                  v-else
                                  class="text-sm"
                                  :variant="file.parseStatus === 2 ? 'secondary' : 'destructive'"
                                >
                                  {{ file.parseStatus === 2 ? 'success' : 'failed' }}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent class="bg-white p-3 shadow-lg rounded-lg" v-if="file.progress_texts && file.progress_texts.length">
                                <div v-for="(text, index) in file.progress_texts" :key="index" class="text-sm text-gray-500 mt-1">
                                  {{ text }}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell class="p-2 py-3 text-gray-500 w-32">
                          {{ new Date(file.createTime).toLocaleDateString() }}
                        </TableCell>
                        <TableCell class="p-2 py-3 w-24 min-w-[64px]" v-if="store.folder_name == '共享文件夹'">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div 
                                  class="text-xs font-medium max-w-[96px] truncate"
                                >
                                  {{ file.username ? file?.username : file?.owner_department }}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div class="text-xs">
                                  <p class="font-medium">
                                    {{ file.username || file.owner_department }}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell class="p-2 py-3 min-w-[120px] max-w-[180px]" v-if="store.folder_name !== 'folder_for_question_channel' && store.folder_name !== '共享文件夹'">
                          <div class="flex flex-wrap gap-1 items-center">
                            <!-- 现有标签 -->
                            <div 
                              v-for="(tag, index) in (file.tag || ['default'])" 
                              :key="index"
                              class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                            >
                              {{ tag }}
                              <button 
                                @click.stop.prevent="removeTag(file, index)"
                                class="text-blue-600 hover:text-blue-800 cursor-pointer"
                                type="button"
                                style="z-index: 10; position: relative;"
                              >
                                <X class="h-3 w-3" />
                              </button>
                            </div>
                            
                            <!-- 内联输入框 -->
                            <div 
                              v-if="editingFileId === file.docId"
                              class="inline-flex items-center"
                            >
                              <Input
                                v-model="newTagInput"
                                :placeholder="isCurrentTagDuplicate ? '标签重复！' : '输入标签...'"
                                :class="[
                                  'h-6 text-xs w-20',
                                  isCurrentTagDuplicate ? 'border-red-500 bg-red-50 text-red-600' : ''
                                ]"
                                @keydown.enter.prevent="addTagToFile(file)"
                                @keydown.escape="cancelTagInput()"
                                @blur="cancelTagInput()"
                                ref="tagInput"
                              />
                              <!-- 重复提示 -->
                              <div 
                                v-if="isCurrentTagDuplicate && newTagInput.trim()"
                                class="ml-1 text-xs text-red-500"
                                title="该标签已存在"
                              >
                                ⚠️
                              </div>
                            </div>
                            
                            <!-- 添加按钮 -->
                            <button 
                              v-else
                              @click.stop.prevent="startTagInput(file)"
                              class="inline-flex items-center gap-1 px-2 py-1 text-xs border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 rounded-md cursor-pointer"
                              type="button"
                              style="z-index: 10; position: relative;"
                            >
                              <Plus class="h-3 w-3" />
                              添加
                            </button>
                          </div>
                        </TableCell>
                        <TableCell class="p-2 py-3 min-w-[68px] max-w-[96px]">
                          <ShareIcon :share_permissions="file?.share_permissions || []" />
                        </TableCell>
                        <TableCell class="p-2 py-3 w-24">
                          <div class="flex space-x-1">
                            <!-- 加入对话 -->
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    class="hover:bg-gray-100 p-1"
                                    @click="chat_doc(file)"
                                  >
                                    <MessageCirclePlus class="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>加入对话</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    class="hover:bg-gray-100 p-1"
                                    :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner"
                                    @click="openShareDialog('doc', file.docId, file.share_permissions)"
                                  >
                                    <Share2 class="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>分享</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    class="hover:bg-gray-100 p-1"
                                    :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner"
                                    @click="openMoveDialog(file.docId)"
                                  >
                                    <FolderInput class="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>移动</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    class="hover:bg-gray-100 p-1"
                                    @click="openCopyDialog(file.docId)"
                                  >
                                    <Copy class="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>复制</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    class="hover:bg-gray-100 p-1"
                                    @click="download_file(file)"
                                  >
                                    <Download class="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>下载</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    class="text-destructive hover:bg-red-50 p-1"
                                    :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner"
                                    @click="openDeleteDialog(file.docId)"
                                  >
                                    <Trash2 class="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>删除</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    </template>
                  </TableBody>
                </Table>
              </div>
              <div v-if="!loading && filteredFilesList.length > 0 && Math.ceil(doc_count / doc_size) > 1" class="flex justify-center my-4 ">
                <div class="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    :disabled="doc_page === 1"
                    @click="changePage(doc_page - 1)"
                    class="hover:bg-gray-100 transition-colors"
                  >
                    上一页
                  </Button>
                  <span class="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md">
                    第 {{ doc_page }} 页 / 共 {{ Math.ceil(doc_count / doc_size) }} 页
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    :disabled="doc_page >= Math.ceil(doc_count / doc_size)"
                    @click="changePage(doc_page + 1)"
                    class="hover:bg-gray-100 transition-colors"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <Card class="w-1/4 rounded-lg overflow-hidden" v-if="store.folder_name != 'folder_for_question_channel' && store.folder_name != '共享文件夹'">
        <CardContent class="p-4 space-y-4">
          <!-- 知识库标题和编辑按钮 -->
          <div class="flex flex-col pb-2 space-y-1">
            <Label class="text-xs text-gray-500 font-medium">知识库名称</Label>
            <Input
              v-model="folder_name"
              class="w-full text-lg font-semibold text-gray-900"
              placeholder="请输入知识库名称"
              :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner"
              @input="debounceUpdateName"
              @keydown.enter.prevent="updateName"
            />
          </div>
          
          <!-- 知识库描述 -->
          <div class="space-y-1">
            <Label class="text-xs text-gray-500 font-medium">描述</Label>
            <textarea 
              v-model="folder_description" 
              :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner"
              class="w-full min-h-[80px] p-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="添加知识库描述..."
              @keydown.enter.prevent="updateDescription"
            />
          </div>

          <!-- 所有标签 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs text-gray-500 font-medium">所有标签</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                @click="refreshAllTags"
                :disabled="allTagsLoading"
                class="h-6 w-6 p-0"
              >
                <RefreshCw class="h-3 w-3" :class="{'animate-spin': allTagsLoading}" />
              </Button>
            </div>
            
            <div v-if="allTagsLoading" class="space-y-1">
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-4 w-12" />
              <Skeleton class="h-4 w-20" />
            </div>
            
            <div v-else-if="filteredTagsList.length === 0" class="text-center text-gray-400 py-2">
              <Tag class="h-4 w-4 mx-auto mb-1 text-gray-300" />
              <p class="text-xs">{{ searchQuery.trim() ? '没有找到匹配的标签' : '暂无标签' }}</p>
            </div>
            
            <div v-else class="flex flex-wrap gap-1">
              <div 
                v-for="tag in filteredTagsList" 
                :key="tag"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                @click="filterByTag(tag)"
              >
                <Tag class="h-3 w-3" />
                {{ tag }}
                <span class="text-gray-500">({{ getTagCount(tag) }})</span>
              </div>
            </div>
            
          </div>
          
          <!-- 知识库详细信息 -->
          <div class="bg-gray-50 p-4 rounded-lg space-y-4 shadow-inner">
            <div class="flex items-start text-sm">
              <Calendar class="h-4 w-4 mr-2 text-gray-400 mt-1" />
              <div class="flex flex-col">
                <span class="text-gray-600 font-medium">创建时间：</span>
                <span class="text-gray-700 text-xs">
                  {{ new Date(folder_create_time).toLocaleDateString() }}
                </span>
              </div>
            </div>
            
            <div class="flex items-start text-sm">
              <UserRound class="h-4 w-4 mr-2 text-gray-400 mt-1" />
              <div class="flex flex-col">
                <span class="text-gray-600 font-medium">所有者：</span>
                <span class="text-gray-700 text-xs">
                  {{ folder_owner || '暂无' }}
                </span>
              </div>
            </div>

            <!-- 增加一个当前权限 -->
            <div class="flex items-start text-sm">
              <Lock class="h-4 w-4 mr-2 text-gray-400 mt-1" />
              <div class="flex flex-col">
                <span class="text-gray-600 font-medium">当前权限：</span>
                <span class="text-gray-700 text-xs">{{ (folder_permission === 'admin' || store.user_info.username === folder_owner) ? '管理' : '只读' }}</span>
              </div>
            </div>

            <div class="flex items-start text-sm">
              <Share2 class="h-4 w-4 mr-2 text-gray-400 mt-1" />
              <div class="flex flex-col">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 font-medium">分享对象：</span>
                  <Button size="sm" class="h-5" 
                    @click="openShareDialog('folder')"
                    :disabled="folder_permission !== 'admin' && store.user_info.username !== folder_owner"
                  >
                    <UserRoundPlus class="h-3 w-3 text-white-500" />
                    <span class="text-xs">分享</span>
                  </Button>
                </div>
                <ShareIcon :share_permissions="folder_share_users || []" class="mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <Dialog :open="showUploadDialog" @update:open="showUploadDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>上传文件</DialogTitle>
        <DialogDescription>
          {{ uploadCompleted ? '文件上传完成，请选择是否解析分子' : '正在上传您的文件，请稍候...' }}
        </DialogDescription>
      </DialogHeader>
      <Progress v-model="uploadProgress" v-if="!uploadCompleted" />
      <ScrollArea class="max-h-60">
        <div class="space-y-2 pr-2">
          <div v-for="file in uploadFiles" :key="file.title" class="flex items-center justify-between gap-2">
            <span class="text-sm truncate flex-1 min-w-0 whitespace-normal break-words" :title="file.title">{{ file.title }}</span>
          </div>
        </div>
      </ScrollArea>
      
      <!-- 解析选项 -->
      <div v-if="uploadCompleted && hasPdfFilesInUpload" class="space-y-4 pt-4 border-t">
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
          >
            开始解析
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>

  <Dialog :open="showMoveDialog" @update:open="showMoveDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>移动文档</DialogTitle>
        <DialogDescription>
          请选择要移动到的目标文件夹
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>目标文件夹</Label>
          <Select v-model="moveTargetFolder">
            <SelectTrigger>
              <SelectValue placeholder="选择目标文件夹" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem 
                  v-for="folder in store.knowledge_folders" 
                  :key="folder.id"
                  :value="folder.id"
                  :disabled="folder.id === folder_id"
                >
                  {{ folder.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showMoveDialog = false">取消</Button>
          <Button 
            :disabled="!moveTargetFolder || moveLoading" 
            @click="confirmMove"
          >
            确定
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>

  <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认删除</AlertDialogTitle>
        <AlertDialogDescription>
          您确定要删除此文档吗？此操作无法撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showDeleteDialog = false">取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmDelete">确定</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <Dialog :open="shareFolderDialog" @update:open="shareFolderDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>分享知识库</DialogTitle>
      </DialogHeader>

      <!-- 当前已经分享的人和组织 -->
      <div class="grid gap-2 pt-2" v-if="(current_share_type === 'folder' && folder_share_users.length > 0) || (current_share_type !== 'folder' && file_share_permissions.length > 0)">
        <div class="space-y-2">
          <Label>当前分享对象</Label>
          <div class="flex flex-wrap gap-2" v-if="current_share_type === 'folder'">
            <Badge 
              v-for="user in folder_share_users" 
              :key="user.id" 
              variant="secondary"
              class="pr-1 flex items-center gap-1 text-white hover:text-white"
              :class="{ 'bg-green-500 hover:bg-green-600': user.permission_type === 'read', 'bg-blue-500 hover:bg-blue-600': user.permission_type === 'admin' }"
            >
              <span>{{ user.show_name || user.user_name || user.name || '未知' }}: {{ user.permission_type === 'read' ? '只读' : '管理' }}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                class="h-5 w-5 p-0 hover:bg-gray-200 rounded-full"
                @click.stop="confirmRemoveShare(user)"
              >
                <X class="h-3 w-3" />
              </Button>
            </Badge>
          </div>
          <div class="flex flex-wrap gap-2" v-else>
            <Badge 
              v-for="user in file_share_permissions" 
              :key="user.id" 
              variant="secondary"
              class="pr-1 flex items-center gap-1 text-white hover:text-white"
              :class="{ 'bg-green-500 hover:bg-green-600': user.permission_type === 'read', 'bg-blue-500 hover:bg-blue-600': user.permission_type === 'admin' }"
            >
              <span>{{ user.show_name || user.user_name || user.name || user.department || '未知' }}: {{ user.permission_type === 'read' ? '只读' : '管理' }}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                class="h-5 w-5 p-0 hover:bg-gray-200 rounded-full"
                @click.stop="confirmRemoveShare(user)"
              >
                <X class="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        </div>
      </div>

      <div class="grid gap-4 py-4">
        <div class="space-y-2">
          <Label>选择分享对象</Label>
          <ShareTemplate @update:share-object="folderShareObject = $event" />
          <Label v-if="folderShareObject.length > 0">选择分享权限</Label>
          <Select v-model="folderSharePermission" v-if="folderShareObject.length > 0">
            <SelectTrigger>
              <SelectValue placeholder="请选择分享权限" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">只读</SelectItem>
              <SelectItem value="admin">管理</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="shareFolderDialog = false">取消</Button>
        <Button @click="submitShareFolder" :loading="btnLoading">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog :open="showRemoveShareDialog" @update:open="showRemoveShareDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认移除分享</AlertDialogTitle>
        <AlertDialogDescription>
          您确定要移除吗？
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showRemoveShareDialog = false">取消</AlertDialogCancel>
        <AlertDialogAction @click="removeShare">确定</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <Dialog :open="showCopyDialog" @update:open="showCopyDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>复制文档</DialogTitle>
        <DialogDescription>
          请选择要复制到的目标文件夹
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>目标文件夹</Label>
          <Select v-model="copyTargetFolder">
            <SelectTrigger>
              <SelectValue placeholder="选择目标文件夹" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem 
                  v-for="folder in store.knowledge_folders" 
                  :key="folder.id"
                  :value="folder.id"
                  :disabled="folder.id === folder_id"
                >
                  {{ folder.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCopyDialog = false">取消</Button>
          <Button 
            :disabled="!copyTargetFolder || copyLoading" 
            @click="confirmCopy"
          >
            确定
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>

  <!-- New Batch Share Dialog -->
  <Dialog :open="showBatchShareDialog" @update:open="showBatchShareDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>批量分享文件</DialogTitle>
        <DialogDescription>
          选择要分享的对象和权限
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-2">
        <div class="space-y-2">
          <Label>已选择 {{ selectedFiles.length }} 个文件</Label>
          <ShareTemplate @update:share-object="batchShareObject = $event" />
          <Label>选择分享权限</Label>
          <Select v-model="batchSharePermission">
            <SelectTrigger>
              <SelectValue placeholder="请选择分享权限" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">只读</SelectItem>
              <SelectItem value="admin">管理</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showBatchShareDialog = false">取消</Button>
        <Button @click="confirmBatchShare" :loading="batchBtnLoading">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Batch Move Dialog -->
  <Dialog :open="showBatchMoveDialog" @update:open="showBatchMoveDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>批量移动文件</DialogTitle>
        <DialogDescription>
          请选择要移动到的目标文件夹
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <Label>已选择 {{ selectedFiles.length }} 个文件</Label>
        </div>
        <div class="space-y-2">
          <Label>目标文件夹</Label>
          <Select v-model="batchMoveTargetFolder">
            <SelectTrigger>
              <SelectValue placeholder="选择目标文件夹" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem 
                  v-for="folder in store.knowledge_folders" 
                  :key="folder.id"
                  :value="folder.id"
                  :disabled="folder.id === folder_id"
                >
                  {{ folder.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showBatchMoveDialog = false">取消</Button>
          <Button 
            :disabled="!batchMoveTargetFolder || batchBtnLoading" 
            @click="confirmBatchMove"
          >
            确定
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Batch Copy Dialog -->
  <Dialog :open="showBatchCopyDialog" @update:open="showBatchCopyDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>批量复制文件</DialogTitle>
        <DialogDescription>
          请选择要复制到的目标文件夹
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <Label>已选择 {{ selectedFiles.length }} 个文件</Label>
        </div>
        <div class="space-y-2">
          <Label>目标文件夹</Label>
          <Select v-model="batchCopyTargetFolder">
            <SelectTrigger>
              <SelectValue placeholder="选择目标文件夹" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem 
                  v-for="folder in store.knowledge_folders" 
                  :key="folder.id"
                  :value="folder.id"
                  :disabled="folder.id === folder_id"
                >
                  {{ folder.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showBatchCopyDialog = false">取消</Button>
          <Button 
            :disabled="!batchCopyTargetFolder || batchBtnLoading" 
            @click="confirmBatchCopy"
          >
            确定
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Batch Delete Dialog -->
  <AlertDialog :open="showBatchDeleteDialog" @update:open="showBatchDeleteDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认批量删除</AlertDialogTitle>
        <AlertDialogDescription>
          您确定要删除这 {{ selectedFiles.length }} 个文档吗？此操作无法撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showBatchDeleteDialog = false">取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmBatchDelete">确定</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { get_doc_in_folder_api, upload_knowledge_api, parse_knowledge_api, delete_knowledge_api, move_doc_api, get_folder_info_api, edit_folder_api, share_folder_api, share_file_api, cancel_share_api, get_shared_docs_api, open_knowledge_api, copy_doc_api, es_copy_doc_to_question_channel_api, get_folder_tags_api, update_file_tags_api } from '@/api/common.js'
import { useStore } from '@/stores/index.js'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, FolderInput, Trash2, Filter, Share, UserRoundPlus, Download, X, Copy, MessageCirclePlus, Settings, ChevronDown, Plus, RefreshCw, Tag } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
// Removed shadcn TagsInput import to use custom inline implementation
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Edit, Calendar, UserRound, Share2, Search, Lock } from 'lucide-vue-next'
import router from '@/router'
import ShareTemplate from './components/share_template.vue'
import ShareIcon from './components/share_icon.vue'
import { download_pdf_from_s3, arrayBufferToBase64, decryptFile } from '@/utils/common.js'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const store = useStore()
const { folder_id } = storeToRefs(store)
const { toast } = useToast()

const loading = ref(false)
const doc_page = ref(1)
const doc_size = ref(10)
const doc_count = ref(0)
const isDragging = ref(false)
const emits = defineEmits(['updateFolder'])

interface FileListItem {
  timer: ReturnType<typeof setInterval> | null
  docId: string
  title: string
  journal_name: string
  createTime: string
  parseStatus: number  // 0: 未开始, 1: 解析中, 2: 解析完成, 3: 解析失败
  parse_progress: number
  progress_texts: string[]
  download_url: string
  download_key: string
  tag: string[]  // 标签列表，默认为['default']
}

interface UploadFile {
  raw: File
  title: string
  alias: string
  type: number
  size: number
  parseStatus: number
  parseProgress?: number
}

const files_list = ref<FileListItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const showUploadDialog = ref(false)
const uploadProgress = ref(0)
const uploadFiles = ref<UploadFile[]>([])
const uploadCompleted = ref(false)
const parseMolecule = ref(false)
const showDeleteDialog = ref(false)
const docToDelete = ref<string>('')

const showMoveDialog = ref(false)
const moveTargetFolder = ref('')
const moveLoading = ref(false)
const docToMove = ref('')
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const original_description = ref('')
const updateTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const nameUpdateTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const original_name = ref('')
const shareFolderDialog = ref(false)
const folderShareObject = ref([])
const folderSharePermission = ref('read')
const btnLoading = ref(false)
const current_share_type = ref('folder')
const current_doc_id = ref('')
// 当前文件夹的权限
const folder_permission = ref('read')
// Add these refs for share removal
const showRemoveShareDialog = ref(false)
const shareToRemove = ref(null)
const file_share_permissions = ref([])

// Add these new refs for copy functionality
const showCopyDialog = ref(false)
const copyTargetFolder = ref('')
const copyLoading = ref(false)
const docToCopy = ref('')

// Add new refs for multi-select and batch operations
const selectedFiles = ref<string[]>([])
const searchQuery = ref('')
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

// Batch operation dialogs
const showBatchShareDialog = ref(false)
const showBatchMoveDialog = ref(false)
const showBatchCopyDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const batchShareObject = ref([])
const batchSharePermission = ref('read')
const batchMoveTargetFolder = ref('')
const batchCopyTargetFolder = ref('')
const batchBtnLoading = ref(false)

// 标签编辑相关（自定义实现）
const editingFileId = ref<string | null>(null)
const newTagInput = ref('')
const tagInput = ref<HTMLInputElement | null>(null)
const tagsSaving = ref(false)

// 所有标签相关
const allTagsList = ref<string[]>([])
const allTagsLoading = ref(false)
const selectedTagFilter = ref<string | null>(null)

// 搜索过滤后的标签列表
const filteredTagsList = computed(() => {
  if (!searchQuery.value.trim()) {
    return allTagsList.value
  }
  return allTagsList.value.filter(tag => 
    tag.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 筛选后的文件列表
const filteredFilesList = computed(() => {
  if (!selectedTagFilter.value) {
    return files_list.value
  }
  return files_list.value.filter(file => 
    file.tag && file.tag.includes(selectedTagFilter.value!)
  )
})

// 检查当前编辑的文件是否输入了重复标签
const isCurrentTagDuplicate = computed(() => {
  if (!editingFileId.value || !newTagInput.value.trim()) return false
  
  const currentFile = files_list.value.find(f => f.docId === editingFileId.value)
  if (!currentFile || !currentFile.tag) return false
  
  const inputTag = newTagInput.value.trim().toLowerCase()
  return currentFile.tag.some(existingTag => 
    existingTag.toLowerCase().trim() === inputTag
  )
})

// Computed properties for selection state
const isAllSelected = computed(() => {
  return filteredFilesList.value.length > 0 && selectedFiles.value.length === filteredFilesList.value.length
})

const hasSelected = computed(() => {
  return selectedFiles.value.length > 0
})

// Check if uploaded files contain PDF files
const hasPdfFilesInUpload = computed(() => {
  return uploadFiles.value.some(file => {
    const file_type = file.title.split('.').pop()?.toLowerCase() || ''
    return file_type === 'pdf'
  })
})

// Toggle select all files
const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedFiles.value = filteredFilesList.value.map(file => file.docId)
  } else {
    selectedFiles.value = []
  }
}

// Toggle select single file
const toggleSelect = (docId: string) => {
  const index = selectedFiles.value.indexOf(docId)
  if (index === -1) {
    selectedFiles.value.push(docId)
  } else {
    selectedFiles.value.splice(index, 1)
  }
}

// Search functionality
const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    doc_page.value = 1 // Reset to first page when searching
    searchQuery.value = searchQuery.value.trim()
    get_doc_in_folder()
  }, 500)
}

const go_back = () => {
  store.show_main_router = true
  const path = '/knowledges'
  const url = `${window.location.origin}${path}`
  window.history.pushState({ path }, '', url)
  store.show_main_router = true
}

const openMoveDialog = (docId: string) => {
  docToMove.value = docId
  showMoveDialog.value = true
}

const download_pdf = (file: FileListItem) => {
  let url = window.location.origin + '/pdf_viewer?docId=' + file.docId
  if (file.download_url) {
    url += '&download_url=' + file.download_url
  }
  if (file.download_key) {
    url += '&download_key=' + file.download_key
  }
  window.open(url, '_blank');
}

const confirmMove = async () => {
  if (!moveTargetFolder.value) return
  
  moveLoading.value = true
  try {
    const res = await move_doc_api({
      folder_id: moveTargetFolder.value,
      docId: docToMove.value
    })
    
    if (res.data.success) {
      toast({
        title: "移动成功",
        description: "文档已成功移动"
      })
      get_doc_in_folder()
    } else {
      toast({
        title: "移动失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    toast({
      title: "移动失败",
      description: "操作失败，请重试",
      variant: "destructive"
    })
    console.error(err)
  } finally {
    moveLoading.value = false
    showMoveDialog.value = false
    docToMove.value = ''
    moveTargetFolder.value = ''
  }
}

const openDeleteDialog = (docId: string) => {
  docToDelete.value = docId
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    const res = await delete_knowledge_api({ doc_id: docToDelete.value })
    if (res.data.success) {
      toast({
        title: "删除成功",
        description: "文档已成功删除"
      })
      get_doc_in_folder()
    } else {
      toast({
        title: "删除失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    toast({
      title: "删除失败", 
      description: "操作失败，请重试",
      variant: "destructive"
    })
    console.error(err)
  } finally {
    showDeleteDialog.value = false
    docToDelete.value = ''
  }
}

const clean_files_list = () => {
  doc_size.value = 10
  doc_count.value = 0

  // Clear the polling timer if it exists
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }

  files_list.value.forEach(file => {
    if (file.timer) {
      clearInterval(file.timer)
    }
  })
  files_list.value = []
}

const checkFileSize = (file: File) => {
  const maxSize = 150 * 1024 * 1024 // 150MB
  return file.size <= maxSize
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files?.length) return
  processFiles(Array.from(files))
  target.value = ''
}

const closeUploadDialog = () => {
  showUploadDialog.value = false
  uploadCompleted.value = false
  parseMolecule.value = false
  uploadProgress.value = 0
  uploadFiles.value = []
}

const startParsing = async () => {
  if (uploadFiles.value.length === 0) return
  
  try {
    const formData = new FormData()
    formData.append('docIds', uploadFiles.value.map(file => file.docId).join(','))
    formData.append('mol_detect', parseMolecule.value ? 'true' : 'false')
    
    let res = null
    res = await parse_knowledge_api(formData)
    
    if (res.data.status) {
      toast({
        title: "解析已开始",
        description: "正在解析文档内容..."
      })
      get_doc_in_folder()
      emits('updateFolder')
      closeUploadDialog()
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
  }
}

const processFiles = async (files: File[]) => {
  // 检查文件数量上限
  if (files.length > 50) {
    toast({
      title: "上传失败",
      description: "单个知识库文件上限为50篇",
      variant: "destructive"
    })
    return
  }

  // 检查文件类型和大小
  for (const file of files) {
    // 检查文件类型
    const file_type = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'pptx', 'docx']
    
    if (!allowedTypes.includes(file_type)) {
      toast({
        title: "上传失败",
        description: "仅支持PDF、JPEG、JPG、PNG、PPTX、DOCX文件格式",
        variant: "destructive"
      })
      return
    }

    if (!checkFileSize(file)) {
      toast({
        title: "上传失败",
        description: "文件大小不能超过50MB",
        variant: "destructive"
      })
      return
    }
  }

  showUploadDialog.value = true
  uploadProgress.value = 0
  uploadFiles.value = []
  uploadCompleted.value = false
  parseMolecule.value = false

  const formData = new FormData()
  for (const file of files) {
    uploadFiles.value.push({
      raw: file,
      title: file.name,
      alias: file.name,
      type: 1,
      size: file.size,
      parseStatus: -1,
      parseProgress: 0
    })
    formData.append('files', file)
  }

  formData.append('folder_id', store.folder_id)
  // 暂时不进行解析，只上传文件
  formData.append('parse_type', '1')
  formData.append('close_parse', 'true')

  try {
    const res = await upload_knowledge_api(formData, {
      onUploadProgress: (progressEvent: ProgressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      }
    })

    if (res.data.success) {
      // 标记成功上传的文件
      uploadFiles.value.forEach(file => {
        if (file.parseStatus === -1) {
          file.parseStatus = 0 // 标记为上传成功，待解析
        }
      })
      
      // 处理已存在的文件
      if (res.data.data?.file_exists) {
        for (const existFile of res.data.data.file_exists) {
          const file = uploadFiles.value.find(f => f.title === existFile.name)
          if (file) file.parseStatus = -3
        }
      }

      if (res.data.data?.file_exists && res.data.data.file_exists.length > 0) {
        if (res.data.data.file_exists.length === files.length) {
          toast({
            title: "上传失败",
            description: "所有文件已存在",
            variant: "destructive"
          })
        } else {
          if (res.data.data?.name_id && res.data.data.name_id.length > 0) {
            for (let i = 0; i < res.data.data.name_id.length; i++) {
              const docId = res.data.data.name_id[i].docId
              const title = res.data.data.name_id[i].name
              const file = uploadFiles.value.find(f => f.title === title)
              if (file) file.docId = docId
            }
          }
          toast({
            title: "部分上传成功",
            description: "部分文件已存在",
            variant: "warning"
          })
        }
      } else {
        // 获取docId
        if (res.data.data?.name_id && res.data.data.name_id.length > 0) {
          for (let i = 0; i < res.data.data.name_id.length; i++) {
            const docId = res.data.data.name_id[i].docId
            const title = res.data.data.name_id[i].name
            const file = uploadFiles.value.find(f => f.title === title)
            if (file) file.docId = docId
          }
        }
        toast({
          title: "上传成功",
          description: "文件已成功上传"
        })
      }
      
      // 设置上传完成状态，不自动关闭弹窗
      uploadCompleted.value = true
      
      // 检查是否有PDF文件
      const hasPdfFiles = files.some(file => {
        const file_type = file.name.split('.').pop()?.toLowerCase() || ''
        return file_type === 'pdf'
      })
      
      // 检查是否需要自动开始解析
      const shouldAutoStartParsing = false
      
      if (!hasPdfFiles || shouldAutoStartParsing) {
        // 如果没有PDF文件，或者是LDAP环境，直接开始解析
        if (shouldAutoStartParsing && hasPdfFiles) {
          // LDAP环境下的PDF文件，不勾选分子解析
          parseMolecule.value = false
          toast({
            title: "文件已上传",
            description: "正在自动解析文档内容...",
            variant: "default"
          })
        }
        
        // 自动解析时直接关闭上传对话框
        setTimeout(() => {
          startParsing()
          if (shouldAutoStartParsing) {
            closeUploadDialog()
          }
        }, 0)
      }
    } else {
      // 标记所有文件为失败
      uploadFiles.value.forEach(file => file.parseStatus = -2)
      toast({
        title: "上传失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    uploadFiles.value.forEach(file => file.parseStatus = -2)
    toast({
      title: "上传失败",
      description: "网络错误，请重试",
      variant: "destructive"
    })
    console.error(err)
  }
}

interface ApiResponse {
  data: {
    success: boolean
    message?: string
    data?: {
      items: FileListItem[]
      total: number
    }
  }
}

const get_doc_in_folder = async () => {
  // Clear any existing poll timer first
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }

  loading.value = true
  try {
    const param = {
      page: doc_page.value,
      size: doc_size.value,
      folder_id: folder_id.value,
      search: searchQuery.value
    }
    let res
    if (folder_id.value === 'shared_folder') {
      res = await get_shared_docs_api(param)
    } else {
      res = await get_doc_in_folder_api(param) as ApiResponse
    }
    
    
    if (res.data.success && res.data.data) {
      console.log('API返回的文件数据:', res.data.data.items)
      files_list.value = res.data.data.items.map((file: any) => {
        console.log('处理文件:', file.title, '原始tag:', file.tag)
        const processedFile = {
          ...file,
          tag: Array.isArray(file.tag) && file.tag.length > 0 ? file.tag : ['default'] // 确保每个文件都有tag字段，默认为['default']
        }
        console.log('处理后文件:', processedFile.title, '最终tag:', processedFile.tag)
        return processedFile
      })
      doc_count.value = res.data.data.total
      store.folder_file_count = doc_count.value
      emits('updateFolder')

      // 检查是否有正在解析的文件
      const hasParsingFiles = files_list.value.some(file => file.parseStatus === 1)
      if (hasParsingFiles) {
        // 启动轮询并存储计时器引用
        pollTimer.value = setInterval(async () => {
          const pollRes = await get_doc_in_folder_api(param) as ApiResponse
          if (pollRes.data.success && pollRes.data.data) {
            files_list.value.forEach(file => {
              const pollFile = pollRes.data.data.items.find(f => f.docId === file.docId)
              if (pollFile) {
                file.parseStatus = pollFile.parseStatus
                file.parse_progress = pollFile.parse_progress
                file.progress_texts = pollFile.progress_texts
                file.download_url = pollFile.download_url
                file.download_key = pollFile.download_key
                // 更新标签数据
                file.tag = Array.isArray(pollFile.tag) && pollFile.tag.length > 0 ? pollFile.tag : ['default']
              }
            })
            // 检查是否还有正在解析的文件
            const stillParsing = pollRes.data.data.items.some(file => file.parseStatus === 1)
            if (!stillParsing) {
              // 如果没有正在解析的文件，停止轮询
              clearInterval(pollTimer.value)
              pollTimer.value = null
            }
          }
        }, 2000) // 每2秒轮询一次
      }
    } else {
      toast({
        variant: "destructive",
        title: "错误",
        description: res.data.message || "获取文档列表失败"
      })
    }
  } catch (err: unknown) {
    const error = err as Error
    toast({
      variant: "destructive", 
      title: "错误",
      description: error.message || "获取文档列表失败"
    })
  } finally {
    loading.value = false
  }
}

const folder_name = ref('') 
const folder_description = ref('')
const folder_create_time = ref('')
const folder_owner = ref('')
const folder_share_users = ref([])

const get_folder_info = async () => {
  const res = await get_folder_info_api(folder_id.value)
  if (res.data.success) {
    folder_name.value = res.data.data.name
    original_name.value = res.data.data.name
    folder_description.value = res.data.data.description
    original_description.value = res.data.data.description
    folder_create_time.value = res.data.data.createTime
    folder_owner.value = res.data.data.owner_name
    folder_share_users.value = res.data.data.share_object
    if (folder_name.value === 'folder_for_question_channel') {
      folder_permission.value = 'admin'
    } else {
      const share_object = res.data.data.share_object
      for (const item of share_object) {
        if (item?.name === store.user_info.department_name) {
          folder_permission.value = item.permission_type
          break
        } else if (item?.user_name === store.user_info.username) {
          folder_permission.value = item.permission_type
          break
        }
      }
    }
  }
}

// watch store.folder_id
watch(folder_id, (newVal) => {
  console.log('newVal', newVal)
  doc_page.value = 1
  get_doc_in_folder()
  get_folder_info()
  fetchAllTags()
  selectedFiles.value = []
  searchQuery.value = ''
})

onMounted(() => {
  get_doc_in_folder()
  get_folder_info()
  fetchAllTags()
})

// Clean up interval when component is unmounted
onUnmounted(() => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
  
  files_list.value.forEach(file => {
    if (file.timer) {
      clearInterval(file.timer)
    }
  })
})

const handleDragOver = (e: DragEvent) => {
  isDragging.value = true
  // Only allow file drops
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (!e.dataTransfer?.files.length) return
  
  // Process dropped files
  processFiles(Array.from(e.dataTransfer.files))
}

const changePage = async (page: number) => {
  doc_page.value = page
  await get_doc_in_folder()
}

const debounceUpdate = () => {
  // 清除现有的超时
  clearTimeout(updateTimeout.value);
  
  // 设置新的超时 - 0.7秒后提交
  updateTimeout.value = setTimeout(() => {
    updateDescription();
  }, 700);
}

const updateDescription = async () => {
  try {
    // 清除任何现有的超时
    clearTimeout(updateTimeout.value);
    
    // 调用API更新描述
    // 请替换为您的实际API调用
    await edit_folder_api({
      folder_id: folder_id.value,
      description: folder_description.value
    })
    // 提示更新成功
    toast({
      title: "更新成功",
      description: "描述已更新"
    })
  } catch (error) {
    // 更新失败，恢复原始值
    folder_description.value = original_description.value;
    // 可选：显示错误提示
    console.error('更新描述失败:', error);
  } finally {
    // 重置原始描述缓存
    original_description.value = '';
  }
}

const debounceUpdateName = () => {
  // Clear existing timeout
  clearTimeout(nameUpdateTimeout.value);
  
  // Set a new timeout - 700ms delay
  nameUpdateTimeout.value = setTimeout(() => {
    updateName();
  }, 700);
}

const updateName = async () => {
  try {
    // Clear any existing timeout
    clearTimeout(nameUpdateTimeout.value);
    
    // Call API to update the folder name
    await edit_folder_api({
      folder_id: folder_id.value,
      name: folder_name.value
    })
    
    // Update store with new folder name
    store.folder_name = folder_name.value
    
    // Show success message
    toast({
      title: "更新成功",
      description: "知识库名称已更新"
    })
  } catch (error) {
    // Restore original name on failure
    folder_name.value = original_name.value;
    console.error('更新名称失败:', error);
    
    // Show error message
    toast({
      title: "更新失败",
      description: "知识库名称更新失败",
      variant: "destructive"
    })
  }
}

const openShareDialog = (share_type: string='folder', doc_id: string='', share_permissions: any[]=[]) => {
  // Initialize new selection as empty
  folderShareObject.value = []
  folderSharePermission.value = 'read' // Default to read permission
  shareFolderDialog.value = true
  current_share_type.value = share_type
  current_doc_id.value = doc_id
  file_share_permissions.value = share_permissions
}

const submitShareFolder = async () => {
  try {
    btnLoading.value = true
    let res
    if (current_share_type.value === 'folder') {
      res = await share_folder_api({
        folder_id: folder_id.value,
        share_permission: folderSharePermission.value,
        share_object: folderShareObject.value
      })
    } else {
      res = await share_file_api({
        doc_id: current_doc_id.value,
        share_permission: folderSharePermission.value,
        share_object: folderShareObject.value
      })
    }
    
    if (res.data.success) {
      toast({
        title: "分享成功",
        description: "成功分享"
      })
      // Update the local share users list
      if (current_share_type.value === 'folder') {
        get_folder_info()
      } else {
        get_doc_in_folder()
      }
    } else {
      toast({
        variant: "destructive",
        title: "分享失败",
        description: res.data.message || "操作失败，请重试"
      })
    }
  } catch (error) {
    console.error('分享失败:', error)
    toast({
      variant: "destructive",
      title: "分享失败",
      description: "操作失败，请重试"
    })
  } finally {
    btnLoading.value = false
    shareFolderDialog.value = false
  }
}

const confirmRemoveShare = (user: any) => {
  shareToRemove.value = user
  showRemoveShareDialog.value = true
}

const removeShare = async () => {
  if (shareToRemove.value) {
    // 请求移除分享
    const param = {
      share_type: current_share_type.value,
      id: folder_id.value,
      share_object: [shareToRemove.value]
    }
    if (current_share_type.value === 'doc') {
      param.id = current_doc_id.value
    } 
    await cancel_share_api(param)
    if (shareToRemove.value.department) {
      folderShareObject.value = folderShareObject.value.filter(u => u.department !== shareToRemove.value.department)
    } else {
      folderShareObject.value = folderShareObject.value.filter(u => u.user_id !== shareToRemove.value.user_id)
    }
    if (current_share_type.value === 'folder') {
      get_folder_info()
    } else {
      get_doc_in_folder()
      if (shareToRemove.value.department) { 
        file_share_permissions.value = file_share_permissions.value.filter(u => u.department !== shareToRemove.value.department)
      } else {
        file_share_permissions.value = file_share_permissions.value.filter(u => u.user_id !== shareToRemove.value.user_id)
      }
    }
    showRemoveShareDialog.value = false
    shareToRemove.value = null
  }
}

const key = ref('XAEhg51aKKSMHgFUSQJr6hEkWv5gCYJ8j7kfQixCV8c=')

const download_file = async (file: FileListItem) => {
  if (file.download_url) {
   //  下载并解密
   const url = file.download_url as string
   const download_key = file.download_key as string
   let need_decrypt = false
   if (file.title.endsWith('.pdf') || file.title.endsWith('.PDF')) {
    need_decrypt = true
   }
   let decrypted
   const arrayBuffer =await download_pdf_from_s3(url, download_key, false)
   if (need_decrypt) {
     const encryptedBytes = new Uint8Array(arrayBuffer)
     // 从加密数据中提取IV(前16字节)和密文
     const iv = encryptedBytes.slice(0, 16)
     const ciphertext = encryptedBytes.slice(16)
     // 将IV和密文转换为Base64格式的字符串
     const ivBase64 = arrayBufferToBase64(iv.buffer)
     const ciphertextBase64 = arrayBufferToBase64(ciphertext.buffer)
     decrypted = await decryptFile(ciphertextBase64, key.value, ivBase64)
   } else {
     decrypted = arrayBuffer
   }
   const download_file = new File([decrypted], file.title, { type: 'application/pdf' })
   const download_url = window.URL.createObjectURL(download_file)
   const a = document.createElement('a')
   a.href = download_url
   a.download = file.title
   a.click()
   return 
  }

  open_knowledge_api(file.docId as string)
    .then(res => {
      let download_file = null
      if (file.if_img) {
        // Handle image file
        const blob = new Blob([res.data], { type: "image/jpeg" }) // or appropriate image type
        download_file = new File([blob], 'image.jpg', { type: blob.type })
      } else {
        // Handle PDF file
        const blob = new Blob([res.data], { type: "application/pdf" })
        download_file = new File([blob], 'pdf.pdf', { type: blob.type })
      }
      // 下载文件
      const url = window.URL.createObjectURL(download_file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.title
      a.click()
    })
    .catch(() => {
      toast({
        title: "Error",
        description: "下载失败",
      })
    })
}

const openCopyDialog = (docId: string) => {
  docToCopy.value = docId
  showCopyDialog.value = true
}

const confirmCopy = async () => {
  if (!copyTargetFolder.value) return
  
  copyLoading.value = true
  try {
    // You'll need to implement this API endpoint or modify the existing move_doc_api
    // to support copying instead of moving
    const res = await copy_doc_api({
      folder_id: copyTargetFolder.value,
      docId: docToCopy.value
    })
    
    if (res.data.success) {
      toast({
        title: "复制成功",
        description: "文档已成功复制到目标文件夹"
      })
      // No need to refresh the current folder since we're copying, not moving
    } else {
      toast({
        title: "复制失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    toast({
      title: "复制失败",
      description: "操作失败，请重试",
      variant: "destructive"
    })
    console.error(err)
  } finally {
    copyLoading.value = false
    showCopyDialog.value = false
    docToCopy.value = ''
    copyTargetFolder.value = ''
  }
}


const chat_doc = async (file: FileListItem) => {
  const res = await es_copy_doc_to_question_channel_api({
    docId: file.docId,
    folder_id: 'xxx'
  })
  if (!res.data.status) {
    toast({
      title: "失败",
      description: "添加到对话框失败",
      variant: "destructive"
    })
    return
  }
  router.push('/?docIds=' + file.docId)
}

// Batch operation functions
const batchShare = () => {
  batchShareObject.value = []
  batchSharePermission.value = 'read'
  showBatchShareDialog.value = true
}

const confirmBatchShare = async () => {
  try {
    batchBtnLoading.value = true
    // Create an array of promises for each file to share
    const sharePromises = selectedFiles.value.map(docId => {
      return share_file_api({
        doc_id: docId,
        share_permission: batchSharePermission.value,
        share_object: batchShareObject.value
      })
    })
    
    // Wait for all promises to resolve
    const results = await Promise.all(sharePromises)
    
    // Check if all operations were successful
    const allSuccess = results.every(res => res.data.success)
    
    if (allSuccess) {
      toast({
        title: "批量分享成功",
        description: `已成功分享 ${selectedFiles.value.length} 个文件`
      })
      get_doc_in_folder()
    } else {
      toast({
        title: "部分分享失败",
        description: "部分文件可能未能成功分享",
        variant: "warning"
      })
    }
  } catch (error) {
    console.error('批量分享失败:', error)
    toast({
      variant: "destructive",
      title: "分享失败",
      description: "操作失败，请重试"
    })
  } finally {
    batchBtnLoading.value = false
    showBatchShareDialog.value = false
    selectedFiles.value = [] // Clear selection after operation
  }
}

const batchMove = () => {
  batchMoveTargetFolder.value = ''
  showBatchMoveDialog.value = true
}

const confirmBatchMove = async () => {
  if (!batchMoveTargetFolder.value) return
  
  try {
    batchBtnLoading.value = true
    // Create an array of promises for each file to move
    const movePromises = selectedFiles.value.map(docId => {
      return move_doc_api({
        folder_id: batchMoveTargetFolder.value,
        docId: docId
      })
    })
    
    // Wait for all promises to resolve
    const results = await Promise.all(movePromises)
    
    // Check if all operations were successful
    const allSuccess = results.every(res => res.data.success)
    
    if (allSuccess) {
      toast({
        title: "批量移动成功",
        description: `已成功移动 ${selectedFiles.value.length} 个文件`
      })
      get_doc_in_folder()
    } else {
      toast({
        title: "部分移动失败",
        description: "部分文件可能未能成功移动",
        variant: "warning"
      })
    }
  } catch (error) {
    console.error('批量移动失败:', error)
    toast({
      variant: "destructive",
      title: "移动失败",
      description: "操作失败，请重试"
    })
  } finally {
    batchBtnLoading.value = false
    showBatchMoveDialog.value = false
    selectedFiles.value = [] // Clear selection after operation
  }
}

const batchCopy = () => {
  batchCopyTargetFolder.value = ''
  showBatchCopyDialog.value = true
}

const confirmBatchCopy = async () => {
  if (!batchCopyTargetFolder.value) return
  
  try {
    batchBtnLoading.value = true
    // Create an array of promises for each file to copy
    const copyPromises = selectedFiles.value.map(docId => {
      return copy_doc_api({
        folder_id: batchCopyTargetFolder.value,
        docId: docId
      })
    })
    
    // Wait for all promises to resolve
    const results = await Promise.all(copyPromises)
    
    // Check if all operations were successful
    const allSuccess = results.every(res => res.data.success)
    
    if (allSuccess) {
      toast({
        title: "批量复制成功",
        description: `已成功复制 ${selectedFiles.value.length} 个文件`
      })
    } else {
      toast({
        title: "部分复制失败",
        description: "部分文件可能未能成功复制",
        variant: "warning"
      })
    }
  } catch (error) {
    console.error('批量复制失败:', error)
    toast({
      variant: "destructive",
      title: "复制失败",
      description: "操作失败，请重试"
    })
  } finally {
    batchBtnLoading.value = false
    showBatchCopyDialog.value = false
    selectedFiles.value = [] // Clear selection after operation
  }
}

const batchDownload = async () => {
  try {
    // Create an array of promises for each file to download
    const downloadPromises = selectedFiles.value.map(docId => {
      const file = files_list.value.find(f => f.docId === docId)
      if (file) {
        return download_file(file)
      }
      return Promise.resolve() // Skip files that aren't found
    })
    
    // Wait for all promises to resolve
    await Promise.all(downloadPromises)
    
    toast({
      title: "批量下载已开始",
      description: `正在下载 ${selectedFiles.value.length} 个文件`
    })
  } catch (error) {
    console.error('批量下载失败:', error)
    toast({
      variant: "destructive",
      title: "下载失败",
      description: "操作失败，请重试"
    })
  } finally {
    selectedFiles.value = [] // Clear selection after operation
  }
}

const batchDelete = () => {
  showBatchDeleteDialog.value = true
}

const confirmBatchDelete = async () => {
  try {
    // Create an array of promises for each file to delete
    const deletePromises = selectedFiles.value.map(docId => {
      return delete_knowledge_api({ doc_id: docId })
    })
    
    // Wait for all promises to resolve
    const results = await Promise.all(deletePromises)
    
    // Check if all operations were successful
    const allSuccess = results.every(res => res.data.success)
    
    if (allSuccess) {
      toast({
        title: "批量删除成功",
        description: `已成功删除 ${selectedFiles.value.length} 个文件`
      })
      get_doc_in_folder()
    } else {
      toast({
        title: "部分删除失败",
        description: "部分文件可能未能成功删除",
        variant: "warning"
      })
    }
  } catch (error) {
    console.error('批量删除失败:', error)
    toast({
      variant: "destructive",
      title: "删除失败",
      description: "操作失败，请重试"
    })
  } finally {
    showBatchDeleteDialog.value = false
    selectedFiles.value = [] // Clear selection after operation
  }
}

const batchChat = async () => {
  const files = files_list.value.filter(f => selectedFiles.value.includes(f.docId))
  if (files.length > 0) {
    const res = await es_copy_doc_to_question_channel_api({
      docId: 'xxx',
      docIds: files.map(f => f.docId),
      folder_id: 'xxx'
    })
    if (!res.data.status) {
      toast({
        title: "失败",
        description: "添加到对话框失败",
        variant: "destructive"
      })
      return
    }
    router.push('/?docIds=' + files.map(f => f.docId).join(','))
  }
}

// 标签编辑相关函数
const startTagInput = (file: FileListItem) => {
  editingFileId.value = file.docId
  newTagInput.value = ''
  nextTick(() => {
    if (tagInput.value) {
      tagInput.value.focus()
    }
  })
}

const addTagToFile = async (file: FileListItem) => {
  const tag = newTagInput.value.trim()
  if (!tag) return
  if (!file.tag) file.tag = []
  
  // 检查标签是否重复（不区分大小写，去除首尾空格）
  const normalizedTag = tag.toLowerCase()
  const isDuplicate = file.tag.some(existingTag => 
    existingTag.toLowerCase().trim() === normalizedTag
  )
  
  if (isDuplicate) {
    // 不清空输入框，让用户看到重复的标签
    toast({ 
      title: '标签重复', 
      description: `标签 "${tag}" 已存在，请勿重复添加`, 
      variant: 'destructive' 
    })
    return
  }
  
  file.tag.push(tag)
  newTagInput.value = ''
  editingFileId.value = null
  await updateFileTagsToBackend(file)
}

const removeTag = async (file: FileListItem, index: number) => {
  if (!file.tag || file.tag.length <= 1) return
  file.tag.splice(index, 1)
  await updateFileTagsToBackend(file)
}

const cancelTagInput = () => {
  newTagInput.value = ''
  editingFileId.value = null
}

const updateFileTagsToBackend = async (file: FileListItem) => {
  if (tagsSaving.value) return // 防止重复请求
  
  tagsSaving.value = true
  try {
    // 调用实际的更新标签API
    const response = await update_file_tags_api(file.docId, file.tag)
    if (!response.data.success) {
      throw new Error(response.data.message || '更新失败')
    }
    
    console.log('标签已更新到后端:', file.docId, file.tag)
    
    toast({
      title: "更新成功",
      description: "标签已保存"
    })
    
    // 标签更新成功后，延迟刷新所有标签列表（等待数据库操作完成）
    setTimeout(() => {
      refreshAllTags()
    }, 1000) // 1秒延迟确保数据库操作完成
  } catch (error) {
    console.error('保存标签到后端失败:', error)
    toast({
      title: "更新失败",
      description: "标签保存失败，请重试",
      variant: "destructive"
    })
  } finally {
    tagsSaving.value = false
  }
}

// 所有标签相关函数
const fetchAllTags = async () => {
  // 当不需要显示"标签"列时，直接跳过，不请求接口
  if (store.folder_name === 'folder_for_question_channel' || store.folder_name === '共享文件夹') {
    allTagsList.value = []
    allTagsLoading.value = false
    return
  }

  if (!folder_id.value) return
  
  allTagsLoading.value = true
  try {
    const response = await get_folder_tags_api(folder_id.value)
    console.log('get_folder_tags_api 返回的完整数据:', response.data)
    if (response.data.success) {
      // 根据新的返回结构解析标签数据
      allTagsList.value = response.data.data.tags || []
      console.log('获取到的标签列表:', allTagsList.value)
    } else {
      throw new Error(response.data.message || '获取标签失败')
    }
  } catch (error) {
    console.error('获取所有标签失败:', error)
    toast({
      title: "获取标签失败",
      description: "无法加载标签列表，请重试",
      variant: "destructive"
    })
  } finally {
    allTagsLoading.value = false
  }
}

const refreshAllTags = () => {
  fetchAllTags()
}

const getTagCount = (tag: string) => {
  return files_list.value.filter(file => file.tag?.includes(tag)).length
}

const filterByTag = (tag: string) => {
  selectedTagFilter.value = tag
  // 筛选逻辑已通过 computed 属性 filteredFilesList 自动处理
}

const clearTagFilter = () => {
  selectedTagFilter.value = null
  // 清除筛选逻辑已通过 computed 属性 filteredFilesList 自动处理
}

</script>
