<template>
  <Card class="cursor-pointer shadow-none hover:shadow-lg transition-all duration-300 group overflow-hidden">
    <!-- Phrase content -->
    <CardContent class="p-3">
      <div class="flex items-start justify-between gap-2">
        <!-- Phrase text -->
        <div class="flex-1">
          <p class="text-sm text-gray-700 line-clamp-3 leading-relaxed">
            {{ phrase.content }}
          </p>
        </div>
        
        <!-- Action buttons -->
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            class="p-2 w-8 h-8" 
            @click.stop="copyPhrase"
            :title="'复制到对话框'"
          >
            <Copy class="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            class="p-2 w-8 h-8 text-red-500 hover:text-red-600" 
            @click.stop="deletePhrase"
            :title="'删除常用语'"
          >
            <Trash2 class="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <!-- Category tag if exists -->
      <div v-if="phrase.category">
        <Badge variant="secondary" class="text-xs">
          {{ phrase.category }}
        </Badge>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Trash2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()

const props = defineProps({
  phrase: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      content: '',
      category: ''
    })
  }
})

const emit = defineEmits(['copy-phrase', 'delete-phrase'])

const copyPhrase = async () => {
  try {
    emit('copy-phrase', props.phrase.content)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.phrase.content)
    } else {
      // Fallback for non-HTTPS or unsupported browsers
      const textArea = document.createElement('textarea')
      textArea.value = props.phrase.content
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
      description: '常用语已复制到对话框',
      variant: 'success'
    })
  } catch (err) {
    console.error('copyPhrase error', err)
    toast({
      title: '复制失败',
      variant: 'destructive'
    })
  }
}

const deletePhrase = () => {
  emit('delete-phrase', props.phrase.id)
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 