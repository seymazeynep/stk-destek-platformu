import React from 'react';
import { X, PhoneCall } from 'lucide-react';

export default function EmergencyDirectoryModal({ onClose }) {
  const emergencyNumbers = [
    {
      number: '112',
      title: '112 Acil Çağrı Merkezi',
      desc: 'Sağlık, Yangın, Polis, Jandarma ve Sahil Güvenlik tek acil numarada birleştirilmiştir.',
      badge: '7/24 Kesintisiz'
    },
    {
      number: '122',
      title: 'AFAD Afet ve Acil Durum',
      desc: 'Deprem, sel, heyelan, çığ ve arama-kurtarma durumlarında AFAD acil müdahale hattı.',
      badge: 'Afet Hattı'
    },
    {
      number: '183',
      title: 'Alo 183 Sosyal Destek Hattı',
      desc: 'Kadın, çocuk, engelli, yaşlı, şehit yakını ve gazilere yönelik psikososyal destek ve şiddet ihbarı.',
      badge: 'Aile Bakanlığı'
    },
    {
      number: '168',
      title: 'Türk Kızılayı Çağrı Merkezi',
      desc: 'Kan bağışı, insani yardım, kök hücre bağışı ve afet yardım talepleri.',
      badge: 'İnsani Yardım'
    },
    {
      number: '144',
      title: 'Alo 144 Sosyal Yardım Hattı',
      desc: 'Gıda, barınma, yakacak ve nakdi sosyal yardımlar için başvuru ve sorgulama hattı.',
      badge: 'Sosyal Yardım'
    },
    {
      number: '191',
      title: 'Alo 191 Uyuşturucu ile Mücadele',
      desc: 'Bağımlılık danışmanlığı, tedavi ve rehabilitasyon yönlendirme hattı.',
      badge: 'Sağlık Bakanlığı'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-floating border border-sand-300 overflow-hidden my-8">

        {/* Header */}
        <div className="bg-red-800 text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <PhoneCall className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Türkiye Acil Destek & Yardım Numaraları</h3>
              <p className="text-xs text-red-100 mt-0.5">
                Hayati ve acil durumlarda 7/24 ücretsiz ulaşabileceğiniz resmi hatlar
              </p>
            </div>
          </div>
        </div>

        {/* List of Emergency Numbers */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-3">
          {emergencyNumbers.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-sand-300 bg-sand-50 text-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-sand-300 text-navy-700">
                    {item.badge}
                  </span>
                  <h4 className="font-bold text-navy-950 text-sm">{item.title}</h4>
                </div>
                <p className="text-xs text-navy-600 leading-relaxed">{item.desc}</p>
              </div>

              <a
                href={`tel:${item.number}`}
                className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-white text-xs font-bold flex items-center justify-center space-x-2 shrink-0 shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Hemen Ara ({item.number})</span>
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 bg-sand-50 border-t border-sand-200 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-sand-200 hover:bg-sand-300 text-navy-900 text-xs font-bold"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}
