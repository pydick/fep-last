# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `pnpm dev` - Start development server
- `pnpm dev:ldap` - Start development server with LDAP mode
- `pnpm build` - Production build
- `pnpm build:dev` - Development build
- `pnpm build:ldap` - Build with LDAP mode
- `pnpm build:private` - Build with private mode
- `pnpm preview` - Preview production build

### Code Quality
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm release` - Create new release

### Testing
This project does not appear to have test scripts configured. Check with the user for testing approach.

## Architecture Overview

### Tech Stack
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Routing**: Vue Router with file-based routing (vite-plugin-pages)
- **State Management**: Pinia
- **UI Components**: Radix Vue + Shadcn/ui components
- **Styling**: Tailwind CSS with custom theming
- **Data Fetching**: TanStack Vue Query
- **Form Handling**: VeeValidate with Zod validation
- **Internationalization**: Vue I18n

### Project Structure
- `src/pages/` - File-based routing pages (converted to routes automatically)
- `src/components/` - Reusable components (auto-imported)
- `src/components/ui/` - Shadcn-vue UI components
- `src/layouts/` - Layout components for different page types
- `src/composables/` - Vue composables (auto-imported)
- `src/stores/` - Pinia stores
- `src/plugins/` - App plugins initialization
- `src/utils/` - Utility functions
- `src/api/` - API service layers

### Key Features
- **Knowledge Management**: File upload, sharing, and organization system
- **Chat Interface**: AI-powered chat with document context
- **Molecular Visualization**: 3D molecular structures with Molstar
- **Multi-mode Support**: Different build modes (production, development, LDAP, private)
- **Theming**: Dynamic theme switching with multiple color schemes
- **Internationalization**: Multi-language support

### Auto-Import Configuration
Components from `src/components/` and composables from `src/composables/` are auto-imported. Vue and Vue Router APIs are also auto-imported.

### API Proxy Configuration
Development server proxies `/api` and `/trans` endpoints to `https://inplat.drugflow.com/`.

### Styling Approach
- Tailwind CSS for utility-first styling
- Custom CSS variables for theming
- Shadcn-vue components for consistent UI
- Responsive design with mobile-first approach

### State Management Pattern
Uses Pinia with composable-style stores. Configuration is persisted using `pinia-plugin-persistedstate`.

### Routing Pattern
File-based routing with layouts. Routes are automatically generated from `src/pages/` directory structure using Nuxt-style routing.