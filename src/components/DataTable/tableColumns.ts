import type { ColumnDef } from '@tanstack/vue-table'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import { h } from 'vue'

export const SelectColumn: ColumnDef<any> = {
  id: 'select',
  header: ({ table }) => h(Checkbox, {
    'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
    'onUpdate:checked': value => table.toggleAllPageRowsSelected(!!value),
    'ariaLabel': 'Select all',
    'class': 'translate-y-0.5',
  }),
  cell: ({ row }) => h(Checkbox, { 'checked': row.getIsSelected(), 'onUpdate:checked': value => row.toggleSelected(!!value), 'ariaLabel': 'Select row', 'class': 'translate-y-0.5' }),
  enableSorting: false,
  enableHiding: false,
}
