import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, sanitizeText } from '../lib/security';
import SEO from '../components/ui/SEO';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  general?: string;
}

const PASSWORD_RULES = [
  { label: 'على الأقل 6 أحرف', test: (p: string) => p.length >= 6 },
  { label: 'لا يتجاوز 128 حرفاً', test: (p: string) => p.length <= 128 },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};

    const name = sanitizeText(fullName.trim());
    if (!name) errs.fullName = 'الاسم الكامل مطلوب';
    else if (name.length < 3) errs.fullName = 'الاسم يجب أن يكون 3 أحرف على الأقل';

    if (!email.trim()) errs.email = 'البريد الإلكتروني مطلوب';
    else if (!validateEmail(email.trim())) errs.email = 'البريد الإلكتروني غير صالح';

    const { valid, errors: pwdErrors } = validatePassword(password);
    if (!password) errs.password = 'كلمة المرور مطلوبة';
    else if (!valid) errs.password = pwdErrors[0];

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    const { error } = await signUp(email.trim(), password, sanitizeText(fullName.trim()));

    if (error) {
      let message = `حدث خطأ: ${error}`; // Show exact error for debugging
      if (error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already exists')) {
        message = 'هذا البريد الإلكتروني مسجل مسبقاً';
      } else if (error.toLowerCase().includes('password')) {
        message = 'كلمة المرور لا تستوفي المتطلبات';
      }
      setErrors({ general: message });
      setSubmitting(false);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <SEO
        title="إنشاء حساب | سيريوس هاند ميد"
        description="أنشئ حسابك في متجر سيريوس هاند ميد وتمتع بتجربة تسوق فريدة"
        url="/register"
      />

      <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-darkbg">
        <div className="w-full max-w-md">

          {/* ── Logo / Brand ── */}
          <div className="text-center mb-8 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-1 text-primary-300 mb-2">
              <Sparkles size={20} className="text-primary-400 -mt-4" />
              <span className="font-cursive text-5xl md:text-6xl text-primary-400 drop-shadow-md tracking-wider -mt-2 pb-2">Sirius</span>
              <Sparkles size={16} className="text-primary-400 opacity-70" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 -mt-3 mb-4 block font-medium">- Handmade -</span>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              انضم إلى مجتمعنا
            </p>
          </div>

          {/* ── Card ── */}
          <div className="bg-white dark:bg-darkbg-card rounded-2xl border border-gray-200 dark:border-darkbg-lighter shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              إنشاء حساب جديد
            </h2>

            {/* General error */}
            {errors.general && (
              <div className="mb-5 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-700 dark:text-rose-400">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Full name */}
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    placeholder="اسمك الكامل"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: undefined })); }}
                    className={`w-full pr-9 pl-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all placeholder:text-gray-500 dark:text-gray-400 ${
                      errors.fullName
                        ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800'
                        : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-500">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined, general: undefined })); }}
                    className={`w-full pr-9 pl-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all placeholder:text-gray-500 dark:text-gray-400 ${
                      errors.email
                        ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800'
                        : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                    }`}
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                    className={`w-full pr-9 pl-10 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all placeholder:text-gray-500 dark:text-gray-400 ${
                      errors.password
                        ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800'
                        : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                    }`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-600 dark:text-gray-300 transition-colors"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
                )}

                {/* Password strength hints */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {PASSWORD_RULES.map(rule => (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle
                          size={12}
                          className={rule.test(password) ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}
                        />
                        <span className={rule.test(password) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus size={18} />
                )}
                {submitting ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-darkbg-lighter text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                لديك حساب بالفعل؟{' '}
                <Link
                  to="/login"
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
