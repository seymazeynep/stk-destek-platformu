import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { ICONS, getOrganizationDistribution } from '../utils/presentation';

export default function Hero({
  stats,
  onSearch,
  onOpenWizard,
  onSelectTopic
}) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const quickPills = [
    { title: 'Öğrenci Bursu', topicId: 1, icon: ICONS.education },
    { title: 'Afet & Kurtarma', topicId: 3, icon: ICONS.emergency },
    { title: 'Gıda & Erzak', topicId: 2, icon: ICONS.support },
    { title: 'Sağlık & Medikal', topicId: 4, icon: ICONS.health },
    { title: 'Engelli Desteği', topicId: 5, icon: ICONS.accessibility },
    { title: 'Sokak Hayvanları', topicId: 8, icon: ICONS.environment },
    { title: 'Hukuki Danışmanlık', topicId: 6, icon: ICONS.justice },
    { title: 'Çocuk Koruma', topicId: 1, icon: ICONS.children }
  ];
  const distribution = getOrganizationDistribution(stats);

  return (
    <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-brand-50/60 border-b border-sand-200/60 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Highlight Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-md bg-sand-200/70 border border-sand-300 text-xs font-semibold text-navy-800 backdrop-blur-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>Türkiye Genelinde Dernek ve Vakıf Rehberi</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-[1.15]">
            Hangi Kurumdan <br />
            <span className="text-brand-700">Nasıl Destek Alabilirsiniz?</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-navy-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Burs, gıda, afet, sağlık veya hukuki danışmanlık... İhtiyacınıza en uygun sivil toplum kuruluşunu soru-cevaplarla bulun, doğrudan iletişime geçin.
          </p>
        </div>

        {/* Core Interactive Search & Wizard Row */}
        <div className="max-w-4xl mx-auto">

          {/* Main Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative mb-6 group">
            <div className="relative flex items-center shadow-floating rounded-3xl bg-white border border-sand-300/80 p-2 sm:p-2.5 transition-all duration-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
              <div className="pl-4 pr-2 text-navy-400 flex items-center pointer-events-none">
                <Search className="w-6 h-6 text-brand-600" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Örn: burs veren vakıflar, arama kurtarma, Kadıköy engelsiz..."
                className="w-full py-3.5 px-2 text-base sm:text-lg bg-transparent text-navy-900 placeholder-navy-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-navy-950 hover:bg-navy-800 text-white font-semibold text-sm sm:text-base transition-colors shrink-0 shadow-sm"
              >
                Ara
              </button>
            </div>
          </form>

          {/* Smart Wizard Card - Primary CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-brand-50 border border-brand-200/80 p-6 sm:p-8 shadow-card hover:shadow-floating transition-all duration-300">

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-card">
                  <ICONS.guide className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-brand-200/80 text-brand-900 text-xs font-bold uppercase tracking-wider mb-1">
                    ÖNERİLEN REHBER
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-navy-950">
                    Akıllı Destek Bulma Sihirbazı
                  </h3>
                  <p className="text-sm sm:text-base text-navy-600 mt-1 max-w-lg">
                    İhtiyacınızı ve şehrinizi seçin; ilgili dernek ve vakıfları tek sonuç akışında karşılaştırın.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenWizard}
                className="w-full md:w-auto px-6 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-card hover:shadow-floating transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 shrink-0"
              >
                <span>Sihirbazı Başlat</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-500">
                Sık Aranan Destek Konuları:
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {quickPills.map((pill, i) => {
                const IconComponent = pill.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectTopic(pill.topicId, pill.title)}
                    className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-sand-300 bg-white text-navy-800 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{pill.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Metric Badges Banner */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white border border-sand-200 text-center shadow-soft">
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-950">
              {stats?.totalStks ? Number(stats.totalStks).toLocaleString('tr-TR') : '102.301'}
            </div>
            <div className="text-xs text-navy-500 font-medium mt-1">Toplam Dernek ve Vakıf</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-sand-200 text-center shadow-soft">
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-700">{distribution.associations.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-navy-500 font-medium mt-1">Dernek</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-sand-200 text-center shadow-soft">
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-950">{distribution.foundations.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-navy-500 font-medium mt-1">Vakıf</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-sand-200 text-center shadow-soft">
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-950">81 İl</div>
            <div className="text-xs text-navy-500 font-medium mt-1">Doğrudan Vatandaş Erişimi</div>
          </div>
        </div>

      </div>
    </section>
  );
}
