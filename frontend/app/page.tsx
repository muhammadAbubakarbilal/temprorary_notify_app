'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">ProjectMind</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/signin" 
              className="px-4 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signin" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-4 inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
            AI-Powered Productivity Platform
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your AI-Powered Second Brain for Project Management
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Transform your notes into actionable tasks with AI, manage projects with ease, 
            and track time effortlessly. From personal planning to professional collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signin"
              className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Free Today →
            </Link>
            <Link 
              href="/signin"
              className="px-8 py-3 border-2 border-slate-300 dark:border-slate-700 text-lg rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Intelligent Project Management</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Combining AI-powered note-taking, smart task management, and time tracking in one seamless platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Notes</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Turn your thoughts into actionable tasks automatically with advanced AI analysis
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Get insights into your productivity patterns and optimize your workflow
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Scale from personal productivity to full team project management
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600 dark:text-slate-400">
          <p>© 2024 ProjectMind. Built with Next.js 15 + FastAPI + Python.</p>
          <p className="text-sm mt-2">Successfully migrated from Vite+React+Express to Next.js+FastAPI stack</p>
        </div>
      </footer>
    </div>
  );
}
