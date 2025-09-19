<template>
  <div class="relative">
    <div class="flex flex-wrap gap-1 max-h-[300px] overflow-y-auto">
      <template v-if="props.share_permissions && props.share_permissions.length">
        <!-- Show first 5 permissions -->
        <TooltipProvider v-for="(perm, idx) in visiblePermissions" :key="idx">
          <Tooltip>
            <TooltipTrigger>
              <div 
                :class="[
                  'w-6 h-6 flex items-center justify-center text-xs text-white font-medium',
                  perm.permission_type === 'read' ? 'bg-green-500' : 'bg-blue-500',
                  perm.user_name ? 'rounded-full' : 'rounded-md'
                ]"
              >
                {{ perm.show_name ? perm.show_name.charAt(0) : perm.user_name ? perm.user_name.charAt(0) : perm.department.charAt(0) }}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div class="text-xs">
                <p class="font-medium">
                  {{ perm.show_name || perm.user_name || perm.department }}: {{ perm.permission_type === 'read' ? '只读' : '管理' }}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <!-- Show +X indicator if more than 5 permissions -->
        <HoverCard>
          <HoverCardTrigger asChild v-if="hasMorePermissions">
            <div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 cursor-pointer">
              +{{ props.share_permissions.length - 5 }}
            </div>
          </HoverCardTrigger>
          
          <HoverCardContent class="w-48 p-2 max-h-[300px] overflow-y-auto">
            <p class="font-medium text-xs mb-2 border-b pb-1 text-blue-500 flex items-center">
              全部分享对象
            </p>
            <div v-for="(perm, idx) in props.share_permissions" :key="idx" class="text-xs py-1">
              <span class="font-medium">{{ perm.show_name || perm.user_name || perm.department }}</span>: 
              {{ perm.permission_type === 'read' ? '只读' : '管理' }}
            </div>
          </HoverCardContent>
        </HoverCard>
      </template>
      <span v-else class="text-gray-400 text-xs">-</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

const props = defineProps({
  share_permissions: {
    type: Array,
    default: () => []
  }
})

const visiblePermissions = computed(() => {
  return props.share_permissions.slice(0, 5)
})

const hasMorePermissions = computed(() => {
  return props.share_permissions.length > 5
})
</script>

