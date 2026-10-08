import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/* ──────────────────────────────────
   Color palette used throughout:
   • Slate dark  #0F172A  (hero bg)
   • Indigo      #4F46E5  (brand)
   • Violet      #7C3AED  (gradient)
   • Amber       #F59E0B  (warm accent)
   • Rose        #F43F5E  (lost / urgent)
   • Emerald     #10B981  (found / success)
   • Warm white  #FFFBF5  (section bg)
────────────────────────────────── */

const Stat = ({ value, label, icon, color }) => (
  <div className="flex flex-col items-center">
    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 ${color}`}>{icon}</span>
    <span className="text-3xl font-extrabold text-white">{value}</span>
    <span className="text-slate-400 text-sm mt-0.5">{label}</span>
  </div>
);

const Step = ({ step, icon, title, desc, accent, textAccent }) => (
  <div className={`relative rounded-2xl p-7 border ${accent} bg-white hover:shadow-lg transition-shadow group overflow-hidden`}>
    <div className="absolute -bottom-4 -right-4 text-8xl font-black opacity-5 select-none group-hover:opacity-10 transition-opacity">
      {step}
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5 ${textAccent}`}>
      {icon}
    </div>
    <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${textAccent.replace('bg-', 'text-').split(' ')[1] || 'text-indigo-600'}`}>
      Step {step}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="bg-white">

      {/* ════════════════════════════════════
          HERO — Dark slate + colorful accents
      ════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-950">
        {/* Colorful glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Campus Lost &amp; Found
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-white">Lost something?</span><br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
              We'll help you find it.
            </span>
          </h1>

          <p className="mt-7 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Report lost or found items on campus. Our Gemini AI connects owners with finders —{' '}
            <span className="text-amber-400 font-medium">fast</span>,{' '}
            <span className="text-emerald-400 font-medium">secure</span>, and{' '}
            <span className="text-violet-400 font-medium">effortless</span>.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/report-lost' : '/register'}
              className="w-full sm:w-auto px-8 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/25 text-base flex items-center justify-center gap-2"
            >
              <span>😞</span> Report Lost Item
            </Link>
            <Link
              to={isAuthenticated ? '/report-found' : '/register'}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 text-base flex items-center justify-center gap-2"
            >
              <span>🎉</span> Report Found Item
            </Link>
            <Link
              to="/items"
              className="w-full sm:w-auto px-8 py-3.5 border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-all text-base"
            >
              Browse Items →
            </Link>
          </div>

          {!isAuthenticated && (
            <p className="mt-5 text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/5 bg-white/3">
          <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <Stat value="500+"  label="Items Reported"   icon="📦" color="bg-indigo-500/20" />
            <Stat value="350+"  label="Matches Found"    icon="🤝" color="bg-amber-500/20" />
            <Stat value="200+"  label="Items Returned"   icon="✅" color="bg-emerald-500/20" />
            <Stat value="1000+" label="Students Helped"  icon="🎓" color="bg-violet-500/20" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          HOW IT WORKS — Warm white bg
      ════════════════════════════════════ */}
      <section className="py-24 bg-[#FFFBF5] px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-amber-600 bg-amber-50 border border-amber-100 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">How Lost2Found works</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Three simple steps to reunite lost items with their owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step
              step="01"
              icon="📝"
              title="Report the Item"
              desc="Fill out a quick form — item name, description, location, and a photo. Takes less than 2 minutes."
              accent="border-rose-100"
              textAccent="bg-rose-50 text-rose-500"
            />
            <Step
              step="02"
              icon="🤖"
              title="AI Finds Matches"
              desc="Gemini AI scans all reports and surfaces the best matches based on description, category, and location."
              accent="border-indigo-100"
              textAccent="bg-indigo-50 text-indigo-500"
            />
            <Step
              step="03"
              icon="🤝"
              title="Connect & Return"
              desc="Chat securely, verify ownership, and coordinate the handoff — all inside the platform."
              accent="border-emerald-100"
              textAccent="bg-emerald-50 text-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FEATURES — White bg, 2-col layout
      ════════════════════════════════════ */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Mock item feed */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-100 bg-slate-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-slate-700">Recent Reports</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
              </span>
            </div>

            <div className="space-y-3">
              {[
                { emoji: '🎒', title: 'Black Nike Backpack', loc: 'Library, 2nd Floor', tag: 'Found', tagColor: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
                { emoji: '📱', title: 'iPhone 15 Pro — Silver', loc: 'Cafeteria Block B', tag: 'Lost', tagColor: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
                { emoji: '🔑', title: 'Car Keys — Honda', loc: 'Parking Lot 3', tag: 'Found', tagColor: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
                { emoji: '💳', title: 'Student ID Card', loc: 'Main Gate', tag: 'Lost', tagColor: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
                { emoji: '👓', title: 'Prescription Glasses', loc: 'Seminar Hall A', tag: 'Found', tagColor: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 border ${item.border} hover:shadow-sm transition-shadow`}>
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.loc}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                </div>
              ))}
            </div>

            {/* AI match banner */}
            <div className="mt-5 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-xs font-bold text-indigo-700">AI Match Found!</p>
                <p className="text-xs text-indigo-500">iPhone 15 → 94% match with report #1042</p>
              </div>
              <span className="ml-auto text-xs bg-indigo-600 text-white font-semibold px-3 py-1 rounded-full">View</span>
            </div>
          </div>

          {/* Features list */}
          <div>
            <span className="inline-block text-violet-600 bg-violet-50 border border-violet-100 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              Why Lost2Found?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-8 leading-tight">
              Everything you need to recover<br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">what matters to you</span>
            </h2>

            <div className="space-y-6">
              {[
                { icon: '🤖', color: 'bg-indigo-50', title: 'AI-Powered Smart Matching', desc: 'Gemini AI compares lost and found reports and surfaces probable matches automatically — no manual searching.' },
                { icon: '💬', color: 'bg-amber-50', title: 'Secure In-App Messaging', desc: 'Chat directly through built-in real-time messaging. No phone numbers shared, ever.' },
                { icon: '🔔', color: 'bg-rose-50', title: 'Instant Notifications', desc: 'Get notified the moment a match is found, a claim is submitted, or a message arrives.' },
                { icon: '🛡️', color: 'bg-emerald-50', title: 'Verified Campus Community', desc: 'Every account is tied to a student ID — keeping the community safe, trusted, and honest.' },
              ].map((f, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${f.color} flex items-center justify-center text-xl group-hover:scale-105 transition-transform`}>
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{f.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? '/items' : '/register'} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-100 text-sm">
                {isAuthenticated ? 'Browse Items →' : 'Get Started Free →'}
              </Link>
              <Link to="/items" className="px-6 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-colors text-sm">
                View All Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          CATEGORY QUICK LINKS
      ════════════════════════════════════ */}
      <section className="py-20 bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-emerald-700 bg-emerald-50 border border-emerald-100 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              Common Categories
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">What people lose most</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: '📱', label: 'Electronics', color: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700' },
              { icon: '🔑', label: 'Keys', color: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700' },
              { icon: '💳', label: 'Cards & IDs', color: 'from-rose-50 to-rose-100 border-rose-200 text-rose-700' },
              { icon: '🎒', label: 'Bags', color: 'from-violet-50 to-violet-100 border-violet-200 text-violet-700' },
              { icon: '👓', label: 'Glasses', color: 'from-sky-50 to-sky-100 border-sky-200 text-sky-700' },
              { icon: '📚', label: 'Books', color: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700' },
            ].map((cat, i) => (
              <Link
                key={i}
                to="/items"
                className={`flex flex-col items-center gap-2.5 py-6 rounded-2xl border bg-gradient-to-b ${cat.color} hover:shadow-md transition-all hover:-translate-y-0.5 group`}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-bold">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          CTA BANNER — Dark with amber accent
      ════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 px-8 py-16 text-center shadow-2xl">
            {/* Decorative blobs */}
            <div className="absolute top-0 left-1/3 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
                🎓 For College Students
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
                Lost something on campus?<br />
                <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                  Don't lose hope.
                </span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Join hundreds of students who've already recovered their belongings through Lost2Found.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={isAuthenticated ? '/report-lost' : '/register'}
                  className="px-8 py-3.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all text-base shadow-lg"
                >
                  😞 Report a Lost Item
                </Link>
                <Link
                  to="/items"
                  className="px-8 py-3.5 border-2 border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-base"
                >
                  🎉 Browse Found Items
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
