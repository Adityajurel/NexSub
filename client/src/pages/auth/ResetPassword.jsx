import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Layers, CheckCircle, AlertCircle, Lock } from 'lucide-react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length <= 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password must be longer than 8 characters and contain uppercase, lowercase and special characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-slate-900 items-center justify-center text-white font-bold shadow-md mb-3">
            <Layers className="w-6 h-6 text-sky-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
          <p className="text-sm text-slate-500 mt-1">Create a secure new password for your account</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">Password Reset Successfully</h3>
              <p className="text-xs text-slate-500 mt-1">Redirecting you to the login screen...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <Button type="submit" loading={loading} className="w-full py-2.5">
                <Lock className="w-4 h-4 mr-1.5" /> Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
