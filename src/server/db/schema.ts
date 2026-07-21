import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const serviceKindEnum = pgEnum('service_kind', ['base', 'addon']);

export const vehicleSizeEnum = pgEnum('vehicle_size', ['hatch', 'sedan', 'suv']);

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
]);

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  kind: serviceKindEnum('kind').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const serviceVariants = pgTable(
  'service_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    vehicleSize: vehicleSizeEnum('vehicle_size').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    priceCents: integer('price_cents').notNull(),
  },
  (t) => [unique('service_variants_service_size_uq').on(t.serviceId, t.vehicleSize)],
);

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerEmail: text('customer_email'),
    vehiclePlate: text('vehicle_plate').notNull(),
    vehicleModel: text('vehicle_model').notNull(),
    vehicleSize: vehicleSizeEnum('vehicle_size').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    serviceMinutes: integer('service_minutes').notNull(),
    totalPriceCents: integer('total_price_cents').notNull(),
    status: appointmentStatusEnum('status').notNull().default('scheduled'),
    notes: text('notes'),
    // Motivo do cancelamento (preenchido pelo admin ao cancelar).
    cancelReason: text('cancel_reason'),
    // Soft-delete: quando preenchido, o registro some das listas mas continua no banco.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deleteReason: text('delete_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('appointments_starts_at_idx').on(t.startsAt)],
);

export const appointmentItems = pgTable('appointment_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id')
    .notNull()
    .references(() => appointments.id, { onDelete: 'cascade' }),
  serviceVariantId: uuid('service_variant_id').references(() => serviceVariants.id, {
    onDelete: 'set null',
  }),
  serviceNameSnap: text('service_name_snap').notNull(),
  kindSnap: serviceKindEnum('kind_snap').notNull(),
  durationSnap: integer('duration_snap').notNull(),
  priceSnap: integer('price_snap').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const servicesRelations = relations(services, ({ many }) => ({
  variants: many(serviceVariants),
}));

export const serviceVariantsRelations = relations(serviceVariants, ({ one }) => ({
  service: one(services, {
    fields: [serviceVariants.serviceId],
    references: [services.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ many }) => ({
  items: many(appointmentItems),
}));

export const appointmentItemsRelations = relations(appointmentItems, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentItems.appointmentId],
    references: [appointments.id],
  }),
  variant: one(serviceVariants, {
    fields: [appointmentItems.serviceVariantId],
    references: [serviceVariants.id],
  }),
}));
