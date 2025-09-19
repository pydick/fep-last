import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import autoprefixer from 'autoprefixer'
import { visualizer } from 'rollup-plugin-visualizer'
import tailwind from 'tailwindcss'
import AutoImport from 'unplugin-auto-import/vite'
import Component from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'
import vueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    visualizer({ gzipSize: true, brotliSize: true }),
    Pages({
      routeStyle: 'nuxt',
      exclude: [
        '**/components/**',
        '**/layouts/**',
        '**/data/**',
        '**/types/**',
      ],
    }),
    Layouts({
      defaultLayout: 'default',
    }),
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.md$/, // .md
      ],
      imports: [
        'vue',
        'vue-router',
      ], // 自动加载 vue,vue-router api
      dirs: [
        'src/composables/**/*.ts',
        'src/enum/**/*.ts',
        'src/store/**/*.ts',
      ], // 自动加载配置里的文件
      defaultExportByFilename: true, // 包含文件夹名称，避免命名冲突
      dts: 'src/types/auto-import.d.ts', // 类型提示文件
    }),
    Component({
      dirs: [
        'src/components',
      ],
      collapseSamePrefixes: true,
      directoryAsNamespace: true, // 包含文件夹名称，避免命名冲突
      dts: 'src/types/auto-import-components.d.ts', // 类型提示文件
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
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
	},
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
    },
  },
})
