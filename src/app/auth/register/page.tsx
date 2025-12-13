'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/shared/ui/Card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [passwordMatch, setPasswordMatch] = useState(true);

  const router = useRouter();

  // Password validation function
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };
    setPasswordRequirements(requirements);
  };

  useEffect(() => {
    validatePassword(password);
    setPasswordMatch(password === confirmPassword && confirmPassword !== '');
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions while loading
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    // Check if password meets all requirements
    const allRequirementsMet = Object.values(passwordRequirements).every(req => req);

    if (!allRequirementsMet) {
      setError('الرجاء التأكد من تحقق جميع متطلبات كلمة المرور');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      setIsLoading(false);
      return;
    }

    try {
      // Call the backend registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (response.ok) {
        // Registration successful, now try to sign in
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.error) {
          setError('حدث خطأ أثناء تسجيل الدخول بعد التسجيل');
        } else {
          // Successful login after registration - redirect to dashboard
          // Using router.replace to avoid back navigation to registration form
          router.replace('/dashboard');
        }
      } else {
        const data = await response.json();
        setError(data.detail || 'حدث خطأ أثناء التسجيل');
      }
    } catch (error) {
      setError('حدث خطأ غير متوقع');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">إنشاء حساب</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">أدخل معلومات حسابك للبدء</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الاسم الكامل
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password requirements checklist */}
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">يجب أن تحتوي كلمة المرور على:</p>
                <ul className="text-sm space-y-1">
                  <li className={`flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {passwordRequirements.minLength ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    8 أحرف على الأقل
                  </li>
                  <li className={`flex items-center ${passwordRequirements.hasUpper ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {passwordRequirements.hasUpper ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    حرف كبير
                  </li>
                  <li className={`flex items-center ${passwordRequirements.hasLower ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {passwordRequirements.hasLower ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    حرف صغير
                  </li>
                  <li className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {passwordRequirements.hasNumber ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    رقم
                  </li>
                  <li className={`flex items-center ${passwordRequirements.hasSpecial ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {passwordRequirements.hasSpecial ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    {'رمز خاص (!@#$%^&*()_+-=[]{}|;:,.<>? )'}
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border ${
                    confirmPassword === password && confirmPassword !== ''
                      ? 'border-green-500'
                      : 'border-slate-300 dark:border-slate-700'
                  } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordMatch && (
                <p className="mt-1 text-sm text-red-600">كلمة المرور وتأكيد كلمة المرور لا تتطابقان</p>
              )}
              {confirmPassword && passwordMatch && (
                <p className="mt-1 text-sm text-green-600">متطابقة</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl transition-colors"
              disabled={isLoading || !Object.values(passwordRequirements).every(req => req) || !passwordMatch}
            >
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>
              هل لديك حساب؟{' '}
              <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 font-medium">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}