import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';
import { initializeGoogleSignIn, renderGoogleButton } from '../supabase';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoggedIn, addNotification, products } = useBiscooboo();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const themeProduct = products && products.length > 0 ? products[0] : null;

  // Initialize Google Sign-In
  useEffect(() => {
    const handleGoogleSignIn = (response) => {
      if (response.credential) {
        loginWithGoogle(response.credential)
          .then((result) => {
            addNotification(`Welcome ${result.user.name}!`, 'success');
            navigate('/');
          })
          .catch((err) => {
            setError(err.message || 'Google login failed');
            addNotification(err.message || 'Google login failed', 'error');
          });
      }
    };

    initializeGoogleSignIn(handleGoogleSignIn);
    
    // Render Google button after a short delay to ensure DOM is ready
    setTimeout(() => {
      renderGoogleButton('google-signin-button');
    }, 100);
  }, [loginWithGoogle, navigate, addNotification]);

  // Check if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
      addNotification('Login failed: ' + (err.message || 'Invalid credentials'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full text-white transition-colors duration-1000 ease-in-out"
      style={{
        backgroundColor: themeProduct?.bgColor || '#000000',
        backgroundImage: themeProduct ? `radial-gradient(circle at center, ${themeProduct.accentColor} 0%, ${themeProduct.bgColor} 80%)` : 'none'
      }}
    >
      <Navbar bgColor={themeProduct?.bgColor} accentColor={themeProduct?.accentColor} />

      <main className="container mx-auto px-6 py-16 md:py-24 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h1 className="text-4xl font-black mb-2">Welcome Back</h1>
            <p className="text-white/60 mb-8">Sign in to your Biscooboo account</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-3 items-start"
              >
                <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-white/40 pointer-events-none" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-white/40 pointer-events-none" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-white/10 border border-white/20 accent-white"
                  />
                  <span className="text-white/60">Remember me</span>
                </label>
                <Link to="#" className="text-white/60 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded-lg font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="h-[1px] bg-white/10 flex-1"></div>
              <span className="text-white/40 text-sm">OR</span>
              <div className="h-[1px] bg-white/10 flex-1"></div>
            </div>

            <div id="google-signin-button" className="w-full"></div>

            <p className="text-center text-white/60 mt-6 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-white font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;