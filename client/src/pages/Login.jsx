import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login, demoLogin, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/items');
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try {
      const res = await login(formData);
      if (res.success) navigate('/items');
      else setError(res.message || 'Login failed');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setIsLoading(false); }
  };

  const handleDemoLogin = async () => {
    setError(''); setIsDemoLoading(true);
    try {
      const res = await demoLogin();
      if (res.success) navigate('/items');
      else setError(res.message || 'Demo login failed');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start demo.');
    } finally { setIsDemoLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — Rich dark gradient ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-16 bg-hero-mesh">
        {/* Animated blobs */}
        <div className="absolute top-16 left-16 w-72 h-72 rounded-full anim-blob anim-float-slow opacity-20"
          style={{ background: 'radial-gradient(circle, #6366F1, #EC4899)' }} />
        <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full anim-blob anim-float opacity-15"
          style={{ background: 'radial-gradient(circle, #14B8A6, #6366F1)', animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-24 w-32 h-32 rounded-full anim-blob opacity-20"
          style={{ background: 'radial-gradient(circle, #F59E0B, #EC4899)', animationDelay: '4s' }} />

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 anim-fade-up">
            <img src="/logo.jpg" alt="Lost2Found" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-2xl" />
            <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Lost2Found
            </h1>
            <p className="text-indigo-300 text-sm font-medium">Smart Campus Lost &amp; Found</p>
          </div>

          <div className="space-y-4 anim-fade-up delay-200">
            {[
              { icon: '🤖', title: 'AI-Powered Matching', desc: 'Gemini AI finds matches instantly' },
              { icon: '💬', title: 'Secure Messaging', desc: 'Connect without sharing contacts' },
              { icon: '🎓', title: 'Campus Verified', desc: 'Only for college students' },
            ].map((f, i) => (
              <div key={i} className="glass rounded-2xl px-5 py-4 flex items-center gap-4 text-left hover-lift">
                <span className="text-2xl anim-float" style={{ animationDelay: `${i * 0.5}s` }}>{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-indigo-300 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating emoji decorations */}
          <div className="absolute top-8 right-8 text-3xl anim-float delay-100 opacity-60 select-none">📱</div>
          <div className="absolute bottom-8 left-4 text-2xl anim-float delay-300 opacity-50 select-none">🔑</div>
          <div className="absolute top-1/3 -right-4 text-2xl anim-float delay-500 opacity-50 select-none">🎒</div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-section-mesh">
        <div className="w-full max-w-md anim-slide-right">
          {/* Header */}
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg" />
              <span className="font-black text-indigo-700 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>Lost2Found</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome back 👋
            </h2>
            <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Demo Banner */}
          <div className="mb-6 rounded-2xl p-4 border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 anim-fade delay-100">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Try without signing up</p>
                <p className="text-xs text-amber-700 mt-0.5">Use <strong>Demo Mode</strong> to explore instantly — no account needed.</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 anim-scale-in">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="anim-fade-up delay-200">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email" name="email" type="email" required
                value={formData.email} onChange={handleChange}
                className="input-premium"
                placeholder="you@college.edu"
              />
            </div>

            {/* Password */}
            <div className="anim-fade-up delay-300">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPw ? 'text' : 'password'}
                  required value={formData.password} onChange={handleChange}
                  className="input-premium pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Sign in button */}
            <div className="anim-fade-up delay-400">
              <button type="submit" disabled={isLoading || isDemoLoading} className="btn-primary w-full text-base">
                {isLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : 'Sign in →'}
              </button>
            </div>

            {/* Divider */}
            <div className="relative anim-fade-up delay-500">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#F5F3FF] px-3 text-xs text-slate-400 font-medium uppercase tracking-widest">or</span>
              </div>
            </div>

            {/* Demo button */}
            <div className="anim-fade-up delay-600">
              <button
                type="button" id="demo-login-btn"
                onClick={handleDemoLogin}
                disabled={isLoading || isDemoLoading}
                className="w-full py-3 px-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 font-bold text-sm transition-all hover:shadow-md hover:border-amber-400 flex items-center justify-center gap-2"
              >
                {isDemoLoading ? (
                  <><span className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-600 rounded-full animate-spin" /> Starting demo...</>
                ) : (
                  <><span>⚡</span> Try Demo — No Sign-Up Required</>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 anim-fade delay-700">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 underline underline-offset-2 transition-colors">
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
