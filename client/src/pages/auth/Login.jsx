import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Eye, EyeOff, Globe2, ArrowRight, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      if (data?.user?.role === 'Customer') navigate('/portal/overview');
      else if (data?.user?.role === 'Staff') navigate('/staff/overview');
      else navigate('/admin/overview');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f7f4ec] text-[#171717]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-[#f0dfb8]/30 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#e8d9bf]/35 blur-3xl" />
        <div className="absolute left-[13%] top-[35%] hidden h-24 w-24 rotate-6 rounded-sm border border-[#d6cdbd] bg-white/40 lg:block" />
        <div className="absolute right-[15%] top-[28%] hidden h-20 w-20 -rotate-6 rounded-sm border border-[#d6cdbd] bg-white/50 lg:block" />
        <div className="absolute bottom-28 left-[16%] hidden h-24 w-16 rotate-3 bg-[#f5c875] lg:block">
          <span className="absolute left-3 top-4 h-2 w-2 rounded-full bg-[#1f1f1f]" />
          <span className="absolute right-4 top-10 h-2 w-2 rounded-full bg-[#1f1f1f]" />
          <span className="absolute left-7 bottom-5 h-2 w-2 rounded-full bg-[#1f1f1f]" />
        </div>
        <div className="absolute bottom-28 right-[17%] hidden h-28 w-16 -rotate-2 bg-[#f5c875] lg:block">
          <span className="absolute left-4 top-5 h-2 w-2 rounded-full bg-[#1f1f1f]" />
          <span className="absolute right-3 top-12 h-2 w-2 rounded-full bg-[#1f1f1f]" />
          <span className="absolute left-6 bottom-4 h-2 w-2 rounded-full bg-[#1f1f1f]" />
        </div>
        <svg className="absolute left-[18%] top-[30%] hidden h-28 w-36 text-[#9b9589] lg:block" viewBox="0 0 160 110" fill="none">
          <path d="M3 73c35 28 20-42 45-22 26 21 27-48 54-22 16 15 27-13 51 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <svg className="absolute right-[15%] top-[38%] hidden h-28 w-36 text-[#9b9589] lg:block" viewBox="0 0 160 110" fill="none">
          <path d="M3 30c25 23 25-16 48 4 25 22 31-31 51-8 15 17 26-9 55 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <header className="relative z-10 mx-auto flex max-w-[1080px] items-start justify-between px-6 py-7 sm:px-10 lg:px-0">
        <div>
          <Link to="/login" className="flex items-center gap-2 text-xl font-black tracking-[-0.06em] text-[#171717]">
            <BrandLogo className="h-7 w-7 rounded-lg bg-white" />
            NexSub
          </Link>
          <div className="mt-4 hidden items-center gap-2 border-t border-[#bcb5a7] pt-2 text-[10px] font-medium text-[#716d65] sm:flex">
            <span>Subscription OS</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
        <nav className="flex items-center gap-3 text-xs font-semibold sm:gap-6">
          <button type="button" className="hidden items-center gap-2 text-[#4f4b45] sm:flex">
            <Globe2 className="h-4 w-4" />
            EN
          </button>
          <span className="hidden text-[#716d65] sm:inline">New here?</span>
          <Link to="/register" className="rounded-full border border-[#d9cdb9] bg-[#f5c875] px-4 py-2.5 text-[#171717] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8d28d]">
            Create account
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-118px)] items-center justify-center px-4 pb-14 sm:px-6">
        <div className="w-full max-w-[390px]">
          <div className="rounded-[26px] border border-white/80 bg-white/95 p-7 shadow-[0_24px_70px_rgba(74,61,40,0.12)] backdrop-blur sm:p-9">
            <div className="mb-7 text-center">
              <BrandLogo className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white shadow-sm" />
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a1988b]">Welcome back</p>
              <h1 className="text-[27px] font-black tracking-[-0.05em] text-[#171717]">Sign in to NexSub</h1>
              <p className="mx-auto mt-2 max-w-[250px] text-sm leading-5 text-[#777169]">
                Manage subscriptions, billing, and customer growth in one place.
              </p>
            </div>

          {error && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-[#3d3934]">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-[#dedbd5] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#aaa49b] focus:border-[#171717] focus:ring-4 focus:ring-[#171717]/5"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-bold text-[#3d3934]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#716d65] transition hover:text-[#171717]">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#dedbd5] bg-[#fcfbf8] px-4 py-3 pr-11 text-sm text-[#171717] outline-none transition placeholder:text-[#aaa49b] focus:border-[#171717] focus:ring-4 focus:ring-[#171717]/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8b857b] transition hover:text-[#171717]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="mt-2 w-full rounded-xl bg-[#f5c875] py-3.5 font-bold text-[#171717] shadow-sm hover:bg-[#f8d28d] focus:ring-[#d9a94f]">
              Sign in <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a1988b]">
            <span className="h-px flex-1 bg-[#ebe7df]" />
            Demo access
            <span className="h-px flex-1 bg-[#ebe7df]" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              ['Admin', 'admin@nexsub.com', 'Admin@12345', 'bg-[#f3eaff] text-[#6d42a5] border-[#dfc9fa]', 'A'],
              ['Staff', 'staff@nexsub.com', 'Staff@12345', 'bg-[#e9f4ff] text-[#28658f] border-[#c8e4fa]', 'S'],
              ['Customer', 'acme@example.com', 'Customer@12345', 'bg-[#fff4d8] text-[#946b1f] border-[#f1d99c]', 'C']
            ].map(([label, demoEmail, demoPass, colorClass, initial]) => (
              <button
                key={label}
                type="button"
                onClick={() => fillQuickDemo(demoEmail, demoPass)}
                className={`group flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold transition hover:-translate-y-0.5 hover:shadow-md ${demoEmail === email ? 'ring-2 ring-[#171717]/15' : ''} ${colorClass}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-xs font-black shadow-sm">
                  {initial}
                </span>
                {label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-[#8b857b]">
            New customer organization?{' '}
            <Link to="/register" className="font-bold text-[#171717] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
          <p className="mt-6 text-center text-[11px] text-[#8b857b]">
            Secure access for your subscription operations
          </p>
        </div>
      </main>
    </div>
  );
};
