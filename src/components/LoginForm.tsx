import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TermsModal } from './TermsModal';

/** Corner-tick frame accents (login panel, site cards). */
export const CornerTicks: React.FC<{ color?: string }> = ({ color = '#5ED6E3' }) => (
  <>
    <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t" style={{ borderColor: `${color}88` }} />
    <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t" style={{ borderColor: `${color}88` }} />
    <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l" style={{ borderColor: `${color}88` }} />
    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r" style={{ borderColor: `${color}88` }} />
  </>
);

/**
 * Sign in or register against `/auth`.
 *
 * Accounts are per-person, not per-team: the roster is open, and teams are
 * formed on the next screen. That is the backend's model — `core_user` holds a
 * person, `core_team` holds the thing that scores.
 */
export const LoginForm: React.FC = () => {
  const { login, signup, authError, busy } = useGame();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const isSignup = mode === 'signup';
  const canSubmit =
    !busy && email.trim().length > 0 && password.length > 0 && (!isSignup || (username.trim().length >= 3 && termsAccepted));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isSignup) await signup(username, email, password);
    else await login(email, password);
  };

  return (
    <>
      <div className="relative border border-[#2B354C] bg-[#0A0D15]/95 px-7 py-8 sm:px-9 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <CornerTicks />
        <h1 className="font-display font-bold uppercase leading-[1.05] tracking-tight text-[#F2F5FA] text-3xl sm:text-4xl">
          Identify<br />yourself.
        </h1>

        <div className="mt-5 flex gap-6 text-[12px] tracking-[0.25em] border-b border-[#1E2536]">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`pb-2 font-bold cursor-pointer transition-colors ${
              !isSignup
                ? 'text-[#5ED6E3] border-b-2 border-[#5ED6E3]'
                : 'text-[#C6CCDA] hover:text-[#F2F5FA] border-b-2 border-transparent'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`pb-2 font-bold cursor-pointer transition-colors ${
              isSignup
                ? 'text-[#5ED6E3] border-b-2 border-[#5ED6E3]'
                : 'text-[#C6CCDA] hover:text-[#F2F5FA] border-b-2 border-transparent'
            }`}
          >
            REGISTER
          </button>
        </div>

        <form onSubmit={submit} className="mt-6">
          {isSignup && (
            <>
              <label className="block text-[11px] font-bold tracking-[0.25em] text-[#C6CCDA]">CALLSIGN</label>
              <div className="mt-2 flex items-center gap-3 border border-[#2B354C] bg-[#07090F] px-4 py-3 focus-within:border-[#5ED6E3] transition-colors">
                <input
                  id="signup-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="3–30 CHARACTERS"
                  autoComplete="username"
                  className="flex-1 bg-transparent font-mono text-[14px] tracking-[0.08em] text-[#5ED6E3] font-semibold focus:outline-none placeholder-[#8B93A9]"
                />
                <span className="text-[10px] font-mono tracking-[0.2em] text-[#A6B2C8] font-bold px-2 py-0.5 border border-[#2B354C] bg-[#141A28]">ID:OPR</span>
              </div>
            </>
          )}

          <label className={`block text-[11px] font-bold tracking-[0.25em] text-[#C6CCDA] ${isSignup ? 'mt-6' : ''}`}>EMAIL</label>
          <div className="mt-2 flex items-center gap-3 border border-[#2B354C] bg-[#07090F] px-4 py-3 focus-within:border-[#5ED6E3] transition-colors">
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operative@axios.net"
              autoComplete="email"
              className="flex-1 bg-transparent font-mono text-[14px] tracking-[0.08em] text-[#5ED6E3] font-semibold focus:outline-none placeholder-[#8B93A9]"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <label className="block text-[11px] font-bold tracking-[0.25em] text-[#C6CCDA]">PASSWORD</label>
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-[11px] tracking-[0.2em] font-bold text-[#5ED6E3] hover:text-[#7CE3EE] transition-colors cursor-pointer"
            >
              {showPassword ? '[ HIDE ]' : '[ SHOW ]'}
            </button>
          </div>
          <div className="mt-2 border border-[#2B354C] bg-[#07090F] px-4 py-3 focus-within:border-[#5ED6E3] transition-colors">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="w-full bg-transparent font-mono text-[14px] tracking-[0.3em] text-[#F2F5FA] font-medium focus:outline-none placeholder-[#8B93A9]"
            />
          </div>
          {isSignup && (
            <div className="mt-2 text-[11px] tracking-[0.15em] text-[#A6B2C8] font-medium">MINIMUM 8 CHARACTERS</div>
          )}

          {isSignup && (
            <div className="mt-6 flex items-start gap-3">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 shrink-0 bg-[#07090F] border border-[#2B354C] text-[#5ED6E3] focus:ring-[#5ED6E3] focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="terms-checkbox" className="text-[12px] text-[#A6B2C8] leading-relaxed cursor-pointer select-none">
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="text-[#5ED6E3] font-bold hover:underline underline-offset-2"
                >
                  Rules of Engagement & Terms
                </button>
                , and understand that the organisation's decision is final.
              </label>
            </div>
          )}

          {authError && <div className="mt-4 text-[13px] text-[#E84D7E] font-medium">{authError}</div>}

          <button
            type="submit"
            id="btn-login"
            disabled={!canSubmit}
            className="mt-6 w-full bg-[#5ED6E3] hover:bg-[#7CE3EE] disabled:opacity-30 disabled:cursor-not-allowed px-10 py-4 text-[#06232A] text-[12px] font-bold tracking-[0.3em] transition-colors cursor-pointer shadow-[0_0_20px_rgba(94,214,227,0.2)] hover:shadow-[0_0_25px_rgba(94,214,227,0.35)]"
          >
            {busy ? 'CONNECTING…' : isSignup ? 'PROVISION OPERATIVE →' : 'ENTER THE ARCHIVE →'}
          </button>
        </form>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onAcceptAll={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
        }}
        onClose={() => setShowTermsModal(false)}
      />
    </>
  );
};

