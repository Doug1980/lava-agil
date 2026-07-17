import { z } from 'zod';
import { toggleItemCompleted } from '@/server/db/queries/appointments';
import { fail, handleError, json } from '@/lib/api';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { itemId } = z
      .object({ id: z.uuid(), itemId: z.uuid() })
      .parse(await params);

    const { completed } = z.object({ completed: z.boolean() }).parse(await request.json());

    const row = await toggleItemCompleted(itemId, completed);
    if (!row) return fail('NOT_FOUND', 'Item não encontrado.', 404);

    return json({ id: row.id, completed: row.completedAt !== null });
  } catch (err) {
    return handleError(err);
  }
}