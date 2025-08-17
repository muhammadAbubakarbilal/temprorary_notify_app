# Project Management Application

## Overview

This is a modern project management web application built with React and Express.js that provides a comprehensive suite of tools for managing projects, notes, tasks, and time tracking. The application features an AI-powered task extraction system that can automatically identify actionable items from notes, along with a real-time time tracking system and a Kanban-style task board.

The application serves as a complete productivity solution where users can create projects, write detailed notes with rich text editing, manage tasks through a visual Kanban board, and track time spent on various activities. The AI integration helps streamline workflow by automatically suggesting tasks based on note content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Rich Text Editing**: TiptapJS with extensions for links, highlights, task lists, and formatting
- **Drag and Drop**: @hello-pangea/dnd for Kanban board functionality
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with TypeScript using tsx for development
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Build System**: ESBuild for production bundling with platform-specific optimizations

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless platform
- **Schema Design**: Five main entities with proper relationships:
  - Projects (with color coding and metadata)
  - Notes (with rich text content and task associations)
  - Tasks (with status, priority, and time tracking)
  - Time entries (for detailed time tracking)
  - Active timers (for real-time timer functionality)
- **Migrations**: Drizzle Kit for database schema migrations and version control

### Authentication and Authorization
- Currently operates without explicit authentication system
- Designed for single-user or trusted environment usage
- API endpoints are unprotected, suitable for development or internal use

### AI Integration Architecture
- **Provider**: OpenAI GPT-4 API integration for intelligent task extraction
- **Task Analysis**: Automated parsing of note content to identify actionable items
- **Priority Assessment**: AI-driven priority assignment based on content context and deadlines
- **Due Date Extraction**: Natural language processing for deadline identification
- **Suggestion System**: Contextual task recommendations based on note analysis

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, TypeScript for type safety
- **Build Tools**: Vite with React plugin, ESBuild for production builds
- **Development**: tsx for TypeScript execution, @replit/vite-plugin-runtime-error-modal for error handling

### UI and Styling Dependencies
- **Component Library**: Comprehensive Radix UI primitives (@radix-ui/react-*)
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Utility Libraries**: class-variance-authority for component variants, clsx and tailwind-merge for class management

### Backend and Database Dependencies
- **Server Framework**: Express.js with TypeScript definitions
- **Database**: Drizzle ORM with Neon Database serverless driver (@neondatabase/serverless)
- **Schema Management**: drizzle-kit for migrations, drizzle-zod for schema validation integration

### Third-Party Service Integrations
- **AI Services**: OpenAI API for GPT-4 powered task extraction and analysis
- **Database Services**: Neon Database for managed PostgreSQL hosting
- **Development Tools**: Replit-specific plugins for development environment integration

### Specialized Feature Dependencies
- **Rich Text Editing**: TipTap editor with multiple extensions (StarterKit, Link, Highlight, TaskList, TaskItem)
- **Drag and Drop**: @hello-pangea/dnd for Kanban board interactions
- **State Management**: TanStack React Query for server state and caching
- **Form Management**: React Hook Form with Hookform Resolvers for Zod integration
- **Routing**: Wouter for lightweight client-side navigation