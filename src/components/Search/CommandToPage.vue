<script setup lang="ts">
import type { RouteLocationAsRelativeGeneric } from 'vue-router'
import type { NavGroup, NavItem } from '../AppSidebar/types'
import {
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { useSidebar } from '@/composables/useSidebar'
import CommandItemHasIcon from './CommandItemHasIcon.vue'

const { navData } = useSidebar()

function getFlatNavItems(navData: NavGroup[]): NavItem[] {
  const flatItems: NavItem[] = []
  navData.forEach((group) => {
    group.items.forEach((item) => {
      if (item.items) {
        flatItems.push(...getFlatNavItems([item as unknown as NavGroup]))
      }
      else {
        flatItems.push(item)
      }
    })
  })
  return flatItems
}

const commands = getFlatNavItems(navData.value!)
</script>

<template>
  <CommandGroup heading="Pages">
    <CommandItem
      v-for="command in commands"
      :key="command.title"
      :value="command.title"
      @click="$router.push(command.url as unknown as RouteLocationAsRelativeGeneric)"
    >
      <CommandItemHasIcon :name="command.title" :icon="command.icon" />
    </CommandItem>
  </CommandGroup>
</template>

<style scoped>
</style>
