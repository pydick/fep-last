<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>添加常用语</DialogTitle>
        <DialogDescription>
          添加您常用的问题或提示语，方便快速使用
        </DialogDescription>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
        <div class="space-y-2">
          <label for="phrase-content" class="text-sm font-medium">
            常用语内容 <span class="text-red-500">*</span>
          </label>
          <Textarea
            id="phrase-content"
            v-model="phraseContent"
            placeholder="请输入常用语内容..."
            class="min-h-[100px] resize-none"
            :maxlength="500"
          />
          <div class="text-xs text-gray-500 text-right">
            {{ phraseContent.length }}/500
          </div>
        </div>
        
        <div class="space-y-2">
          <label for="phrase-category" class="text-sm font-medium">
            分类标签 <span class="text-gray-400">(可选)</span>
          </label>
          <Input
            id="phrase-category"
            v-model="phraseCategory"
            placeholder="如：分子计算、文献查询等"
            :maxlength="20"
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="closeDialog">
          取消
        </Button>
        <Button 
          @click="handleSubmit" 
          :disabled="!phraseContent.trim() || isSubmitting"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSubmitting ? '添加中...' : '添加' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import { create_phrase_api } from '@/api/common.js'

const { toast } = useToast()

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'phrase-added'])

const isOpen = ref(props.open)
const phraseContent = ref('')
const phraseCategory = ref('')
const isSubmitting = ref(false)

// Watch for prop changes
watch(() => props.open, (newVal) => {
  isOpen.value = newVal
})

// Watch for local changes
watch(isOpen, (newVal) => {
  emit('update:open', newVal)
  if (!newVal) {
    resetForm()
  }
})

const resetForm = () => {
  phraseContent.value = ''
  phraseCategory.value = ''
  isSubmitting.value = false
}

const closeDialog = () => {
  isOpen.value = false
}

const handleSubmit = async () => {
  if (!phraseContent.value.trim()) {
    toast({
      title: '请输入常用语内容',
      variant: 'destructive'
    })
    return
  }

  isSubmitting.value = true
  
  try {
    const newPhrase = {
      content: phraseContent.value.trim(),
      category: phraseCategory.value.trim() || null
    }
    
    const response = await create_phrase_api(newPhrase)
    
    emit('phrase-added')
    
    toast({
      title: '添加成功',
      description: '常用语已成功添加'
    })
    
    closeDialog()
  } catch (error) {
    console.error('Add phrase error:', error)
    toast({
      title: '添加失败',
      description: '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script> 