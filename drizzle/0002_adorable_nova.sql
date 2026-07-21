ALTER TABLE "appointments" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "delete_reason" text;--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_no_overlap";--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_overlap" EXCLUDE USING gist (
  tstzrange("starts_at", "ends_at") WITH &&
) WHERE ("status" <> 'cancelled' AND "deleted_at" IS NULL);