import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye, ArrowRight, Check, Play, X,
  Shield, Activity, AlertTriangle, BarChart2,
  Link2, Share2, UserCheck, Lock,
} from 'lucide-react'

// ─── Hand-Drawn SVG Components ───────────────────────────────────────────────

function WavyUnderline({
  drawn = false,
  delay = 0,
  color = '#0066cc',
}: {
  drawn?: boolean
  delay?: number
  color?: string
}) {
  return (
    <svg
      className="absolute left-0 w-full pointer-events-none"
      style={{ bottom: '-5px', height: '12px' }}
      viewBox="0 0 300 10"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M 2 6 Q 37 1, 75 6 Q 112 11, 150 6 Q 188 1, 225 6 Q 262 11, 298 6"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={drawn ? 0 : 1}
        style={{ transition: `stroke-dashoffset 1s ease ${delay}s` }}
      />
    </svg>
  )
}

// Drawn circle that animates around step numbers on scroll
function SketchCircle({ drawn = false, delay = 0 }: { drawn?: boolean; delay?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <path
        d="M 20 3 C 33 2, 39 9, 38 20 C 39 31, 33 38, 20 38 C 7 38, 1 31, 2 20 C 1 9, 7 2, 20 3"
        fill="none"
        stroke="#0066cc"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={drawn ? 0 : 1}
        style={{ transition: `stroke-dashoffset 0.7s ease ${delay}s` }}
      />
    </svg>
  )
}

// Curved arrow — decorative, atmospheric
function SketchArrow({ className = '' }: { className?: string }) {
  return (
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none" className={className} aria-hidden="true">
      <path d="M 8 6 C 2 22, 22 36, 36 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M 28 46 L 37 48 L 38 39"   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Tiny ambient doodles — scattered around sections
const DoodleStar = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 1 L12.8 7.8 H19.8 L14.2 11.8 L16.2 18.5 L11 14.5 L5.8 18.5 L7.8 11.8 L2.2 7.8 H9.2 Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const DoodleX = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M3 3 L15 15 M3 15 L15 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const DoodleDots = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    {[4, 14, 24].flatMap(x =>
      [4, 14, 24].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="currentColor" />)
    )}
  </svg>
)

const DoodleZigzag = () => (
  <svg width="52" height="16" viewBox="0 0 52 16" fill="none" aria-hidden="true">
    <path d="M0 8 L13 2 L26 14 L39 2 L52 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const DoodleSpiral = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <path d="M13 13 C13 10, 10 8, 8 10 C6 12, 7 16, 10 18 C13 20, 17 19, 19 16 C21 12, 20 8, 17 6 C14 4, 9 4, 6 7"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const DoodleSquiggle = () => (
  <svg width="64" height="14" viewBox="0 0 64 14" fill="none" aria-hidden="true">
    <path d="M0 7 C8 2, 16 12, 24 7 C32 2, 40 12, 48 7 C56 2, 60 12, 64 7"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// ─── Attention Verified Mock (hero right) ────────────────────────────────────

const RING_R    = 40
const RING_CIRC = 2 * Math.PI * RING_R

function AttentionMock() {
  const [score, setScore] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setScore(94); return }

    let intervalId: ReturnType<typeof setInterval>
    const timeoutId = setTimeout(() => {
      let n = 0
      intervalId = setInterval(() => {
        n = Math.min(n + 94 / 80, 94)
        setScore(Math.round(n))
        if (n >= 94) clearInterval(intervalId)
      }, 20)
    }, 800)

    return () => { clearTimeout(timeoutId); clearInterval(intervalId) }
  }, [])

  const ringOffset = RING_CIRC * (1 - score / 100)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-elevation-3 overflow-hidden w-full max-w-sm mx-auto lg:mx-0 motion-safe:animate-float">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-300"    aria-hidden="true" />
        <span className="w-3 h-3 rounded-full bg-yellow-300" aria-hidden="true" />
        <span className="w-3 h-3 rounded-full bg-green-300"  aria-hidden="true" />
        <span className="ml-2 text-xs text-gray-400 truncate">Introduction to Cell Biology</span>
      </div>

      <div className="relative bg-slate-800 aspect-video flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <Play size={18} className="text-white ml-0.5" aria-hidden="true" />
        </div>
        <span className="absolute bottom-2 right-3 text-[11px] text-white/60 font-mono tabular-nums">8:24 / 22:00</span>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
          <div className="h-full bg-primary-400" style={{ width: '38%' }} />
        </div>
      </div>

      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-14 h-14 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <UserCheck size={22} className="text-primary-500" aria-hidden="true" />
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-success-500 rounded-full flex items-center justify-center shadow-sm">
              <Check size={10} className="text-white" strokeWidth={3} aria-hidden="true" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-success-600">Face present</span>
        </div>

        <div className="w-px h-14 bg-gray-100" aria-hidden="true" />

        <div className="flex flex-col items-center gap-1">
          <div className="relative w-24 h-24">
            <svg width="96" height="96" className="-rotate-90" aria-label={`Attention score ${score}%`} role="img">
              <circle cx="48" cy="48" r={RING_R} fill="none" stroke="#e2e8f0" strokeWidth="7" />
              <circle
                cx="48" cy="48" r={RING_R}
                fill="none" stroke="#0066cc" strokeWidth="7"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.04s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
              <span className="text-xl font-bold text-slate-800 tabular-nums leading-none">{score}%</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">Focus</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Attention score</span>
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success-100 text-success-700">
          <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" aria-hidden="true" />
          Watching live
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-100 text-primary-700">
          Verified
        </span>
      </div>
    </div>
  )
}

// ─── Static data ─────────────────────────────────────────────────────────────

const TRUST_BAR = [
  { icon: Shield,    label: 'No video recording' },
  { icon: UserCheck, label: 'Client-side detection' },
  { icon: Lock,      label: 'COPPA compliant' },
  { icon: Check,     label: 'GDPR deletion on request' },
]

const STEPS = [
  { num: '1', icon: Link2,     title: 'Paste a video URL',           desc: 'Paste any YouTube link. Verified Video validates it and creates a shareable session in seconds.' },
  { num: '2', icon: Share2,    title: 'Share with your class',       desc: 'Send the session link via email, your LMS, or however you reach students.' },
  { num: '3', icon: UserCheck, title: 'Students watch with consent', desc: 'Students see a clear consent prompt before the webcam is used. No recording ever happens.' },
  { num: '4', icon: BarChart2, title: 'Review engagement data',      desc: 'See who watched, for how long, and how attentively. Export a CSV for your records.' },
]

const FEATURES = [
  { icon: Shield,        title: 'Privacy by design',          desc: "No video is ever recorded or stored. Face detection runs entirely in the student's browser. We store attention scores, not footage." },
  { icon: Activity,      title: 'Real-time attention scoring', desc: 'Scores update every 5 seconds and are visible to students live, keeping verification transparent and fair.' },
  { icon: AlertTriangle, title: 'Tamper detection',           desc: 'Detects fast-forwards, speed changes, and pauses over 30 seconds — and flags those sessions for teacher review.' },
  { icon: BarChart2,     title: 'Dashboard & CSV export',     desc: 'See completion rates and average attention per student across all sessions. Export a summary report in one click.' },
]

const COMPARISON = [
  {
    label: 'Engagement tools',
    example: 'e.g. EdPuzzle',
    highlighted: false,
    items: [
      { ok: true,  text: 'Quick to assign' },
      { ok: true,  text: 'Student-friendly' },
      { ok: false, text: 'No proof students watched' },
      { ok: false, text: 'Easy to skip through' },
    ],
  },
  {
    label: 'Verified Video',
    example: "That's us",
    highlighted: true,
    items: [
      { ok: true, text: 'Quick to assign' },
      { ok: true, text: 'Student-friendly' },
      { ok: true, text: 'Proves who watched and how attentively' },
      { ok: true, text: 'No recording · COPPA compliant' },
    ],
  },
  {
    label: 'Proctoring software',
    example: 'e.g. Proctorio',
    highlighted: false,
    items: [
      { ok: true,  text: 'Verifies completion' },
      { ok: false, text: "Records students' screens" },
      { ok: false, text: 'Triggers parent complaints' },
      { ok: false, text: 'Expensive enterprise contracts' },
    ],
  },
]

const PLANS = [
  {
    name: 'Free',  price: '$0',  note: 'forever',    cta: 'Get started free', highlighted: false,
    features: ['1 active class', '5 sessions / month', 'Basic engagement report', 'CSV export'],
  },
  {
    name: 'Pro',   price: '$49', note: '/ month',    cta: 'Start Pro trial',  highlighted: true,
    features: ['Unlimited classes', 'Unlimited sessions', 'Full analytics dashboard', 'Priority support', 'API access'],
  },
  {
    name: 'School', price: 'Custom', note: 'per district', cta: 'Contact us', highlighted: false,
    features: ['Everything in Pro', 'SSO / LMS integration', 'Parental consent workflow', 'Dedicated support', 'SLA guarantee'],
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({})
  const [heroDrawn, setHeroDrawn] = useState(false)

  // Hero underline draws in shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setHeroDrawn(true), 700)
    return () => clearTimeout(t)
  }, [])

  // Scroll-reveal observer for everything else
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setIsVisible(prev => ({ ...prev, [e.target.id]: true }))
      }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Helpers to keep JSX concise
  const vis   = (id: string) => !!isVisible[id]
  const fadeUp = (id: string, d = 0) =>
    `transition-all duration-500 ${vis(id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}` +
    (d ? ` delay-[${d}ms]` : '')

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Eye size={16} className="text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-slate-900">Verified Video</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600" aria-label="Main">
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How it works</a>
            <a href="#features"     className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#pricing"      className="hover:text-primary-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary btn-small">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-4 overflow-hidden">

        {/* Ambient doodles */}
        <div className="absolute top-16 right-10 lg:right-[520px] text-primary-200 opacity-50 rotate-12 pointer-events-none" aria-hidden="true"><DoodleStar /></div>
        <div className="absolute top-32 right-20 lg:right-[560px] text-primary-100 opacity-40 pointer-events-none"           aria-hidden="true"><DoodleDots /></div>
        <div className="absolute bottom-16 left-6 text-primary-200 opacity-35 -rotate-6 pointer-events-none"                 aria-hidden="true"><DoodleZigzag /></div>
        <div className="absolute top-1/2 left-8 text-primary-100 opacity-30 pointer-events-none hidden lg:block"              aria-hidden="true"><DoodleSpiral /></div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" aria-hidden="true" />
              Privacy-first · COPPA compliant · K-12 ready
            </div>

            <h1 className="font-heading text-5xl md:text-6xl font-bold text-slate-900 leading-[1.08] tracking-tight mb-6">
              Know your students{' '}
              <span className="relative inline-block">
                actually watched.
                <WavyUnderline drawn={heroDrawn} delay={0.1} />
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Teachers paste a video URL and share a link. Students watch with lightweight, transparent attention verification — no recording, no surveillance.
            </p>

            {/* CTA with decorative arrow */}
            <div className="relative flex flex-col sm:flex-row gap-3 mb-8">
              {/* Arrow pointing down toward the button — desktop only */}
              <div className="absolute -top-10 left-44 text-primary-300 opacity-50 rotate-6 pointer-events-none hidden lg:block" aria-hidden="true">
                <SketchArrow />
              </div>
              <Link to="/signup" className="btn-primary flex items-center justify-center gap-2 group">
                Start for free
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="px-6 py-3 rounded-lg font-semibold text-primary-600 border border-primary-200 hover:bg-primary-50 transition-colors text-center"
              >
                See how it works
              </a>
            </div>

            <p className="text-sm text-slate-400">Free to start · No credit card · Works with any YouTube video</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <AttentionMock />
          </div>
        </div>
      </section>

      {/* ── Trust bar ──────────────────────────────────────────────── */}
      <section className="bg-primary-50 border-y border-primary-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {TRUST_BAR.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium text-primary-700">
                <Icon size={18} className="text-primary-500 flex-shrink-0" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-20 px-4 overflow-hidden">

        {/* Ambient doodles */}
        <div className="absolute top-8 right-8 text-primary-100 opacity-40 pointer-events-none"               aria-hidden="true"><DoodleStar /></div>
        <div className="absolute bottom-8 left-8 text-primary-100 opacity-35 rotate-45 pointer-events-none"  aria-hidden="true"><DoodleZigzag /></div>
        <div className="absolute top-1/2 right-4 text-primary-100 opacity-30 pointer-events-none hidden lg:block" aria-hidden="true"><DoodleSquiggle /></div>

        <div className="max-w-6xl mx-auto">
          {/* Section title — underline draws when it enters view */}
          <div id="hiw-title" data-animate>
            <h2 className="font-heading text-4xl font-bold text-slate-900 text-center mb-4">
              <span className="relative inline-block">
                How it works
                <WavyUnderline drawn={vis('hiw-title')} delay={0.3} />
              </span>
            </h2>
            <p className="text-slate-600 text-center mb-14 max-w-xl mx-auto">
              From assigning a video to reviewing engagement data — under two minutes to set up.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                id={`step-${i}`}
                data-animate
                className={`card ${fadeUp(`step-${i}`)}`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                {/* Step number with a sketch circle that draws in on scroll */}
                <div className="relative w-10 h-10 flex items-center justify-center mb-4">
                  <SketchCircle drawn={vis(`step-${i}`)} delay={i * 0.12 + 0.2} />
                  <span className="text-sm font-bold text-primary-600 relative z-10">{step.num}</span>
                </div>
                <step.icon size={18} className="text-primary-400 mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="relative bg-primary-50 border-y border-primary-100 py-20 px-4 overflow-hidden">

        {/* Ambient doodles */}
        <div className="absolute top-10 left-10 text-primary-200 opacity-30 pointer-events-none"             aria-hidden="true"><DoodleDots /></div>
        <div className="absolute bottom-10 right-10 text-primary-200 opacity-30 -rotate-12 pointer-events-none" aria-hidden="true"><DoodleStar /></div>
        <div className="absolute top-1/3 right-6 text-primary-200 opacity-25 pointer-events-none hidden lg:block" aria-hidden="true"><DoodleX /></div>
        <div className="absolute bottom-1/3 left-6 text-primary-200 opacity-25 pointer-events-none hidden lg:block" aria-hidden="true"><DoodleSpiral /></div>

        <div className="max-w-6xl mx-auto">
          <div id="feat-title" data-animate>
            <h2 className="font-heading text-4xl font-bold text-slate-900 text-center mb-4">
              <span className="relative inline-block">
                Built for teachers who care about privacy
                <WavyUnderline drawn={vis('feat-title')} delay={0.3} color="#0052a3" />
              </span>
            </h2>
            <p className="text-slate-600 text-center mb-14 max-w-xl mx-auto">
              Verify engagement without compromising student trust.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                id={`feat-${i}`}
                data-animate
                className={`card transition-all duration-500 ${
                  vis(`feat-${i}`)
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-6 scale-[0.97]'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-primary-600" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden">

        {/* Ambient doodles */}
        <div className="absolute top-8 left-8 text-primary-100 opacity-35 rotate-6 pointer-events-none"      aria-hidden="true"><DoodleX /></div>
        <div className="absolute bottom-8 right-8 text-primary-100 opacity-30 pointer-events-none"            aria-hidden="true"><DoodleSpiral /></div>
        <div className="absolute top-1/2 left-4 text-primary-100 opacity-25 pointer-events-none hidden lg:block" aria-hidden="true"><DoodleSquiggle /></div>

        <div className="max-w-6xl mx-auto">
          <div id="comp-title" data-animate>
            <h2 className="font-heading text-4xl font-bold text-slate-900 text-center mb-4">
              The{' '}
              <span className="relative inline-block">
                responsible middle ground
                <WavyUnderline drawn={vis('comp-title')} delay={0.25} />
              </span>
            </h2>
            <p className="text-slate-600 text-center mb-14 max-w-xl mx-auto">
              Video assignments have two bad options. We're the third.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {COMPARISON.map((col, i) => {
              // Slide left column from left, middle from bottom, right from right
              const hiddenClass  = ['-translate-x-8 opacity-0', 'translate-y-8 opacity-0', 'translate-x-8 opacity-0'][i]
              const visibleClass = ['translate-x-0 opacity-100',  'translate-y-0 opacity-100', 'translate-x-0 opacity-100'][i]
              return (
                <div
                  key={col.label}
                  id={`comp-${i}`}
                  data-animate
                  className={`rounded-xl border-2 p-6 transition-all duration-500 ${
                    vis(`comp-${i}`) ? visibleClass : hiddenClass
                  } ${
                    col.highlighted
                      ? 'border-primary-500 bg-primary-600 shadow-elevation-3 md:scale-105'
                      : 'border-gray-200 bg-white'
                  }`}
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  {col.highlighted && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-3">
                      That's us
                    </span>
                  )}
                  <h3 className={`font-heading font-bold text-lg mb-0.5 ${col.highlighted ? 'text-white' : 'text-slate-800'}`}>
                    {col.label}
                  </h3>
                  <p className={`text-xs mb-5 ${col.highlighted ? 'text-primary-200' : 'text-slate-400'}`}>
                    {col.example}
                  </p>
                  <ul className="space-y-3">
                    {col.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        {item.ok
                          ? <Check size={16} className={`flex-shrink-0 mt-0.5 ${col.highlighted ? 'text-green-300' : 'text-success-500'}`} aria-hidden="true" />
                          : <X     size={16} className={`flex-shrink-0 mt-0.5 ${col.highlighted ? 'text-primary-300' : 'text-slate-300'}`} aria-hidden="true" />
                        }
                        <span className={col.highlighted ? 'text-white' : item.ok ? 'text-slate-700' : 'text-slate-400'}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" className="relative bg-primary-50 border-y border-primary-100 py-20 px-4 overflow-hidden">

        {/* Ambient doodles */}
        <div className="absolute top-8 right-12 text-primary-200 opacity-30 pointer-events-none"               aria-hidden="true"><DoodleZigzag /></div>
        <div className="absolute bottom-8 left-12 text-primary-200 opacity-25 rotate-45 pointer-events-none"  aria-hidden="true"><DoodleStar /></div>

        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-slate-900 text-center mb-4">Simple pricing</h2>
          <p className="text-slate-600 text-center mb-14">Start free. Upgrade when your class grows.</p>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                id={`plan-${i}`}
                data-animate
                className={`rounded-xl border-2 p-6 transition-all duration-500 ${fadeUp(`plan-${i}`)} ${
                  plan.highlighted
                    ? 'border-primary-600 bg-primary-600 shadow-elevation-3 md:-mt-2'
                    : 'border-gray-200 bg-white'
                }`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                {plan.highlighted && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-3">
                    Most popular
                  </span>
                )}
                <h3 className={`font-heading font-bold text-xl mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-800'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-primary-600'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-primary-200' : 'text-slate-400'}`}>{plan.note}</span>
                </div>
                <Link
                  to="/signup"
                  className={`block text-center py-2.5 rounded-lg font-semibold text-sm mb-5 transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-primary-600 hover:bg-primary-50'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check size={14} className={`flex-shrink-0 ${plan.highlighted ? 'text-green-300' : 'text-success-500'}`} aria-hidden="true" />
                      <span className={plan.highlighted ? 'text-primary-100' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="relative gradient-primary py-20 px-4 overflow-hidden">

        {/* Ambient doodles (white on blue) */}
        <div className="absolute top-6 right-10 text-white opacity-15 rotate-12 pointer-events-none"         aria-hidden="true"><DoodleStar /></div>
        <div className="absolute bottom-6 left-10 text-white opacity-10 pointer-events-none"                  aria-hidden="true"><DoodleDots /></div>
        <div className="absolute top-1/2 right-6 text-white opacity-10 pointer-events-none hidden lg:block"   aria-hidden="true"><DoodleZigzag /></div>
        <div className="absolute top-1/3 left-6 text-white opacity-10 pointer-events-none hidden lg:block"    aria-hidden="true"><DoodleSquiggle /></div>

        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="font-heading text-4xl font-bold text-white mb-4">
            Assign your first verified video{' '}
            <span id="cta-mins" data-animate className="relative inline-block">
              in minutes.
              <WavyUnderline drawn={vis('cta-mins')} delay={0.3} color="rgba(255,255,255,0.7)" />
            </span>
          </h2>
          <p className="text-primary-200 text-lg mb-8">
            Free to start. No credit card. Works with any YouTube link.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3 rounded-lg font-semibold text-primary-700 bg-white hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
            >
              Start for free <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 rounded-lg font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye size={16} className="text-primary-400" aria-hidden="true" />
                <span className="font-semibold text-white">Verified Video</span>
              </div>
              <p className="text-sm text-slate-500">Privacy-first engagement verification for K-12 educators.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'How it works', 'Pricing'] },
              { title: 'Company', links: ['Blog', 'Contact', 'Careers'] },
              { title: 'Legal',   links: ['Privacy', 'Terms', 'COPPA'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 Verified Video. All rights reserved.</p>
            <div className="flex gap-6">
              {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
                <a key={s} href="#" className="hover:text-white transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
