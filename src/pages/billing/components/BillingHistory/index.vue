<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CircleCheck, CircleDashed, CloudDownload, HandCoins } from 'lucide-vue-next'

const billingHistory = [
  {
    id: 1,
    date: '2024-01-01',
    amount: 199.99,
    plan: 'Enterprise',
    status: 'unpaid',

  },
  {
    id: 2,
    date: '2023-12-01',
    amount: 19.99,
    plan: 'Small Business',
    status: 'paid',
    file: 'invoice2.pdf',
  },
  {
    id: 3,
    date: '2023-11-01',
    amount: 0,
    plan: 'Free',
    status: 'paid',
    file: 'invoice3.pdf',
  },
]
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card v-for="billing in billingHistory" :key="billing.id">
      <CardHeader>
        <CardTitle>
          {{ billing.plan }}
        </CardTitle>
        <CardDescription>
          <span>{{ billing.plan }}</span> |
          <span>{{ billing.date }}</span>
        </CardDescription>
      </CardHeader>

      <CardContent class="flex-1">
        <div class="mb-2 text-2xl font-bold">
          ${{ billing.amount }}
        </div>
        <div
          class="inline-flex items-center text-left" :class="cn({
            'bg-green-100': billing.status === 'paid',
            'bg-orange-100': billing.status === 'unpaid',
            'px-2 py-1 rounded-md': true,
          })"
        >
          <div v-if="billing.status === 'paid'" class="flex items-center ">
            <CircleCheck class="w-4 h-4 mr-1 text-green-500" />
          </div>
          <span v-else>
            <CircleDashed class="w-4 h-4 mr-1 text-orange-500" />
          </span>
          <span class="">{{ billing.status }}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button v-if="billing.status === 'unpaid'" class="mr-2" variant="default">
          <HandCoins class="w-4 h-4" />
          Pay Now
        </Button>

        <Button v-else class="" variant="outline" :disabled="!billing?.file">
          <CloudDownload class="w-4 h-4" />
          Download Invoice
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
