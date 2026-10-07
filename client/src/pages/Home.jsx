import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/* ─── Stat card ─── */
const Stat = ({ value, label, icon }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl mb-1">{icon}</span>
    <span className="text-3xl font-extrabold text-white">{value}</span>
    <span className="text-indigo-200 text-sm mt-0.5">{label}</span>
  </div>
);

/* ─── Step card ─── */
const Step = ({ number, icon, title, description, color }) => (
  <div className="relative bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${color}`}>
      {icon}
    </div>
    <span className="absolute top-5 right-6 text-5xl font-black text-gray-50 select-none group-hover:text-gray-100 transition-colors">
      {number}
    </span>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
  </div>
);

/* ─── Feature card ─── */
const Feature = ({ icon, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="bg-gray-50">

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600">
        {/* decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          {/* badge */}
          <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-indigo-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Smart Lost &amp; Found Platform for Colleges
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Lost something?<br />
            <span className="text-indigo-200">We'll help you</span>{' '}
            <span className="relative inline-block">
              find it.
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9C50 3 150 1 298 9" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            Report lost or found items on campus. Our AI-powered matching system connects owners with finders — fast, secure, and effortless.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/report-lost' : '/register'}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/20 text-base"
            >
              😞 Report Lost Item
            </Link>
            <Link
              to={isAuthenticated ? '/report-found' : '/register'}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/15 border border-white/30 text-white font-bold rounded-xl hover:bg-white/25 transition-all text-base backdrop-blur-sm"
            >
              🎉 Report Found Item
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-indigo-200 hover:text-white text-sm font-medium underline underline-offset-2 transition-colors"
              >
                Already have an account? Sign in →
              </Link>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/10 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <Stat value="500+" label="Items Reported"     icon="📦" />
            <Stat value="350+" label="Items Matched"      icon="🤝" />
            <Stat value="200+" label="Items Returned"     icon="✅" />
            <Stat value="1000+" label="Students Helped"   icon="🎓" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">How Lost2Found works</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">Three simple steps to reunite lost items with their owners on your campus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step
            number="01"
            icon="📝"
            title="Report the Item"
            description="Quickly fill out a simple form describing the lost or found item — name, description, location, and a photo."
            color="bg-indigo-50"
          />
          <Step
            number="02"
            icon="🤖"
            title="AI Finds Matches"
            description="Our Gemini-powered AI scans all reports and automatically surfaces the best matches based on description and location."
            color="bg-violet-50"
          />
          <Step
            number="03"
            icon="🤝"
            title="Connect & Return"
            description="Chat securely with the other person, verify ownership, and coordinate the item return — all within the platform."
            color="bg-emerald-50"
          />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — illustration placeholder */}
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-10 text-center">
                <div className="text-8xl mb-6">🔍</div>
                <div className="space-y-3">
                  {[
                    { emoji: '🎒', text: 'Black backpack found near Library', tag: 'Found', color: 'bg-green-100 text-green-700' },
                    { emoji: '📱', text: 'iPhone 15 lost at Cafeteria Block B', tag: 'Lost', color: 'bg-red-100 text-red-700' },
                    { emoji: '🔑', text: 'Car keys found at Parking Lot 3', tag: 'Found', color: 'bg-green-100 text-green-700' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-left">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-sm text-gray-700 flex-1">{item.text}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.color}`}>{item.tag}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 inline-flex items-center gap-2 text-xs text-indigo-500 font-medium bg-indigo-50 px-4 py-2 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  AI matching in progress...
                </div>
              </div>
            </div>

            {/* Right — features list */}
            <div>
              <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Why Lost2Found?</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-8">
                Everything you need to recover what matters
              </h2>

              <div className="space-y-7">
                <Feature
                  icon="🤖"
                  title="AI-Powered Smart Matching"
                  description="Gemini AI automatically compares lost and found reports and surfaces probable matches — no manual searching needed."
                />
                <Feature
                  icon="💬"
                  title="Secure In-App Messaging"
                  description="Chat directly with finders or owners through our built-in real-time messaging system — no phone numbers required."
                />
                <Feature
                  icon="🔔"
                  title="Instant Notifications"
                  description="Get notified the moment a match is found, a claim is submitted, or a message arrives."
                />
                <Feature
                  icon="🛡️"
                  title="Verified Campus Community"
                  description="Built exclusively for college students. Every account is tied to a student ID, keeping the community safe and trusted."
                />
              </div>

              <div className="mt-10 flex gap-4">
                <Link
                  to={isAuthenticated ? '/items' : '/register'}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 text-sm"
                >
                  {isAuthenticated ? 'Browse Items →' : 'Get Started Free →'}
                </Link>
                <Link
                  to="/items"
                  className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  View All Items
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl px-8 py-14 text-center shadow-xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-400/20 rounded-full blur-2xl" />
          <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Lost something on campus?
          </h2>
          <p className="relative text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of students who've already recovered their belongings through Lost2Found.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? '/report-lost' : '/register'}
              className="px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-base shadow-md"
            >
              Report a Lost Item
            </Link>
            <Link
              to={isAuthenticated ? '/items' : '/login'}
              className="px-8 py-3.5 border-2 border-white/40 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-base"
            >
              Browse Found Items
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
