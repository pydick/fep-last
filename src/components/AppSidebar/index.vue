<script lang="ts" setup>
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'

import NavFooter from './NavFooter.vue'
import NavGroup from './NavGroup.vue'
import TeamSwitcher from './TeamSwitcher.vue'
</script>

<template>
  <Sidebar collapsible="icon" class="z-50">
    <SidebarHeader>
      <TeamSwitcher :teams="sidebarData.teams" />
    </SidebarHeader>

    <SidebarContent>
      <NavGroup :nav-main="sidebarData.navMain" />
    </SidebarContent>

    <SidebarFooter>
      <NavFooter :user="sidebarData.user" />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>

<style></style>
