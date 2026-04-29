import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = authAPI.getGoogleLoginUrl();
  };

  const handleGithubLogin = () => {
    window.location.href = authAPI.getGithubLoginUrl();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-sky-600"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-sky-50 text-slate-900">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-56 bg-white" />

        <header className="mx-auto flex max-w-7xl px-6 py-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
              T
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-700">TechBit</p>
              <p className="text-sm text-slate-500">Developer trend intelligence</p>
            </div>
          </Link>

          
        </header>

        <div className="mx-auto max-w-xl">

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
              <div className="rounded-[1.5rem] p-6 sm:p-7">
                <div className="mb-7 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-3xl font-bold text-white">
                    T
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Authentication</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">Open TechBit</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Choose your provider and continue your developer workflow.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-base font-semibold text-slate-900 transition-transform hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={handleGithubLogin}
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-slate-900 px-5 py-3.5 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    <Github className="h-5 w-5" />
                    Continue with GitHub
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
                  <p className="font-medium text-sky-700">Secure sign-in flow</p>
                  <p className="mt-1 leading-6">
                    We only use trusted OAuth providers and keep your access flow focused and minimal.
                  </p>
                </div>

                <p className="mt-6 text-center text-xs text-slate-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-slate-500">
              New here?{' '}
              <Link to="/" className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800">
                Explore the platform
                <ArrowRight size={14} />
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
};


export default Login;
