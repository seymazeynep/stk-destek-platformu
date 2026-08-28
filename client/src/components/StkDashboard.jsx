import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Inbox,
  Settings,
  PlusCircle,
  Mail,
  Phone,
  LogOut,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  loginStk,
  registerStk,
  fetchDashboard,
  updateStkProfile,
  addStkActivity,
  updateRequestStatus
} from '../services/api';
import { getOrganizationIcon, getOrganizationTypeLabel, getRegistryInfo } from '../utils/presentation';

export default function StkDashboard({
  currentUser,
  onLoginSuccess,
  onLogout
}) {
  // Auth Form State (for unauthenticated users)
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactName, setContactName] = useState('');
  const contactPhone = '';
  const kutukNo = '';
  const [kurumAdi, setKurumAdi] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data State (for authenticated users)
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'profile', 'new-activity'
  const [, setLoadingDashboard] = useState(false);

  // Profile Edit Form
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [profileMsg, setProfileMsg] = useState(null);

  // New Activity Form
  const [actTitle, setActTitle] = useState('');
  const [actCategory, setActCategory] = useState('Duyuru');
  const [actContent, setActContent] = useState('');
  const [actDate, setActDate] = useState('');
  const [actMsg, setActMsg] = useState(null);

  // The HttpOnly cookie is the authentication source; persisted user data is display-only.
  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  async function loadDashboardData() {
    try {
      setLoadingDashboard(true);
      const data = await fetchDashboard();
      setDashboardData(data);
      if (data.stk) {
        setEditPhone(data.stk.telefon || '');
        setEditEmail(data.stk.email || '');
        setEditWebsite(data.stk.web_site || '');
        setEditAddress(data.stk.kurum_adresi || '');
        setEditDesc(data.stk.aciklama || '');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const res = await loginStk(email.trim(), password);
        localStorage.setItem('stk_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
        loadDashboardData();
      } else {
        const res = await registerStk({
          email: email.trim(),
          password: password,
          contact_name: contactName.trim(),
          phone: contactPhone || '',
          kutuk_no: kutukNo || null,
          kurum_adi: kurumAdi.trim() || null
        });
        localStorage.setItem('stk_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
        loadDashboardData();
      }
    } catch (err) {
      setAuthError(err.message || 'İşlem başarısız oldu.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateStkProfile({
        telefon: editPhone,
        email: editEmail,
        web_site: editWebsite,
        kurum_adresi: editAddress,
        aciklama: editDesc
      });
      setProfileMsg({ type: 'success', text: 'Profil bilgileri başarıyla güncellendi.' });
      loadDashboardData();
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Profil güncellenemedi.' });
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      await addStkActivity({
        title: actTitle,
        category: actCategory,
        content: actContent,
        event_date: actDate
      });
      setActMsg({ type: 'success', text: 'Faaliyet/Duyuru başarıyla yayınlandı.' });
      setActTitle('');
      setActContent('');
      setActDate('');
      loadDashboardData();
    } catch (err) {
      setActMsg({ type: 'error', text: err.message || 'Faaliyet eklenemedi.' });
    }
  };

  const handleStatusChange = async (reqId, newStatus) => {
    try {
      await updateRequestStatus(reqId, newStatus, null);
      loadDashboardData();
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: UNAUTHENTICATED LOGIN / REGISTER FORM
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="py-12 max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl border border-sand-300 shadow-floating p-6 sm:p-8">

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-navy-950 text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-soft">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-navy-950">
              {authMode === 'login' ? 'Kurum Temsilcisi Girişi' : 'Dernek / Vakıf Kaydı ve Profil Talebi'}
            </h2>
            <p className="text-xs text-navy-500 mt-1">
              {authMode === 'login'
                ? 'Gelen destek başvurularını yönetin ve faaliyetlerinizi yayınlayın'
                : 'Dernek veya vakıf profilinizi sahiplenin ya da yeni kurum kaydı açın'}
            </p>
          </div>

          {/* Toggle between Login and Register */}
          <div className="flex bg-sand-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'login' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-600'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'register' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-600'
              }`}
            >
              Kurum Kaydı / Profil Sahiplen
            </button>
          </div>

          {authError && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                    Yetkili Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Adınız ve Soyadınız"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                    Kurum Adı (veya Sicil / Kaynak No)
                  </label>
                  <input
                    type="text"
                    value={kurumAdi}
                    onChange={(e) => setKurumAdi(e.target.value)}
                    placeholder="Örn: Anadolu Eğitim Derneği veya Vakfı"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-navy-500 mt-1">Kurum türüne göre resmi kaynak kaydıyla eşleştirilir.</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                E-Posta Adresi *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stk@kurum.org.tr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                Şifre *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-card transition-all disabled:opacity-50 mt-2"
            >
              {authLoading ? 'İşleniyor...' : authMode === 'login' ? 'Giriş Yap' : 'STK Hesabı Oluştur'}
            </button>
          </form>

          {/* Demo helper */}
          <div className="mt-6 pt-4 border-t border-sand-200 text-center">
            <p className="text-xs text-navy-400">
              Test için herhangi bir e-posta ve şifreyle anında yeni STK hesabı açabilirsiniz.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUTHENTICATED STK ADMIN DASHBOARD
  // -------------------------------------------------------------
  const stk = dashboardData?.stk;
  const requests = dashboardData?.requests || [];

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Top Banner with STK Profile Summary */}
      <div className="bg-white rounded-3xl border border-sand-300/90 shadow-soft p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-navy-950 text-brand-200 flex items-center justify-center font-bold text-2xl shadow-card">
              {React.createElement(getOrganizationIcon(stk), { className: 'w-8 h-8' })}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-navy-950">
                  {stk?.kurum_adi || 'STK Yönetim Paneli'}
                </h1>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Yetkili {getOrganizationTypeLabel(stk)}</span>
                </span>
              </div>
              <p className="text-xs text-navy-500 mt-1">
                Temsilci: <strong className="text-navy-800">{currentUser?.contact_name || 'Yetkili'}</strong> •
                Konum: {stk?.il || 'Türkiye'} • {getRegistryInfo(stk).shortLabel}: {getRegistryInfo(stk).value} • Kaynak: {getRegistryInfo(stk).source}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl border border-sand-300 text-navy-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Dashboard Nav Tabs */}
        <div className="flex border-b border-sand-200 mt-6 -mb-2 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-4 border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'requests'
                ? 'border-brand-600 text-brand-700 font-bold'
                : 'border-transparent text-navy-600 hover:text-navy-950'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Gelen Destek Talepleri ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'profile'
                ? 'border-brand-600 text-brand-700 font-bold'
                : 'border-transparent text-navy-600 hover:text-navy-950'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Kurum Profilini Düzenle</span>
          </button>

          <button
            onClick={() => setActiveTab('new-activity')}
            className={`pb-4 border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'new-activity'
                ? 'border-brand-600 text-brand-700 font-bold'
                : 'border-transparent text-navy-600 hover:text-navy-950'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Faaliyet & Duyuru Ekle</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GELEN DESTEK TALEPLERİ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-950">Vatandaşlardan Gelen Talepler</h2>
            <span className="text-xs text-navy-500 font-medium">Toplam {requests.length} başvuru</span>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-sand-200">
              <Inbox className="w-12 h-12 text-navy-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-navy-900">Henüz gelen destek talebi yok</h3>
              <p className="text-xs text-navy-500 mt-1">Platform üzerinden vatandaşlar talep gönderdiğinde burada listelenecektir.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div
                  key={req.id}
                  className="p-6 rounded-3xl bg-white border border-sand-200 shadow-soft hover:shadow-card transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-sand-100">
                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-navy-950 text-base">{req.user_name}</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-800 text-xs font-bold">
                        {req.support_category || 'Genel Destek'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={req.status || 'pending'}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer ${
                          req.status === 'answered'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : req.status === 'reviewed'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-amber-50 border-amber-300 text-amber-800'
                        }`}
                      >
                        <option value="pending">Beklemede</option>
                        <option value="reviewed">İncelendi</option>
                        <option value="answered">Yanıtlandı</option>
                      </select>
                      <span className="text-xs text-navy-400 font-mono">#{req.id}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-bold text-navy-900 text-sm mb-1">{req.subject}</h4>
                    <p className="text-sm text-navy-700 leading-relaxed bg-sand-50/70 p-3.5 rounded-2xl border border-sand-200">
                      {req.message}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-navy-500">
                    <div className="flex items-center space-x-4">
                      <a href={`mailto:${req.user_email}`} className="flex items-center space-x-1 text-blue-600 hover:underline">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{req.user_email}</span>
                      </a>
                      {req.user_phone && (
                        <a href={`tel:${req.user_phone}`} className="flex items-center space-x-1 text-emerald-600 hover:underline">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{req.user_phone}</span>
                        </a>
                      )}
                    </div>

                    <div className="text-[11px] text-navy-400">
                      Tarih: {req.created_at || 'Yeni'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROFİL DÜZENLE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-soft max-w-3xl">
          <h2 className="text-xl font-bold text-navy-950 mb-4">Kurum Bilgilerini Güncelle</h2>

          {profileMsg && (
            <div className={`p-4 rounded-xl mb-4 text-xs font-semibold ${
              profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                  Resmi Telefon
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0 (212) 000 00 00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                  Resmi E-Posta
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="iletisim@kurum.org.tr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                Web Sitesi
              </label>
              <input
                type="url"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="https://www.kurum.org.tr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                Kurum Adresi
              </label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Açık adres..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                Hakkında & Faaliyet Açıklaması
              </label>
              <textarea
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Kurumun misyonu, destek alanları ve yürüttüğü projeler..."
                className="w-full p-3.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-card"
              >
                Bilgileri Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: FAALİYET EKLE */}
      {activeTab === 'new-activity' && (
        <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-soft max-w-3xl">
          <h2 className="text-xl font-bold text-navy-950 mb-1">Yeni Faaliyet & Duyuru Yayınla</h2>
          <p className="text-xs text-navy-500 mb-4">Bu duyuru kurumunuzun detay sayfasında ve arama sonuçlarında görünecektir.</p>

          {actMsg && (
            <div className={`p-4 rounded-xl mb-4 text-xs font-semibold ${
              actMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {actMsg.text}
            </div>
          )}

          <form onSubmit={handleActivitySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                Faaliyet / Duyuru Başlığı *
              </label>
              <input
                type="text"
                required
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                placeholder="Örn: 2026 Kış Dönemi Üniversite Burs Başvuruları Başladı"
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                  Kategori
                </label>
                <select
                  value={actCategory}
                  onChange={(e) => setActCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Burs & Eğitim">Burs & Eğitim</option>
                  <option value="İnsani Yardım">İnsani Yardım</option>
                  <option value="Afet & Acil Durum">Afet & Acil Durum</option>
                  <option value="Sağlık & Medikal">Sağlık & Medikal</option>
                  <option value="Etkinlik & Seminer">Etkinlik & Seminer</option>
                  <option value="Gönüllülük">Gönüllülük</option>
                  <option value="Duyuru">Duyuru</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                  Tarih / Son Başvuru
                </label>
                <input
                  type="date"
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1">
                Duyuru / Faaliyet İçeriği *
              </label>
              <textarea
                rows={5}
                required
                value={actContent}
                onChange={(e) => setActContent(e.target.value)}
                placeholder="Başvuru şartları, kapsam, hedef kitle ve iletişim talimatları..."
                className="w-full p-3.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-7 py-3 rounded-2xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-sm shadow-card flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Faaliyeti Yayınla</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
