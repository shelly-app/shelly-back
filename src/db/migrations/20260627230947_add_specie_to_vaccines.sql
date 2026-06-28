ALTER TABLE "vaccines" ADD COLUMN "specie" "specie" DEFAULT 'dog' NOT NULL;--> statement-breakpoint
ALTER TABLE "vaccines" ALTER COLUMN "specie" DROP DEFAULT;