import { useState, useEffect, FormEvent } from 'react';
import { User, Mail, Phone, MapPin, Save, CheckCircle2, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

const CITY_LABELS: Record<string, { ar: string; en: string }> = {
  'القاهرة': { ar: 'القاهرة', en: 'Cairo' },
  'الإسكندرية': { ar: 'الإسكندرية', en: 'Alexandria' },
  'الجيزة': { ar: 'الجيزة', en: 'Giza' },
  'القليوبية': { ar: 'القليوبية', en: 'Qalyubia' },
  'شرم الشيخ': { ar: 'شرم الشيخ', en: 'Sharm El-Sheikh' },
  'الغردقة': { ar: 'الغردقة', en: 'Hurghada' },
  'المنصورة': { ar: 'المنصورة', en: 'Mansoura' },
  'طنطا': { ar: 'طنطا', en: 'Tanta' },
  'أسيوط': { ar: 'أسيوط', en: 'Asyut' },
  'أسوان': { ar: 'أسوان', en: 'Aswan' },
  'أخرى': { ar: 'أخرى', en: 'Other' },
};

export default function ProfilePage() {
  const { profile, updateProfile, user } = useAuth();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

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
    if (!name) errs.full_name = t('profile.errors.name_required');
    else if (name.length < 3) errs.full_name = t('profile.errors.name_short');

    if (form.phone.trim() && !validatePhone(form.phone.trim())) {
      errs.phone = t('profile.errors.phone_invalid');
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
      showToast(t('profile.toast_save_error'), 'error');
    } else {
      showToast(t('profile.toast_save_success'));
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
    <div className="text-start">
      <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
        {label}
      </label>
      <div className="relative">
        <span className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
          {icon}
        </span>
        {input}
      </div>
      {error && <p className="mt-1 text-xs text-rose-500 text-start">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-500 text-start">{hint}</p>}
    </div>
  );

  return (
    <>
      <SEO
        title={t('profile.seo_title')}
        description={t('profile.seo_desc')}
        url="/profile"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-start">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8 justify-start">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-extrabold text-primary-700 dark:text-primary-400">
              {(profile?.full_name || user?.email || '؟').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile?.full_name || t('profile.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-white dark:bg-darkbg-card rounded-2xl border border-gray-200 dark:border-darkbg-lighter shadow-sm text-start">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-darkbg-lighter text-start">
            <h2 className="font-bold text-gray-900 dark:text-white">{t('profile.info_title')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('profile.info_desc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">

            {/* Email (read-only) */}
            <div className="text-start">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                {t('profile.email')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed text-start"
                  dir="ltr"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-start">
                {t('profile.email_read_only')}
              </p>
            </div>

            {/* Full name */}
            {field(
              'profile-name',
              t('profile.full_name'),
              <User size={16} />,
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                placeholder={t('profile.full_name_placeholder')}
                value={form.full_name}
                onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setErrors(p => ({ ...p, full_name: undefined })); }}
                className={`w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all text-start ${
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
              t('profile.phone'),
              <Phone size={16} />,
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                placeholder={t('profile.phone_placeholder')}
                value={form.phone}
                onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: undefined })); }}
                className={`w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all text-start ${
                  errors.phone
                    ? 'border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800'
                    : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                }`}
                dir="ltr"
              />,
              errors.phone,
              t('profile.phone_optional'),
            )}

            {/* City */}
            <div className="text-start">
              <label htmlFor="profile-city" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                {t('profile.city')}
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                <select
                  id="profile-city"
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer text-start"
                >
                  <option value="">{t('profile.city_placeholder')}</option>
                  {EGYPT_CITIES.map(city => (
                    <option key={city} value={city}>
                      {CITY_LABELS[city] ? (isAr ? CITY_LABELS[city].ar : CITY_LABELS[city].en) : city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="text-start">
              <label htmlFor="profile-address" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5 text-start">
                {t('profile.address')}
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute rtl:right-3 ltr:left-3 top-3.5 text-gray-500 dark:text-gray-400 pointer-events-none" />
                <textarea
                  id="profile-address"
                  placeholder={t('profile.address_placeholder')}
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  rows={3}
                  className="w-full rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-3 border border-gray-200 dark:border-darkbg-lighter rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none text-start"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-start">{t('profile.address_optional')}</p>
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
                {submitting ? t('profile.saving') : saved ? t('profile.saved') : t('profile.save_changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
