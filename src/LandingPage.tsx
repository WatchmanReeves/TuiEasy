import React from 'react';
import { Pencil, Square, Download, Image as ImageIcon, BookmarkPlus, LayoutTemplate, Zap, ArrowRight, Github, ExternalLink } from 'lucide-react';

const REPO_URL = 'https://github.com/WatchmanReeves/TuiEasy';

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="group relative bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-teal-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/5">
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative">
      <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const StepCard = ({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: React.ReactNode }) => (
  <div className="flex-1 text-center group">
    <div className="mx-auto w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5 group-hover:border-teal-500/40 group-hover:shadow-lg group-hover:shadow-teal-500/10 transition-all duration-300">
      <div className="text-teal-400 group-hover:scale-110 transition-transform duration-300">{icon}</div>
    </div>
    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-bold mb-3 font-mono">{num}</div>
    <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
    <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">{desc}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <img src="/logo-icon.png" alt="" className="h-10 w-10 rounded-xl group-hover:brightness-110 transition-all" />
            <span className="text-zinc-100 font-bold tracking-wide text-xl">Tui<span className="text-teal-400">Easy</span></span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:block">Features</a>
            <a href="#workflow" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:block">Workflow</a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              <Github size={20} />
            </a>
            <a href="/app" className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-sm rounded-lg transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30">
              Open Editor
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Gradient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-teal-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-emerald-500/3 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Terminal-style tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-sm text-zinc-400 font-mono">Open Source TUI Designer</span>
            <span className="text-xs text-zinc-600 font-mono">v1.0</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-zinc-100">TUI Design.</span>
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Too Easy.</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The visual editor for terminal user interfaces. Draw layouts with mouse, touch, or Apple Pencil.
            Export to ANSI. Feed it to your AI agent. Ship faster.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <a href="/app" className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-base rounded-xl transition-all duration-200 shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.02]">
              Try It Now <ArrowRight size={18} />
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-semibold text-base rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200">
              <Github size={18} /> GitHub
            </a>
          </div>

          {/* Hero Image */}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 via-emerald-500/10 to-teal-500/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-xs text-zinc-500 font-mono ml-3">TuiEasy — localhost:3000</span>
              </div>
              <img
                src="/hero-app.png"
                alt="TuiEasy — Designing the TuiEasy logo inside TuiEasy"
                className="w-full"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">Everything You Need</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">A complete toolkit for designing terminal interfaces — from quick sketches to production-ready layouts.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Pencil size={24} />}
              title="Freehand Drawing"
              desc="Draw with pencil, line, rectangle, and smart box tools. Supports mouse, touch, and Apple Pencil."
            />
            <FeatureCard
              icon={<LayoutTemplate size={24} />}
              title="Smart Boxes"
              desc="Auto-connect box-drawing characters. Choose from Light, Heavy, Double, Rounded, Dashed, and Mixed styles."
            />
            <FeatureCard
              icon={<ImageIcon size={24} />}
              title="Image Import"
              desc="Convert any image to terminal art using half-block color or braille dot patterns with adjustable thresholds."
            />
            <FeatureCard
              icon={<Download size={24} />}
              title="ANSI Export & Import"
              desc="Export to .ans files with full 24-bit color. Import existing ANSI art to edit and remix."
            />
            <FeatureCard
              icon={<BookmarkPlus size={24} />}
              title="Glyph Library"
              desc="Hundreds of Unicode glyphs — box drawing, braille, block elements, geometry, and alphanumerics. Save your favorites."
            />
            <FeatureCard
              icon={<Zap size={24} />}
              title="Design Library"
              desc="Save and load designs from localStorage. Premade templates for common layouts like file explorers and chat UIs."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/30 to-zinc-950 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">The Magic Workflow</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">From sketch to working TUI in three simple steps. Let AI handle the hard parts.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-8 sm:gap-4">
            <StepCard
              num="1"
              title="Sketch Your UI"
              desc="Draw the layout block-by-block using the visual editor. iPad & Apple Pencil supported."
              icon={<Pencil size={28} />}
            />
            <div className="hidden sm:flex items-center pt-10 text-zinc-700">
              <ArrowRight size={24} />
            </div>
            <StepCard
              num="2"
              title="Export the Layout"
              desc="One click export to ANSI with full 24-bit color codes. Character-perfect output."
              icon={<Download size={28} />}
            />
            <div className="hidden sm:flex items-center pt-10 text-zinc-700">
              <ArrowRight size={24} />
            </div>
            <StepCard
              num="3"
              title="Feed It to AI"
              desc="Paste the ANSI layout into your AI coding agent. It generates a working TUI from your design."
              icon={<Zap size={28} />}
            />
          </div>
        </div>
      </section>

      {/* Demo / Video Placeholder */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">See It In Action</h2>
            <p className="text-zinc-400">Watch TuiEasy transform your workflow</p>
          </div>

          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
            {/* 
              PLACEHOLDER: Replace this with a YouTube embed or looping MP4.
              Example YouTube: <iframe src="https://www.youtube.com/embed/VIDEO_ID" ... />
              Example Video: <video src="/demo.mp4" autoPlay loop muted playsInline />
            */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-teal-400 border-b-[12px] border-b-transparent ml-1" />
              </div>
              <p className="text-zinc-500 text-sm font-mono">Demo video coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">Ready to Design?</h2>
          <p className="text-zinc-400 mb-8">TuiEasy is free, open source, and runs entirely in your browser. No account needed.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/app" className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-base rounded-xl transition-all duration-200 shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.02]">
              Launch Editor <ArrowRight size={18} />
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3.5 text-zinc-400 hover:text-zinc-100 font-semibold text-base transition-colors">
              <ExternalLink size={16} /> View Source
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="" className="h-5 w-5 rounded" />
            <span className="text-zinc-500 text-sm">
              TuiEasy &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
            <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">AGPL-3.0</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
