'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useBookingCart } from '@/hooks/use-booking-cart';
import { useAvailability, useCatalog } from '@/hooks/use-availability';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleSizePicker } from '@/components/client/vehicle-size-picker';
import { BaseServicePicker, AddonPicker } from '@/components/client/service-picker';
import { CartSummary } from '@/components/client/cart-summary';
import { DatePicker } from '@/components/client/date-picker';
import { SlotGrid } from '@/components/client/slot-grid';
import { BookingForm } from '@/components/client/booking-form';
import { BookingConfirmation } from '@/components/client/booking-confirmation';
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

export default function BookingPage() {
  const cart = useBookingCart();
  const [date, setDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<Appointment | null>(null);

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">LavaÁgil</h1>
        <p className="text-sm text-muted-foreground">Seu carro limpo na hora certa.</p>
      </header>

      <div className="space-y-8 pb-4">
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

        {cart.isValid && date && (
          <Step n={4} title="Horário">
            <SlotGrid
              data={availability.data}
              isLoading={availability.isLoading}
              selected={selectedTime}
              onSelect={setSelectedTime}
            />
          </Step>
        )}

        {canBook && cart.vehicleSize && date && selectedTime && (
          <Step n={5} title="Seus dados">
            <BookingForm
              vehicleSize={cart.vehicleSize}
              serviceVariantIds={cart.variantIds}
              date={date}
              time={selectedTime}
              onBooked={setBooked}
              onSlotTaken={() => {
                setSelectedTime(null);
                availability.refetch();
              }}
            />
          </Step>
        )}
      </div>

      <CartSummary
        items={cart.items}
        durationMinutes={cart.totals.durationMinutes}
        priceCents={cart.totals.priceCents}
      />
    </main>
  );
}