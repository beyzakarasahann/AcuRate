'use client';

import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, GraduationCap, Users as UsersIcon, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'student' | 'teacher' | 'institution';

interface DemoCredentials {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const roles = [
    {
      id: 'student' as Role,
      name: 'Student',
      icon: GraduationCap,
      description: 'View your courses and performance',
      color: 'from-blue-500 to-cyan-500',
      credentials: { username: 'student1', password: 'student123' }
    },
    {
      id: 'teacher' as Role,
      name: 'Teacher',
      icon: UsersIcon,
      description: 'Manage courses and grade students',
      color: 'from-purple-500 to-pink-500',
      credentials: { username: 'teacher1', password: 'teacher123' }
    },
    {
      id: 'institution' as Role,
      name: 'Institution',
      icon: Building2,
      description: 'View analytics and reports',
      color: 'from-indigo-500 to-purple-600',
      credentials: { username: 'admin', password: 'admin123' }
    }
  ];

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  const fillDemoCredentials = () => {
    const creds = selectedRoleData?.credentials;
    if (creds) {
      setUsername(creds.username);
      setPassword(creds.password);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Simple validation (will be replaced with real API)
      const creds = selectedRoleData?.credentials;
      if (username === creds?.username && password === creds?.password) {
        // Store auth info in cookies
        document.cookie = `auth_token=demo_token_${Date.now()}; path=/; max-age=86400`;
        document.cookie = `user_role=${selectedRole}; path=/; max-age=86400`;
        document.cookie = `username=${username}; path=/; max-age=86400`;

        // Redirect based on role
        if (selectedRole === 'student') {
          router.push('/student');
        } else if (selectedRole === 'teacher') {
          router.push('/teacher');
        } else {
          router.push('/institution');
        }
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 1000);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Left Side - Role Selection */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2"
              >
                Welcome to AcuRate
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400"
              >
                Select your role to continue
              </motion.p>
            </div>

            <div className="space-y-4">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedRole(role.id)}
                  className={`backdrop-blur-xl rounded-2xl border p-5 cursor-pointer transition-all ${
                    selectedRole === role.id
                      ? 'bg-white/10 border-white/30 shadow-2xl shadow-indigo-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{role.name}</h3>
                      <p className="text-gray-400 text-sm">{role.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedRole === role.id
                        ? 'border-indigo-400 bg-indigo-500'
                        : 'border-white/30'
                    }`}>
                      {selectedRole === role.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Demo Credentials Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5"
            >
              <h3 className="text-blue-300 font-semibold mb-3 text-sm">Demo Credentials</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Username:</span>
                  <code className="text-blue-300 font-mono">{selectedRoleData?.credentials.username}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Password:</span>
                  <code className="text-blue-300 font-mono">{selectedRoleData?.credentials.password}</code>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fillDemoCredentials}
                className="w-full mt-4 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-300 text-sm font-medium transition-all"
              >
                Fill Demo Credentials
              </motion.button>
            </motion.div>
          </div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-gray-400 text-sm">
                Enter your credentials to access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className="text-gray-400 text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <button className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Contact Admin
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

