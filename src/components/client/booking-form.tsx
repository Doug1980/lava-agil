'use client';

import { TZDate } from '@date-fns/tz';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { BookingConfirmDialog } from '@/components/client/booking-confirm-dialog';
import { TIMEZONE } from '@/lib/constants';
import { maskPhone, maskPlate, unmaskDigits } from '@/lib/format';
import type { CreateAppointmentInput } from '@/lib/schemas/appointment';
import { type BookingFormValues, bookingFormSchema } from '@/lib/schemas/booking-form';
import { cn } from '@/lib/utils';
import type { ApiError, Appointment, VehicleSize } from '@/types/api';

/**
 * Rede local: o tratamento de 409/422 depende de ler o corpo `ApiError`.
 * Quando o api-client centralizar isso, este helper migra pra lá.
 */
class BookingError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new BookingError(body?.error ?? 'UNKNOWN', body?.message ?? 'Falha ao agendar.');
  }

  return res.json() as Promise<Appointment>;
}

/** Compõe o startsAt no fuso do estabelecimento. 14:00 em SP vira 17:00Z. ADR-007. */
function composeStartsAt(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new TZDate(year, month - 1, day, hour, minute, TIMEZONE).toISOString();
}

type Props = {
  vehicleSize: VehicleSize;
  serviceVariantIds: string[];
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  priceCents: number;
  durationMinutes: number;
  items: { name: string; durationMinutes: number; priceCents: number }[];
  onBooked: (appointment: Appointment) => void;
  onSlotTaken?: () => void;
};

const inputClass = cn(
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'aria-[invalid=true]:border-destructive',
);

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function BookingForm({
  vehicleSize,
  serviceVariantIds,
  date,
  time,
  priceCents,
  durationMinutes,
  items,
  onBooked,
  onSlotTaken,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customer: { name: '', phone: '', email: '' },
      vehicle: { plate: '', model: '' },
    },
  });

  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: BookingFormValues) =>
      createAppointment({
        customer: {
          name: values.customer.name,
          phone: values.customer.phone,
          email: values.customer.email,
        },
        vehicle: { ...values.vehicle, size: vehicleSize },
        startsAt: composeStartsAt(date, time),
        serviceVariantIds,
      }),
    onSuccess: onBooked,
    onError: (err) => {
      if (err instanceof BookingError && err.code === 'SLOT_TAKEN') {
        toast.error('Esse horário acabou de ser reservado. Escolha outro.');
        onSlotTaken?.();
        return;
      }
      if (err instanceof BookingError && err.code === 'SIZE_MISMATCH') {
        toast.error('A seleção não corresponde ao porte do veículo. Refaça a escolha.');
        return;
      }
      toast.error(
        err instanceof BookingError ? err.message : 'Não foi possível concluir o agendamento.',
      );
    },
    onSettled: () => setConfirmOpen(false),
  });

  // Submeter valida o formulário e abre o modal de confirmação.
  const onSubmit = form.handleSubmit(() => setConfirmOpen(true));

  function handleConfirm() {
    mutation.mutate(form.getValues());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Nome *(obrigatório)" error={errors.customer?.name?.message}>
        <input
          {...form.register('customer.name')}
          className={inputClass}
          aria-invalid={!!errors.customer?.name}
          autoComplete="name"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone *(obrigatório)" error={errors.customer?.phone?.message}>
          <Controller
            control={form.control}
            name="customer.phone"
            render={({ field }) => (
              <input
                {...field}
                value={maskPhone(field.value ?? '')}
                onChange={(e) => field.onChange(unmaskDigits(e.target.value))}
                className={inputClass}
                aria-invalid={!!errors.customer?.phone}
                inputMode="numeric"
                placeholder="(11) 98765-4321"
                autoComplete="tel"
              />
            )}
          />
        </Field>

        <Field label="E-mail *(obrigatório)" error={errors.customer?.email?.message}>
          <input
            {...form.register('customer.email')}
            className={inputClass}
            aria-invalid={!!errors.customer?.email}
            inputMode="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Placa *(obrigatório)" error={errors.vehicle?.plate?.message}>
          <Controller
            control={form.control}
            name="vehicle.plate"
            render={({ field }) => (
              <input
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskPlate(e.target.value))}
                className={cn(inputClass, 'uppercase')}
                aria-invalid={!!errors.vehicle?.plate}
                placeholder="ABC1D23"
                inputMode="text"
                autoCapitalize="characters"
              />
            )}
          />
        </Field>

        <Field label="Modelo *(obrigatório)" error={errors.vehicle?.model?.message}>
          <input
            {...form.register('vehicle.model')}
            className={cn(inputClass, 'uppercase')}
            aria-invalid={!!errors.vehicle?.model}
            placeholder="Fiat Argo"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5',
          'text-sm font-medium text-primary-foreground transition-colors',
          'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-60',
        )}
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {mutation.isPending ? 'Agendando...' : 'Confirmar agendamento'}
      </button>

      <BookingConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        vehicleSize={vehicleSize}
        items={items}
        date={date}
        time={time}
        totalMinutes={durationMinutes}
        totalCents={priceCents}
        pending={mutation.isPending}
        onConfirm={handleConfirm}
      />
    </form>
  );
}
