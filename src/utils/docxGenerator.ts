import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, convertInchesToTwip, ExternalHyperlink } from 'docx'
import { saveAs } from 'file-saver'
// @ts-ignore
import { upload_file_to_s3, download_from_s3 } from './common.js'

// 检查是否为LDAP模式
function isLdapMode(): boolean {
  return import.meta.env.VITE_APP_ENV === 'ldap'
}

// 中文字体配置
const CHINESE_FONTS = {
  primary: '微软雅黑',
  fallback: ['黑体', 'SimHei', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'Arial Unicode MS']
}

// 创建字体配置对象
const createFontConfig = () => ({
  name: CHINESE_FONTS.primary,
  eastAsia: CHINESE_FONTS.primary,
  cs: CHINESE_FONTS.primary,
  ascii: CHINESE_FONTS.primary,
  hAnsi: CHINESE_FONTS.primary,
})

// 引用类型接口
interface Citation {
  cite_id: number
  type: string
  url?: string
  title?: string
  published_time?: string
  domain_url?: string
  docId?: string
  filename?: string
  code?: string
  language?: string
  mol_name?: string
  smiles?: string
}

// 从pipeline中提取引用信息
function extractCitations(pipeline: any[]): Citation[] {
  const citations: Citation[] = []
  let cite_id = 1
  
  if (!pipeline || pipeline.length === 0) {
    return citations
  }
  
  for (const item of pipeline) {
    if (item.description?.type === 'url' || item.description?.type === 'pdf' || 
        item.description?.type === 'code' || item.description?.type === 'mol') {
      
      const citation: Citation = {
        cite_id: cite_id,
        type: item.description.type,
        ...item.description
      }
      
      // 为URL类型添加域名
      if (citation.type === 'url' && citation.url) {
        citation.domain_url = getDomain(citation.url)
      }
      
      citations.push(citation)
      cite_id++
    }
  }
  
  return citations
}

// 获取URL域名
function getDomain(url: string): string {
  try {
    const domain = url.split('/')[2]
    if (!domain) return ''
    return domain.replace('www.', '').replace('https://', '').replace('http://', '')
  } catch {
    return ''
  }
}

// 格式化时间
function formatTime(time: string): string {
  if (!time) return ''
  return time.split('T')[0]
}

// 生成引用列表的段落
function generateReferencesParagraphs(citations: Citation[]): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = []
  
  if (citations.length === 0) {
    return paragraphs
  }
  
  // 添加引用标题
  paragraphs.push(new Paragraph({
    children: [
      new TextRun({
        text: '参考资料',
        font: createFontConfig(),
        size: 24,
        bold: true,
      })
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: convertInchesToTwip(0.3),
      after: convertInchesToTwip(0.2),
    },
  }))
  
  // 为每个引用添加段落
  for (const citation of citations) {
    const children: (TextRun | ExternalHyperlink)[] = []
    
    // 添加引用编号
    children.push(new TextRun({
      text: `[${citation.cite_id}] `,
      font: createFontConfig(),
      size: 14,
    }))
    
    switch (citation.type) {
      case 'url':
        if (citation.title) {
          children.push(new TextRun({
            text: `${citation.title}. `,
            font: createFontConfig(),
            size: 14,
          }))
        }
        if (citation.domain_url) {
          children.push(new TextRun({
            text: `来源: ${citation.domain_url}. `,
            font: createFontConfig(),
            size: 14,
          }))
        }
        if (citation.url) {
          children.push(new TextRun({
            text: `访问地址: `,
            font: createFontConfig(),
            size: 14,
          }))
          children.push(new ExternalHyperlink({
            children: [
              new TextRun({
                text: citation.url,
                font: createFontConfig(),
                size: 14,
                color: '0066CC',
                underline: {},
              })
            ],
            link: citation.url
          }))
          children.push(new TextRun({
            text: `. `,
            font: createFontConfig(),
            size: 14,
          }))
        }
        if (citation.published_time) {
          children.push(new TextRun({
            text: `发布时间: ${formatTime(citation.published_time)}.`,
            font: createFontConfig(),
            size: 14,
          }))
        }
        break
        
      case 'pdf':
        let pdfText = ''
        if (citation.title) {
          pdfText += `${citation.title}. `
        }
        if (citation.filename) {
          pdfText += `文件: ${citation.filename}. `
        }
        pdfText += `类型: PDF文档.`
        children.push(new TextRun({
          text: pdfText,
          font: createFontConfig(),
          size: 14,
        }))
        break
        
      case 'code':
        let codeText = `代码片段. `
        if (citation.language) {
          codeText += `语言: ${citation.language}. `
        }
        codeText += `类型: 代码执行结果.`
        children.push(new TextRun({
          text: codeText,
          font: createFontConfig(),
          size: 14,
        }))
        break
        
      case 'mol':
        let molText = ''
        if (citation.mol_name) {
          molText += `分子: ${citation.mol_name}. `
        }
        if (citation.smiles) {
          molText += `SMILES: ${citation.smiles}. `
        }
        molText += `类型: 分子数据.`
        children.push(new TextRun({
          text: molText,
          font: createFontConfig(),
          size: 14,
        }))
        break
        
      default:
        children.push(new TextRun({
          text: `引用资料.`,
          font: createFontConfig(),
          size: 14,
        }))
    }
    
    paragraphs.push(new Paragraph({
      children: children,
      spacing: {
        after: convertInchesToTwip(0.08),
      },
    }))
  }
  
  return paragraphs
}

// 简单的markdown解析器（基于正则表达式）
interface ParsedContent {
  type: 'title' | 'heading' | 'paragraph' | 'code' | 'math' | 'list' | 'table' | 'text'
  content: string
  level?: number
  items?: string[]
  tableData?: {
    headers: string[]
    rows: string[][]
  }
}

function parseMarkdown(content: string): ParsedContent[] {
  const lines = content.split('\n')
  const parsed: ParsedContent[] = []
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i].trim()
    
    if (!line) {
      i++
      continue
    }
    
    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      parsed.push({
        type: 'heading',
        content: headingMatch[2],
        level: headingMatch[1].length
      })
      i++
      continue
    }
    
    // 代码块
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      parsed.push({
        type: 'code',
        content: codeLines.join('\n')
      })
      i++
      continue
    }
    
    // 数学公式块（$$开头的行）
    if (line.startsWith('$$')) {
      const mathLines: string[] = [line]
      i++
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        mathLines.push(lines[i])
        i++
      }
      // 添加结束行
      if (i < lines.length) {
        mathLines.push(lines[i])
        i++
      }
      parsed.push({
        type: 'math',
        content: mathLines.join('\n').replace(/^\$\$|\$\$$/g, ''), // 移除$$符号
      })
      continue
    }
    
    // 无序列表
    if (line.match(/^[\-\*\+]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[\-\*\+]\s+/)) {
        items.push(lines[i].trim().replace(/^[\-\*\+]\s+/, ''))
        i++
      }
      parsed.push({
        type: 'list',
        content: '',
        items
      })
      continue
    }
    
    // 有序列表
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      parsed.push({
        type: 'list',
        content: '',
        items
      })
      continue
    }
    
    // 表格（必须以|开头，确保是真正的表格行）
    if (line.startsWith('|') && line.includes('|') && line.split('|').length > 2) {
      const tableRows: string[] = []
      let headerRow = ''
      
      // 收集表格行
      while (i < lines.length) {
        const currentLine = lines[i].trim()
        
        // 检查是否是表格行（以|开头）
        if (!currentLine.startsWith('|') || !currentLine.includes('|') || currentLine.split('|').length <= 2) {
          break
        }
        
        // 跳过分隔符行（如 |---|---|）
        if (!currentLine.match(/^\|[\s\-\|]+\|$/)) {
          if (!headerRow) {
            headerRow = currentLine
          } else {
            tableRows.push(currentLine)
          }
        }
        i++
      }
      
      if (headerRow) {
        // 解析表头
        const headers = headerRow
          .split('|')
          .slice(1, -1) // 移除首尾空元素
          .map(cell => cell.trim().replace(/\*\*/g, '')) // 移除markdown粗体标记
        
        // 解析表格数据行
        const rows = tableRows.map(row => 
          row
            .split('|')
            .slice(1, -1) // 移除首尾空元素
            .map(cell => cell.trim())
        )
        
        parsed.push({
          type: 'table',
          content: '',
          tableData: {
            headers,
            rows
          }
        })
      }
      continue
    }
    
    // 普通段落
    const paragraphLines: string[] = []
    while (i < lines.length && lines[i].trim() && 
           !lines[i].trim().match(/^#{1,6}\s+/) &&
           !lines[i].trim().startsWith('```') &&
           !lines[i].trim().match(/^[\-\*\+]\s+/) &&
           !lines[i].trim().match(/^\d+\.\s+/)) {
      paragraphLines.push(lines[i].trim())
      i++
    }
    
    if (paragraphLines.length > 0) {
      parsed.push({
        type: 'paragraph',
        content: paragraphLines.join(' ')
      })
    }
  }
  
  return parsed
}

// 处理内联格式（粗体、斜体、代码、citation）
function processInlineFormat(text: string): TextRun[] {
  const runs: TextRun[] = []
  
  // 匹配各种格式：数学公式、粗体、斜体、代码、citation（数学公式优先级更高）
  const regex = /(\$\$[^$]+\$\$|\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|<citation\s+cite_id=(\d+)\s*\/?>(?:[^<]*<\/citation>)?|<cite_id=(\d+)\s*\/?>)/g
  
  let lastIndex = 0
  let match
  
  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      const normalText = text.slice(lastIndex, match.index)
      if (normalText.trim()) {
        runs.push(new TextRun({
          text: normalText,
          font: createFontConfig(),
          size: 16, // 调小字体
        }))
      }
    }
    
    const matchedText = match[0]
    
    if (matchedText.startsWith('$$') && matchedText.endsWith('$$')) {
      // 块级数学公式
      runs.push(new TextRun({
        text: matchedText, // 保留原始LaTeX格式
        font: {
          name: 'Cambria Math', // 数学字体
        },
        size: 14,
        color: '8B0000', // 深红色
        italics: true,
      }))
    } else if (matchedText.startsWith('$') && matchedText.endsWith('$') && !matchedText.startsWith('$$')) {
      // 行内数学公式（排除$$情况）
      runs.push(new TextRun({
        text: matchedText, // 保留原始LaTeX格式
        font: {
          name: 'Cambria Math', // 数学字体
        },
        size: 14,
        color: '8B0000', // 深红色
        italics: true,
      }))
    } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      // 粗体
      runs.push(new TextRun({
        text: matchedText.slice(2, -2),
        bold: true,
        font: createFontConfig(),
        size: 16,
      }))
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      // 斜体
      runs.push(new TextRun({
        text: matchedText.slice(1, -1),
        italics: true,
        font: createFontConfig(),
        size: 16,
      }))
    } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
      // 内联代码
      runs.push(new TextRun({
        text: matchedText.slice(1, -1),
        font: {
          name: 'Consolas',
        },
        size: 14,
        shading: {
          fill: 'F5F5F5',
        },
      }))
    } else if (matchedText.includes('cite_id')) {
      // Citation处理
      // 重新匹配citation以获取cite_id
      const citationMatch = matchedText.match(/cite_id=(\d+)/)
      if (citationMatch) {
        const citeId = citationMatch[1]
        runs.push(new TextRun({
          text: `[${citeId}]`,
          font: createFontConfig(),
          size: 14,
          color: '0066CC', // 蓝色
        }))
      }
    }
    
    lastIndex = regex.lastIndex
  }
  
  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText.trim()) {
      runs.push(new TextRun({
        text: remainingText,
        font: createFontConfig(),
        size: 16,
      }))
    }
  }
  
  return runs
}

// 清理markdown内容
function cleanMarkdownContent(content: string): string {
  // 移除thinking标签内容
  const thinkingRegex = /<thinking>[\s\S]*?<\/thinking>/gi
  content = content.replace(thinkingRegex, '')
  
  // 移除task标签内容
  const taskRegex = /<task[^>]*>[\s\S]*?<\/task>/gi
  content = content.replace(taskRegex, '')
  
  // 移除wemol_task标签内容
  const wemolTaskRegex = /<wemol_task>[\s\S]*?<\/wemol_task>/gi
  content = content.replace(wemolTaskRegex, '')
  
  // 移除结束符
  content = content.replace(/<<<end>>>/gi, '')
  
  // 移除span标签
  content = content.replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '')
  
  // 移除markdown图片标记（支持各种格式）
  content = content.replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // ![alt](url) 和 ![alt](url "title")
  
//   content = content.replace(/<!--[\s\S]*?-->/g, '')
  
//   content = content.replace(/<[^>]+>/g, '')
  
//   content = content.replace(/\n\s*\n\s*\n/g, '\n\n')
  
  return content.trim()
}

// 主要的docx生成函数
export async function generateDocx(content: string, pipeline: any[] = []): Promise<void> {
  try {
    // 清理内容
    const cleanContent = cleanMarkdownContent(content)
    
    // 解析markdown
    const parsedContent = parseMarkdown(cleanContent)

    // 提取引用信息
    const citations = extractCitations(pipeline)

    // 创建文档段落
    const children: (Paragraph | Table)[] = []
    
    // 处理解析后的内容
    for (const item of parsedContent) {
      switch (item.type) {
        case 'heading':
          const runs = processInlineFormat(item.content)
          children.push(new Paragraph({
            children: runs,
            heading: item.level === 1 ? HeadingLevel.HEADING_1 :
                    item.level === 2 ? HeadingLevel.HEADING_2 :
                    item.level === 3 ? HeadingLevel.HEADING_3 :
                    item.level === 4 ? HeadingLevel.HEADING_4 :
                    item.level === 5 ? HeadingLevel.HEADING_5 : HeadingLevel.HEADING_6,
            spacing: {
              before: convertInchesToTwip(0.1),
              after: convertInchesToTwip(0.1),
            },
          }))
          break
          
        case 'paragraph':
          const paraRuns = processInlineFormat(item.content)
          if (paraRuns.length > 0) {
            children.push(new Paragraph({
              children: paraRuns,
              spacing: {
                after: convertInchesToTwip(0.05),
              },
            }))
          }
          break
          
        case 'code':
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: item.content,
                font: {
                  name: 'Consolas',
                },
                size: 12,
              }),
            ],
            shading: {
              fill: 'F5F5F5',
            },
            spacing: {
              before: convertInchesToTwip(0.05),
              after: convertInchesToTwip(0.05),
            },
          }))
          break
          
        case 'math':
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: `$$${item.content}$$`, // 重新添加$$符号以保持LaTeX格式
                font: {
                  name: 'Cambria Math',
                },
                size: 14,
                color: '8B0000', // 深红色
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER, // 居中显示
            spacing: {
              before: convertInchesToTwip(0.1),
              after: convertInchesToTwip(0.1),
            },
          }))
          break
          
        case 'list':
          if (item.items) {
            for (const listItem of item.items) {
              const listRuns = processInlineFormat(listItem)
              children.push(new Paragraph({
                children: listRuns,
                bullet: {
                  level: 0,
                },
              }))
            }
          }
          break
          
        case 'table':
          if (item.tableData) {
            const { headers, rows } = item.tableData
            
            // 创建表格行
            const tableRows: TableRow[] = []
            
            // 添加表头
            const headerCells = headers.map(header => 
              new TableCell({
                children: [new Paragraph({
                  children: processInlineFormat(header),
                })],
                shading: { fill: 'E6E6E6' }, // 浅灰色背景
              })
            )
            tableRows.push(new TableRow({ children: headerCells }))
            
            // 添加数据行
            for (const row of rows) {
              const rowCells = row.map(cell => 
                new TableCell({
                  children: [new Paragraph({
                    children: processInlineFormat(cell),
                  })],
                })
              )
              tableRows.push(new TableRow({ children: rowCells }))
            }
            
            // 创建表格
            const table = new Table({
              rows: tableRows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
            })
            
            children.push(table)
            
            // 表格后添加空行
            children.push(new Paragraph({ children: [] }))
          }
          break
      }
    }

    // 生成引用列表段落
    const referenceParagraphs = generateReferencesParagraphs(citations)
    children.push(...referenceParagraphs)
    
    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    })
    
    // 生成文件
    const blob = await Packer.toBlob(doc)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `文档导出_${timestamp}.docx`
    
    // 如果是LDAP模式，先上传到S3，然后下载
    if (isLdapMode()) {
      try {
        // 上传到S3
        const { s3_key, s3_url } = await upload_file_to_s3(blob, filename)
        console.log('文件已上传到S3:', { s3_key, s3_url })
        
        // 从S3下载文件
        const arrayBuffer = await download_from_s3(s3_key, true)
        const downloadBlob = new Blob([arrayBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        })
        
        // 下载文件
        saveAs(downloadBlob, filename)
      } catch (error) {
        console.error('S3处理失败，回退到直接下载:', error)
        // 如果S3处理失败，回退到直接下载
        saveAs(blob, filename)
      }
    } else {
      // 非LDAP模式，直接下载
      saveAs(blob, filename)
    }
    
  } catch (error) {
    console.error('生成DOCX文件失败:', error)
    
    // 提供更友好的错误信息
    let errorMessage = '生成DOCX文件失败'
    if (error instanceof Error) {
      if (error.message.includes('nodebuffer')) {
        errorMessage = '浏览器不支持此功能，请尝试使用更新版本的浏览器'
      } else if (error.message.includes('network')) {
        errorMessage = '网络错误，请检查网络连接后重试'
      } else {
        errorMessage = `生成DOCX文件失败: ${error.message}`
      }
    }
    
    throw new Error(errorMessage)
  }
} 