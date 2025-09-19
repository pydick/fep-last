<template>
  <div id="ngl_multi_ligand_frame" style="position: relative; min-height: 300px; height: calc(100% + 1px); min-width: 300px; width: calc(100% + 1px)">
    <drugflow_molstar ref="molstar_ref" :if_sequence_panel="false" :disable_comp_btn="true" :show_tool="false" :prolif_show_ligname="false"/>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onUnmounted, watch } from 'vue'
import drugflow_molstar from '@/components/molecule/drugflow_molstar.vue'

const props = defineProps({
  has_refer: { type: Boolean, default: true },
  refer_pdb_string: { type: String, default: '' },
  ligand_string: { type: String, default: '' },
  ori_ligand_name: { type: String, default: '' },
  ligand_site: { type: String, default: '' },
  refer_smiles: { type: String, default: '' },
  ligands_list: { type: Array, default: () => [
    {'ligand_hex_id': 'sdasda', 'ligand_smiles': 'CCCCCCC', 'ligand_show_name': '1', 'pdb_string': '', 'residue_full_info': []},
    {'ligand_hex_id': 'sa', 'ligand_smiles': 'CCCCCCCNNN', 'ligand_show_name': '2', 'pdb_string': '', 'residue_full_info': []},
    {'ligand_hex_id': '23dasda', 'ligand_smiles': 'C1CCCCCC1', 'ligand_show_name': '3', 'pdb_string': '', 'residue_full_info': []},
  ]},
  render_time: { type: String, default: 'immediately' },
  file_format: { type: String, default: 'pdb' },
})

const color_list_ori_pdb = ref([
  {'color': 'red', 'count': 0},
  {'color': 'silver', 'count': 0}
])
const molstar_ref = ref()
const color_list = ref([
  {'color': 'blue', 'count': 0},
  {'color': 'gray', 'count': 0},
  {'color': 'orange', 'count': 0},
  {'color': 'purple', 'count': 0},
  {'color': 'green', 'count': 0},
  {'color': 'pink', 'count': 0},
  {'color': 'brown', 'count': 0},
  {'color': 'yellow', 'count': 0},
  {'color': 'cyan', 'count': 0},
  {'color': 'magenta', 'count': 0},
  {'color': 'lime', 'count': 0},
  {'color': 'maroon', 'count': 0},
  {'color': 'navy', 'count': 0},
  {'color': 'olive', 'count': 0},
  {'color': 'teal', 'count': 0},
  {'color': 'aqua', 'count': 0},
  {'color': 'black', 'count': 0}
])

const own_ligands_list = ref([])
const own_ligands_hex_id_list = ref([])
const ref_check = ref(true)
const drawed_refer = ref(false)
const init_molstar = ref(false)

// Methods converted to functions in setup
const init_draw = () => {
  init_molstar.value = true
  if (props.render_time === 'immediately') {
    draw()
  }
}

const draw_refer = async () => {
  drawed_refer.value = true
  if (props.refer_pdb_string) {
    const color = color_list_ori_pdb.value[0].color
    await add_pdb_view(props.refer_pdb_string, undefined, 0, true, 'ref', color, [])
  }
}

const draw_ligand = async () => {
  const color = color_list.value[0].color
  await add_sdf_view(props.ligand_string, undefined, 1, true, 'ligand', color, [])
}

const draw = async () => {
  try {
    if (!init_molstar.value) {
      setTimeout(() => {
        draw()
      }, 1500)
      return
    }

    if (!drawed_refer.value) {
      drawed_refer.value = true
      await draw_refer()
    }
    const ligands_hex_id_list = props.ligands_list.map(item => item.ligand_hex_id)
    // 先移除own_ligands_hex_id_list多出来的id, 并更改color cnt
    for (let i = 0; i < own_ligands_hex_id_list.value.length; i++) {
      if (ligands_hex_id_list.indexOf(own_ligands_hex_id_list.value[i]) === -1) {
        change_color_cnt(own_ligands_list.value[i].color, -1)
        // remove ligand view
        await molstar_ref.value.remove_ligand_view_pdb(own_ligands_list.value[i].id)
        own_ligands_hex_id_list.value.splice(i, 1)
        own_ligands_list.value.splice(i, 1)
        i--
      }
    }
    for (let i=0; i < ligands_hex_id_list.length; i++) {
      if (own_ligands_hex_id_list.value.indexOf(ligands_hex_id_list[i]) === -1) {
        own_ligands_hex_id_list.value.push(ligands_hex_id_list[i])
        const color = find_color()
        own_ligands_list.value.push({
          'id': ligands_hex_id_list[i],
          'smiles': props.ligands_list[i].ligand_smiles,
          'pdb_string': props.ligands_list[i].pdb_string,
          'ligand_show_name': props.ligands_list[i].ligand_show_name,
          'residue_full_info': props.ligands_list[i].residue_full_info,
          'check': true,
          'color': color,
        })
        // add ligand view
        await add_ligand_view(props.ligands_list[i].pdb_string, ligands_hex_id_list[i], i, false, props.ligands_list[i].ligand_show_name, color, props.ligands_list[i].residue_full_info)
      }
    }
    close_loading()
  } catch {
    close_loading()
  }
}

const find_color = () => {
  // 找到第一个count最小的color
  let min_cnt = 999999
  let min_color = ''
  let min_i = 0
  for (let i=0; i < color_list.value.length; i++) {
    if (color_list.value[i].count < min_cnt) {
      min_cnt = color_list.value[i].count
      min_color = color_list.value[i].color
      min_i = i
    }
  }
  color_list.value[min_i].count += 1
  return min_color
}

const change_color_cnt = (color, cnt) => {
  for (let i=0; i < color_list.value.length; i++) {
    if (color_list.value[i].color === color) {
      color_list.value[i].count += cnt
      break
    }
  }
}

const add_pdb_view = async (pdb_input_string, ligand_hex_id, ligand_cnt_id, is_refer_ligand, ligand_name, color, residue_full_info) => {
  open_loading()
  // load new data
  let if_clean = false
  let render_id = ligand_hex_id
  if (is_refer_ligand) {
    if_clean = true
    render_id = '0'
  } 
  let input_params
  if (props.ligand_site) {
      input_params = {
      'url': undefined,
      'format': props.file_format,
      'is_binary': false,
      'input': pdb_input_string,
      'if_render': true,
      'render_type': 'ligand_view',
      'render_id': render_id,
      'carbon_color': color,
      'if_clean': if_clean,
      'pdb_name': ligand_name,
      'ligand_name': props.ori_ligand_name,
      'residue_full_info': residue_full_info,
      'ligand_site': props.ligand_site
    }
  } else {
    input_params = {
      'url': undefined,
      'format': props.file_format,
      'is_binary': false,
      'input': pdb_input_string,
      'if_render': true,
      'render_type': 'default',
      'render_id': render_id,
      'carbon_color': color,
      'if_clean': if_clean,
      'pdb_name': ligand_name,
      'ligand_name': props.ori_ligand_name,
      'residue_full_info': residue_full_info,
      'ligand_site': props.ligand_site
    }
  }
  console.log(input_params)
  await molstar_ref.value.load_structure(input_params)
}

const add_sdf_view = async (pdb_input_string, ligand_hex_id, ligand_cnt_id, is_refer_ligand, ligand_name, color, residue_full_info) => {
  open_loading()
  // load new data
  let if_clean = false
  let render_id = ligand_hex_id
  if (is_refer_ligand) {
    if_clean = true
    render_id = '0'
  } 
  const input_params = {
    'url': undefined,
    'format': 'sdf',
    'is_binary': false,
    'input': pdb_input_string,
    'if_render': true,
    'render_type': 'ligand_view',
    'render_id': '1',
    'carbon_color': color,
    'if_clean': false,
    'pdb_name': ligand_name,
    'ligand_name': 'UNL',
    'residue_full_info': residue_full_info
  }
  await molstar_ref.value.load_structure(input_params)
}

const add_ligand_view = async (pdb_input_string, ligand_hex_id, ligand_cnt_id, is_refer_ligand, ligand_name, color, residue_full_info) => {
  open_loading()
  // load new data
  let if_clean = false
  let render_id = ligand_hex_id
  if (is_refer_ligand) {
    if_clean = true
    render_id = '0'
  } 
  const input_params = {
    'url': undefined,
    'format': props.file_format,
    'is_binary': false,
    'input': pdb_input_string,
    'if_render': true,
    'render_type': 'ligand_view',
    'render_id': render_id,
    'carbon_color': color,
    'if_clean': if_clean,
    'pdb_name': ligand_name,
    'ligand_name': 'UNL',
    'residue_full_info': residue_full_info
  }
  await molstar_ref.value.load_structure(input_params)
}

const change_visible = (ligand_id) => {
  molstar_ref.value.set_ligand_view_id_visibility(ligand_id)
}

const open_loading = (content) => {
  // Empty implementation preserved
}

const close_loading = (flag) => {
  // Empty implementation preserved
}

// Expose methods for external use
defineExpose({
  init_draw,
  draw,
  draw_refer,
  draw_ligand,
  change_visible,
  open_loading,
  close_loading,
  add_ligand_view,
  find_color,
  change_color_cnt,
  molstar_ref,
  color_list_ori_pdb,
  color_list,
  own_ligands_list,
  own_ligands_hex_id_list,
  ref_check,
  drawed_refer,
  init_molstar
})

// Lifecycle hooks
onBeforeUnmount(() => {
  // Implementation goes here if needed
})

onUnmounted(() => {
  // Implementation goes here if needed
})
</script>