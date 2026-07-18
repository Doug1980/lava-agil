import type { z } from 'zod';
import { createAppointmentSchema } from './appointment';

/**
 * O que o formulário coleta de fato: dados do cliente e do veículo.
 * Porte, data, horário e serviços vêm do estado da página, não de inputs.
 * Reusa as regras do servidor via pick/omit, então front e back não divergem.
 */
export const bookingFormSchema = createAppointmentSchema.pick({ customer: true }).extend({
  vehicle: createAppointmentSchema.shape.vehicle.omit({ size: true }),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;