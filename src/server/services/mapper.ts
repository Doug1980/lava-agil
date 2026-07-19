import { STATUS_LABELS } from '@/lib/constants';

type ItemRow = {
  id: string;
  serviceNameSnap: string;
  kindSnap: 'base' | 'addon';
  durationSnap: number;
  priceSnap: number;
  completedAt: Date | null;
};

type AppointmentRow = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleSize: string;
  startsAt: Date;
  endsAt: Date;
  serviceMinutes: number;
  totalPriceCents: number;
  status: keyof typeof STATUS_LABELS;
  notes: string | null;
  createdAt: Date;
  items?: ItemRow[];
};

/**
 * Versão pública, consultável por código sem autenticação. Devolve só o que o
 * próprio cliente precisa para acompanhar — nunca telefone, placa ou e-mail.
 */
export function toPublicAppointment(row: AppointmentRow) {
  return {
    code: row.code,
    customerName: row.customerName,
    vehicleModel: row.vehicleModel,
    vehicleSize: row.vehicleSize,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    serviceMinutes: row.serviceMinutes,
    totalPriceCents: row.totalPriceCents,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    items: (row.items ?? []).map((i) => ({
      name: i.serviceNameSnap,
      kind: i.kindSnap,
      durationMinutes: i.durationSnap,
      priceCents: i.priceSnap,
    })),
  };
}

export function toAppointmentResponse(row: AppointmentRow) {
  return {
    id: row.id,
    code: row.code,
    customer: {
      name: row.customerName,
      phone: row.customerPhone,
      email: row.customerEmail,
    },
    vehicle: {
      plate: row.vehiclePlate,
      model: row.vehicleModel,
      size: row.vehicleSize,
    },
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    serviceMinutes: row.serviceMinutes,
    totalPriceCents: row.totalPriceCents,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    items: (row.items ?? []).map((i) => ({
      id: i.id,
      name: i.serviceNameSnap,
      kind: i.kindSnap,
      durationMinutes: i.durationSnap,
      priceCents: i.priceSnap,
      completed: Boolean(i.completedAt),
    })),
  };
}
