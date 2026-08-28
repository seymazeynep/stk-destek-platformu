import React from 'react';
import { HeartHandshake, Shield, PhoneCall, Sparkles, LockKeyhole } from 'lucide-react';

export default function Footer({ onOpenWizard, onOpenEmergency, onSelectCategory }) {
  return (
    <footer className="bg-navy-950 text-white pt-16 pb-12 border-t border-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-navy-800">

          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                STK <span className="text-brand-400">Rehberi</span>
              </span>
            </div>
            <p className="text-xs text-navy-400 leading-relaxed">
              Türkiye'deki dernek ve vakıfları vatandaşlarla buluşturan tarafsız destek, bilgi ve dayanışma rehberi.
            </p>
            <div className="flex items-center space-x-2 text-xs text-brand-300 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Resmi dernek ve vakıf kaynaklarıyla uyumlu</span>
            </div>
          </div>

          {/* Quick Support Topics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-3">
              Destek Kategorileri
            </h4>
            <ul className="space-y-2 text-xs text-navy-300">
              <li>
                <button onClick={() => onSelectCategory('EĞİTİM ARAŞTIRMA  DERNEKLERİ')} className="hover:text-white transition-colors">
                  Burs ve Eğitim Destekleri
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('İNSANİ YARDIM DERNEKLERİ')} className="hover:text-white transition-colors">
                  Gıda & Erzak Yardımları
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('SAĞLIK ALANINDA FAALİYET GÖSTEREN DERNEKLER')} className="hover:text-white transition-colors">
                  Sağlık ve Medikal Desteği
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('ENGELLİ DERNEKLERİ')} className="hover:text-white transition-colors">
                  Engelli Birey ve Aile Hizmetleri
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('ÇEVRE DOĞAL HAYAT HAYVANLARI KORUMA DERNEKLERİ')} className="hover:text-white transition-colors">
                  Sokak Hayvanları ve Doğa
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('HAK VE SAVUNUCULUK DERNEKLERİ')} className="hover:text-white transition-colors">
                  Hukuki Destek ve Kadın Hakları
                </button>
              </li>
            </ul>
          </div>

          {/* Core Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-3">
              Hızlı Araçlar
            </h4>
            <ul className="space-y-2 text-xs text-navy-300">
              <li>
                <button onClick={onOpenWizard} className="hover:text-white transition-colors flex items-center space-x-1.5 text-brand-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Akıllı Destek Sihirbazı</span>
                </button>
              </li>
              <li>
                <a href="#directory" className="hover:text-white transition-colors">
                  Dernek ve Vakıf Dizini
                </a>
              </li>
              <li>
                <button onClick={onOpenEmergency} className="hover:text-rose-400 transition-colors text-rose-300 font-semibold flex items-center space-x-1">
                  <PhoneCall className="w-3 h-3" />
                  <span>Acil Yardım Numaraları (112, 122)</span>
                </button>
              </li>
              <li>
                <span className="text-navy-500">81 İl Kurum Dağılım Haritası</span>
              </li>
            </ul>
          </div>

          {/* Privacy & Project Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-3">
              Bitirme Projesi & Bilgi
            </h4>
            <p className="text-xs text-navy-400 leading-relaxed mb-3">
              Bu platform, dernek ve vakıflara erişimi artırmak ve ihtiyaç sahiplerini doğru kurumlarla buluşturmak amacıyla geliştirilmiş bir üniversite bitirme projesidir.
            </p>
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 text-[11px] text-navy-400 flex items-center gap-2">
              <LockKeyhole className="w-3.5 h-3.5 shrink-0" />
              <span>Güvenli veri ve KVKK uyumlu iletişim altyapısı</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-500 gap-4">
          <div>
            © 2026 STK Destek ve Dayanışma Platformu. Tüm hakları saklıdır.
          </div>
          <div className="flex items-center space-x-1 text-navy-400">
            <span>Toplumsal dayanışma ve kamu yararı için geliştirilmiştir.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
