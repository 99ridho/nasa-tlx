CREATE TYPE "public"."collection_mode" AS ENUM('weighted', 'raw_only');--> statement-breakpoint
CREATE TYPE "public"."phase_order" AS ENUM('comparisons_first', 'ratings_first');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."subscale_code" AS ENUM('MD', 'PD', 'TD', 'OP', 'EF', 'FR');--> statement-breakpoint
CREATE TABLE "pairwise_comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"pair_index" smallint NOT NULL,
	"subscale_a" "subscale_code" NOT NULL,
	"subscale_b" "subscale_code" NOT NULL,
	"selected" "subscale_code" NOT NULL,
	"responded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pair_index_range" CHECK ("pairwise_comparisons"."pair_index" >= 0 AND "pairwise_comparisons"."pair_index" <= 14)
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"participant_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"task_label" text NOT NULL,
	"collection_mode" "collection_mode" NOT NULL,
	"phase_order" "phase_order" DEFAULT 'comparisons_first' NOT NULL,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL,
	"pair_order" jsonb NOT NULL,
	"subscale_order" jsonb NOT NULL,
	"side_order" jsonb NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"task_label" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscale_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"subscale" "subscale_code" NOT NULL,
	"raw_value" smallint NOT NULL,
	"slider_position" numeric(5, 2) NOT NULL,
	"responded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "raw_value_range" CHECK ("subscale_ratings"."raw_value" >= 0 AND "subscale_ratings"."raw_value" <= 100)
);
--> statement-breakpoint
CREATE TABLE "tlx_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"weight_md" smallint NOT NULL,
	"weight_pd" smallint NOT NULL,
	"weight_td" smallint NOT NULL,
	"weight_op" smallint NOT NULL,
	"weight_ef" smallint NOT NULL,
	"weight_fr" smallint NOT NULL,
	"weighted_tlx" numeric(6, 2),
	"raw_tlx" numeric(6, 2) NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tlx_scores_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "pairwise_comparisons" ADD CONSTRAINT "pairwise_comparisons_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscale_ratings" ADD CONSTRAINT "subscale_ratings_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tlx_scores" ADD CONSTRAINT "tlx_scores_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pairwise_session_pair_unique" ON "pairwise_comparisons" USING btree ("session_id","pair_index");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_study_code_unique" ON "participants" USING btree ("study_id","participant_code");--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_session_subscale_unique" ON "subscale_ratings" USING btree ("session_id","subscale");