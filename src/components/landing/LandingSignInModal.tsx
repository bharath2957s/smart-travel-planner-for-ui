import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PaperPlaneLogo } from './OrigamiIcons';
import { useAuth } from '../../lib/AuthContext';

interface LandingSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (email: string) => void;
  initialTab?: 'signin' | 'register';
}


export const LandingSignInModal: React.FC<LandingSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'signin',
}) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'signin') {
        const result = await login(email, password);
        if (result.success) {
          setSubmitted(true);
          setTimeout(() => {
            onSuccess?.(email);
            onClose();
            setSubmitted(false);
          }, 1000);
        } else {
          setErrorMessage(result.error || 'Invalid email or password.');
        }
      } else {
        const result = await register(name || email.split('@')[0], email, password);
        if (result.success) {
          setSubmitted(true);
          setTimeout(() => {
            onSuccess?.(email);
            onClose();
            setSubmitted(false);
          }, 1000);

        } else {
          setErrorMessage(result.error || 'Registration failed. Email might already be taken.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 text-center bg-gradient-to-b from-blue-50/60 to-white">
          <div className="flex justify-center mb-3">
            <PaperPlaneLogo className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">
            {tab === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your private travel dossiers, custom activities, and persistent itineraries.
          </p>

          <div className="flex bg-slate-100 p-1 rounded-xl mt-6">
            <button
              onClick={() => {
                setTab('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'signin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800">
              {tab === 'signin' ? 'Signed In Successfully!' : 'Account Created Successfully!'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Loading your personalized travel workspace...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Julian Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Quick Demo Credential Pill */}
            {tab === 'signin' && (
              <div
                onClick={() => {
                  setEmail('traveler@world.com');
                  setPassword('Traveler123!');
                  setErrorMessage(null);
                }}
                className="text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-xl cursor-pointer transition text-center border border-blue-100"
              >
                Use Demo Account: <strong>traveler@world.com</strong> / <strong>Traveler123!</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isSubmitting
                  ? 'Verifying...'
                  : tab === 'signin'
                  ? 'Sign In to Your Account'
                  : 'Create Free Account'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
