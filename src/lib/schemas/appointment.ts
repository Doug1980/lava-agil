import { z } from 'zod';

export const vehicleSizeSchema = z.enum(['hatch', 'sedan', 'suv']);

export const appointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']);

/** Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23). */
const plateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/, 'Placa inválida');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10,11}$/, 'Telefone deve ter DDD e 8 ou 9 dígitos');

export const createAppointmentSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(3, 'Nome muito curto').max(120),
    phone: phoneSchema,
    email: z.email('Informe um e-mail válido para receber o comprovante'),
  }),
  vehicle: z.object({
    plate: plateSchema,
    model: z.string().trim().toUpperCase().min(2, 'Informe o modelo').max(60),
    size: vehicleSizeSchema,
  }),
  startsAt: z.iso.datetime({ offset: true }),
  serviceVariantIds: z.array(z.uuid()).min(1, 'Escolha ao menos um serviço').max(8),
});

export const availabilityQuerySchema = z.object({
  date: z.iso.date(),
  durationMinutes: z.coerce.number().int().min(5).max(600),
});

export const servicesQuerySchema = z.object({
  vehicleSize: vehicleSizeSchema,
});

export const updateStatusSchema = z
  .object({
    status: appointmentStatusSchema,
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.status !== 'cancelled' || Boolean(data.reason && data.reason.length > 0), {
    message: 'Informe o motivo do cancelamento.',
    path: ['reason'],
  });

export const deleteAppointmentSchema = z.object({
  reason: z.string().trim().min(1, 'Informe o motivo da exclusão.').max(500),
});

export const listAppointmentsQuerySchema = z.object({
  date: z.iso.date().optional(),
  status: appointmentStatusSchema.optional(),
  // Recorte de tempo: dia da data informada (padrão) ou o mês inteiro dela.
  period: z.enum(['day', 'month']).optional().default('day'),
  // Quando true, retorna a "lixeira" (só os excluídos).
  deleted: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type VehicleSize = z.infer<typeof vehicleSizeSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
