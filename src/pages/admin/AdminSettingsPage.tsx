import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Upload, Globe, Phone, Share2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { uploadImage } from '../../lib/upload';

const settingGroups = [
  {
    title: 'الموقع',
    icon: Globe,
    keys: ['site_title', 'site_title_ar', 'site_description', 'site_description_ar', 'logo_url'],
    labels: { site_title: 'اسم الموقع (إنجليزي)', site_title_ar: 'اسم الموقع (عربي)', site_description: 'وصف الموقع (إنجليزي)', site_description_ar: 'وصف الموقع (عربي)', logo_url: 'رابط الشعار' } as Record<string, string>,
  },
  {
    title: 'التواصل',
    icon: Phone,
    keys: ['phone', 'email', 'whatsapp', 'address_ar', 'address_en'],
    labels: { phone: 'الهاتف', email: 'البريد الإلكتروني', whatsapp: 'واتساب', address_ar: 'العنوان (عربي)', address_en: 'العنوان (إنجليزي)' } as Record<string, string>,
  },
  {
    title: 'التواصل الاجتماعي',
    icon: Share2,
    keys: ['instagram', 'facebook', 'twitter'],
    labels: { instagram: 'إنستجرام', facebook: 'فيسبوك', twitter: 'تويتر' } as Record<string, string>,
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('settings').select('*');
      const map: Record<string, string> = {};
      (data ?? []).forEach(s => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    );
    await Promise.all(updates);
    showToast('تم حفظ الإعدادات');
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const url = await uploadImage(file);
      if (url) {
        setSettings(s => ({ ...s, logo_url: url }));
      } else {
        throw new Error('Upload failed');
      }
    } catch { showToast('فشل رفع الشعار', 'error'); }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إعدادات الموقع</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة معلومات وإعدادات المتجر</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-xl transition-colors">
          <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="space-y-6">
        {settingGroups.map(group => (
          <div key={group.title} className="bg-white dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-lighter rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <group.icon size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white">{group.title}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {group.keys.map(key => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{group.labels[key]}</label>
                  {key === 'logo_url' ? (
                    <div className="flex items-center gap-3">
                      {settings[key] && <img src={settings[key]} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />}
                      <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl cursor-pointer hover:border-primary-400 transition-colors text-sm">
                        <Upload size={16} className="text-gray-500 dark:text-gray-400" /> رفع شعار
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <input value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-darkbg-lighter rounded-xl bg-gray-100 dark:bg-darkbg-lighter text-gray-900 dark:text-white outline-none focus:border-primary-500 text-sm"
                      dir={key.endsWith('_ar') ? 'rtl' : 'ltr'} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
