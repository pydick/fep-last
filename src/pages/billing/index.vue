<script lang="ts" setup>
import Page from '@/components/Layout/Page.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BillingHistory from './components/BillingHistory/index.vue'
import Plans from './components/Plan/Plans.vue'

const route = useRoute()

const type = computed(() => (route.query.type as 'plans' | 'billing') || 'plans')
</script>

<template>
  <Page
    title="Plans & Billing"
    description="Manage your plan and billing history here."
  >
    <Tabs :default-value="type">
      <TabsList>
        <TabsTrigger value="plans">
          Plans
        </TabsTrigger>
        <TabsTrigger value="billing">
          Billing History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="plans">
        <Plans />
      </TabsContent>
      <TabsContent value="billing">
        <BillingHistory class="mt-2" />
      </TabsContent>
    </Tabs>
  </Page>
</template>

<style>

</style>
