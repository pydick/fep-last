# GPT Frontend

<div align="center">
  
![GPT Frontend](./public/logo.svg)

一个基于 Vue 3 的智能 AI 助手前端应用，集成了多种人工智能工具和数据库查询功能。

[![Vue 3](https://img.shields.io/badge/Vue-3.5.13-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.7-brightgreen.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-blue.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 📖 项目简介

GPT Frontend 是一个现代化的 AI 助手前端应用，专为生命科学和药物研发领域设计。该应用提供了丰富的AI功能模块，包括分子计算、蛋白质分析、文献查询、数据库搜索等多种智能化工具，支持研究人员进行高效的科研工作。

## ✨ 核心功能

### 💬 智能对话页面 (Ask)
- **多模态文件上传**: 支持 PDF、图片(JPG/PNG)、分子文件(PDB/SDF)、序列文件(FASTA)、文档(PPTX/DOCX/TXT) 等格式
- **拖拽上传**: 支持文件拖拽上传，实时解析和预览
- **分子编辑器**: 集成 Ketcher 分子编辑器，支持分子结构绘制和编辑
- **分子识别**: 自动识别图片和PDF中的分子结构，提取SMILES和结构信息
- **3D分子可视化**: 基于 DrugFlow Molstar 的分子3D展示和交互
- **实时翻译**: 支持文档内容的实时中英文翻译
- **深度思考模式**: AI深度分析和推理功能
- **工具集成**: 集成多种专业工具，支持一键调用

### 🔬 医药数据库查询
- **临床试验搜索**: 基于中美ClinicTrials数据库的临床试验信息查询
- **专利信息搜索**: Google Patent等专利数据库搜索，支持CDR专利检索
- **管线数据搜索**: 自建数据库中的药物管线信息查询和分析

### 🧬 小分子工具
- **ADMET计算**: 
  - 预测17种物化性质、5种药化性质、6种成药性规则
  - 21种ADME性质、27种毒性性质的系统性评价
  - 支持Caco-2渗透性等关键参数预测
- **对接计算**: 
  - 使用DrugFlow的CarsiDock评估蛋白-配体结合构象和结合亲和力
  - 支持异构体分析和结合位点可视化
- **结构提取**: 
  - 从图片和PDF中智能提取分子结构信息

### 🧪 大分子工具 (齐鲁模式)
- **抗体开发分析**: 
  - Wemol Antibody Developability and TCE Analysis Workflow
  - 综合抗体分析工作流，包含多个分析步骤
  - FASTA文件处理、蛋白质理化性质分析、Patch分析和免疫原性预测
- **蛋白物化性质计算**: 等电点、消光系数、分子量等属性计算
- **PTM预测**: 翻译后修饰风险位点预测，扫描潜在的PTM风险位点
- **Patch分析**: 蛋白质表面Patch大小和分布分析，解决聚集问题
- **免疫原性风险评估**: AlphaMHC v3.0 beta端到端免疫原性风险预测
- **多序列比对与聚类**: 
  - 基于渐进算法的多重序列比对
  - DBSCAN算法聚类分析
- **结构预测**: 
  - 支持ESMFold、Boltz-1、Protinex等开源工具
  - AlphaFold3工具预测蛋白结构
- **专业分析模块**:
  - 溶解度预测、聚集倾向预测
  - 抗体编号注释、germline分布和比对
  - 专利序列提取和检索

### 📚 知识库管理
- **文件上传支持**:
  - 支持格式: PDF、JPG/JPEG/PNG、PPTX、DOCX、TXT
  - 单文件最大150MB，单知识库最多50个文件
  - 支持拖拽上传和批量上传
- **智能解析**:
  - 高精度PDF解析和智能内容提取
  - 自动提取表格数据和图片内容
  - 分子结构自动识别和标注
- **知识库功能**:
  - 多路智能召回的知识检索
  - 支持知识库创建、编辑和管理
  - 文件分享和权限控制(只读/管理员)
- **协作功能**:
  - 支持团队成员分享和协作
  - 批量文件操作(分享、移动、删除)
  - 加入对话功能，直接引用文档进行问答
- **翻译功能**: 
  - 支持文档内容的实时翻译
  - 保持格式的专业翻译服务

### 🔍 常规查询工具
- **互联网查询**: 多搜索引擎联合查询，自动判断使用工具
- **PPT制作**: 自动生成专业的PPT演示文稿
- **图片问答**: 
  - 分子和文字的自动识别解析
  - 支持多种图片格式的智能分析
- **页面分析**: 网页内容智能爬取和解析

### 📊 信息调研工具
- **立项调研助手**: 
  - 基于非专利药立项调研模板
  - 生成结构化的产品调研报告
  - 支持文档导出功能
- **模板化报告**:
  - 项目立项评估报告模版
  - 关键竞品差异化分析报告模版  
  - 关键节点项目评估报告模版
  - 靶点调研模版
- **自定义模板**: 
  - 支持上传自定义DOCX模板文件
  - 最大50MB文件支持
  - 模板解析和应用功能

### 🔧 常用语管理
- **短语收藏**: 支持常用问题和回答的收藏管理
- **快速调用**: 一键插入常用语到对话中
- **个性化定制**: 支持自定义常用语分类和管理


## 🛠 技术栈

### 前端框架
- **Vue 3**: 使用 Composition API 的现代化前端框架
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 快速的前端构建工具

### UI 组件库
- **Radix Vue**: 无障碍的 UI 组件原语
- **Shadcn/ui**: 现代化的 UI 组件库
- **Tailwind CSS**: 功能优先的 CSS 框架
- **Lucide Vue Next**: 美观的图标库

### 状态管理与路由
- **Pinia**: Vue 3 官方推荐的状态管理库
- **Vue Router**: 官方路由管理器
- **File-based Routing**: 基于文件的路由系统


## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 (推荐)

### 安装依赖

```bash
# 或使用 npm
npm install --force

# 可能需要安装缺失的意外
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# LDAP 模式开发
npm run dev:ldap
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建部署

```bash
# 生产环境构建
npm run build

# 开发环境构建
npm run build:dev

# LDAP 模式构建
npm run build:ldap

# 私有模式构建
npm run build:private

```


## 📁 项目结构

```
gpt_frontend/
├── public/                     # 静态资源
│   ├── examples/              # 示例文件
│   └── static/                # 静态文件
├── src/
│   ├── api/                   # API 接口层
│   ├── assets/                # 资源文件
│   ├── components/            # 组件库
│   │   ├── ui/               # UI 基础组件
│   │   ├── Layout/           # 布局组件
│   │   ├── DataTable/        # 表格组件
│   │   └── ...
│   ├── composables/           # 组合式函数
│   ├── pages/                 # 页面组件
│   │   ├── ask/              # 问答页面
│   │   ├── auth/             # 认证页面
│   │   ├── channels/         # 频道页面
│   │   ├── knowledges/       # 知识库页面
│   │   └── ...
│   ├── layouts/               # 布局模板
│   ├── plugins/               # 插件配置
│   ├── router/                # 路由配置
│   ├── stores/                # 状态管理
│   ├── types/                 # 类型定义
│   └── utils/                 # 工具函数
├── components.json            # 组件配置
├── tailwind.config.js         # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── vite.config.ts            # Vite 配置
```

## 🔧 配置说明

### 环境模式

项目支持多种构建模式：

- **production**: 生产环境
- **development**: 开发环境  
- **ldap**: LDAP 认证模式
- **private**: 私有部署模式

### 代理配置

开发环境默认代理配置：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://inplat.drugflow.com/',
      changeOrigin: true,
    },
    '/trans': {
      target: 'https://inplat.drugflow.com/',
      changeOrigin: true,
    }
  }
}
```

