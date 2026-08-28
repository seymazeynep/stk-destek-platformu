import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Share2,
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { fetchStkDetail } from '../services/api';
import { getOrganizationIcon, getOrganizationTypeLabel, getRegistryInfo } from '../utils/presentation';

export default function StkDetailModal({ stkId, onClose, onOpenContactModal }) {
  const [stk, setStk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await fetchStkDetail(stkId);
        setStk(data);
      } catch (err) {
        console.error('Error loading STK details:', err);
        setError('STK detayları yüklenemedi.');
      } finally {
        setLoading(false);
      }
    }
    if (stkId) {
      loadDetail();
    }
  }, [stkId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stkId) return null;

  const registry = getRegistryInfo(stk);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-floating border border-sand-300 overflow-hidden my-8 max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div className="relative bg-navy-950 text-white p-6 sm:p-8 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-4 pr-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center shrink-0">
              {React.createElement(getOrganizationIcon(stk), { className: 'w-7 h-7' })}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-brand-500/80 text-white text-xs font-bold uppercase tracking-wider">
                  {getOrganizationTypeLabel(stk)}
                </span>
                {stk?.is_verified ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Doğrulanmış kurum</span>
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                {stk?.kurum_adi}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {loading ? (
            <div className="space-y-4 py-8 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-navy-600 font-medium">STK bilgileri yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 text-rose-800 rounded-2xl text-center">
              {error}
            </div>
          ) : (
            <>
              {/* Primary Info Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200">
                  <div className="text-xs text-navy-500 font-medium flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>Şehir & İlçe</span>
                  </div>
                  <div className="text-sm font-bold text-navy-950 mt-1 truncate">
                    {stk.ilce ? `${stk.ilce}, ` : ''}{stk.il || 'Belirtilmemiş'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200">
                  <div className="text-xs text-navy-500 font-medium flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>Kuruluş Tarihi</span>
                  </div>
                  <div className="text-sm font-bold text-navy-950 mt-1">
                    {stk.kurulus_tarihi || 'Belirtilmemiş'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200 col-span-2 sm:col-span-1">
                  <div className="text-xs text-navy-500 font-medium flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                    <span>{registry.shortLabel}</span>
                  </div>
                  <div className="text-sm font-bold text-navy-950 mt-1 font-mono">
                    {registry.value}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-navy-600">
                <span className="font-semibold">Veri kaynağı:</span>
                <span>{registry.source}</span>
                {stk.faaliyet_alani && <><span aria-hidden="true">·</span><span>{stk.faaliyet_alani}</span></>}
              </div>

              {/* Sub-category detail */}
              {stk.detayli_faaliyet && (
                <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-200/70">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-800 mb-1">
                    Detaylı Faaliyet & Uzmanlık Alanları:
                  </div>
                  <p className="text-sm text-navy-800 leading-relaxed font-medium">
                    {stk.detayli_faaliyet}
                  </p>
                </div>
              )}

              {/* Description */}
              {stk.aciklama && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-500 mb-2">
                    Hakkında & Amaç
                  </h4>
                  <p className="text-sm text-navy-700 leading-relaxed bg-sand-50 p-4 rounded-2xl border border-sand-200">
                    {stk.aciklama}
                  </p>
                </div>
              )}

              {/* Official Address */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-500 mb-2">
                  Resmi Kurum Adresi
                </h4>
                <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 text-sm text-navy-800 flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{stk.kurum_adresi || 'Adres bilgisi sistemde kayıtlı değildir.'}</span>
                </div>
              </div>

              {/* Contact Channels Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-500 mb-2">
                  Doğrudan İletişim Kanalları
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stk.telefon ? (
                    <a
                      href={`tel:${stk.telefon}`}
                      className="p-3.5 rounded-2xl border border-sand-200 bg-sand-50 hover:bg-brand-50 hover:border-brand-200 transition-colors flex items-center space-x-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-navy-500">Telefon</div>
                        <div className="text-sm font-bold text-navy-900">{stk.telefon}</div>
                      </div>
                    </a>
                  ) : null}

                  {stk.email ? (
                    <a
                      href={`mailto:${stk.email}`}
                      className="p-3.5 rounded-2xl border border-sand-200 bg-sand-50 hover:bg-brand-50 hover:border-brand-200 transition-colors flex items-center space-x-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-navy-500">E-Posta</div>
                        <div className="text-sm font-bold text-navy-900 truncate">{stk.email}</div>
                      </div>
                    </a>
                  ) : null}

                  {stk.web_site ? (
                    <a
                      href={stk.web_site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl border border-sand-200 bg-sand-50 hover:bg-brand-50 hover:border-brand-200 transition-colors flex items-center space-x-3 col-span-1 sm:col-span-2"
                    >
                      <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-xs text-navy-500">Resmi Web Sitesi</div>
                        <div className="text-sm font-bold text-brand-700 flex items-center space-x-1">
                          <span className="truncate">{stk.web_site}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
                        </div>
                      </div>
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Activities and Announcements */}
              {stk.activities && stk.activities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-500 mb-3 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>Güncel Faaliyetler ve Duyurular</span>
                  </h4>
                  <div className="space-y-3">
                    {stk.activities.map(act => (
                      <div key={act.id} className="p-4 rounded-2xl bg-white border border-sand-200 shadow-soft">
                        <div className="flex items-center justify-between text-xs text-navy-500 mb-1">
                          <span className="font-bold text-brand-700">{act.category}</span>
                          {act.event_date && <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /> <span>{act.event_date}</span></span>}
                        </div>
                        <h5 className="font-bold text-navy-950 text-sm">{act.title}</h5>
                        <p className="text-xs text-navy-600 mt-1 leading-relaxed">{act.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-sand-50 border-t border-sand-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleShare}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-sand-300 text-navy-700 hover:bg-sand-100 text-xs font-semibold flex items-center justify-center space-x-1.5"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Bağlantı Kopyalandı!' : 'Profili Paylaş'}</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-sand-300 text-navy-700 text-xs font-semibold hover:bg-sand-100"
            >
              Kapat
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenContactModal(stk);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-card"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Doğrudan Destek Talebi Gönder</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
