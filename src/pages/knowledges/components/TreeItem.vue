<!-- 树形结构项目组件 -->
<script setup name="TreeItem" lang="ts">
import { PropType } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import { Building, UserRound } from 'lucide-vue-next'

type TreeItemType = {
  id: string
  name: string
  show_name: string
  type: 'department' | 'user'
  children: TreeItemType[]
  expanded: boolean
}

const props = defineProps({
  item: {
    type: Object as PropType<TreeItemType>,
    required: true
  },
  selectedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['toggle', 'select'])

const isSelected = computed(() => {
  return props.selectedIds.includes(props.item.id)
})

const handleToggle = () => {
  emit('toggle', props.item)
}

const handleSelect = () => {
  emit('select', props.item)
}
</script>

<template>
  <div class="tree-item">
    <div class="flex items-center py-1">
      <Checkbox 
        :checked="isSelected" 
        @update:checked="handleSelect" 
        class="mr-2"
      />
      <div class="flex items-center flex-grow cursor-pointer" @click="item.type === 'department' ? handleToggle() : handleSelect()">
        <Building v-if="item.type === 'department'" class="h-4 w-4 mr-1 text-orange-500" />
        <UserRound v-else class="h-4 w-4 mr-1 text-blue-500" />
        <span class="text-sm" v-if="item.show_name">{{ item.show_name + '(' + item.name + ')' }}</span>
        <span class="text-sm" v-else>{{ item.name }}</span>
      </div>
      <button 
        v-if="item.type === 'department'" 
        @click="handleToggle"
        class="p-1 hover:bg-muted rounded"
      >
        <ChevronRight v-if="!item.expanded" class="h-4 w-4" />
        <ChevronDown v-else class="h-4 w-4" />
      </button>
    </div>
    <div v-if="item.expanded" class="pl-6 border-l ml-2">
      <TreeItem 
        v-for="child in item.children" 
        :key="child.id" 
        :item="child"
        :selected-ids="selectedIds"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>