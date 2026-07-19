'use client';

import { Clock, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { BookingConfirmation } from '@/components/client/booking-confirmation';
import { BookingForm } from '@/components/client/booking-form';
import { BookingPanel } from '@/components/client/booking-panel';
import { DatePicker } from '@/components/client/date-picker';
import { AddonPicker, BaseServicePicker } from '@/components/client/service-picker';
import { VehicleSizePicker } from '@/components/client/vehicle-size-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailability, useCatalog } from '@/hooks/use-availability';
import { useBookingCart } from '@/hooks/use-booking-cart';
import { useMyBookings } from '@/hooks/use-my-bookings';
import { formatCurrency, formatDuration } from '@/lib/format';
import type { Appointment } from '@/types/api';

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function BookingFlow() {
  const cart = useBookingCart();
  const { addCode } = useMyBookings();
  const [date, setDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<Appointment | null>(null);

  function handleBooked(appointment: Appointment) {
    addCode(appointment.code);
    setBooked(appointment);
  }

  const catalog = useCatalog(cart.vehicleSize);
  const availability = useAvailability(date, cart.totals.durationMinutes);

  // Se o horário escolhido deixa de caber (adicionou serviço, ou alguém reservou),
  // limpa a seleção assim que a nova grade chega.
  useEffect(() => {
    if (!selectedTime || !availability.data) return;
    const stillFree = availability.data.slots.some(
      (slot) => slot.time === selectedTime && slot.available,
    );
    if (!stillFree) setSelectedTime(null);
  }, [availability.data, selectedTime]);

  function handleReset() {
    cart.clear();
    setSelectedTime(null);
    setBooked(null);
  }

  if (booked) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <BookingConfirmation appointment={booked} onReset={handleReset} />
      </main>
    );
  }

  const canBook =
    cart.vehicleSize !== null && cart.isValid && date !== null && selectedTime !== null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">LavaÁgil</h1>
        <p className="text-sm text-muted-foreground">Seu carro limpo na hora certa.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-8">
          <Step n={1} title="Porte do veículo">
            <VehicleSizePicker value={cart.vehicleSize} onChange={cart.setVehicleSize} />
          </Step>

          {cart.vehicleSize && (
            <Step n={2} title="Serviços">
              {catalog.isLoading || !catalog.data ? (
                <div className="grid gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <BaseServicePicker
                    services={catalog.data.base}
                    selected={cart.base}
                    onSelect={cart.setBase}
                  />
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Adicionais</h3>
                    <AddonPicker
                      services={catalog.data.addons}
                      isSelected={cart.isAddonSelected}
                      onToggle={cart.toggleAddon}
                    />
                  </div>
                </div>
              )}
            </Step>
          )}

          {cart.isValid && (
            <Step n={3} title="Data">
              <DatePicker
                value={date}
                onChange={(next) => {
                  setDate(next);
                  setSelectedTime(null);
                }}
              />
            </Step>
          )}
        </div>

        <BookingPanel
          items={cart.items}
          durationMinutes={cart.totals.durationMinutes}
          priceCents={cart.totals.priceCents}
          hasDate={date !== null}
          availability={availability.data}
          isLoadingSlots={availability.isLoading}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
          canContinue={canBook}
          onContinue={() => scrollTo('seus-dados')}
        />
      </div>

      {canBook && cart.vehicleSize && date && selectedTime && (
        <section id="seus-dados" className="mt-10 max-w-2xl scroll-mt-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              4
            </span>
            Seus dados
          </h2>
          <BookingForm
            vehicleSize={cart.vehicleSize}
            serviceVariantIds={cart.variantIds}
            date={date}
            time={selectedTime}
            onBooked={handleBooked}
            onSlotTaken={() => {
              setSelectedTime(null);
              availability.refetch();
            }}
          />
        </section>
      )}

      {cart.items.length > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="size-4 text-muted-foreground" aria-hidden />
                {formatDuration(cart.totals.durationMinutes)}
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                <Wallet className="size-4 text-muted-foreground" aria-hidden />
                {formatCurrency(cart.totals.priceCents)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => scrollTo(canBook ? 'seus-dados' : 'horarios')}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              {canBook ? 'Seus dados' : 'Ver horários'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
