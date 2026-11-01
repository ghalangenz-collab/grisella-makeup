'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Service } from '@/types/database';
import StepService from './StepService';
import StepLocation from './StepLocation';
import StepSchedule from './StepSchedule';
import StepCustomer from './StepCustomer';
import StepSummary from './StepSummary';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';

interface BookingStepperProps {
  initialServices: Service[];
  initialSettings: Record<string, string>;
}

export default function BookingStepper({
  initialServices,
  initialSettings,
}: BookingStepperProps) {
  const router = useRouter();

  // Step state (1 sampai 5)
  const [step, setStep] = useState(1);

  // Form State
  const defaultService = initialServices[0] || {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Bridesmaid Makeup',
    price: 450000,
    duration_minutes: 75,
  };

  const transportZones = JSON.parse(
    initialSettings.transport_fee_zones ||
      JSON.stringify([
        { zone: 'Jakarta Selatan & sekitarnya (<5 km)', fee: 50000 },
        { zone: 'Jakarta Pusat / Barat / Timur (5-15 km)', fee: 100000 },
        { zone: 'Tangerang / Depok / Bekasi / Luar Kota (>15 km)', fee: 175000 },
      ])
  );

  const [formData, setFormData] = useState({
    serviceId: defaultService.id,
    makeupType: defaultService.name,
    customRequest: '',
    durationMinutes: defaultService.duration_minutes,
    servicePrice: defaultService.price,

    location: 'studio' as 'studio' | 'home',
    address: '',
    addressBenchmark: '',
    selectedZone: transportZones[0]?.zone || '',
    transportFee: 0,

    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',

    clientName: '',
    clientPhone: '',
    notes: '',
    source: 'Instagram',
  });

  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validasi sebelum pindah step
  const handleNext = () => {
    setErrorNotice(null);

    if (step === 1) {
      if (formData.makeupType.includes('Lainnya') && !formData.customRequest.trim()) {
        setErrorNotice('Mohon isi kolom "Makeup apa yang kamu inginkan?"');
        return;
      }
    } else if (step === 2) {
      if (formData.location === 'home' && !formData.address.trim()) {
        setErrorNotice('Mohon isi alamat lengkap untuk layanan Home Service');
        return;
      }
    } else if (step === 3) {
      if (!formData.date || !formData.startTime) {
        setErrorNotice('Mohon pilih tanggal dan jam yang tersedia');
        return;
      }
    } else if (step === 4) {
      if (!formData.clientName.trim()) {
        setErrorNotice('Nama pemesan wajib diisi');
        return;
      }
      if (!formData.clientPhone.trim()) {
        setErrorNotice('Nomor WhatsApp wajib diisi');
        return;
      }
      if (formData.clientPhone.replace(/\D/g, '').length < 8) {
        setErrorNotice('Nomor WhatsApp tidak valid');
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrorNotice(null);
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorNotice(null);

    try {
      const payload = {
        service_id: formData.serviceId,
        makeup_type: formData.makeupType,
        custom_request: formData.customRequest,
        service_location: formData.location,
        address: formData.location === 'home' ? formData.address : initialSettings.studio_address,
        address_benchmark: formData.addressBenchmark,
        transport_fee: formData.location === 'home' ? formData.transportFee : 0,
        date: formData.date,
        start_time: formData.startTime,
        duration_minutes: formData.durationMinutes,
        client_name: formData.clientName,
        client_phone: formData.clientPhone,
        notes: formData.notes,
        source: formData.source,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorNotice(data.error || 'Terjadi kesalahan saat memproses booking');
        setIsSubmitting(false);
        return;
      }

      // Redirect ke halaman token status booking
      router.push(data.redirect_url || `/booking/${data.token}`);
    } catch {
      setErrorNotice('Gagal terhubung ke server. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  const stepsLabels = ['Layanan', 'Lokasi', 'Jadwal', 'Data Diri', 'Ringkasan'];

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-28">
      {/* Visual Stepper Tracker */}
      <div className="mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-[#EBDCD5] -z-1" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#C97A7E] -z-1 transition-all duration-300"
            style={{ width: `${((step - 1) / (stepsLabels.length - 1)) * 100}%` }}
          />

          {stepsLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;

            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#C97A7E] text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#FAEDF0] border-2 border-[#C97A7E] text-[#8C4247]'
                      : 'bg-white border border-[#EBDCD5] text-[#9C8E8F]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span
                  className={`text-[9px] mt-1 tracking-tight font-medium ${
                    isCurrent ? 'text-[#8C4247] font-bold' : 'text-[#9C8E8F]'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorNotice && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>{errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Dynamic Step Component */}
      <div className="transition-all duration-200">
        {step === 1 && (
          <StepService
            services={initialServices}
            selectedServiceId={formData.serviceId}
            makeupType={formData.makeupType}
            customRequest={formData.customRequest}
            onSelectService={(srv) => {
              setFormData((prev) => ({
                ...prev,
                serviceId: srv.id,
                makeupType: srv.name,
                servicePrice: srv.price,
                durationMinutes: srv.duration_minutes,
              }));
            }}
            onCustomRequestChange={(val) => {
              setFormData((prev) => ({ ...prev, customRequest: val }));
            }}
          />
        )}

        {step === 2 && (
          <StepLocation
            location={formData.location}
            address={formData.address}
            addressBenchmark={formData.addressBenchmark}
            studioAddress={initialSettings.studio_address || 'Jl. Melati Indah No. 18, Jakarta Selatan'}
            transportZones={transportZones}
            selectedZone={formData.selectedZone}
            transportFee={formData.transportFee}
            onLocationChange={(loc) => {
              setFormData((prev) => ({
                ...prev,
                location: loc,
                transportFee: loc === 'studio' ? 0 : (transportZones[0]?.fee || 50000),
              }));
            }}
            onAddressChange={(val) => setFormData((prev) => ({ ...prev, address: val }))}
            onBenchmarkChange={(val) => setFormData((prev) => ({ ...prev, addressBenchmark: val }))}
            onZoneSelect={(z) =>
              setFormData((prev) => ({
                ...prev,
                selectedZone: z.zone,
                transportFee: z.fee,
              }))
            }
          />
        )}

        {step === 3 && (
          <StepSchedule
            selectedDate={formData.date}
            selectedTime={formData.startTime}
            durationMinutes={formData.durationMinutes}
            location={formData.location}
            onDateChange={(d) => setFormData((prev) => ({ ...prev, date: d }))}
            onTimeChange={(t) => setFormData((prev) => ({ ...prev, startTime: t }))}
          />
        )}

        {step === 4 && (
          <StepCustomer
            name={formData.clientName}
            phone={formData.clientPhone}
            notes={formData.notes}
            source={formData.source}
            onNameChange={(val) => setFormData((prev) => ({ ...prev, clientName: val }))}
            onPhoneChange={(val) => setFormData((prev) => ({ ...prev, clientPhone: val }))}
            onNotesChange={(val) => setFormData((prev) => ({ ...prev, notes: val }))}
            onSourceChange={(val) => setFormData((prev) => ({ ...prev, source: val }))}
          />
        )}

        {step === 5 && (
          <StepSummary
            makeupType={formData.makeupType}
            customRequest={formData.customRequest}
            durationMinutes={formData.durationMinutes}
            servicePrice={formData.servicePrice}
            serviceLocation={formData.location}
            address={formData.location === 'home' ? formData.address : initialSettings.studio_address}
            addressBenchmark={formData.addressBenchmark}
            transportFee={formData.location === 'home' ? formData.transportFee : 0}
            date={formData.date}
            startTime={formData.startTime}
            clientName={formData.clientName}
            clientPhone={formData.clientPhone}
            cancellationPolicy={initialSettings.cancellation_policy}
            dpPercentage={parseInt(initialSettings.dp_percentage || '30', 10)}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Floating Bottom Sticky Navigation Bar */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EBDCD5] p-3 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="py-3 px-4 rounded-xl border border-[#EBDCD5] text-xs font-semibold text-[#635354] hover:bg-[#FDFBF7] flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="py-3 px-6 rounded-xl bg-[#C97A7E] hover:bg-[#B5676B] text-white text-xs font-semibold flex items-center gap-1 shadow-md hover:shadow-lg transition-all ml-auto"
            >
              <span>Lanjutkan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
