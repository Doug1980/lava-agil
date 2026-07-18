import { TZDate } from '@date-fns/tz';
import { customAlphabet } from 'nanoid';
import { TIMEZONE } from '@/lib/constants';
import type { CreateAppointmentInput } from '@/lib/schemas/appointment';
import { getDb } from '@/server/db';
import { findActiveBookings } from '@/server/db/queries/appointments';
import { findVariants } from '@/server/db/queries/services';
import { appointmentItems, appointments } from '@/server/db/schema';
import { assertBookable, computeEndsAt } from './availability';
import { BusinessRuleError } from './errors';
import { assertValidSelection, calculateTotals } from './pricing';

const generateCode = customAlphabet('0123456789', 4);

function dateKey(d: Date): string {
  const zoned = new TZDate(d, TIMEZONE);
  const y = zoned.getFullYear();
  const m = String(zoned.getMonth() + 1).padStart(2, '0');
  const day = String(zoned.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function createAppointment(input: CreateAppointmentInput) {
  const db = getDb();
  const startsAt = new Date(input.startsAt);

  const items = await findVariants(input.serviceVariantIds);

  if (items.length !== input.serviceVariantIds.length) {
    throw new BusinessRuleError('UNKNOWN_SERVICE', 'Algum serviço selecionado não existe.');
  }

  if (items.some((i) => !i.active)) {
    throw new BusinessRuleError('INACTIVE_SERVICE', 'Algum serviço não está mais disponível.');
  }

  if (items.some((i) => i.vehicleSize !== input.vehicle.size)) {
    throw new BusinessRuleError(
      'SIZE_MISMATCH',
      'Os serviços não correspondem ao porte do veículo.',
    );
  }

  assertValidSelection(items);

  const { serviceMinutes, totalPriceCents } = calculateTotals(items);
  const date = dateKey(startsAt);
  const bookings = await findActiveBookings(date);

  assertBookable({
    date,
    durationMinutes: serviceMinutes,
    bookings,
    now: new Date(),
    startsAt,
  });

  const endsAt = computeEndsAt(startsAt, serviceMinutes);

  const [appointment] = await db
    .insert(appointments)
    .values({
      code: `LA-${generateCode()}`,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      customerEmail: input.customer.email || null,
      vehiclePlate: input.vehicle.plate,
      vehicleModel: input.vehicle.model,
      vehicleSize: input.vehicle.size,
      startsAt,
      endsAt,
      serviceMinutes,
      totalPriceCents,
    })
    .returning();

  const insertedItems = await db
    .insert(appointmentItems)
    .values(
      items.map((item) => ({
        appointmentId: appointment.id,
        serviceVariantId: item.variantId,
        serviceNameSnap: item.serviceName,
        kindSnap: item.kind,
        durationSnap: item.durationMinutes,
        priceSnap: item.priceCents,
      })),
    )
    .returning();

  return { ...appointment, items: insertedItems };
}
