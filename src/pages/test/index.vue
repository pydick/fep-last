<script>
import { reactive, ref } from 'vue'
import protein3d_molstar from '@/components/molecule/protein3d_molstar.vue'
import { data } from './data.js'

export default {
  name: 'ScreenDocking',
  components: {
    Protein3dMolstar: protein3d_molstar,
  },
  setup() {
    const form = reactive({
      is_isomer: true,
      need_prot_process: true,
      smiles_col: '',
      input_tab: '数据库导入',
      pdbid_url: '',
      pdb_id: '',
      pdb_dataset_id: '',
      ligands_id: '',
      pdbid_input: '',
      pdbid_select: '',
      protein_file: '',
      pdb_name: '',
      pdbfile_validate_status: '',
      ligandfile_validate_status: '',
      protein_chain: [],
      het_group: [],
      correct: true,
      protonation: true,
      charge: 'amber14/protein.ff14SB',
      minimize_flag: 'atoms',
      minimized: null,
      missing_residue: [],
      missing_residue_list: [],
      pdb: 'pdb_file',
      chain: [],
      add_missing_residue: true,
      addh: true,
      modify_protonation: true,
      ph: 7.4,
      opt_hydrogen: true,
      energy_min: true,
      force_field: 'amber14/protein.ff14SB',

      ligand_input_tab: '上传文件',
      ligand_file: '',
      ligand_smiles: '',
      ligand_example_select: '',
      Disconnect_group: true,
      keep_large_fragment: true,
      Ionization: 'set_pH',
      Ionization_pH_main: 7.4,
      Ionization_pH_sub: 0.2,
      Tautomers: false,
      Stereoisomers: 'retain',
      isomer_limit: 5,
      ligand_energy_minimize: 'MMFF94',

      X_center: null,
      Y_center: null,
      Z_center: null,
      X_dimension: null,
      Y_dimension: null,
      Z_dimension: null,
      mode: 'semi',
      distance: null,
      scoring: 'carsidock',
      rescoring: ['RTMS'],
      num_pose: 1,
      task_name: 'Docking Task',
      // box_ligand: 'default',
      box_ligand: 'A:KY9:1102',
      box_changed_by_user: false,
      irrelevant_waters: false,
      het_group: [],
      delete_water: [],
    })
    const theme = ref('light')
    const if_show_box = ref(true)
    const molstar3dRef = ref(null)
    return { form, theme, if_show_box, molstar3dRef }
  },
  methods: {
    show_protein() {
      this.$refs.molstar3dRef.loadStructure(data, 'pdb')
    },
  },
}
</script>

<template>
  <div>
    <div style="width: 800px; height: 800px">
      <el-button @click="show_protein">
        show_protein
      </el-button>
      <Protein3dMolstar
        ref="molstar3dRef"
        v-model:box_x="form.X_center"
        v-model:box_y="form.Y_center"
        v-model:box_z="form.Z_center"
        v-model:l1="form.X_dimension"
        v-model:l2="form.Y_dimension"
        v-model:l3="form.Z_dimension"
        v-model:ligand_select="form.box_ligand"
        v-model:theme="theme"
        v-model:if_changed_box="form.box_changed_by_user"
        :if_show_box="if_show_box"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<route lang="yaml">
  meta:
    layout: blank
</route>
