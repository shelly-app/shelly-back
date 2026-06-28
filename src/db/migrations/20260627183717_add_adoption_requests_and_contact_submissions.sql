CREATE TYPE "public"."adoption_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('shelter', 'sponsor');--> statement-breakpoint
CREATE TABLE "adoption_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"pet_id" integer NOT NULL,
	"shelter_id" integer NOT NULL,
	"requester_name" varchar(255) NOT NULL,
	"requester_email" varchar(255) NOT NULL,
	"requester_phone" varchar(64),
	"status" "adoption_request_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"rejection_reason" text,
	"location" varchar(255),
	"family_composition" varchar(255),
	"has_yard" boolean,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "contact_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(64),
	"organization" varchar(255),
	"message" text NOT NULL,
	"shelter_name" varchar(255),
	"shelter_location" varchar(255),
	"shelter_type" varchar(255),
	"sponsorship_type" varchar(255),
	"budget" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_shelter_id_shelters_id_fk" FOREIGN KEY ("shelter_id") REFERENCES "public"."shelters"("id") ON DELETE cascade ON UPDATE no action;