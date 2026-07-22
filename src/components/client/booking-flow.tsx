'use client';

import { Check, Clock, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { BookingForm } from '@/components/client/booking-form';
import { BookingSuccessDialog } from '@/components/client/booking-success-dialog';
import { BookingPanel } from '@/components/client/booking-panel';
import { DatePicker } from '@/components/client/date-picker';
import { AddonPicker, BaseServicePicker } from '@/components/client/service-picker';
import { VehicleSizePicker } from '@/components/client/vehicle-size-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailability, useCatalog } from '@/hooks/use-availability';
import { useBookingCart } from '@/hooks/use-booking-cart';
import { useMyBookings } from '@/hooks/use-my-bookings';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types/api';

function Step({
  n,
  title,
  children,
  className,
}: {
  n: number;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
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
    setDate(null);
    setBooked(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const canBook =
    cart.vehicleSize !== null && cart.isValid && date !== null && selectedTime !== null;

  const steps = [
    { label: 'Veículo', done: cart.vehicleSize !== null },
    { label: 'Serviço', done: cart.isValid },
    { label: 'Adicionais', done: cart.addonsResolved },
    { label: 'Data', done: date !== null },
    { label: 'Horário', done: selectedTime !== null },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-8 text-center"
        style={{ backgroundImage: 'linear-gradient(135deg, #0e2148, #1e5fd6)' }}
      >
        <span aria-hidden className="pointer-events-none absolute -left-8 -top-8 size-32 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute right-6 top-4 size-16 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute right-24 top-24 size-8 rounded-full bg-white/10" />
        <span className="relative inline-flex rounded-3xl bg-white p-4 shadow-xl shadow-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="LavaÁgil" className="h-32 w-auto sm:h-40" />
        </span>
        <h1 className="relative mt-5 text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
          Agende sua lavagem
        </h1>
        <p className="relative mt-1 text-sm text-blue-100">
          Monte seu atendimento e veja os horários na hora.
        </p>
      </section>

      <div className="my-6 flex items-center justify-center gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const active = i === currentStep;
          return (
            <div key={step.label} className="flex items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    step.done && 'bg-primary text-primary-foreground',
                    active && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !step.done && !active && 'bg-secondary text-muted-foreground',
                  )}
                >
                  {step.done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium sm:text-xs',
                    step.done || active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    'mb-4 h-0.5 w-6 rounded sm:w-12',
                    step.done ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-8">
          <Step n={1} title="Porte do veículo">
            <VehicleSizePicker value={cart.vehicleSize} onChange={cart.setVehicleSize} />
          </Step>

          {cart.vehicleSize && (
            <Step n={2} title="Serviço" className="animate-rise">
              {catalog.isLoading || !catalog.data ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <BaseServicePicker
                  services={catalog.data.base}
                  selected={cart.base}
                  onSelect={cart.setBase}
                />
              )}
            </Step>
          )}

          {cart.isValid && catalog.data && (
            <Step n={3} title="Adicionais" className="animate-rise">
              <AddonPicker
                services={catalog.data.addons}
                isSelected={cart.isAddonSelected}
                onToggle={cart.toggleAddon}
                noAddonsSelected={cart.noAddons}
                onChooseNoAddons={cart.chooseNoAddons}
              />
            </Step>
          )}

          {cart.addonsResolved && (
            <Step n={4} title="Data" className="animate-rise">
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
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              5
            </span>
            Seus dados
          </h2>
          <BookingForm
            vehicleSize={cart.vehicleSize}
            serviceVariantIds={cart.variantIds}
            date={date}
            time={selectedTime}
            priceCents={cart.totals.priceCents}
            durationMinutes={cart.totals.durationMinutes}
            items={cart.items.map((i) => ({
              name: i.name,
              durationMinutes: i.durationMinutes,
              priceCents: i.priceCents,
            }))}
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

      <BookingSuccessDialog
        open={booked !== null}
        onOpenChange={(o) => {
          if (!o) handleReset();
        }}
        code={booked?.code ?? ''}
        email={booked?.customer.email ?? null}
        onNewBooking={handleReset}
      />
    </main>
  );
}
