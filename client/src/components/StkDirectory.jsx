import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building2,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  X,
  MessageSquare,
  Globe,
  Phone,
  ExternalLink
} from 'lucide-react';
import { fetchStks, fetchCategories, fetchCities } from '../services/api';
import {
  getOrganizationIcon,
  getOrganizationTypeLabel,
  getRegistryInfo,
  getSafeWebsiteUrl
} from '../utils/presentation';

export default function StkDirectory({
  initialQuery = '',
  onSelectStk,
  onOpenContactModal
}) {
  const [stks, setStks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [organizationType, setOrganizationType] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Dropdown options
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);

  // Load categories and cities
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catsData, citiesData] = await Promise.all([fetchCategories(), fetchCities()]);
        setCategories(catsData);
        setCities(citiesData);
      } catch (e) {
        console.error('Error loading metadata:', e);
      }
    }
    loadMeta();
  }, []);


  // Fetch STKs whenever page or filters change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await fetchStks({
          page,
          limit: 18,
          q: searchQuery,
          city: selectedCity,
          category: selectedCategory,
          organizationType,
          verified: verifiedOnly ? '1' : '',
          sort: sortBy
        });
        if (isMounted) {
          setStks(data.stks);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error('Error loading STKs:', err);
        if (isMounted) {
          setLoadError('STK verilerine ulaşılamadı. Sunucunun açık olduğundan emin olup tekrar deneyin.');
          setStks([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadData();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [page, searchQuery, selectedCity, selectedCategory, organizationType, verifiedOnly, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedCategory('all');
    setOrganizationType('all');
    setVerifiedOnly(false);
    setSortBy('default');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCity !== 'all' || selectedCategory !== 'all' || organizationType !== 'all' || verifiedOnly;

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header Title */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">STK DİZİNİ VE ARAMA</span>
            <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight mt-1">
              Türkiye Sivil Toplum Haritası
            </h2>
            <p className="text-sm text-navy-600 mt-1">
              Dernek ve vakıfları kurum türü, il, faaliyet alanı ve anahtar kelimeye göre filtreleyin.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-2 bg-sand-200/80 p-1 rounded-xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-600 hover:text-navy-950'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-600 hover:text-navy-950'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="bg-white rounded-3xl border border-sand-300/90 p-4 sm:p-6 shadow-soft mb-8">
        <div className="mb-4" role="group" aria-label="Kurum türü filtresi">
          <span className="block text-xs font-bold uppercase tracking-wider text-navy-600 mb-2">Kurum türü</span>
          <div className="inline-flex w-full sm:w-auto rounded-xl border border-sand-300 bg-sand-50 p-1">
            {[
              ['all', 'Tümü'],
              ['dernek', 'Dernek'],
              ['vakif', 'Vakıf']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={organizationType === value}
                onClick={() => {
                                  setOrganizationType(value);
                                  setSelectedCategory('all');
                                  setPage(1);
                                }}
                className={`min-h-10 flex-1 sm:flex-none px-5 rounded-lg text-sm font-semibold transition-colors ${organizationType === value ? 'bg-navy-950 text-white shadow-sm' : 'text-navy-700 hover:bg-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-5 h-5 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Dernek, vakıf veya anahtar kelime..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-navy-900 text-sm placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* City Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">Tüm İller (81 İl)</option>
              {cities.map(c => (
                <option key={c.il} value={c.il}>{c.il} ({c.count})</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              disabled={organizationType === 'vakif'}
              aria-label="Faaliyet alanı filtresi"
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="all">
                {organizationType === 'vakif'
                  ? 'Vakıflarda anahtar kelime kullanın'
                  : `Tüm Faaliyet Alanları (${categories.length})`}
              </option>
              {organizationType !== 'vakif' && categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name} ({cat.stk_count})</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="default">Sıralama: Önerilen</option>
              <option value="name_asc">İsim (A-Z)</option>
              <option value="name_desc">İsim (Z-A)</option>
              <option value="newest">En Yeni Kuruluş</option>
            </select>
          </div>

        </div>

        {/* Secondary options & Filter badges */}
        <div className="mt-4 pt-4 border-t border-sand-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-sand-300"
              />
              <span className="font-semibold text-navy-800 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-brand-700" />
                <span>Sadece doğrulanmış kurumlar</span>
              </span>
            </label>
          </div>

          <div className="flex items-center space-x-3 text-navy-600 font-medium">
            <span>{loadError ? 'Veri bağlantısı kurulamadı' : <>Toplam <strong className="text-navy-950 font-bold">{total.toLocaleString('tr-TR')}</strong> STK bulundu</>}</span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-brand-700 hover:text-brand-800 font-semibold underline ml-2"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STK Cards Listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-56 rounded-3xl bg-sand-100 animate-pulse border border-sand-200" />
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="p-8 text-center bg-white rounded-3xl border border-red-200">
          <Building2 className="w-10 h-10 text-red-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy-900">Veri bağlantısı kurulamadı</h3>
          <p className="text-sm text-navy-600 mt-1">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-semibold"
          >
            Sayfayı Yenile
          </button>
        </div>
      ) : stks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-sand-200">
          <Building2 className="w-12 h-12 text-navy-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy-900">Sonuç bulunamadı</h3>
          <p className="text-sm text-navy-500 mt-1">Lütfen arama terimlerinizi veya filtreleri değiştirerek tekrar deneyiniz.</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Tüm Filtreleri Sıfırla
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stks.map(stk => (
            <div
              key={stk.id}
              className="p-6 rounded-3xl bg-white border border-sand-200/90 shadow-soft hover:border-brand-300 hover:shadow-card transition-all duration-200 flex flex-col justify-between card-hover"
            >
              <div>
                {/* Badges & Location */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1 text-xs text-navy-500 font-medium truncate max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="truncate">{stk.ilce ? `${stk.ilce}, ` : ''}{stk.il || 'Belirtilmemiş'}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sand-100 text-navy-700 text-[11px] font-bold">
                    {React.createElement(getOrganizationIcon(stk), { className: 'w-3 h-3' })}
                    <span>{getOrganizationTypeLabel(stk)}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-navy-950 text-base leading-snug line-clamp-2">
                  {stk.kurum_adi}
                </h3>

                {/* Category badge */}
                <div className="mt-2">
                  <span className="inline-block text-xs font-semibold text-brand-700 bg-brand-50/80 px-2.5 py-1 rounded-lg">
                    {stk.faaliyet_alani}
                  </span>
                </div>

                {/* Subcategory */}
                {stk.detayli_faaliyet && (
                  <p className="text-xs text-navy-500 mt-2 line-clamp-2 italic">
                    {stk.detayli_faaliyet}
                  </p>
                )}

                <div className="text-[11px] text-navy-500 mt-3">
                  <span className="font-semibold">{getRegistryInfo(stk).shortLabel}:</span>{' '}
                  <span className="font-mono">{getRegistryInfo(stk).value}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>{getRegistryInfo(stk).source}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                  {stk.telefon && (
                    <a
                      href={`tel:${stk.telefon}`}
                      className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors"
                      title={`Telefon: ${stk.telefon}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{stk.telefon}</span>
                    </a>
                  )}

                  {getSafeWebsiteUrl(stk.web_site) && (
                    <a
                      href={getSafeWebsiteUrl(stk.web_site)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
                      title={stk.web_site}
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{stk.web_site}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-sand-100 flex items-center space-x-2">
                <button
                  onClick={() => onOpenContactModal(stk)}
                  className="flex-1 py-2 px-3 rounded-xl bg-sand-100 hover:bg-brand-50 hover:text-brand-800 text-navy-800 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                  <span>Destek İste</span>
                </button>

                <button
                  onClick={() => onSelectStk(stk.id)}
                  className="py-2 px-3 rounded-xl bg-navy-950 hover:bg-navy-800 text-white text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <span>Detay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-3xl border border-sand-200 divide-y divide-sand-200 overflow-hidden shadow-soft">
          {stks.map(stk => (
            <div key={stk.id} className="p-5 hover:bg-sand-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {stk.faaliyet_alani}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-navy-700 font-semibold">
                    {React.createElement(getOrganizationIcon(stk), { className: 'w-3.5 h-3.5' })}
                    <span>{getOrganizationTypeLabel(stk)}</span>
                  </span>
                  {stk.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-brand-700" aria-label="Doğrulanmış kurum" />}
                </div>
                <h3 className="font-bold text-navy-950 text-base">{stk.kurum_adi}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>{stk.ilce ? `${stk.ilce}, ` : ''}{stk.il || 'Belirtilmemiş'}</span>
                  </span>
                  <span>{getRegistryInfo(stk).shortLabel}: {getRegistryInfo(stk).value}</span>
                  <span className="hidden md:inline">Kaynak: {getRegistryInfo(stk).source}</span>
                  {stk.telefon && (
                    <a
                      href={`tel:${stk.telefon}`}
                      className="inline-flex max-w-full items-center gap-1 text-emerald-800 font-semibold hover:underline"
                      title={`Telefon: ${stk.telefon}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{stk.telefon}</span>
                    </a>
                  )}
                  {getSafeWebsiteUrl(stk.web_site) && (
                    <a
                      href={getSafeWebsiteUrl(stk.web_site)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-brand-700 hover:underline"
                      title={stk.web_site}
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="max-w-72 truncate">{stk.web_site}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onOpenContactModal(stk)}
                  className="py-2 px-3 rounded-xl bg-sand-100 hover:bg-sand-200 text-navy-800 text-xs font-bold"
                >
                  Destek İste
                </button>
                <button
                  onClick={() => onSelectStk(stk.id)}
                  className="py-2 px-4 rounded-xl bg-navy-950 hover:bg-navy-800 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <span>İncele</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between border-t border-sand-200 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-sand-300 text-sm font-semibold text-navy-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Önceki</span>
          </button>

          <div className="text-sm text-navy-600 font-medium">
            Sayfa <span className="font-bold text-navy-950">{page}</span> / {totalPages.toLocaleString('tr-TR')}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-sand-300 text-sm font-semibold text-navy-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <span>Sonraki</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </section>
  );
}
