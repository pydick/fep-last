import request from '@/utils/request.js'

//获取webalert
export function get_webalert_api() {
  return request.get('/api/v1/prompt/get_alert')
}

//上传pdf
export function upload_knowledge_api(params, config) {
  return request.post(`/api/v1/knowledge_base/upload?folder_id=${params.get('folder_id')}`, params, config=config)
}

export function parse_knowledge_api(params) {
  return request.post(`/api/v1/knowledge_base/parse`, params)
}

export function check_folder_api(params) {
  return request.post('/api/v1/knowledge_base/folder/check_folder', params)
}

//pdf列表
export function get_knowledgelist_api(params) {
  return request.get('/api/v1/knowledge_base', params)
}

//打开pdf
export function open_knowledge_api(doc_id) {
  return request.get(`/api/v1/knowledge_base/download/${doc_id}`)
}

export function open_knowledge_offline_api(doc_id) {
  return request.get(`/api/v1/knowledge_base/download_offline/${doc_id}`)
}

//删除pdf
export function delete_knowledge_api(params) {
  return request.delete(`/api/v1/knowledge_base/${params.doc_id}`, params)
}

//获取文件夹list
export function get_folder_api(params) {
  let url = `/api/v1/knowledge_base/folder?page=${params.page}&size=${params.size}`
  if (params.search) {
    url += `&search=${params.search}`
  }
  if (params.sort) {
    url += `&sort=${params.sort}`
  }
  return request.get(url, params)
}

//获取分享文件夹list
export function get_share_folder_api(params) {
  let url = `/api/v1/knowledge_base/get_share_folders?page=${params.page}&size=${params.size}`
  if (params.sort) {
    url += `&sort=${params.sort}`
  }
  return request.get(url, params)
}

//获取分享文件列表
export function get_shared_docs_api() {
  return request.get('/api/v1/knowledge_base/get_shared_docs')
}

//创建文件夹
export function create_folder_api(params) {
  return request.post('/api/v1/knowledge_base/folder', params)
}

//获取文件夹信息
export function get_folder_info_api(folder_id) {
  return request.get('/api/v1/knowledge_base/get_folder/' + folder_id)
}

//更新文件夹
export function edit_folder_api(params) {
  return request.put(`/api/v1/knowledge_base/folder/${params.folder_id}`, params)
}

//分享文件夹
export function share_folder_api(params) {
  return request.post('/api/v1/knowledge_base/share_folder', params)
}

//分享文件
export function share_file_api(params) {
  return request.post('/api/v1/knowledge_base/share_doc', params)
}

//取消分享
export function cancel_share_api(params) {
  return request.post('/api/v1/knowledge_base/cancel_share', params)
}

//获取文件夹下所有文件
export function get_doc_in_folder_api(params) {
  if (params.search) {
    return request.get(`/api/v1/knowledge_base/folder/${params.folder_id}?page=${params.page}&size=${params.size}&search=${params.search}`)
  } else {
    return request.get(`/api/v1/knowledge_base/folder/${params.folder_id}?page=${params.page}&size=${params.size}`)
  }
}

//删除文件夹
export function delete_folder_api(params) {
  return request.delete(`/api/v1/knowledge_base/folder/${params.folder_id}`, params)
}

//移动文件夹文件
export function move_doc_api(params) {
  return request.post('/api/v1/knowledge_base/folder/movedoc', params)
}

//拷贝文件夹文件
export function copy_doc_api(params) {
  // 如果是production环境，则使用/new_api/v1/knowledge_base/copy_doc
  // if (process.env.NODE_ENV === 'production') {
  //   return request.post('/api/v1/knowledge_base/copy_doc2', params)
  // } else {
  //   return request.post('/api/v1/knowledge_base/copy_doc', params)
  // }
  return request.post('/api/v1/knowledge_base/copy_doc', params)
}

export function test_kb_api(params) {
  return request.post('/api/v1/channel/test_kb', params)
}

// 统计访问次数
export function count_visit_api() {
  return request.get('/api/v1/')
}

//获取频道列表
export function get_channellist_api(params) {
  if (params.search) {
    return request.get(`/api/v1/channel?page=${params.page}&size=${params.size}&search=${params.search}`, params)
  } else {
    return request.get(`/api/v1/channel?page=${params.page}&size=${params.size}`, params)
  }
}
//创建频道
export function create_channel_api(params) {
  return request.post('/api/v1/channel', params)
}
//编辑频道
export function edit_channel_api(params) {
  return request.put(`/api/v1/channel/${params.channel_id}`, params)
}
//删除频道
export function delete_channel_api(params) {
  return request.delete(`/api/v1/channel/${params.channel_id}`, params)
}
//新建问题
export function create_question_api(params) {
  return request.post(`/api/v1/channel/questions`, params)
}
//gpt 新建问题
export function create_gpt_question_api(params) {
  return request.post(`/api/v1/channel/init_questions`, params)
}
//获取问题列表
export function get_questionlist_api(params) {
  return request.get(`/api/v1/channel/questions/${params.channel_id}?page=${params.page}&size=${params.size}`, params)
}
//重新提问
export function re_question_api(params) {
  return request.get(`/api/v1/channel/questions/re/${params.question_id}`, params)
}
//删除提问
export function delete_question_api(params) {
  return request.delete(`/api/v1/channel/questions/${params.question_id}`, params)
}
//点赞差评
export function add_effect_api(params) {
  return request.post(`/api/v1/channel/answer/effect`, params)
}

//获取prompt列表
export function get_prompt_api(params) {
  return request.get(`/api/v1/prompt?page=${params.page}&size=${params.size}`, params)
}

//获取prompt列表
export function get_doc_api(doc_id) {
  return request.get('/api/v1/knowledge_base/doc/' + doc_id)
}

export function get_doc_markdown_api(doc_id) {
  return request.get('/api/v1/knowledge_base/doc_markdown/' + doc_id)
}

export function get_kb_api(kb_id) {
  return request.get('/api/v1/knowledge_base/get_folder/' + kb_id)
}

export function get_folder_by_name_api(folder_name) {
  return request.get('/api/v1/knowledge_base/get_folder/xxx?folder_name=' + folder_name)
}

export function search_person_department_api(keyword) {
  return request.get('/api/v1/search_person_department?keyword=' + keyword)
}

export function get_department_tree_api() {
  return request.get('/api/v1/departments')
}

// 获取分享记录
export function get_shared_record_api(params) {
  return request.get('/api/v1/knowledge_base/get_shared_records', params)
}

//创建prompt
export function create_prompt_api(params) {
  return request.post(`/api/v1/prompt`, params)
}
//修改prompt
export function edit_prompt_api(params) {
  return request.put(`/api/v1/prompt/${params.prompt_id}`, params)
}
//删除prompt
export function delete_prompt_api(params) {
  return request.delete(`/api/v1/prompt/${params.prompt_id}`, params)
}
//删除prompt
export function get_recommend_api(params) {
  // return request.post('/new_api/v1/recommend', params)
  return request.post('/api/v1/channel/recommend', params)
}
//流式问答
export function sse_questions() {
  return '/new_api/v1/channel/questions'
}

export function stop_question_api(channel_id) {
  return request.put('api/v1/channel/stop_questions/' + channel_id)
}

export function parse_url_api(params) {
  return request.post('/api/v1/knowledge_base/parse_url', params)
}

export function get_doc_in_channel_api(channel_id) {
  return request.get('/api/v1/channel/channel_docs/' + channel_id)
}

export function get_all_doc_api(params) {
  return request.get(`/api/v1/knowledge_base/all_docs?page=${params.page}&size=${params.size}&search=${params.search}&show_my_kb=${params.show_my_kb}`, params)
}

export function add_doctokb_api(params) {
  return request.post('/api/v1/knowledge_base/add_doc_to_kb', params)
}

export function get_queue_info(question_id) {
  return request.get('/new_api/v1/channel/queue_info?question_id=' + question_id)
}

export function translate_content_api(params) {
  return request.post('/api/v1/knowledge_base/translate', params)
}

export function draw_svg_api(params) {
  return request.post('/api/v1/mol/draw_svg', params)
}

export function getimgbase64_api(img_id) {
  return request.get('/api/v1/knowledge_base/get_img/' + img_id)
}

export function get_pdb_string_api(pdb_id) {
  return request.get('/api/v1/mol/get_pdb_string?pdb_id=' + pdb_id)
}

export function get_mol_string_api(mol_key) {
  return request.get('/api/v1/mol/get_mol_string?mol_key=' + mol_key)
}

export function get_mol_png_api(mol_key) {
  return request.get('/api/v1/mol/get_mol_png?mol_key=' + mol_key)
}

export function es_copy_doc_to_question_channel_api(params) {
  return request.post('/api/v1/knowledge_base/es_copy_doc_to_question_channel', params)
}

// 获取文件夹所有标签
export function get_folder_tags_api(folder_id) {
  return request.get(`/api/v1/knowledge_base/folder/${folder_id}/tags`)
}

// 更新文件标签
export function update_file_tags_api(doc_id, tags) {
  return request.post('/api/v1/knowledge_base/folder/update_tag', {
    doc_id: doc_id,
    tag: tags
  })
}

export function download_drugflow_file_api(job_id, file_type) {
  return request.get('/api/v1/mol/download_drugflow_file?job_id=' + job_id + '&file_type=' + file_type)
}

export function update_molecule_block_api(params) {
  return request.post('/api/v1/mol/update_molecule_block', params)
}

//下载分子表格
export function download_mol_table_api(doc_id) {
  return request.get('/api/v1/mol/download_mol_table?doc_id=' + doc_id, {
    responseType: 'blob'
  })
}

//导出docx
export function export_docx_api(doc_id, question_id, question_title) {
  let url = '/api/v1/knowledge_base/export_docx?'
  if (doc_id) {
    url += 'doc_id=' + doc_id + '&'
  }
  if (question_id) {
    url += 'question_id=' + question_id + '&'
  }
  if (question_title) {
    url += 'question_title=' + question_title
  }
  return request.get(url, {
    responseType: 'blob'
  })
}

// 常用语API
// 获取用户常用语列表
export function get_phrases_api() {
  return request.get('/api/v1/phrases')
}

// 创建常用语
export function create_phrase_api(params) {
  return request.post('/api/v1/phrases', params)
}

// 删除常用语
export function delete_phrase_api(phrase_id) {
  return request.delete('/api/v1/phrases/' + phrase_id)
}

// 更新常用语
export function update_phrase_api(params) {
  return request.put('/api/v1/phrases/' + params.phrase_id, params)
}