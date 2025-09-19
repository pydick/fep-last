// 读取PDB文件内容
export function readPDBFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => {
      const pdbText = event.target.result
      resolve(pdbText)
    }
    reader.onerror = event => {
      reject(event.target.error)
    }
    reader.readAsText(file)
  })
}


// 确保口袋中没有配体，可以有水分子或者离子
export async function check_pocket(pdb_file, delete_hets, center_dic, dim_dic) {
  const pdb_string = await readPDBFile(pdb_file)
  // 离子的名称定义
  const ions = ['CL', 'NA', 'MG', 'ZN', 'CA', 'FE', 'MN', 'CO', 'CU', 'NI', 'K', 'CD', 'HG', 'CS', 'SR', 'BA', 'TL', 'PB', 'AU', 'AG', 'IR', 'RU', 'PT', 'RH', 'OS', 'RE', 'TC', 'MO', 'W', 'V', 'CR', 'FE', 'CO', 'NI', 'CU', 'ZN', 'Y', 'SR', 'ZR', 'NB', 'MO', 'TC', 'RU', 'RH', 'PD', 'AG', 'CD', 'IN', 'SN', 'SB', 'TE', 'I', 'XE', 'CS', 'BA', 'LA', 'CE', 'PR', 'ND', 'PM', 'SM', 'EU', 'GD', 'TB', 'DY', 'HO', 'ER', 'TM', 'YB', 'LU', 'HF', 'TA', 'W', 'RE', 'OS', 'IR', 'PT', 'AU', 'HG', 'TL', 'PB', 'BI', 'PO', 'AT', 'RN', 'FR', 'RA', 'AC', 'TH', 'PA', 'U', 'NP', 'PU', 'AM', 'CM', 'BK', 'CF', 'ES', 'FM', 'MD', 'NO', 'LR', 'RF', 'DB', 'SG', 'BH', 'HS', 'MT', 'DS', 'RG', 'CN', 'NH', 'FL', 'MC', 'LV', 'TS', 'OG']
  // delete_hets.push({ residue_number: item.residue_number, chain_id: item.chain_id })
  const delete_hets_list = delete_hets.map(item => item.chain_id + ':' + item.residue_number)
  const x = Number(center_dic.X_center)
  const y = Number(center_dic.Y_center)
  const z = Number(center_dic.Z_center)
  const dim_x = Number(dim_dic.X_dimension)
  const dim_y = Number(dim_dic.Y_dimension)
  const dim_z = Number(dim_dic.Z_dimension)
  const lines = pdb_string.split('\n')
  const het_atom_cnt = {}
  const new_delete_hets = []

  for (const line of lines) {
    if (line.startsWith('HETATM')) {
      const ligand_name = line.substr(17, 3).trim()
      const residue_id = line.substr(22, 5).trim()
      const chain_name = line.substr(21, 1).trim()
      // 转为float
      const x_c = Number(line.substr(30, 8).trim())
      const y_c = Number(line.substr(38, 8).trim())
      const z_c = Number(line.substr(46, 8).trim())
      if (het_atom_cnt[chain_name + ':' + residue_id] === undefined) {
        het_atom_cnt[chain_name + ':' + residue_id] = 1
      } else {
        het_atom_cnt[chain_name + ':' + residue_id] += 1
      }
      if (delete_hets_list.includes(chain_name + ':' + residue_id)) {
        continue
      }
      if (het_atom_cnt[chain_name + ':' + residue_id] < 8) {
        continue
      }
      console.log('ligand_name', ligand_name)
      if (ligand_name !== 'HOH' && !ions.includes(ligand_name)) {
        // 判断坐标是否在口袋内
        if (x_c < x + dim_x / 2 && x_c > x - dim_x / 2 && y_c < y + dim_y / 2 && y_c > y - dim_y / 2 && z_c < z + dim_z / 2 && z_c > z - dim_z / 2) {
          delete_hets_list.push(chain_name + ':' + residue_id)
          delete_hets.push({ residue_number: residue_id, chain_id: chain_name })
          new_delete_hets.push({ residue_number: residue_id, chain_id: chain_name, ligand_name: ligand_name })
        }
      }
    }
  }
  return {delete_hets: delete_hets, new_delete_hets: new_delete_hets}
}


// 分析PDB文件中的配体名称
function analyzePDB(pdbText) {
  const lines = pdbText.split('\n')
  const ligandNames = []

  for (const line of lines) {
    if (line.startsWith('HETATM')) {
      const ligandName = line.substr(17, 3).trim()
      if (!ligandNames.includes(ligandName)) {
        ligandNames.push(ligandName)
      }
    }
  }

  return ligandNames
}

// 同步函数解析PDB文件中的配体名称
export async function parse_ligand(file) {
  try {
    const pdbText = await readPDBFile(file)
    const ligandNames = analyzePDB(pdbText)
    console.log('配体名称:', ligandNames)
    return ligandNames
  } catch (error) {
    console.error('读取文件错误:', error)
    throw error
  }
}

// 同步函数解析PDB文件中的配体名称
export function parse_ligand_string(pdb_string) {
  const ligandNames = analyzePDB(pdb_string)
  console.log('配体名称:', ligandNames)
  return ligandNames
}

export function parse_ligand_info(pdb_string) {
  // 解析所有的配体信息
  // chain_name
  // name
  // count
  const ret_list = []
  const lines = pdb_string.split('\n')
  const ligand_dict = {}
  for (const line of lines) {
    if (line.startsWith('HETATM')) {
      const ligand_name = line.substr(17, 3).trim()
      // 增加一个离子列表，如果ligand_name在离子名称列表中，则忽略
      const ions = ['CL', 'NA', 'MG', 'ZN', 'CA', 'FE', 'MN', 'CO', 'CU', 'NI', 'K', 'CD', 'HG', 'CS', 'SR', 'BA', 'TL', 'PB', 'AU', 'AG', 'IR', 'RU', 'PT', 'RH', 'OS', 'RE', 'TC', 'MO', 'W', 'V', 'CR', 'FE', 'CO','NI', 'CU', 'ZN', 'Y', 'SR', 'X']
      if (ligand_name === 'HOH') {
        continue
      }
      if (ions.includes(ligand_name)) {
        continue
      }
      const residue_id = line.substr(22, 5).trim()
      const chain_name = line.substr(21, 1).trim()
      const x = line.substr(30, 8).trim()
      const y = line.substr(38, 8).trim()
      const z = line.substr(46, 8).trim()

      if (ligand_dict[chain_name + ':' + ligand_name + ':' + residue_id] === undefined) {
        ligand_dict[chain_name + ':' + ligand_name + ':' + residue_id] = {
          chain_name,
          name: chain_name + ':' + ligand_name + ':' + residue_id,
          residue_name: ligand_name,
          residue_id,
          count: 1,
          show_option: true,
          coords: [[Number(x), Number(y), Number(z)]]
        }
      } else {
        ligand_dict[chain_name + ':' + ligand_name + ':' + residue_id].count += 1
        ligand_dict[chain_name + ':' + ligand_name + ':' + residue_id].coords.push([
          Number(x),
          Number(y),
          Number(z)
        ])
      }
    }
  }
  for (const key in ligand_dict) {
    const max_min_dict = calc_max_min(ligand_dict[key])
    ligand_dict[key].max_min_coord = max_min_dict
    ret_list.push(ligand_dict[key])
  }
  return ret_list
}

function calc_max_min(ligand_dict) {
  const coords = ligand_dict.coords
  const x_list = []
  const y_list = []
  const z_list = []
  for (const coord of coords) {
    x_list.push(coord[0])
    y_list.push(coord[1])
    z_list.push(coord[2])
  }
  return {
    max_x: Math.max(...x_list),
    min_x: Math.min(...x_list),
    max_y: Math.max(...y_list),
    min_y: Math.min(...y_list),
    max_z: Math.max(...z_list),
    min_z: Math.min(...z_list)
  }
}

export function parse_chain_info(pdb_string) {
  // 解析所有的链信息
  const lines = pdb_string.split('\n')

  // 获得链中的residue信息
  const chain_dict = {}
  const residue_id_list = []
  for (const line of lines) {
    if (line.startsWith('ATOM')) {
      const residue_name = line.substr(17, 3).trim()
      const chain_name = line.substr(21, 1).trim()
      const residue_id = line.substr(22, 5).trim()
      if (chain_dict[chain_name] === undefined) {
        chain_dict[chain_name] = []
      }
      if (residue_id_list.includes(chain_name + ':' + residue_id)) {
        continue
      } else {
        chain_dict[chain_name].push(residue_name)
        residue_id_list.push(chain_name + ':' + residue_id)
      }
    }
  }
  const ret_list = []
  for (const chain_name in chain_dict) {
    ret_list.push({
      chain_full_name: chain_name,
      chain_main_name: chain_name,
      chain_cont: chain_dict[chain_name]
    })
  }
  return ret_list
}


export function search_centry(pdb_string, chain_list=[]) {
  if (chain_list.length === 0) {
    chain_list = parse_chain_info(pdb_string).map(item => item.chain_main_name)
  }
  const lines = pdb_string.split('\n')
  const coord_list = []

  for (const line of lines) {
    if (line.startsWith('ATOM')) {
      const chain_name = line.substr(21, 1).trim()
      const x = line.substr(30, 8).trim()
      const y = line.substr(38, 8).trim()
      const z = line.substr(46, 8).trim()
      if (chain_list.includes(chain_name)) {
        coord_list.push([Number(x), Number(y), Number(z)])
      }
    }
  }
  // 计算中心点
  const center = [0, 0, 0]
  for (const coord of coord_list) {
    center[0] += coord[0]
    center[1] += coord[1]
    center[2] += coord[2]
  }
  center[0] /= coord_list.length
  center[1] /= coord_list.length
  center[2] /= coord_list.length
  return center
}


export function parse_pdb_info(pdb_string) {
  const chain_list = parse_chain_info(pdb_string)
  const ligand_list = parse_ligand_info(pdb_string)
  return { chain: chain_list, ligand: ligand_list }
}
