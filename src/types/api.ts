import type { AppointmentStatus, VehicleSize } from '@/lib/schemas/appointment';

export type { AppointmentStatus, VehicleSize };

export type ServiceKind = 'base' | 'addon';

export type CatalogEntry = {
  id: string;
  slug: string;
  name: string;
  kind: ServiceKind;
  description: string | null;
  sortOrder: number;
  variantId: string;
  durationMinutes: number;
  priceCents: number;
};

export type Catalog = {
  base: CatalogEntry[];
  addons: CatalogEntry[];
};

export type SlotReason = 'past' | 'closing' | 'occupied';

export type Slot = {
  time: string;
  available: boolean;
  reason?: SlotReason;
};

export type DayAvailability = {
  date: string;
  open: boolean;
  businessHours: { start: string; end: string } | null;
  slots: Slot[];
};

export type AppointmentItem = {
  id: string;
  name: string;
  kind: ServiceKind;
  durationMinutes: number;
  priceCents: number;
  completed: boolean;
};

export type Appointment = {
  id: string;
  code: string;
  customer: { name: string; phone: string; email: string | null };
  vehicle: { plate: string; model: string; size: VehicleSize };
  startsAt: string;
  endsAt: string;
  serviceMinutes: number;
  totalPriceCents: number;
  status: AppointmentStatus;
  statusLabel: string;
  notes: string | null;
  cancelReason: string | null;
  deletedAt: string | null;
  deleteReason: string | null;
  createdAt: string;
  items: AppointmentItem[];
};

/** Visão pública, consultável por código (sem telefone, placa ou e-mail). */
export type PublicAppointment = {
  code: string;
  customerName: string;
  vehicleModel: string;
  vehicleSize: VehicleSize;
  startsAt: string;
  endsAt: string;
  serviceMinutes: number;
  totalPriceCents: number;
  status: AppointmentStatus;
  statusLabel: string;
  items: Array<{
    name: string;
    kind: ServiceKind;
    durationMinutes: number;
    priceCents: number;
  }>;
};

export type ApiError = {
  error: string;
  message: string;
};
