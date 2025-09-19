declare module 'markdown-it' {
  const markdownit: any
  export default markdownit
}

declare module 'markdown-it-external-link' {
  const plugin: any
  export default plugin
}

declare module '@xtthaop/markdown-it-katex' {
  const plugin: any
  export default plugin
}

declare module 'highlight.js' {
  export const highlight: any
  export const getLanguage: any
  export default any
}

declare module '@/utils/common.js' {
  export const preview_pdf_from_s3: (url?: string, key?: string) => Promise<ArrayBuffer>
  export const download_pdf_from_s3: (url?: string, key?: string, need_decrypt?: boolean) => Promise<ArrayBuffer>
  export const arrayBufferToBase64: (buffer: ArrayBuffer) => string
  export const base64ToArrayBuffer: (base64: string) => ArrayBuffer
  export const decryptFile: (ciphertextBase64: string, keyBase64: string, ivBase64: string) => Promise<Uint8Array>
  export const calc_iou: (pocket_a: any, pocket_b: any) => number
  export const change_pocket_to_xyz: (coords_info: any, expand?: number) => any
}

declare module '@/api/common.js' {
  export const get_doc_markdown_api: (docId: string) => Promise<any>
  export const open_knowledge_api: (docId: string) => Promise<any>
  export const getimgbase64_api: (imgId: string) => Promise<any>
  export const get_doc_api: (docId: string) => Promise<any>
  export const get_kb_api: (kbId: string) => Promise<any>
  export const draw_svg_api: (formData: any) => Promise<any>
  export const get_mol_png_api: (key: string) => Promise<any>
  export const add_doctokb_api: (param: any) => Promise<any>
}

declare module '@/stores/index.js' {
  export const useStore: () => any
} 