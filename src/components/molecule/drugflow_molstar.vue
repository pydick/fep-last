<template>
  <div class="relative w-full h-full z-50" :class="{'fixed inset-0 z-50 w-screen h-screen': full_screen_type}">
    <div :id="canvas_id" ref="molstar_ref" class="w-full h-full min-w-[300px] min-h-[300px]" 
      :class="{'drugflow_molstar_no_sequence': !props.if_sequence_panel, 'drugflow_molstar': true}">
    </div>
    
    <div class="absolute top-2 w-full" v-show="props.show_tool && show_tool">
      <div class="mx-auto w-[40rem] flex items-center justify-center">
        <!-- Empty space -->
        <div class="flex-1"></div>
        
        <!-- Granularity & Selection Tools -->
        <div class="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="granularity" title="Set Granularity"/>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Set Granularity</h3>
              <RadioGroup v-model="granularity" @update:model-value="set_granularity" class="flex flex-col space-y-1">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="chain" id="chain" />
                  <Label for="chain">Chain</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="residue" id="residue" />
                  <Label for="residue">Residue</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="element" id="element" />
                  <Label for="element">Atom</Label>
                </div>
              </RadioGroup>
            </PopoverContent>
          </Popover>
          
          <!-- Quick Select Popover -->
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="quick_select" title="Quick Select"/>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Quick Select</h3>
              <div class="flex flex-col space-y-1">
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="quick_select(undefined, type='chains')">
                  All Chains
                </Button>
                <div v-for="item in pdb_info.chain" :key="item.key">
                  <Button variant="ghost" size="sm" class="justify-start h-7" @click="quick_select(item)">
                    Chain: {{ item.auth_asym_id }}
                  </Button>
                </div>
                
                <Separator v-if="pdb_info.ligand.length" class="my-2" />
                
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="quick_select(undefined, type='ligands')">
                  All Ligands
                </Button>
                <div v-for="item in pdb_info.ligand" :key="item.key">
                  <Button variant="ghost" size="sm" class="justify-start h-7" @click="quick_select(item)">
                    {{ item.auth_asym_id }}: {{item.residue_name}}: {{item.auth_residue_number}}
                  </Button>
                </div>
                
                <Separator v-if="pdb_info.water.length" class="my-2" />
                
                <div v-if="pdb_info.water.length">
                  <Button variant="ghost" size="sm" class="justify-start h-7" @click="quick_select(undefined, type='water')">
                    All Water
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="expand" title="More Selection" />
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">More Selection</h3>
              <div class="flex flex-col space-y-1">
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="select_all()">Select All</Button>
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="select_none()">Select None</Button>
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="invert_select()">Invert Select</Button>
                
                <Separator class="my-2" />
                
                <p class="text-xs mb-2">Expand</p>
                <div class="flex items-center space-x-2">
                  <Input v-model="expand_number" type="number" class="w-20" :min="1" :max="10" />
                  <span class="text-xs">Å</span>
                  <Button size="sm" variant="default" @click="expand_selection">OK</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="w-4"></div>
        
        <!-- Visualization Tools -->
        <div class="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="create_surface" title="Create Surface" :disabled="props.disable_comp_btn"/>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Create Surface</h3>
              <div class="flex flex-col space-y-1">
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_surface(undefined, 'selection')">
                  For Selection
                </Button>
                
                <Separator v-if="pdb_info.chain.length" class="my-2" />
                
                <div v-for="item in pdb_info.chain" :key="item.key">
                  <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_surface(item)">
                    Chain: {{ item.auth_asym_id }}
                  </Button>
                </div>
                
                <Separator v-if="pdb_info.ligand.length" class="my-2" />
                
                <div v-for="item in pdb_info.ligand" :key="item.key">
                  <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_surface(item)">
                    {{ item.auth_asym_id }}: {{item.residue_name}}: {{item.auth_residue_number}}
                  </Button>
                </div>
                
                <Separator v-if="surface_list.length" class="my-2" />
                
                <div v-for="item in surface_list" :key="item" class="mb-1 flex items-center">
                  <Button 
                    v-show="item.if_show_name" 
                    :variant="item.hide ? 'secondary' : 'default'" 
                    size="sm" 
                    class="w-[70px] mr-3"
                    @click="item.hide=!item.hide;set_visibility('Surface_' + item.timestamp)"
                  >
                    {{ item.name }}
                  </Button>
                  <Input 
                    v-show="!item.if_show_name" 
                    v-model="item.name" 
                    class="w-[70px] mr-3 h-9" 
                    @keyup.enter="item.if_show_name = !item.if_show_name"
                  />
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="item.if_show_name = !item.if_show_name">
                    <PencilIcon class="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" class="h-8 w-8" @click="create_surface(undefined, 'clean', item.timestamp)">
                    <TrashIcon class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="create_pocket" title="Create Pocket" :disabled="props.disable_comp_btn"/>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Create Pocket</h3>
              <div class="flex flex-col space-y-1">
                <div v-for="item in pdb_info.ligand" :key="item.key">
                  <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_pocket(item)">
                    {{ item.auth_asym_id }}: {{item.residue_name}}: {{item.auth_residue_number}}
                  </Button>
                </div>
                
                <div v-if="pdb_info.ligand.length === 0">
                  <Button variant="ghost" size="sm" class="justify-start h-7" disabled>No Pocket</Button>
                </div>
                
                <Separator class="my-2" />
                
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_pocket(undefined, type='clean')">
                  Clean Pocket
                </Button>
                
                <Separator v-if="has_pocket" class="my-2" />
                
                <div v-if="has_pocket" class="flex items-center space-x-2">
                  <Checkbox id="hide-chain" v-model="if_hide_chain" @update:model-value="hide_chain" />
                  <Label for="hide-chain">Hide Non-Pocket Atoms</Label>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="create_label" title="Create Label" :disabled="props.disable_comp_btn"/>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Create Label</h3>
              <div class="flex flex-col space-y-1">
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_label(undefined, type='selection')">
                  For Selection
                </Button>
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_label(undefined, type='ligands')">
                  All Ligands
                </Button>
                
                <Separator class="my-2" />
                
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="create_label(undefined, type='clean')">
                  Clean Label
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="measure" title="Measure" />
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Create Measurement</h3>
              <div class="flex flex-col space-y-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" class="justify-start h-7" @click="add_distance()">
                      Add Distance
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    请先选择两个原子再添加距离测量
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" class="justify-start h-7" @click="add_angle()">
                      Add Angle
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    请先选择三个原子再添加角度测量
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" class="justify-start h-7" @click="add_dihedral()">
                      Add Dihedral
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    请先选择四个原子再添加二面角测量
                  </TooltipContent>
                </Tooltip>
                
                <Separator class="my-2" />
                
                <Button variant="ghost" size="sm" class="justify-start h-7" @click="clean_measure()">
                  Clean Measure
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="more" title="More" :disabled="props.disable_comp_btn" />
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">More</h3>
              <div class="flex flex-col space-y-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  class="justify-start h-7" 
                  :disabled="has_pocket || has_surface || props.disable_comp_btn" 
                  @click="hide_selection()"
                >
                  Hide Selection
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  class="justify-start h-7" 
                  :disabled="has_pocket || has_surface || props.disable_comp_btn" 
                  @click="show_selection(type='prev')"
                >
                  Show Selection
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  class="justify-start h-7" 
                  :disabled="has_pocket || has_surface || props.disable_comp_btn" 
                  @click="show_selection(type='all')"
                >
                  Show All
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="w-4"></div>
        
        <!-- Display Options -->
        <div class="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="moon" title="Change Background" />
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Change Background</h3>
              <RadioGroup v-model="background" @update:model-value="change_background" class="flex flex-col space-y-1">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="white" id="bg-white" />
                  <Label for="bg-white">White</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="black" id="bg-black" />
                  <Label for="bg-black">Black</Label>
                </div>
              </RadioGroup>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <molstar_btn svg_name="cartoon" title="Change Repr" :disabled="props.disable_comp_btn" />
            </PopoverTrigger>
            <PopoverContent class="w-auto p-2">
              <h3 class="text-sm font-medium mb-2">Change Repr</h3>
              <RadioGroup v-model="chain_repr" @update:model-value="change_repr" class="flex flex-col space-y-1">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="cartoon" id="repr-cartoon" />
                  <Label for="repr-cartoon">Cartoon</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="bs" id="repr-bs" />
                  <Label for="repr-bs">Ball & Stick</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="sf" id="repr-sf" />
                  <Label for="repr-sf">Spacefill</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="line" id="repr-line" />
                  <Label for="repr-line">Line</Label>
                </div>
              </RadioGroup>
            </PopoverContent>
          </Popover>
          
          <molstar_btn svg_name="interaction" @click="show_prolif_func" title="Show 2D Interaction"/>
          <molstar_btn svg_name="screen_shot" @click="make_screenshot" title="Screen Shot" />
          <molstar_btn svg_name="goto_center" @click="reset_camera" title="Goto Center" />
          <molstar_btn svg_name="rotate" @click="toggle_spin" title="Rotate" />
          <molstar_btn svg_name="full_screen" @click="full_screen" />
          <molstar_btn svg_name="reset" @click="reset_all" title="Reset" />
        </div>
        
        <div class="flex-1"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, defineEmits, nextTick } from 'vue'
  import molstar_btn from '@/components/molecule/molstar_btn.vue'
  import 'drugflow-molstar/build/drugflow-molstar-light.css'
  import 'drugflow-molstar/build/drugflow-molstar-component-0.3.46.js'
  import { InteractionsRepresentationProvider } from 'molstar/lib/mol-model-props/computed/representations/interactions'
  import { Color, ColorMap } from 'molstar/lib/mol-util/color';
  import { ColorNames } from 'molstar/lib/mol-util/color/names';
  
  // Import Shadcn components
  import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
  import { Button } from '@/components/ui/button'
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
  import { Label } from '@/components/ui/label'
  import { Separator } from '@/components/ui/separator'
  import { Input } from '@/components/ui/input'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
  
  // Import Lucide icons
  import { Pencil as PencilIcon, Trash as TrashIcon } from 'lucide-vue-next'

  const molstar_ref = ref(null)
  const canvas_id = 'molstar-canvas-' + Date.now()
  const full_screen_type = ref(false)
  const granularity = ref('residue')
  const background = ref('white')
  const expand_number = ref(5)
  const pdb_info = ref({'chain': [], 'ligand': [], 'pocket': [], 'other': [], 'water': []})
  const show_tool = ref(true)
  const chain_repr = ref('cartoon')
  const old_repr = ref('Polymer_cartoon')
  const repr_state = ref({'cartoon': true, 'bs': false, 'sf': false, 'line': false})
  const init_params = ref({})
  const has_pocket = ref(false)
  const has_surface = ref(false)
  const if_hide_chain = ref(false)
  const show_prolif = ref(false)
  const prolif_ref = ref(null)
  const pdb_ligand_inter_list = ref([])
  const wait_proif = ref(true)
  const prolif_data = ref([])

  const props = defineProps({
    box_bg_color: {
      type: Number,
      default: 0x1100CC
    },
    if_sequence_panel: {
      type: Boolean,
      default: true
    },
    show_tool: {
      type: Boolean,
      default: true
    },
    disable_comp_btn: {
      type: Boolean,
      default: false
    },
    prolif_show_ligname: {
      type: Boolean,
      default: true
    }
  })
  const emit = defineEmits(['init-complete']);

  const init = async() => {
    molstar_ref.value.viewerInstance = new DrugflowMolstarPlugin();
    let viewerContainer = document.getElementById(canvas_id);
    await molstar_ref.value.viewerInstance.init(
      viewerContainer,
      {'if_sequence_panel': props.if_sequence_panel}
    )
    molstar_ref.value.viewerInstance.canvas.toggleSelect(false)
    molstar_ref.value.viewerInstance.add_click_listener()
  }

  const load_structure = async(input_params) => {
    init_params.value = input_params

    await molstar_ref.value.viewerInstance.load_tree(
      {
        url: input_params.url, format: input_params.format, isBinary: input_params.is_binary, 
        pdb_string: input_params.input, if_render: input_params.if_render, 
        render_type: input_params.render_type, render_id: input_params.render_id,
        ligand_name: input_params.ligand_name, ligand_site: input_params.ligand_site
      },
      input_params.if_clean
    )
    const render_id = input_params.render_id
    pdb_info.value = molstar_ref.value.viewerInstance.get_basic_info()
    // molstar_ref.value.viewerInstance.canvas.toggleControls(true)
    
    if (input_params.render_type === 'default') {
      await add_or_update_default_repr(1, true, false)
    } else {
      await add_or_update_ligand_view_repr(render_id, input_params.carbon_color)
    }
    if (input_params.if_clean) {
      pdb_ligand_inter_list.value = []
    } 
  }

  const set_occlusion = () => {
    molstar_ref.value.viewerInstance.plugin.canvas3d.setProps({
        postprocessing: { occlusion: { name: 'off', params: {} } }
    });
  }

  const find_UNL_dict = (interaction_list) => {
    const ret_dict = {}
    for (let i = 0; i < interaction_list.length; i++) {
      if (interaction_list[i].interaction_dict[0] && interaction_list[i].interaction_dict[0].ligand_name == 'UNL') {
        ret_dict['auth_asym_id'] = interaction_list[i].interaction_dict[0].ligand_chain_id
        ret_dict['auth_residue_number'] = interaction_list[i].interaction_dict[0].ligand_residue_number
        break
      }
    }
    return ret_dict
  }

  const recreate_repr = async (alpha=1, recreate_polymer=true, recreate_ligand=true, recreate_water=true) => {
    if (recreate_polymer) {
      await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_cartoon', repr_state.value.cartoon, {type: 'cartoon', typeParams: {alpha: alpha}})
      await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_bs', repr_state.value.bs, {
        type: 'ball-and-stick', 
        size: 'uniform', 
        sizeParams: { value: 0.9 },
        typeParams: {alpha: alpha, ignoreHydrogens: 'all', ignoreHydrogensVariant: 'non-polar'},
        color: 'element-symbol', 
        colorParams: { 
          carbonColor: {name :'element-symbol', params: {}}, 
          colors: { name: 'custom', params: ColorMap({'C': ColorNames.gray, })}
        }
      })
      await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_sf', repr_state.value.sf, {type: 'spacefill', typeParams: {alpha: alpha}})
      await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_line', repr_state.value.line, {type: 'line', typeParams: {alpha: alpha}})
    }
    if (recreate_ligand) {
      await molstar_ref.value.viewerInstance.update_comp_repr('Ligand', 'Ligand_bs', true, {
        type: 'ball-and-stick',
        typeParams: {ignoreHydrogens: 'all', ignoreHydrogensVariant: 'non-polar'},
        color: 'element-symbol', 
        colorParams: { 
          carbonColor: {name :'element-symbol', params: {}}, 
          colors: { name: 'custom', params: ColorMap({'C': ColorNames.orange, })}
        }
      })
    }
    if (recreate_water) {
      await molstar_ref.value.viewerInstance.update_comp_repr('Water', 'Water_bs', true, {type: 'ball-and-stick'})
    }
    set_occlusion()
  }

  const add_or_update_ligand_view_repr = async(ligand_id, color_name) => {
    await molstar_ref.value.viewerInstance.update_comp_repr('Ligand_' + ligand_id, 'Ligand_' + ligand_id + '_bs', true, {
        type: 'ball-and-stick', 
        typeParams: {alpha: 1, ignoreHydrogens: 'all', ignoreHydrogensVariant: 'non-polar',},
        color: 'element-symbol', 
        colorParams: { 
          carbonColor: {name :'element-symbol', params: {}}, 
          colors: { name: 'custom', params: ColorMap({'C': ColorNames[color_name], })}
        }
      })
    await molstar_ref.value.viewerInstance.update_comp_repr('Ligand_plus_' + ligand_id, 'Ligand_plus_' + ligand_id + '_bs', true, {
        type: 'ball-and-stick',
        color: 'element-symbol', 
        size: 'uniform', 
        sizeParams: { value: 0.9 },
        typeParams: { alpha: 0.8, ignoreHydrogens: 'all', ignoreHydrogensVariant: 'non-polar' },
        colorParams: { 
          carbonColor: {name :'element-symbol', params: {}}, 
          colors: { name: 'custom', params: ColorMap({'C': ColorNames.gray, })}
        }
      })
    await molstar_ref.value.viewerInstance.update_comp_repr('Ligand_plus_' + ligand_id, 'Ligand_plus_' + ligand_id + '_label', true, {
        type: 'label', 
        sizeParams: { scale: 0.65 },
        colorParams: { value: 0xffffff },
        typeParams: { alpha: 1, level: granularity.value }
      })
    // await molstar_ref.value.viewerInstance.update_comp_repr('Ligand_' + ligand_id, 'Ligand_' + ligand_id + '_it', true, {
    //     type: InteractionsRepresentationProvider,
    //     typeParams: {includeParent: true, parentDisplay: 'between' }
    //   })
    // focus ligand
    for (let i = 0; i < pdb_info.value.ligand.length; i++) {
      if (pdb_info.value.ligand[i].residue_name === 'UNL') {
        molstar_ref.value.viewerInstance.visual.focus([pdb_info.value.ligand[i]], undefined, 10)
        break
      }
    }
    set_occlusion()
  }

  const add_or_update_default_repr = async (alpha=1, if_hetatm=true, not_change_visible=true) => {
    await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_cartoon', true, {type: 'cartoon', typeParams: {alpha: alpha}})
    await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_bs', not_change_visible, {
      type: 'ball-and-stick', 
      size: 'uniform', 
      sizeParams: { value: 0.9 },
      typeParams: {alpha: alpha, ignoreHydrogens: 'all', ignoreHydrogensVariant: 'non-polar'},
      color: 'element-symbol', 
      colorParams: { 
        carbonColor: {name :'element-symbol', params: {}}, 
        colors: { name: 'custom', params: ColorMap({'C': ColorNames.gray, })}
      }
    })
    await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_sf', not_change_visible, {type: 'spacefill', typeParams: {alpha: alpha}})
    await molstar_ref.value.viewerInstance.update_comp_repr('Polymer', 'Polymer_line', not_change_visible, {type: 'line', typeParams: {alpha: alpha}})
  
    if (if_hetatm) {
      if (pdb_info.value.ligand.length > 0) {
        await molstar_ref.value.viewerInstance.update_comp_repr('Ligand', 'Ligand_bs', true, {
          type: 'ball-and-stick',
          typeParams: {ignoreHydrogens: 'all', ignoreHydrogensVariant: 'non-polar'},
          color: 'element-symbol', 
          colorParams: { 
            carbonColor: {name :'element-symbol', params: {}}, 
            colors: { name: 'custom', params: ColorMap({'C': ColorNames.orange, })}
          }
        })
      }
      if (pdb_info.value.water.length > 0) {
        await molstar_ref.value.viewerInstance.update_comp_repr('Water', 'Water_bs', true, {type: 'ball-and-stick'})
      }
    }
    set_occlusion()
  }

  const reset_all = async () => {
    await molstar_ref.value.viewerInstance.clear()
    await load_structure(init_params.value)
  }

  const add_mouse_event = (func) => {
    molstar_ref.value.viewerInstance.add_mouse_event(func)
  }

  const get_pdb_info = () => {
    return pdb_info.value
  }

  const add_shape = (params) => {
    const structure = molstar_ref.value.viewerInstance.plugin.state.data.select('Structure_0')[0]
    return molstar_ref.value.viewerInstance.add_shape(structure, params)
  }

  const remove_shape = (selector) => {
    molstar_ref.value.viewerInstance.remove_shape(selector)
  }

  const full_screen = () => {
    full_screen_type.value = !full_screen_type.value
    molstar_ref.value.viewerInstance.canvas.toggleExpanded(full_screen_type.value)
  }

  const reset_camera = () => {
    molstar_ref.value.viewerInstance.visual.camera_reset()
  }

  const make_screenshot = () => {
    const c = document.getElementsByTagName('canvas')[0]
    const base64Img = c.toDataURL('image/png')
    const a = document.createElement('a')
    a.download = 'Drugflow_Screenshot.png'
    a.href = base64Img
    a.click()
    a.remove()
  }

  const toggle_spin = () => {
    molstar_ref.value.viewerInstance.visual.toggleSpin()
  }

  const change_background = () => {
    if (background.value === 'white') {
      set_background({r: 255, g: 255, b: 255})
    } else {
      set_background({r: 0, g: 0, b: 0})
    }
  }

  const set_visibility = (ref) => {
    molstar_ref.value.viewerInstance.set_visibility(ref)
  }

  const change_repr = () => {
    if (old_repr.value === 'Polymer_' + chain_repr.value) {
      return 
    }
    if (old_repr.value) {
      molstar_ref.value.viewerInstance.set_visibility(old_repr.value)
    }
    if (chain_repr.value === 'hide') {
      old_repr.value = null
      return
    } 
    if (chain_repr.value === 'cartoon') {
      molstar_ref.value.viewerInstance.set_visibility('Polymer_cartoon')
      repr_state.value = {'cartoon': true, 'bs': false, 'sf': false, 'line': false}
    } else if (chain_repr.value === 'bs') {
      molstar_ref.value.viewerInstance.set_visibility('Polymer_bs')
      repr_state.value = {'cartoon': false, 'bs': true, 'sf': false, 'line': false}
    } else if (chain_repr.value === 'sf') {
      molstar_ref.value.viewerInstance.set_visibility('Polymer_sf')
      repr_state.value = {'cartoon': false, 'bs': false, 'sf': true, 'line': false}
    } else if (chain_repr.value === 'line') {
      molstar_ref.value.viewerInstance.set_visibility('Polymer_line')
      repr_state.value = {'cartoon': false, 'bs': false, 'sf': false, 'line': true}
    }
    old_repr.value = 'Polymer_' + chain_repr.value
  }

  const hide_chain = (val) => {
    if (old_repr.value) {
      molstar_ref.value.viewerInstance.set_visibility(old_repr.value)
    }
  }

  const set_ligand_view_id_visibility = (smiles_id) => {
    molstar_ref.value.viewerInstance.set_visibility('Ligand_' + smiles_id)
    molstar_ref.value.viewerInstance.set_visibility('Ligand_plus_' + smiles_id)

    for (let j = 0; j < pdb_ligand_inter_list.value.length; j++) {
      if (pdb_ligand_inter_list.value[j]['render_id'] == smiles_id) {
        for (let i = 0; i < pdb_ligand_inter_list.value[j].prolif_id_list.length; i++) {
          molstar_ref.value.viewerInstance.set_visibility(pdb_ligand_inter_list.value[j].prolif_id_list[i])
        }
        break
      }
    }
  }

  const remove_ligand_view_pdb = async (smiles_id) => {
    await remove_prolif_line(smiles_id)
    await molstar_ref.value.viewerInstance.remove_tmp_comp('Structure_' + smiles_id, smiles_id)

    for (let i = 0; i< pdb_ligand_inter_list.value.length; i++) {
      if (pdb_ligand_inter_list.value[i]['render_id'] === smiles_id) {
        // 删除这个元素
        pdb_ligand_inter_list.value.splice(i, 1)
        break
      }
    }
  }

  const set_background = (color) => {
    // {r, g, b}
    molstar_ref.value.viewerInstance.canvas.setBgColor(color)
  }

  const set_granularity = (value) => {
    molstar_ref.value.viewerInstance.visual.changeProps(value)
  }

  const quick_select = (item, type='single', not_focus) => {
    if (type === 'chains') {
      molstar_ref.value.viewerInstance.visual.select(pdb_info.value.chain)
    } else if (type === 'ligands') {
      molstar_ref.value.viewerInstance.visual.select(pdb_info.value.ligand)
    } else if (type === 'water') {
      molstar_ref.value.viewerInstance.visual.select([{'label_comp_id': 'HOH'}])
    } else {
      if (item?.length >= 1) {
        molstar_ref.value.viewerInstance.visual.select(item)
      } else {
        molstar_ref.value.viewerInstance.visual.select([item])
      }
    }
    if(!not_focus){
      molstar_ref.value.viewerInstance.visual.focus_now()
    }
  }

  const surface_list = ref([])
  const create_surface = async (item, type='single', name='abcd') => {
    if (type === 'single') {
      molstar_ref.value.viewerInstance.visual.select_none()
      quick_select(item, type)
    } else if (type === 'clean') {
      await molstar_ref.value.viewerInstance.remove_tmp_comp('Surface_' + name)
      for (let i = 0; i < surface_list.value.length; i++) {
        if (surface_list.value[i].timestamp === name) {
          surface_list.value.splice(i, 1)
          break
        }
      }
      if (surface_list.value.length === 0) {
        has_surface.value = false
      }
      return 
    }
    // 获得selected_info
    const now_dict = molstar_ref.value.viewerInstance.selected_info.now
    const select_info = [...now_dict.polymer, ...now_dict.ligand, ...now_dict.other]
    const timestamp = Date.now()
    has_surface.value = true
    await molstar_ref.value.viewerInstance.create_surf_comp(timestamp)
    await molstar_ref.value.viewerInstance.update_comp_repr('Surface_' + timestamp, 'Surface_gs_' + timestamp, true, {type: 'gaussian-surface', color: 'hydrophobicity'})
    molstar_ref.value.viewerInstance.visual.select_none()
    if (surface_list.value.length === 0) {
      surface_list.value.push({'cnt': 1, 'timestamp': timestamp, 'name': 'Surf ' + 1, 'if_show_name': true, 'select_info': select_info})
    } else {
      const max_cnt = surface_list.value.reduce((a, b) => a.cnt > b.cnt ? a : b).cnt + 1
      surface_list.value.push({'cnt': max_cnt, 'timestamp': timestamp, 'name': 'Surf ' + max_cnt, 'if_show_name': true, 'select_info': select_info})
    }
  }

  const find_and_add_prolif_data = async (item, render_id = '0') => {
    const bond_color_dict = {
      'VdWContact': ColorNames.orange,
      'Hydrophobic': ColorNames.green,
      'PiStacking': ColorNames.purple,
      'Cationic': ColorNames.red,
      'HBDonor/HBAcceptor': ColorNames.blue,
      'HBDonor': ColorNames.blue,
      'HBAcceptor': ColorNames.blue
    }

    let prolif_data = []
    let prolif_id_list = []
    let pdb_string = ''
    for(let i = 0; i < pdb_ligand_inter_list.value.length; i++) {
      if (pdb_ligand_inter_list.value[i].render_id == render_id) {
        prolif_data = pdb_ligand_inter_list.value[i].prolif_data
        prolif_id_list = pdb_ligand_inter_list.value[i].prolif_id_list
        pdb_string = pdb_ligand_inter_list.value[i].pdb_string
        break
      }
    }

    let tmp_list = []
    let interaction_list = []
    for (let i = 0; i < prolif_data.length; i++) {
      tmp_list = prolif_data[i].interaction_dict
      if (tmp_list.length > 0 && tmp_list[0]['ligand_chain_id'] == item['auth_asym_id'] && tmp_list[0]['ligand_residue_number'] == item['auth_residue_number']) {
        interaction_list = prolif_data[i].interaction_dict
        break
      }
    }

    for (let i = 0; i < interaction_list.length; i++) {
      const prolif_id = 'Prolif_contact_' + render_id + '_' + i
      console.log('prolif_id', prolif_id)
      prolif_id_list.push(prolif_id)

      await molstar_ref.value.viewerInstance.add_contact({
        structure_ref: 'Structure_' + render_id,
        start_query: [{'atom_id': interaction_list[i].ligand_atom_id}],
        end_query: [{'atom_id': interaction_list[i].prot_atom_id}],
        interactionType: interaction_list[i].interaction_type,
        color: bond_color_dict[interaction_list[i].interaction_type],
        id: prolif_id,
      })
    }
  }

  const remove_prolif_line = async (render_id='0') => {
    for (let j = 0; j < pdb_ligand_inter_list.value.length; j++) {
      if (pdb_ligand_inter_list.value[j]['render_id'] == render_id) {

        for (let i = 0; i < pdb_ligand_inter_list.value[j].prolif_id_list.length; i++) {
          await molstar_ref.value.viewerInstance.remove_tmp_comp(pdb_ligand_inter_list.value[j].prolif_id_list[i], render_id)
        }
        pdb_ligand_inter_list.value[j].prolif_id_list = []
        break
      }
    }
  }

  const create_pocket = async (item, type='single') => {
    // 找到对应的prolif数据
    await remove_prolif_line()

    if (type === 'clean') {
      await molstar_ref.value.viewerInstance.remove_tmp_comp('Ligand_tmp')
      await molstar_ref.value.viewerInstance.remove_tmp_comp('Ligand_plus_tmp')
      // 清理自定义线条绘制
      await add_or_update_default_repr(1, false)
      has_pocket.value = false
      return 
    }
    has_pocket.value = true

    await molstar_ref.value.viewerInstance.create_tmp_ligand_comp(item.auth_asym_id, item.auth_residue_number)

    await molstar_ref.value.viewerInstance.update_comp_repr('Ligand_plus_tmp', 'Ligand_plus_tmp_bs', true, {
        type: 'ball-and-stick', 
        size: 'uniform', 
        sizeParams: { value: 0.9 },
        typeParams: {alpha: 0.8, ignoreHydrogens: 'all', ignoreHydrogensVariant: 'non-polar'},
        color: 'element-symbol', 
        colorParams: { 
          carbonColor: {name :'element-symbol', params: {}}, 
          colors: { name: 'custom', params: ColorMap({'C': ColorNames.gray, })}
        }
      })
    await molstar_ref.value.viewerInstance.update_comp_repr('Ligand_plus_tmp', 'Ligand_plus_tmp_label', true, {
        type: 'label', 
        sizeParams: { scale: 0.65 },
        colorParams: { value: 0xffffff },
        typeParams: { alpha: 1, level: granularity.value }
      })
    // await molstar_ref.value.viewerInstance.update_comp_repr('Ligand_tmp', 'Ligand_tmp_it', true, {
    //     type: InteractionsRepresentationProvider,
    //     typeParams: {includeParent: true, parentDisplay: 'between' }
    //   })
    await add_or_update_default_repr(0.1, false)
    await find_and_add_prolif_data(item)
    molstar_ref.value.viewerInstance.visual.focus([item])
  }

  const create_label = async (item, type='single') => {
    if (type === 'clean') {
      await molstar_ref.value.viewerInstance.remove_tmp_comp('Label_tmp')
      return 
    } else if (type === 'ligands') {
      molstar_ref.value.viewerInstance.visual.select(pdb_info.value.ligand)
    }
    await molstar_ref.value.viewerInstance.create_tmp_label_comp()
    await molstar_ref.value.viewerInstance.update_comp_repr('Label_tmp', 'Label_tmp_label', true, {
        type: 'label',
        sizeParams: { scale: 0.65 },
        colorParams: { value: 0xffffff },
        typeParams: { alpha: 1, level: granularity.value }
      })
  }

  const hide_selection = () => {
    molstar_ref.value.viewerInstance.visual.hideSelect()
  }

  const show_selection = async (type='prev', show_params=[]) => {
    let ret
    if (type === 'prev') {
      ret = await molstar_ref.value.viewerInstance.visual.show_prev()
    } else if (type === 'chain') {
      const ret_no = await molstar_ref.value.viewerInstance.visual._showSelect()
      if (ret_no === -1) {
        ret = {polymer: true, ligand: false, water: false}
        await molstar_ref.value.viewerInstance.recreate_s_c(ret)
        // 隐藏不显示的部分
        // 通过比较pdbinfo找到不显示的部分
        // hide_selection()
        await reverse_show(ret, show_params)
      } else {
        ret = {polymer: false, ligand: false, water: false}
      }
      
    } else if (type === 'water') {
      const ret_no = await molstar_ref.value.viewerInstance.visual._showSelect('Water')
      if (ret_no === -1) {
        ret = {polymer: false, ligand: false, water: true}
        await molstar_ref.value.viewerInstance.recreate_s_c(ret)
        await reverse_show(ret, show_params)
      } else {
        ret = {polymer: false, ligand: false, water: false}
      }
    } else if (type === 'ligand') {
      const ret_no = await molstar_ref.value.viewerInstance.visual._showSelect('Ligand')
      if (ret_no === -1) {
        ret = {polymer: false, ligand: true, water: false}
        await molstar_ref.value.viewerInstance.recreate_s_c(ret)
        await reverse_show(ret, show_params)
      } else {
        ret = {polymer: false, ligand: false, water: false}
      }
    } else {
      ret = await molstar_ref.value.viewerInstance.visual.show_all()
    }
    console.log('ret', ret)
    await recreate_repr(1, ret.polymer, ret.ligand, ret.water)
  }

  const reverse_show = async (ret, show_params) => {
    if (show_params.length === 0) {
      return 
    }
    let hide_params = []
    for (let i = 0; i < show_params.length; i++) {
      if (ret.polymer) {
        hide_params = pdb_info.value.chain.filter(item => item.auth_asym_id !== show_params[i].auth_asym_id)
      } else if (ret.ligand) {
        hide_params = pdb_info.value.ligand.filter(item => item.auth_residue_number !== show_params[i].auth_residue_number)
      } else if (ret.water) {
        hide_params = pdb_info.value.water.filter(item => item.auth_residue_number !== show_params[i].auth_residue_number)
      }
    }
    select_none()
    console.log('hide_params', hide_params)
    if (hide_params.length > 0) {
      quick_select(hide_params)
      hide_selection()
      select_none()
    }
  }

  const expand_selection = () => {
    molstar_ref.value.viewerInstance.visual.expand_select(Number(expand_number.value))
  }

  const add_distance = () => {
    molstar_ref.value.viewerInstance.measure.add_distance()
  }

  const add_angle = () => {
    molstar_ref.value.viewerInstance.measure.add_angle()
  }

  const add_dihedral = () => {
    molstar_ref.value.viewerInstance.measure.add_dihedral()
  }

  const clean_measure = () => {
    molstar_ref.value.viewerInstance.measure.clean_all_measure()
  }

  const select_all = () => {
    molstar_ref.value.viewerInstance.visual.select_all()
  }

  const select_none = () => {
    molstar_ref.value.viewerInstance.visual.select_none()
  }

  const invert_select = () => {
    molstar_ref.value.viewerInstance.visual.inverse_select()
  }

  const change_water_repr = () => {
    molstar_ref.value.viewerInstance.set_visibility('Water')
  }

  const show_prolif_func = () => {
    show_prolif.value = !show_prolif.value
    if (show_prolif.value) {
      nextTick(() => {
        prolif_ref.value.set_ligand_from_outer()
      })
    }
  }

  onMounted(async () => {
    await init()
    emit('init-complete')
  })

  defineExpose({
    init,
    reset_all,
    load_structure,
    set_background,
    toggle_spin,
    full_screen,
    full_screen_type,
    add_shape,
    remove_shape,
    reset_camera,
    add_mouse_event,
    expand_selection,
    granularity,
    expand_number,
    pdb_info,
    show_tool,
    chain_repr,
    old_repr,
    quick_select,
    hide_selection,
    show_selection,
    get_pdb_info,
    create_pocket,
    set_ligand_view_id_visibility,
    remove_ligand_view_pdb,
    select_none,
    change_water_repr,
    prolif_ref,
    show_prolif_func
  })

</script>

<style lang="css">
  /* Maintain the original Molstar-specific CSS */
  .drugflow_molstar .msp-layout-main {
    top: 0px!important;
    bottom: 97px!important;
  }
  .drugflow_molstar_no_sequence .msp-layout-main {
    bottom: 0px!important;
  }
  .drugflow_molstar .msp-layout-top {
    bottom: 0!important;
    top: auto!important;
  }
  .drugflow_molstar .msp-plugin .msp-viewport-top-left-controls {
    display: none;
  }
  .drugflow_molstar .msp-plugin .msp-selection-viewport-controls {
    display: none;
  }
  .drugflow_molstar .msp-plugin .msp-viewport-controls {
    display: none;
  }
  .drugflow_molstar .msp-plugin .msp-layout-standard {
    border: none;
  }
</style>
