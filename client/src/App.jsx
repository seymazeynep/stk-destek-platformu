import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SmartWizard from './components/SmartWizard';
import StkDirectory from './components/StkDirectory';
import StkDetailModal from './components/StkDetailModal';
import DirectContactModal from './components/DirectContactModal';
import StkDashboard from './components/StkDashboard';
import TurkeyMapSection from './components/TurkeyMapSection';
import EmergencyDirectoryModal from './components/EmergencyDirectoryModal';
import Footer from './components/Footer';
import { fetchStats, fetchCategories, logoutStk } from './services/api';
import { ArrowRight, Shield } from 'lucide-react';
import { API_ICON_MAP, ICONS } from './utils/presentation';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'directory', 'portal'
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modals & Active Selections
  const [, setWizardOpen] = useState(false);
  const [wizardTopicId, setWizardTopicId] = useState(null);
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [selectedStkId, setSelectedStkId] = useState(null);
  const [contactModalData, setContactModalData] = useState(null); // { stk, initialCategory }
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Authenticated STK User
  const [stkUser, setStkUser] = useState(() => {
    const saved = localStorage.getItem('stk_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Load initial stats & categories
  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, catsData] = await Promise.all([
          fetchStats(),
          fetchCategories()
        ]);
        setStats(statsData);
        setCategories(catsData);
      } catch (err) {
        console.error('Error loading initial platform data:', err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('stk_user');
      setStkUser(null);
      setActiveTab('home');
    };

    window.addEventListener('stk:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('stk:unauthorized', handleUnauthorized);
  }, []);

  // Handlers
  const handleOpenWizard = (topicId = null) => {
    setWizardTopicId(topicId);
    setWizardOpen(true);
    setActiveTab('home');
    setTimeout(() => {
      const el = document.getElementById('wizard-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleHeroSearch = (query) => {
    setDirectorySearchQuery(query);
    setActiveTab('directory');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSelectCategory = (categoryName) => {
    setDirectorySearchQuery(categoryName);
    setActiveTab('directory');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSelectCity = (cityName) => {
    setDirectorySearchQuery(cityName);
    setActiveTab('directory');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleOpenContactModal = (stk, initialCategory = 'Genel Destek') => {
    setContactModalData({ stk, initialCategory });
  };

  const handleLoginSuccess = (user) => {
    setStkUser(user);
    setActiveTab('portal');
  };

  const handleLogout = async () => {
    try {
      await logoutStk();
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('stk_user');
      setStkUser(null);
      setActiveTab('home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-brand-100 selection:text-brand-900">

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWizard={() => handleOpenWizard(null)}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
        onOpenStkPortal={() => setActiveTab('portal')}
        stkUser={stkUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">

        {/* ======================================================== */}
        {/* 1. HOME TAB */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <Hero
              stats={stats}
              onSearch={handleHeroSearch}
              onOpenWizard={() => handleOpenWizard(null)}
              onSelectTopic={(topicId) => handleOpenWizard(topicId)}
            />

            {/* Smart Support Wizard Section (Expanded when opened) */}
            <section id="wizard-section" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <SmartWizard
                initialTopicId={wizardTopicId}
                onSelectStk={(id) => setSelectedStkId(id)}
                onOpenContactModal={handleOpenContactModal}
              />
            </section>

            {/* Category Showcase Section */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">UZMANLIK ALANLARI</span>
                  <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight mt-1">
                    Faaliyet Alanlarına Göre Sivil Toplum
                  </h2>
                  <p className="text-sm text-navy-600 mt-1">
                    Türkiye genelindeki dernek ve vakıfların temel çalışma ve hizmet alanları
                  </p>
                </div>

                <button
                  onClick={() => { setActiveTab('directory'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex items-center space-x-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <span>Tüm STK'ları İncele</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categories.slice(0, 8).map((cat) => {
                  const IconComp = API_ICON_MAP[cat.icon] || ICONS.organization;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.name)}
                      className="p-6 rounded-3xl bg-white border border-sand-200 shadow-soft hover:border-brand-300 hover:shadow-card transition-all duration-200 text-left flex flex-col justify-between group card-hover"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-sand-100 group-hover:bg-brand-50 text-brand-600 flex items-center justify-center mb-4 transition-colors">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-navy-950 text-base group-hover:text-brand-700 transition-colors line-clamp-2">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-navy-500 mt-1.5 line-clamp-2">
                          {cat.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-sand-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-800 bg-sand-100 px-2.5 py-1 rounded-lg">
                          {cat.stk_count.toLocaleString('tr-TR')} STK
                        </span>
                        <ArrowRight className="w-4 h-4 text-navy-400 group-hover:text-brand-600 transform group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Regional / Turkey Map Section */}
            <TurkeyMapSection
              stats={stats}
              onSelectCity={handleSelectCity}
            />

            {/* Trust & Verification Banner */}
            <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-navy-950 text-white rounded-3xl p-8 sm:p-12 shadow-floating relative overflow-hidden">
                <div className="max-w-2xl relative z-10">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-4">
                    <Shield className="w-4 h-4" />
                    <span>Şeffaf ve Doğrulanmış Sivil Toplum</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                    Sivil Toplum Kuruluşunuzu Platformda Temsil Edin
                  </h2>
                  <p className="text-sm sm:text-base text-navy-300 mt-3 leading-relaxed">
                    Kurumunuzun resmi sayfasını yönetin, gelen yardım ve destek taleplerini anında yanıtlayın, burs ve kampanya duyurularınızı binlerce vatandaşa ulaştırın.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('portal')}
                      className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-card transition-all"
                    >
                      Dernek veya Vakıf Temsilcisi Girişi
                    </button>
                    <button
                      onClick={() => handleOpenWizard(null)}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
                    >
                      Destek Arayanlar İçin Rehber
                    </button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ======================================================== */}
        {/* 2. DIRECTORY TAB */}
        {/* ======================================================== */}
        {activeTab === 'directory' && (
          <div id="directory">
            <StkDirectory
              initialQuery={directorySearchQuery}
              onSelectStk={(id) => setSelectedStkId(id)}
              onOpenContactModal={handleOpenContactModal}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. STK PORTAL TAB */}
        {/* ======================================================== */}
        {activeTab === 'portal' && (
          <StkDashboard
            currentUser={stkUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        )}

      </main>

      {/* STK Detail Modal */}
      {selectedStkId && (
        <StkDetailModal
          stkId={selectedStkId}
          onClose={() => setSelectedStkId(null)}
          onOpenContactModal={handleOpenContactModal}
        />
      )}

      {/* Direct Contact Modal */}
      {contactModalData && (
        <DirectContactModal
          stk={contactModalData.stk}
          initialCategory={contactModalData.initialCategory}
          onClose={() => setContactModalData(null)}
        />
      )}

      {/* Emergency Directory Modal */}
      {emergencyModalOpen && (
        <EmergencyDirectoryModal
          onClose={() => setEmergencyModalOpen(false)}
        />
      )}

      {/* Global Footer */}
      <Footer
        onOpenWizard={() => handleOpenWizard(null)}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
        onSelectCategory={handleSelectCategory}
      />

    </div>
  );
}
