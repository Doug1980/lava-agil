import { servicesQuerySchema } from '@/lib/schemas/appointment';
import { listCatalog } from '@/server/db/queries/services';
import { handleError, json } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { vehicleSize } = servicesQuerySchema.parse({
      vehicleSize: searchParams.get('vehicleSize'),
    });

    return json(await listCatalog(vehicleSize));
  } catch (err) {
    return handleError(err);
  }
}