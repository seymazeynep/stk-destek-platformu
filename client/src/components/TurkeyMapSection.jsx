import React from 'react';
import { MapPin, Compass, ArrowRight } from 'lucide-react';

export default function TurkeyMapSection({ stats, onSelectCity }) {
  const topCities = stats?.topCities || [
    { il: 'İstanbul', count: 23984 },
    { il: 'Ankara', count: 11050 },
    { il: 'İzmir', count: 6698 },
    { il: 'Bursa', count: 4984 },
    { il: 'Antalya', count: 3781 },
    { il: 'Kocaeli', count: 3134 },
    { il: 'Konya', count: 2712 },
    { il: 'Adana', count: 2466 }
  ];

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-sand-100 rounded-3xl border border-sand-200 p-6 sm:p-10 shadow-soft">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Bölgesel Dayanışma Ağı</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              81 İlde STK Yoğunluğu ve Dağılımı
            </h2>
            <p className="text-sm text-navy-600 mt-1">
              Bulunduğunuz şehre tıklayarak yerel sivil toplum kuruluşlarını tek tıkla listeleyin.
            </p>
          </div>

          <div className="text-xs text-navy-500 font-medium">
            En yüksek STK yoğunluğuna sahip ilk 8 il
          </div>
        </div>

        {/* City distribution grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {topCities.map((city, idx) => (
            <button
              key={city.il}
              onClick={() => onSelectCity(city.il)}
              className="p-5 rounded-2xl bg-white border border-sand-200 hover:border-brand-400 hover:shadow-card transition-all duration-200 text-left group flex flex-col justify-between card-hover"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy-400">#{idx + 1}</span>
                <div className="w-8 h-8 rounded-xl bg-sand-50 group-hover:bg-brand-50 text-brand-600 flex items-center justify-center transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="font-extrabold text-navy-950 text-base group-hover:text-brand-700 transition-colors">
                  {city.il}
                </h3>
                <p className="text-xs text-navy-500 font-medium mt-0.5">
                  {Number(city.count).toLocaleString('tr-TR')} STK
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-sand-100 flex items-center justify-between text-xs font-bold text-brand-600 group-hover:text-brand-700">
                <span>STK'ları Gör</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
