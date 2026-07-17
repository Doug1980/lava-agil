import { availabilityQuerySchema } from '@/lib/schemas/appointment';
import { findActiveBookings } from '@/server/db/queries/appointments';
import { getDayAvailability } from '@/server/services/availability';
import { handleError, json } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { date, durationMinutes } = availabilityQuerySchema.parse({
      date: searchParams.get('date'),
      durationMinutes: searchParams.get('durationMinutes'),
    });

    const bookings = await findActiveBookings(date);

    return json(
      getDayAvailability({ date, durationMinutes, bookings, now: new Date() }),
    );
  } catch (err) {
    return handleError(err);
  }
}