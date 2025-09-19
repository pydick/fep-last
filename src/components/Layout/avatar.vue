<template>
</template>

<script setup lang="ts">
import { useStore } from '@/stores/index.js'
import { ref } from 'vue'

interface UserResponse {
  data: {
    data?: {
      phone?: string
      email?: string
      id?: string
      _id?: string
      department_name?: string
    }
    phone?: string
    email?: string
    telephone?: string
    id?: string
    _id?: string
    department_name?: string
  }
}

const store = useStore()
const get_users_role = ref<(() => Promise<UserResponse>) | null>(null)

const loadApi = async () => {
  if (import.meta.env.VITE_APP_ENV === 'private' || import.meta.env.VITE_APP_ENV === 'ldap') {
    const { get_users_role: api1 } = await import('@/api/user.js')
    get_users_role.value = api1
  } else {
    const { get_users_role: api2 } = await import('@/api/drugflow_user.js')
    get_users_role.value = api2
  }
  await getUser()
}

loadApi()

const getUser = async () => {
  try {
    if (!get_users_role.value) return
    
    const res = await get_users_role.value()
    // 优先显示手机号，然后显示邮箱
    const res_data = res.data.data || res.data
    const telephone = res_data.phone || res_data.telephone
    
    store.user_info = {
      name: process_name(telephone || res_data.email || ''),
      username: res_data.name || '',
      id: res_data.id || res_data._id || '',
      department_name: res_data.department_name || 'none',
    }
    store.user_id = res_data.id || res_data._id || ''
  } catch (err) {
    console.log('getUser err', err)
  }
}

const process_name = (phone_or_email: string): string => {
  if (!phone_or_email) return ''
  
  if (phone_or_email.indexOf('@') !== -1) {
    return phone_or_email
  } else {
    // 手机号中间四位显示*
    return phone_or_email.slice(0, 3) + '****' + phone_or_email.slice(7, 11)
  }
}

</script>
