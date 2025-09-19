import { defineStore } from 'pinia'

export const useStore = defineStore('status', {
  state: () => ({
    user_info: {
      show_name: '',
      username: '',
      id: '',
      department_name: '',
    },

    main_status: 1,
    channel_id: null,
    file_data: null,

    folder_id: null,
    folder_name: '',
    folder_file_count: 0,

    prompt_list: [],
    folder_list: [],
    login_dialog: false,
    user_tab: 'sign_in',
    password_token: null,
    user_id: null,

    miniside_show_content: false,
    current_btn: 'new',
    ask_active: -1,
    knowledge_active: -1,
    miniside_tab: '-1',

    now_knowledge: [],
    knowledge_folders: [],
    knowledgeCSAIDefault: false, // 调试用
    llm_select: 0,
    need_login: false,
    files_list: [],
    change_to_question_page: false,
    docNameSelectList: [],
    now_knowledge_list: [],
    docIdList: [],
    selectedKbs: [],
    isOnline: true,
    searchType: 'all',
    isThinking: true,
    isTemplateMode: false,
    templateId: null,
    templateName: null,
    isSidebarOpen: true,
    isRightSidebarOpen: false,
    current_pdf_url: '',

    // 高亮效果
    if_highlight_card: false,
    show_main_router: true,
  }),
  actions: {
    increment() {
      this.main_status++
    }
  }
})

export default useStore