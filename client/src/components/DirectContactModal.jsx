import React, { useState } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitContactRequest } from '../services/api';

export default function DirectContactModal({
  stk,
  initialCategory = 'Genel Destek',
  onClose
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    if (!kvkkAccepted) {
      setError('Lütfen KVKK aydınlatma metnini onaylayınız.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await submitContactRequest({
        stk_id: stk.id,
        user_name: name,
        user_email: email,
        user_phone: phone,
        support_category: category,
        subject,
        message
      });

      setSuccessData(response);

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({
          particleCount: 36,
          spread: 50,
          colors: ['#627281', '#b9b6c0', '#f8f5ef'],
          origin: { y: 0.6 }
        });
      }

    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Talebiniz gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!stk) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-floating border border-sand-300 overflow-hidden my-8">

        {/* Header */}
        <div className="bg-brand-700 text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Send className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Doğrudan Destek & İletişim Talebi</h3>
              <p className="text-xs text-brand-100 mt-0.5 max-w-md truncate">
                Kurum: <span className="font-semibold text-white">{stk.kurum_adi}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {successData ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-2xl font-extrabold text-navy-950">Talebiniz Başarıyla İletildi!</h4>
              <p className="text-sm text-navy-600 max-w-md mx-auto leading-relaxed">
                Destek başvurunuz ve iletişim bilgileriniz <strong>{stk.kurum_adi}</strong> yetkililerine ulaştırılmıştır. Başvurunuz incelendikten sonra e-posta veya telefon yoluyla sizinle irtibata geçilecektir.
              </p>

              <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 text-xs text-navy-500 font-mono inline-block">
                Takip No: #{successData.requestId || 'Oluşturuldu'}
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-sm shadow-card"
                >
                  Tamam
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                    Adınız Soyadınız *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                    E-Posta Adresiniz *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adiniz@ornek.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0 (5XX) XXX XX XX"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                    Destek / İletişim Kategorisi
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Burs ve Eğitim Desteği">Burs ve Eğitim Desteği</option>
                    <option value="Gıda, Erzak ve Temel İhtiyaç">Gıda, Erzak ve Temel İhtiyaç</option>
                    <option value="Afet ve Acil Durum Desteği">Afet ve Acil Durum Desteği</option>
                    <option value="Sağlık, Tedavi ve Medikal Cihaz">Sağlık, Tedavi ve Medikal Cihaz</option>
                    <option value="Engelli Hizmetleri & Araç">Engelli Hizmetleri & Araç</option>
                    <option value="Hukuki Destek & Danışmanlık">Hukuki Destek & Danışmanlık</option>
                    <option value="Psikolojik & Sosyal Hizmet">Psikolojik & Sosyal Hizmet</option>
                    <option value="Sokak Hayvanları Tedavi / Mama">Sokak Hayvanları Tedavi / Mama</option>
                    <option value="Gönüllülük & İşbirliği">Gönüllülük & İşbirliği</option>
                    <option value="Genel Destek">Genel Destek</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                  Konu Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: 2026 Üniversite Burs Başvurusu Hakkında"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                  Talebinizin veya Durumunuzun Detayları *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="İhtiyacınızı, durumunuzu ve STK'dan beklediğiniz desteği açık ve anlaşılır şekilde belirtiniz..."
                  className="w-full p-3.5 rounded-xl bg-sand-50 border border-sand-300 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-navy-600 select-none">
                  <input
                    type="checkbox"
                    checked={kvkkAccepted}
                    onChange={(e) => setKvkkAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-brand-600 focus:ring-brand-500 border-sand-300 shrink-0"
                  />
                  <span>
                    Paylaştığım iletişim ve talep bilgilerimin yalnızca ilgili sivil toplum kuruluşuna iletilmesini ve KVKK kapsamında işlenmesini onaylıyorum.
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-sand-300 text-navy-700 text-xs font-semibold hover:bg-sand-100"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-7 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-card flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Gönderiliyor...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Talebi İlet</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
