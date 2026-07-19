import { z } from 'zod';
import { handleError, json } from '@/lib/api';
import { findAppointmentsByCodes } from '@/server/db/queries/appointments';
import { toPublicAppointment } from '@/server/services/mapper';

const querySchema = z.object({ codes: z.string().min(1) });

/** Aceita "la-abc123", "ABC123" ou "LA-ABC123" e normaliza para "LA-ABC123". */
function normalizeCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  const body = cleaned.startsWith('LA-') ? cleaned.slice(3) : cleaned;
  return body ? `LA-${body}` : '';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { codes } = querySchema.parse({ codes: searchParams.get('codes') });

    const list = Array.from(
      new Set(
        codes
          .split(',')
          .map(normalizeCode)
          .filter((c) => c.length > 3),
      ),
    ).slice(0, 50);

    const rows = await findAppointmentsByCodes(list);
    return json(rows.map(toPublicAppointment));
  } catch (err) {
    return handleError(err);
  }
}
