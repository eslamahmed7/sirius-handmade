import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import Logo from '../ui/Logo';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 dark:bg-darkbg text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-darkbg-lighter">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
              <Link to="/" className="flex flex-col items-center gap-1 mb-4" aria-label={t('header.home')}>
                <Logo size="sm" />
              </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed text-center md:text-start">{t('footer.desc')}</p>
          </div>

          {/* Links */}
          <div className="text-center md:text-start">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('footer.quick_links')}</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm hover:text-primary-400 transition-colors">{t('header.home')}</Link></li>
              <li><Link to="/products" className="text-sm hover:text-primary-400 transition-colors">{t('header.products')}</Link></li>
              <li><Link to="/about" className="text-sm hover:text-primary-400 transition-colors">{t('header.about')}</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-primary-400 transition-colors">{t('header.contact')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center md:text-start">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3 flex flex-col items-center md:items-start">
              <li className="flex items-center gap-2 text-sm">
                <Instagram size={14} />
                <a href="https://ig.me/m/sirius_handmade7" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  sirius_handmade7
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm"><Mail size={14} /> <span>siriushandmade59@gmail.com</span></li>
              <li className="flex items-center gap-2 text-sm"><MapPin size={14} /> <span>{t('footer.address')}</span></li>
            </ul>
          </div>

          {/* Social */}
          <div className="text-center md:text-start flex flex-col items-center md:items-start">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('footer.follow_us')}</h3>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/sirius_handmade7?igsh=ZmltczVzcDIxNzVo&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white dark:bg-darkbg-card hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"><Instagram size={18} /></a>
              <a href="https://www.facebook.com/share/1GUQ53F6UM/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white dark:bg-darkbg-card hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"><Facebook size={18} /></a>
              <a href="https://www.tiktok.com/@sirius_handmade?_r=1&_d=ef6ifg40ghd8ih&sec_uid=MS4wLjABAAAAC1RmtLXhxq2wKTcXjnu4K6deyDBMM7BxGnszUIe5gTGyg4KQj94wqQXbOUhmHth5&share_author_id=7010492566484845573&sharer_language=ar&source=h5_m&u_code=dkkg4ef8h7ek0b&ug_btm=b8727,b0&social_share_type=4&utm_source=copy&sec_user_id=MS4wLjABAAAAC1RmtLXhxq2wKTcXjnu4K6deyDBMM7BxGnszUIe5gTGyg4KQj94wqQXbOUhmHth5&tt_from=copy&utm_medium=ios&utm_campaign=client_share&enable_checksum=1&user_id=7010492566484845573&share_link_id=94042EE8-F6C4-4C65-ADFD-6D85C5FB3B02&share_app_id=1233" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white dark:bg-darkbg-card hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-darkbg-lighter text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Sirius Handmade. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
