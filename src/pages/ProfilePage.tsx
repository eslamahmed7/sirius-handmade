import { useState, useEffect, FormEvent } from 'react';
import { User, Mail, Phone, MapPin, Save, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validatePhone, sanitizeText } from '../lib/security';
import { useToast } from '../components/ui/Toast';
import SEO from '../components/ui/SEO';

interface ProfileForm {
  full_name: string;
  phone: string;
  address: string;
  city: string;
}

interface FormErrors {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
}

const EGYPT_CITIES = [
  'القاهرة', 'الإسكندرية', 'الجيزة', 'القليوبية', 'شرم الشيخ',
  'الغردقة', 'المنصورة', 'طنطا', 'أسيوط', 'أسوان', 'أخرى',
];

export default function ProfilePage() {
  const { profile, updateProfile, user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    phone: '',
    address: '',
    city: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
      });
    }
  }, [profile]);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    const name = sanitizeText(form.full_name.trim());
    if (!name) errs.full_name = 'الاسم الكامل مطلوب';
    else if (name.length < 3) errs.full_name = 'الاسم يجب أن يكون 3 أحرف على الأقل';

    if (form.phone.trim() && !validatePhone(form.phone.trim())) {
      errs.phone = 'رقم الهاتف غير صالح';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const updates = {
      full_name: sanitizeText(form.full_name.trim()),
      phone: sanitizeText(form.phone.trim()),
      address: sanitizeText(form.address.trim()),
      city: sanitizeText(form.city.trim()),
    };

    const { error } = await updateProfile(updates);

    if (error) {
      showToast('فشل حفظ التغييرات، يرجى المحاولة مرة أخرى', 'error');
    } else {
      showToast('تم حفظ التغييرات بنجاح');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSubmitting(false);
  };

  const field = (
    id: string,
    label: string,
    icon: React.ReactNode,
    input: React.ReactNode,
    error?: string,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
          {icon}
        </span>
        {input}
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );

  return (
    <>
      <SEO
        title="ملفي الشخصي | سيريوس هاند ميد"
        description="إدارة معلومات حسابك الشخصي"
        url="/profile"
      />

      <div dir="rtl" className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-extrabold text-primary-700 dark:text-primary-400">
              {(profile?.full_name || user?.email || '؟').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile?.full_name || 'ملفي الشخصي'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-white dark:bg-darkbg-card rounded-2xl border border-gray-200 dark:border-darkbg-lighter shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-darkbg-lighter">
            <h2 className="font-bold text-gray-900 dark:text-white">المعلومات الشخصية</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              يمكنك تعديل بياناتك الشخصية في أي وقت
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full pr-9 pl-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  dir="ltr"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                البريد الإلكتروني لا يمكن تعديله
              </p>
            </div>

            {/* Full name */}
            {field(
              'profile-name',
              'الاسم الكامل',
              <User size={16} />,
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                placeholder="اسمك الكامل"
                value={form.full_name}
                onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setErrors(p => ({ ...p, full_name: undefined })); }}
                className={`w-full pr-9 pl-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all ${
                  errors.full_name
                    ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800'
                    : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                }`}
              />,
              errors.full_name,
            )}

            {/* Phone */}
            {field(
              'profile-phone',
              'رقم الهاتف',
              <Phone size={16} />,
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                placeholder="01xxxxxxxxx"
                value={form.phone}
                onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: undefined })); }}
                className={`w-full pr-9 pl-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800'
                    : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                }`}
                dir="ltr"
              />,
              errors.phone,
              'اختياري',
            )}

            {/* City */}
            <div>
              <label htmlFor="profile-city" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                المدينة
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                <select
                  id="profile-city"
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full pr-9 pl-4 py-3 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">اختر المدينة</option>
                  {EGYPT_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="profile-address" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                العنوان
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute right-3 top-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
                <textarea
                  id="profile-address"
                  placeholder="الشارع، المبنى، رقم الشقة..."
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  rows={3}
                  className="w-full pr-9 pl-4 py-3 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">اختياري</p>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Save size={16} />
                )}
                {submitting ? 'جاري الحفظ...' : saved ? 'تم الحفظ!' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
