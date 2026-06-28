CREATE TYPE "public"."event_type" AS ENUM('status_change', 'vaccination', 'user_event', 'name_change', 'size_change');--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_type" "event_type" DEFAULT 'user_event' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;