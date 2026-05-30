import { useState, FormEvent } from 'react';
import {
  Mail, MapPin, Send, User,
  FileText, CheckCircle2, Loader2, Instagram, Facebook,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { sanitizeText, validateEmail } from '../lib/security';
import { supabase } from '../lib/supabase';
import SEO from '../components/ui/SEO';

// ─── Contact info constants ────────────────────────────────────────────────────

const TikTokIcon = ({ size, className }: any) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const CONTACT_INFO = [
  {
    icon: Instagram,
    title: 'انستجرام',
    value: '@sirius_handmade7',
    href: 'https://www.instagram.com/sirius_handmade7?igsh=ZmltczVzcDIxNzVo&utm_source=qr',
    dir: 'ltr' as const,
  },
  {
    icon: Facebook,
    title: 'فيسبوك',
    value: 'Sirius Handmade',
    href: 'https://www.facebook.com/share/1GUQ53F6UM/?mibextid=wwXIfr',
    dir: 'ltr' as const,
  },
  {
    icon: TikTokIcon,
    title: 'تيك توك',
    value: '@sirius_handmade',
    href: 'https://www.tiktok.com/@sirius_handmade?_r=1&_d=ef6ifg40ghd8ih&sec_uid=MS4wLjABAAAAC1RmtLXhxq2wKTcXjnu4K6deyDBMM7BxGnszUIe5gTGyg4KQj94wqQXbOUhmHth5&share_author_id=7010492566484845573&sharer_language=ar&source=h5_m&u_code=dkkg4ef8h7ek0b&ug_btm=b8727,b0&social_share_type=4&utm_source=copy&sec_user_id=MS4wLjABAAAAC1RmtLXhxq2wKTcXjnu4K6deyDBMM7BxGnszUIe5gTGyg4KQj94wqQXbOUhmHth5&tt_from=copy&utm_medium=ios&utm_campaign=client_share&enable_checksum=1&user_id=7010492566484845573&share_link_id=94042EE8-F6C4-4C65-ADFD-6D85C5FB3B02&share_app_id=1233',
    dir: 'ltr' as const,
  },
  {
    icon: Mail,
    title: 'البريد الإلكتروني',
    value: 'siriushandmade59@gmail.com',
    href: 'mailto:siriushandmade59@gmail.com',
    dir: 'ltr' as const,
  },
  {
    icon: MapPin,
    title: 'الموقع',
    value: 'مصر - الدقهلية - المنصورة',
    href: 'https://maps.google.com/?q=مصر،+الدقهلية،+المنصورة',
    dir: 'rtl' as const,
  },
];

const SUBJECTS = [
  'استفسار عن منتج',
  'متابعة طلب',
  'شكوى أو ملاحظة',
  'طلب تصميم مخصص',
  'استفسار عن الشحن',
  'أخرى',
];

// ─── Form interfaces ────────────────────────────────────────────────────────────

interface ContactForm {
  name: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ContactPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<ContactForm>({
    name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    const name = sanitizeText(form.name.trim());
    if (!name) errs.name = 'الاسم مطلوب';
    else if (name.length < 2) errs.name = 'الاسم قصير جداً';

    if (form.phone.trim() && form.phone.trim().length < 8) errs.phone = 'رقم الهاتف غير صالح';

    if (!form.subject) errs.subject = 'يرجى اختيار موضوع الرسالة';

    const msg = sanitizeText(form.message.trim());
    if (!msg) errs.message = 'الرسالة مطلوبة';
    else if (msg.length < 10) errs.message = 'الرسالة قصيرة جداً (10 أحرف على الأقل)';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const safeName = sanitizeText(form.name.trim());
    const safePhone = sanitizeText(form.phone.trim());
    const safeSubject = sanitizeText(form.subject);
    const safeMessage = sanitizeText(form.message.trim());

    const igText = `مرحباً، لدي رسالة من الموقع:\n\nالاسم: ${safeName}\nرقم الهاتف: ${safePhone}\nالموضوع: ${safeSubject}\n\nالرسالة:\n${safeMessage}`;
    
    // Fallback copy mechanism
    const copyToClipboard = async (text: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error('Fallback copy failed', error);
          throw error;
        } finally {
          textArea.remove();
        }
      }
    };

    try {
      await copyToClipboard(igText);
      showToast('تم نسخ الرسالة بنجاح! قم بلصقها في المحادثة الآن', 'success');
    } catch (e) {
      showToast('لم نتمكن من نسخ الرسالة، يرجى كتابتها يدوياً', 'error');
    }
    
    // Open Instagram Direct (or profile as fallback)
    window.open('https://ig.me/m/sirius_handmade7', '_blank');
    
    setSent(true);
    setForm({ name: profile?.full_name ?? '', phone: profile?.phone ?? '', subject: '', message: '' });
    setErrors({});
    setSubmitting(false);
  };

  return (
    <>
      <SEO
        title="تواصل معنا | سيريوس هاند ميد"
        description="تواصل مع فريق سيريوس هاند ميد لأي استفسار أو طلب مخصص. نحن هنا لمساعدتك."
        keywords="تواصل, استفسار, خدمة عملاء, سيريوس هاند ميد"
        url="/contact"
      />

      <div dir="rtl" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <span className="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold tracking-wider uppercase mb-3">
            نحب نسمعك
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            تواصل معنا
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
            فريقنا جاهز للإجابة عن جميع استفساراتك وتلبية طلباتك. لا تتردد في التواصل معنا!
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Contact info ── */}
          <div className="lg:col-span-2 space-y-4">
            {CONTACT_INFO.map(({ icon: Icon, title, value, href, dir }) => (
              <a
                key={title}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-4 p-4 bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                  <Icon size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{title}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate" dir={dir}>
                    {value}
                  </p>
                </div>
              </a>
            ))}


          </div>

          {/* ── Contact form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6 md:p-8">

              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    تم إرسال رسالتك!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                    شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="px-5 py-2.5 border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    إرسال رسالة أخرى
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    أرسل رسالة
                  </h2>

                  <form onSubmit={handleSubmit} noValidate className="space-y-5">

                    {/* Name + Email row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                          الاسم <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                          <input
                            id="contact-name"
                            type="text"
                            placeholder="اسمك الكامل"
                            value={form.name}
                            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
                            className={`w-full pr-9 pl-4 py-2.5 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all placeholder:text-gray-500 dark:text-gray-400 ${
                              errors.name ? 'border-rose-400 focus:ring-rose-300' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                            }`}
                          />
                        </div>
                        {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                          رقم الهاتف <span className="text-gray-500 text-xs font-normal">(اختياري)</span>
                        </label>
                        <div className="relative">
                          <input
                            id="contact-phone"
                            type="tel"
                            placeholder="رقم هاتفك"
                            value={form.phone}
                            onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: undefined })); }}
                            className={`w-full pr-9 pl-4 py-2.5 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all placeholder:text-gray-500 dark:text-gray-400 ${
                              errors.phone ? 'border-rose-400 focus:ring-rose-300' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                            }`}
                            dir="ltr"
                          />
                        </div>
                        {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                        الموضوع <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                        <select
                          id="contact-subject"
                          value={form.subject}
                          onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: undefined })); }}
                          className={`w-full pr-9 pl-4 py-2.5 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                            errors.subject ? 'border-rose-400 focus:ring-rose-300' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                          }`}
                        >
                          <option value="">اختر موضوع الرسالة</option>
                          {SUBJECTS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      {errors.subject && <p className="mt-1 text-xs text-rose-500">{errors.subject}</p>}
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                        الرسالة <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        placeholder="اكتب رسالتك هنا..."
                        value={form.message}
                        onChange={e => { setForm(p => ({ ...p, message: e.target.value })); setErrors(p => ({ ...p, message: undefined })); }}
                        rows={5}
                        maxLength={1000}
                        className={`w-full px-4 py-3 border rounded-xl text-sm bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:ring-2 transition-all resize-none placeholder:text-gray-500 dark:text-gray-400 ${
                          errors.message ? 'border-rose-400 focus:ring-rose-300' : 'border-gray-200 dark:border-darkbg-lighter focus:ring-primary-500'
                        }`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {errors.message
                          ? <p className="text-xs text-rose-500">{errors.message}</p>
                          : <span />}
                        <span className="text-xs text-gray-500">
                          {form.message.length}/1000
                        </span>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {submitting
                        ? <Loader2 size={18} className="animate-spin" />
                        : <Instagram size={18} />}
                      {submitting ? 'جاري التحويل...' : 'إرسال الرسالة عبر الانستجرام'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
