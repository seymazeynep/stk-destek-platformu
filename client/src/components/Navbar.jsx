import React, { useEffect, useRef, useState } from 'react';
import {
  HeartHandshake,
  Sparkles,

  Building2,
  ShieldCheck,
  PhoneCall,

  Menu,
  X,
  Compass,
  Palette
} from 'lucide-react';

const THEME_KEY = 'stk_theme';
const ACCENT_KEY = 'stk_accent';

function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'system');
  const [accent, setAccent] = useState(() => localStorage.getItem(ACCENT_KEY) || 'umber');
  const containerRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolvedTheme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.dataset.accent = accent;
    };

    applyTheme();
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(ACCENT_KEY, accent);
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme, accent]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        containerRef.current?.querySelector('button')?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className="theme-picker relative ml-auto md:ml-0" ref={containerRef}>
      <button
        type="button"
        aria-label="Tema ayarlarını aç"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="theme-picker__trigger p-2.5 rounded-xl border border-sand-300 text-navy-800 hover:bg-sand-100 transition-colors"
      >
        <Palette className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <div role="dialog" aria-label="Tema ayarları" className="theme-popover absolute right-0 top-full mt-2 w-64 rounded-2xl border border-sand-300 bg-white p-4 shadow-floating">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-navy-700 mb-2">Görünüm</legend>
            <div role="radiogroup" aria-label="Görünüm tercihi" className="grid grid-cols-3 gap-1 rounded-xl bg-sand-100 p-1">
              {[['system', 'Sistem'], ['light', 'Açık'], ['dark', 'Koyu']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={theme === value}
                  onClick={() => setTheme(value)}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${theme === value ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-600 hover:text-navy-950'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-xs font-bold uppercase tracking-wider text-navy-700 mb-2">Ana vurgu</legend>
            <div role="radiogroup" aria-label="Ana vurgu rengi" className="grid grid-cols-2 gap-2">
              {[['umber', 'Umber'], ['slate', 'Slate']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={accent === value}
                  onClick={() => setAccent(value)}
                  className={`accent-option accent-option--${value} flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${accent === value ? 'is-selected border-brand-600 text-navy-950' : 'border-sand-300 text-navy-600'}`}
                >
                  <span className="accent-option__swatch" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenWizard,
  onOpenEmergency,
  onOpenStkPortal,
  stkUser
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Brand Logo */}
          <button
            onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center space-x-3 text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-card transition-colors duration-200">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-navy-950">STK</span>
                <span className="font-semibold text-xl text-brand-600">Rehberi</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded">TÜRKİYE</span>
              </div>
              <p className="text-xs text-navy-500 -mt-0.5">Dernek ve Vakıf Rehberi</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-brand-100/70 text-brand-800 font-semibold'
                  : 'text-navy-700 hover:bg-sand-100 hover:text-navy-950'
              }`}
            >
              Ana Sayfa
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'directory'
                  ? 'bg-brand-100/70 text-brand-800 font-semibold'
                  : 'text-navy-700 hover:bg-sand-100 hover:text-navy-950'
              }`}
            >
              <Compass className="w-4 h-4 text-brand-600" />
              <span>Dernek & Vakıf Dizini</span>
            </button>

            <button
              onClick={onOpenEmergency}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-rose-700 hover:bg-rose-50 transition-all flex items-center space-x-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Acil Hatlar</span>
            </button>
          </nav>

          <ThemePicker />

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Smart Wizard Highlight CTA */}
            <button
              onClick={onOpenWizard}
              className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-card transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-brand-200 animate-pulse" />
              <span>Destek Bul (Sihirbaz)</span>
            </button>

            {/* STK Portal Login/Dashboard */}
            {stkUser ? (
              <button
                onClick={() => setActiveTab('portal')}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="max-w-[120px] truncate">{stkUser.contact_name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenStkPortal}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-sand-300 text-navy-800 text-sm font-medium hover:bg-sand-100 transition-colors"
              >
                <Building2 className="w-4 h-4 text-navy-600" />
                <span>Kurum Girişi</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={onOpenWizard}
              className="p-2 rounded-xl bg-brand-500 text-white shadow-sm"
              title="Destek Bul"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-navy-800 hover:bg-sand-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sand-50/95 backdrop-blur-lg border-b border-sand-200 px-4 pt-2 pb-6 space-y-2">
          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-navy-800 hover:bg-sand-100"
          >
            Ana Sayfa
          </button>
          <button
            onClick={() => { setActiveTab('directory'); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-navy-800 hover:bg-sand-100 flex items-center justify-between"
          >
            <span>Dernek & Vakıf Dizini</span>
            <span className="text-xs bg-brand-100 text-brand-800 px-2 py-0.5 rounded-md font-bold">102.301</span>
          </button>
          <button
            onClick={() => { onOpenEmergency(); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-rose-700 hover:bg-rose-50 flex items-center space-x-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Acil Yardım Numaraları</span>
          </button>
          <div className="pt-2 border-t border-sand-200 space-y-2">
            <button
              onClick={() => { onOpenWizard(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-center flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-brand-200" />
              <span>Akıllı Destek Sihirbazı</span>
            </button>
            <button
              onClick={() => { onOpenStkPortal(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl border border-navy-300 text-navy-900 font-semibold text-center flex items-center justify-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>{stkUser ? 'Kurum Yönetim Paneli' : 'Dernek / Vakıf Girişi'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
