import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Layers, ArrowRight, Shield, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-slate-900 items-center justify-center text-white font-bold shadow-md mb-3">
            <Layers className="w-6 h-6 text-sky-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">NexSub Platform</h2>
          <p className="text-sm text-slate-500 mt-1">Intelligent Subscription Management & Recurring Billing</p>
        </div>

        {/* Demo Fast Login Pills for Evaluators */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-600" /> Quick Hackathon Demo Logins:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('admin@nexsub.com', 'Admin@12345')}
              className="text-xs font-semibold p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('staff@nexsub.com', 'Staff@12345')}
              className="text-xs font-semibold p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200"
            >
              💼 Staff
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('acme@example.com', 'Customer@12345')}
              className="text-xs font-semibold p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200"
            >
              🏢 Customer
            </button>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full py-2.5 mt-2">
              Sign In to NexSub <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New customer organization?{' '}
              <Link to="/register" className="font-semibold text-slate-900 hover:underline">
                Register Customer Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
