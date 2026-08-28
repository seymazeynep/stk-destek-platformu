import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  Globe,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Building
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { matchWizard, fetchWizardTopics } from '../services/api';
import {
  API_ICON_MAP,
  getOrganizationIcon,
  getOrganizationTypeLabel,
  getRegistryInfo
} from '../utils/presentation';

const TURKISH_CITIES = [
  'Tüm Türkiye', 'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın',
  'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane',
  'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli',
  'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ',
  'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt',
  'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis',
  'Osmaniye', 'Düzce'
];

export default function SmartWizard({
  initialTopicId = null,
  onSelectStk,
  onOpenContactModal
}) {
  const [step, setStep] = useState(1);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Form selections
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTargetGroup, setSelectedTargetGroup] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tüm Türkiye');
  const [customKeyword, setCustomKeyword] = useState('');

  // Results state
  const [matchingResults, setMatchingResults] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchError, setMatchError] = useState(null);

  // Load wizard topics from backend
  useEffect(() => {
    async function loadTopics() {
      try {
        setLoadingTopics(true);
        const data = await fetchWizardTopics();
        setTopics(data);
        if (initialTopicId) {
          const match = data.find(t => t.id === Number(initialTopicId));
          if (match) {
            setSelectedTopic(match);
            setStep(2);
          }
        }
      } catch (err) {
        console.error('Error loading topics:', err);
      } finally {
        setLoadingTopics(false);
      }
    }
    loadTopics();
  }, [initialTopicId]);

  // Execute matching
  const handleFindStks = async () => {
    try {
      setLoadingMatch(true);
      setMatchError(null);
      setStep(4); // Move to results step

      const response = await matchWizard({
        topicId: selectedTopic ? selectedTopic.id : undefined,
        targetGroup: selectedTargetGroup || undefined,
        city: selectedCity,
        keyword: customKeyword || undefined
      });

      setMatchingResults(response);

      // Trigger celebratory micro-interaction
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({
          particleCount: 36,
          spread: 50,
          colors: ['#627281', '#b9b6c0', '#f8f5ef'],
          origin: { y: 0.6 }
        });
      }

    } catch (err) {
      console.error('Match error:', err);
      setMatchError('Eşleştirme yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedTopic(null);
    setSelectedTargetGroup('');
    setSelectedCity('Tüm Türkiye');
    setCustomKeyword('');
    setMatchingResults(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-sand-300 shadow-floating overflow-hidden max-w-5xl mx-auto my-8">

      {/* Wizard Header with Step Progress */}
      <div className="bg-navy-950 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/90 text-amber-200 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Akıllı Destek Bulma Rehberi</h2>
              <p className="text-xs sm:text-sm text-navy-300">İhtiyacınıza en uygun sivil toplum kuruluşunu adım adım keşfedin</p>
            </div>
          </div>

          {step < 4 && (
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-brand-500 text-white' : 'bg-navy-800 text-navy-400'}`}>1</span>
              <div className={`w-8 h-1 ${step >= 2 ? 'bg-brand-500' : 'bg-navy-800'}`} />
              <span className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-brand-500 text-white' : 'bg-navy-800 text-navy-400'}`}>2</span>
              <div className={`w-8 h-1 ${step >= 3 ? 'bg-brand-500' : 'bg-navy-800'}`} />
              <span className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-brand-500 text-white' : 'bg-navy-800 text-navy-400'}`}>3</span>
            </div>
          )}
        </div>
      </div>

      {/* Step Contents */}
      <div className="p-6 sm:p-10">

        {/* STEP 1: DESTEK KONUSU SEÇİMİ */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">1. ADIM</span>
              <h3 className="text-2xl font-bold text-navy-950 mt-1">Hangi alanda desteğe veya yardıma ihtiyacınız var?</h3>
              <p className="text-sm text-navy-600 mt-1">İlgili dernek ve vakıfları listelemek için temel kategorilerden birini seçin.</p>
            </div>

            {loadingTopics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="h-32 rounded-2xl bg-sand-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((t) => {
                  const IconComp = API_ICON_MAP[t.icon] || Building;
                  const isSelected = selectedTopic?.id === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTopic(t);
                        setStep(2);
                      }}
                      className={`p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500 shadow-sm'
                          : 'border-sand-200 bg-sand-50/50 hover:border-brand-300 hover:bg-white hover:shadow-card'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-white border border-sand-200 text-brand-700 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-sand-300 bg-white'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-bold text-navy-950 group-hover:text-brand-700 transition-colors">{t.title}</h4>
                        <p className="text-xs text-navy-500 line-clamp-2 mt-1">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: HEDEF KİTLE / KİM İÇİN? */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">2. ADIM</span>
              <h3 className="text-2xl font-bold text-navy-950 mt-1">Bu desteği kimin için arıyorsunuz?</h3>
              <p className="text-sm text-navy-600 mt-1">Seçtiğiniz alan: <span className="font-semibold text-brand-700">{selectedTopic?.title}</span></p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {(selectedTopic?.target_groups || [
                'Kendim İçin',
                'Öğrenci / Genç',
                'İhtiyaç Sahibi Aile',
                'Afetzede Birey / Aile',
                'Engelli Birey / Yakını',
                'Kadın',
                'Yaşlı / Bakıma Muhtaç',
                'Genel Vatandaş / Diğer'
              ]).map((group, idx) => {
                const isSelected = selectedTargetGroup === group;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedTargetGroup(group)}
                    className={`p-4 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-400'
                        : 'border-sand-200 bg-white text-navy-800 hover:border-sand-300 hover:bg-sand-50'
                    }`}
                  >
                    <span>{group}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-sand-300'}`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-sand-200">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-sand-300 text-navy-700 text-sm font-semibold hover:bg-sand-100 flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri Dön</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center space-x-2 shadow-sm"
              >
                <span>Devam Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KONUM VE DETAY BİLGİSİ */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">3. ADIM</span>
              <h3 className="text-2xl font-bold text-navy-950 mt-1">Hangi şehirde destek arıyorsunuz?</h3>
              <p className="text-sm text-navy-600 mt-1">Bulunduğunuz ili seçebilir veya Türkiye genelindeki tüm dernek ve vakıfları listeleyebilirsiniz.</p>
            </div>

            <div className="space-y-6 mb-8 max-w-xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-2">
                  Şehir / İl Seçimi
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-brand-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-sand-300 text-navy-900 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none shadow-soft cursor-pointer"
                  >
                    {TURKISH_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-2">
                  Özel Arama veya Ek İhtiyaç Notu (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder="Örn: 'Üniversite 3. sınıf', 'Tekerlekli sandalye', 'Deprem bölgesi'..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-sand-300 text-navy-900 text-base placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-soft"
                />
              </div>

              {/* Summary of selections */}
              <div className="p-4 rounded-2xl bg-sand-100/70 border border-sand-200 text-sm space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-navy-500 mb-1">Seçim Özeti:</div>
                <div className="text-navy-800"><span className="font-semibold">Konu:</span> {selectedTopic?.title}</div>
                {selectedTargetGroup && <div className="text-navy-800"><span className="font-semibold">Kitle:</span> {selectedTargetGroup}</div>}
                <div className="text-navy-800"><span className="font-semibold">Konum:</span> {selectedCity}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-sand-200">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-sand-300 text-navy-700 text-sm font-semibold hover:bg-sand-100 flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri Dön</span>
              </button>

              <button
                onClick={handleFindStks}
                className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base flex items-center space-x-2.5 shadow-card transition-colors"
              >
                <Sparkles className="w-5 h-5 text-amber-200" />
                <span>Uygun STK'ları Eşleştir</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SONUÇLAR VE İLETİŞİM REHBERİ */}
        {step === 4 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-sand-200 gap-4">
              <div>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Akıllı Eşleştirme Tamamlandı</span>
                </span>
                <h3 className="text-2xl font-bold text-navy-950">
                  {selectedTopic?.title} için Uygun STK'lar
                </h3>
                <p className="text-sm text-navy-600 mt-0.5">
                  Konum: <span className="font-semibold text-navy-900">{selectedCity}</span> •
                  {matchingResults?.count ? ` Toplam ${matchingResults.count} eşleşen kurum bulundu` : ' Sonuçlar aranıyor...'}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-sand-300 text-navy-700 hover:bg-sand-100 text-sm font-semibold flex items-center space-x-2 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yeniden Ara</span>
              </button>
            </div>

            {loadingMatch ? (
              <div className="space-y-4 py-8 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-navy-600 font-medium">Dernek ve vakıflar arasından uygun kurumlar taranıyor...</p>
              </div>
            ) : matchError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
                <p className="font-semibold">{matchError}</p>
                <button
                  onClick={handleFindStks}
                  className="mt-3 px-4 py-2 rounded-xl bg-rose-600 text-white font-medium text-sm"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : matchingResults?.stks?.length === 0 ? (
              <div className="p-8 rounded-3xl bg-sand-100 text-center">
                <Building className="w-12 h-12 text-navy-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-navy-900">Aradığınız kriterlerde STK bulunamadı</h4>
                <p className="text-sm text-navy-600 mt-1">Lütfen şehir seçimini 'Tüm Türkiye' olarak değiştirerek tekrar deneyiniz.</p>
                <button
                  onClick={() => { setSelectedCity('Tüm Türkiye'); handleFindStks(); }}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm"
                >
                  Tüm Türkiye'de Ara
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {matchingResults?.stks?.map((stk) => (
                  <div
                    key={stk.id}
                    className="p-6 rounded-3xl border border-sand-200/90 bg-white hover:border-brand-300 shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{stk.matchScore} Uyum</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sand-100 text-navy-700 text-xs font-semibold">
                          {React.createElement(getOrganizationIcon(stk), { className: 'w-3.5 h-3.5' })}
                          <span>{getOrganizationTypeLabel(stk)}</span>
                          {stk.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-brand-700" aria-label="Doğrulanmış kurum" />}
                        </span>
                      </div>

                      {/* STK Name & Details */}
                      <h4 className="font-extrabold text-navy-950 text-lg leading-snug line-clamp-2">
                        {stk.kurum_adi}
                      </h4>

                      <p className="text-xs text-brand-700 font-semibold mt-1">
                        {stk.faaliyet_alani}
                      </p>

                      {stk.detayli_faaliyet && (
                        <p className="text-xs text-navy-500 mt-1 line-clamp-1 italic">
                          {stk.detayli_faaliyet}
                        </p>
                      )}

                      <div className="text-[11px] text-navy-500 mt-2">
                        {getRegistryInfo(stk).shortLabel}: <span className="font-mono">{getRegistryInfo(stk).value}</span> · {getRegistryInfo(stk).source}
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-xs text-navy-600 mt-3">
                        <MapPin className="w-3.5 h-3.5 text-navy-400 mr-1 shrink-0" />
                        <span className="truncate">{stk.ilce ? `${stk.ilce}, ` : ''}{stk.il || 'Belirtilmemiş'}</span>
                      </div>
                    </div>

                    {/* Action & Contact Buttons */}
                    <div className="mt-5 pt-4 border-t border-sand-200/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Send Direct Message / Application Form */}
                        <button
                          onClick={() => onOpenContactModal(stk, selectedTopic?.title)}
                          className="w-full py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Destek Talebi</span>
                        </button>

                        {/* View Detailed Profile */}
                        <button
                          onClick={() => onSelectStk(stk.id)}
                          className="w-full py-2.5 px-3 rounded-xl border border-sand-300 text-navy-800 hover:bg-sand-100 text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <span>Profili İncele</span>
                          <ArrowRight className="w-3.5 h-3.5 text-navy-500" />
                        </button>
                      </div>

                      {/* Direct Phone / Web Links */}
                      <div className="flex items-center space-x-2 text-xs">
                        {stk.telefon ? (
                          <a
                            href={`tel:${stk.telefon}`}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-sand-100 hover:bg-sand-200 text-navy-800 font-medium flex items-center justify-center space-x-1 truncate"
                          >
                            <Phone className="w-3 h-3 text-brand-700" />
                            <span className="truncate">{stk.telefon}</span>
                          </a>
                        ) : null}

                        {stk.web_site ? (
                          <a
                            href={stk.web_site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2 rounded-lg bg-sand-100 hover:bg-sand-200 text-navy-800 font-medium flex items-center justify-center space-x-1 truncate"
                          >
                            <Globe className="w-3 h-3 text-brand-700" />
                            <span className="truncate">Web Sitesi</span>
                          </a>
                        ) : null}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
