import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-paper flex font-sans">

      {/* ── Left panel — branding ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-forest relative flex-col justify-between p-12 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] organic-shape animate-organic opacity-15" style={{ background: 'linear-gradient(135deg, #D9A441, transparent)', filter: 'blur(50px)', animationDuration: '15s' }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] organic-shape animate-organic opacity-20" style={{ background: 'linear-gradient(135deg, #3F6F52, transparent)', filter: 'blur(40px)', animationDuration: '20s', animationDelay: '-5s' }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Heart className="w-5 h-5 text-gold fill-current" />
          </div>
          <div>
            <div className="font-serif font-bold text-white text-lg leading-none">NayePankh</div>
            <div className="text-white/50 text-xs">Foundation</div>
          </div>
        </div>

        {/* Quote */}
        <div className="relative">
          <div className="text-5xl text-gold/30 font-serif leading-none mb-4">"</div>
          <blockquote className="text-white/90 text-xl font-serif leading-relaxed mb-6">
            Every act of kindness ripples outward, creating waves of change we may never see but always feel.
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">NayePankh Foundation</p>
              <p className="text-white/50 text-xs">Giving Wings to Kindness</p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative flex gap-4">
          {[
            { icon: Shield, label: 'Verified NGO' },
            { icon: Heart, label: '12+ Years' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2 bg-white/8 rounded-xl px-4 py-2.5 border border-white/10">
              <b.icon className="w-4 h-4 text-gold" />
              <span className="text-white/70 text-xs font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm" style={{ animation: 'stagger-up 0.6s ease both' }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-moss to-forest flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="font-serif font-bold text-forest text-lg">NayePankh Foundation</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="section-eyebrow mb-2">Admin Portal</p>
            <h1 className="text-3xl font-extrabold font-serif text-forest mb-2">Welcome back</h1>
            <p className="text-muted text-sm">
              Sign in to manage volunteers and programs.{' '}
              <Link to="/register" className="text-moss font-semibold hover:text-forest transition-colors">
                Register as volunteer →
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="input-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue="admin@nayepankh.org"
                  className="input pl-10"
                  placeholder="admin@nayepankh.org"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue="password123"
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" id="login-submit" className="btn-primary w-full py-3.5 text-base mt-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-sage-dark/40 text-center">
            <p className="text-xs text-muted">
              Are you a volunteer?{' '}
              <Link to="/register" className="text-moss font-semibold hover:text-forest">
                Register here
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="mt-6 p-4 rounded-2xl bg-sage border border-sage-dark/40 text-xs text-muted text-center">
            <span className="font-semibold text-forest">Demo:</span> Credentials are pre-filled. Just click Sign In.
          </div>
        </div>
      </div>
    </div>
  );
}
