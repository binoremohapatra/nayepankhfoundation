import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

const STATS = [
  { label: 'Volunteers', value: '2,400+' },
  { label: 'Programs', value: '48' },
  { label: 'Communities', value: '120+' },
  { label: 'Years Active', value: '12' },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Community First',
    description: 'We prioritize initiatives that directly benefit local communities — ensuring every effort creates measurable, lasting impact.',
    gradient: 'linear-gradient(135deg,#10B981,#0D9488)',
  },
  {
    icon: Shield,
    title: 'Trusted & Transparent',
    description: 'Operating with full transparency and verified processes to maintain the trust of our volunteers, donors, and beneficiaries.',
    gradient: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description: 'Our intelligent assistant helps identify your skills and matches you with the programs where you can make the biggest difference.',
    gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)',
  },
];

const PROGRAMS = [
  { icon: '📚', label: 'Education' },
  { icon: '🌱', label: 'Environment' },
  { icon: '🏥', label: 'Healthcare' },
  { icon: '🍽️', label: 'Food & Nutrition' },
  { icon: '💻', label: 'Digital Literacy' },
  { icon: '🏠', label: 'Shelter' },
];

/* ── Scroll-reveal hook ──────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.65s ease, transform 0.65s cubic-bezier(0.22,1,0.36,1)';
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ── Stagger children on scroll ──────────────────────────────── */
function useStaggerReveal(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, i) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(24px)';
      child.style.transition = `opacity 0.55s ease ${i * 0.1}s, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s`;
    });
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach(child => {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          });
          obs.unobserve(container);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [count]);
  return ref;
}

/* ── Animated counter ────────────────────────────────────────── */
const AnimatedStat: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        obs.unobserve(el);
      }
    }, { threshold: 0.3 });
    el.style.opacity = '0';
    el.style.transform = 'scale(0.8)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.3,0.64,1)';
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="card text-center p-5 group">
      <div
        className="text-2xl font-extrabold mb-0.5 transition-transform duration-300 group-hover:scale-110"
        style={{ fontFamily: 'Fraunces,serif', color: '#1F3A2E' }}
      >
        {value}
      </div>
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>{label}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  // Parallax on hero
  const heroRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translate(${e.clientX * 0.015}px, ${e.clientY * 0.01}px)`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate(${-e.clientX * 0.01}px, ${-e.clientY * 0.008}px)`;
      }
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const featuresRef = useStaggerReveal(3);
  const stepsRef = useStaggerReveal(3);
  const statsRef = useStaggerReveal(4);
  const whyRef = useScrollReveal();
  const ctaRef = useScrollReveal();
  const programsRef = useScrollReveal(0.1);

  return (
    <>
      <style>{`
        @keyframes heroFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          33%      { transform: translateY(-14px) rotate(3deg); }
          66%      { transform: translateY(-7px) rotate(-2deg); }
        }
        @keyframes orbitPing {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes navDrop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-float   { animation: heroFloat 6s ease-in-out infinite; }
        .orbit-ping   { animation: orbitPing 2s cubic-bezier(0,0,0.2,1) infinite; }
        .nav-drop     { animation: navDrop 0.5s ease both; }
        .card-hover   { transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 60px -8px rgba(31,58,46,0.2); }
      `}</style>

      <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: '#FAF6EE' }}>

        {/* ── Floating Nav ────────────────────────────────── */}
        <nav className="fixed top-0 inset-x-0 z-50 nav-drop">
          <div className="mx-auto max-w-6xl px-6 pt-4">
            <div
              className="flex items-center justify-between px-6 py-3.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 24px rgba(31,58,46,0.08)', border: '1px solid rgba(255,255,255,0.7)' }}
            >
              <Link to="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ color: '#1F3A2E' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3F6F52,#1F3A2E)' }}>
                  <Heart className="w-4 h-4 text-white fill-current" />
                </div>
                <span style={{ fontFamily: 'Fraunces,serif' }}>NayePankh</span>
                <span className="text-sm font-normal hidden sm:block" style={{ color: '#6B7280' }}>Foundation</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm px-4 py-2">Admin Login</Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm px-5 py-2.5"
                  style={{ borderRadius: '14px' }}
                >
                  Volunteer Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────── */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 overflow-hidden">

          {/* Animated background blobs */}
          <div
            ref={blob1Ref}
            className="absolute top-1/4 left-1/5 w-[400px] h-[400px] organic-shape animate-organic pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(63,111,82,0.15), rgba(16,185,129,0.05))', filter: 'blur(30px)', transition: 'transform 0.8s ease', animationDuration: '14s' }}
          />
          <div
            ref={blob2Ref}
            className="absolute bottom-1/4 right-1/5 w-[350px] h-[350px] organic-shape animate-organic pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(217,164,65,0.15), rgba(245,158,11,0.05))', filter: 'blur(40px)', transition: 'transform 0.8s ease', animationDuration: '18s', animationDelay: '-5s' }}
          />

          {/* Floating dots */}
          {[
            { top: '20%', left: '12%', size: 10, delay: '0s', color: 'rgba(63,111,82,0.4)' },
            { top: '35%', right: '10%', size: 7, delay: '1s', color: 'rgba(217,164,65,0.5)' },
            { bottom: '30%', left: '18%', size: 14, delay: '2s', color: 'rgba(31,58,46,0.2)' },
            { top: '15%', right: '20%', size: 6, delay: '1.5s', color: 'rgba(63,111,82,0.3)' },
          ].map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full hero-float pointer-events-none"
              style={{ ...dot, width: dot.size, height: dot.size, background: dot.color, animationDelay: dot.delay } as React.CSSProperties}
            />
          ))}

          {/* Eyebrow tag */}
          <div className="animate-fade-up mb-7" style={{ animationDelay: '0.15s' }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase"
              style={{ background: 'rgba(31,58,46,0.06)', border: '1px solid rgba(31,58,46,0.1)', color: 'rgba(31,58,46,0.65)', letterSpacing: '0.16em' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="orbit-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" style={{ background: '#D9A441' }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#D9A441' }}></span>
              </span>
              Volunteer Hub · NayePankh Foundation
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up text-center font-extrabold leading-[1.06] mb-6 max-w-3xl"
            style={{
              fontFamily: 'Fraunces,serif',
              fontSize: 'clamp(2.8rem, 6vw, 5rem)',
              color: '#1F3A2E',
              animationDelay: '0.25s',
            }}
          >
            Give Wings to{' '}
            <span className="relative inline-block">
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #D9A441 0%, #3F6F52 60%, #1F3A2E 100%)' }}
              >
                Your Kindness
              </span>
              {/* Animated underline */}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 10" fill="none">
                <path d="M4 7 Q75 1 150 7 Q225 13 296 5" stroke="#D9A441" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55"
                  style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'drawLine 1.2s ease 0.8s forwards' }}
                />
              </svg>
              <style>{`@keyframes drawLine { to { stroke-dashoffset: 0; } }`}</style>
            </span>
          </h1>

          <p
            className="animate-fade-up text-center text-lg md:text-xl max-w-xl leading-relaxed mb-11"
            style={{ color: '#6B7280', animationDelay: '0.35s' }}
          >
            Join the NayePankh Foundation Volunteer Hub. Our AI-assisted onboarding makes it easy to find where you can make the biggest impact in your community.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up flex flex-wrap justify-center gap-4 mb-16" style={{ animationDelay: '0.45s' }}>
            <Link
              to="/register"
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '1rem 2.5rem', borderRadius: '16px' }}
            >
              Start Volunteering <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="btn-outline"
              style={{ fontSize: '1rem', padding: '1rem 2.5rem', borderRadius: '16px' }}
            >
              Admin Portal
            </Link>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="animate-fade-up w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-3" style={{ animationDelay: '0.55s' }}>
            {STATS.map(s => <AnimatedStat key={s.label} {...s} />)}
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div ref={whyRef} className="text-center mb-16">
              <p className="section-eyebrow mb-3">Why NayePankh</p>
              <h2 className="section-heading mb-4">Built for Impact,<br />Designed for You</h2>
              <p className="section-sub max-w-xl mx-auto">We combine human compassion with technology to connect passionate volunteers with meaningful opportunities.</p>
            </div>
            <div ref={featuresRef} className="grid md:grid-cols-3 gap-6">
              {FEATURES.map(f => (
                <div key={f.title} className="card organic-card card-hover p-8 cursor-default group border-t-4" style={{ borderTopColor: f.gradient.includes('10B981') ? '#10B981' : f.gradient.includes('6366F1') ? '#6366F1' : '#F59E0B' }}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: f.gradient }}
                  >
                    <f.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#1F3A2E' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Programs dark strip ───────────────────────────── */}
        <section style={{ background: '#1F3A2E', padding: '4rem 1.5rem' }}>
          <div ref={programsRef} className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="section-eyebrow mb-2" style={{ color: '#D9A441' }}>Our Programs</p>
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fraunces,serif' }}>Find Your Cause</h2>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                {PROGRAMS.map((p, i) => (
                  <span
                    key={p.label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-default"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      transition: 'all 0.2s ease',
                      animationDelay: `${i * 0.08}s`,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)';
                      (e.currentTarget as HTMLElement).style.color = '#fff';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {p.icon} {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="section-eyebrow mb-3">Simple Process</p>
            <h2 className="section-heading mb-16">How It Works</h2>
            <div ref={stepsRef} className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5" style={{ background: 'linear-gradient(90deg,#D4E2C8,#3F6F52,#D4E2C8)' }} />
              {[
                { step: '01', title: 'Fill Your Details', desc: 'Share your skills, availability, and what causes matter most to you.' },
                { step: '02', title: 'Verify Your Email', desc: 'Get a 6-digit OTP to confirm your identity — takes under a minute.' },
                { step: '03', title: 'Get Matched', desc: 'Our team reviews your profile and connects you with the right program.' },
              ].map(item => (
                <div key={item.step} className="flex flex-col items-center text-center group cursor-default">
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-white font-extrabold font-mono text-lg mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10"
                    style={{ background: 'linear-gradient(135deg,#3F6F52,#1F3A2E)', boxShadow: '0 8px 20px rgba(63,111,82,0.3)' }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#1F3A2E' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────── */}
        <section className="py-20 px-6">
          <div ref={ctaRef} className="max-w-3xl mx-auto text-center">
            <div className="card organic-card p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff, #f5f9f4)' }}>
              {/* Animated background gradient */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(63,111,82,0.15), transparent 70%)' }}
              />
              <div className="relative">
                <div className="hero-float inline-block mb-5">
                  <Heart className="w-10 h-10" style={{ color: '#D9A441' }} fill="currentColor" />
                </div>
                <h2 className="section-heading mb-4">Ready to Make<br />a Difference?</h2>
                <p className="section-sub mb-8 max-w-md mx-auto">Join thousands of volunteers who are already creating change. Your skills can transform lives.</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/register" className="btn-gold" style={{ fontSize: '1rem', padding: '1rem 2.5rem', borderRadius: '16px' }}>
                    Join as a Volunteer <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link to="/login" className="btn-outline" style={{ fontSize: '1rem', padding: '1rem 2rem', borderRadius: '16px' }}>
                    Admin Access
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer style={{ background: '#1F3A2E', color: '#fff', padding: '3rem 1.5rem' }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Heart className="w-4 h-4 fill-current" style={{ color: '#D9A441' }} />
              </div>
              <span className="font-bold text-lg" style={{ fontFamily: 'Fraunces,serif' }}>NayePankh Foundation</span>
            </div>
            <div className="flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span>Giving Wings to Kindness</span>
              <span>·</span>
              <span>© {new Date().getFullYear()}</span>
              <span>·</span>
              <Link to="/register" className="hover:text-white transition-colors">Volunteer</Link>
              <Link to="/login" className="hover:text-white transition-colors">Admin</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
