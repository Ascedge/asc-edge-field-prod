SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
SET default_tablespace = '';
SET default_table_access_method = "heap";
CREATE TABLE IF NOT EXISTS "public"."passport_lookups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "raw_address" "text" NOT NULL,
    "normalized_address" "text",
    "matched" boolean DEFAULT false NOT NULL,
    "matched_property_id" "uuid",
    "source" "text",
    "lead_name" "text",
    "lead_phone" "text",
    "cta_clicked" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."passport_lookups" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "storage_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "text" DEFAULT 'gary'::"text" NOT NULL,
    "phase" "text"
);
ALTER TABLE "public"."photos" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "address" "text" NOT NULL,
    "normalized_address" "text" NOT NULL,
    "lat" double precision,
    "lng" double precision,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "text" DEFAULT 'gary'::"text" NOT NULL,
    "claim_status" "text" DEFAULT 'unclaimed'::"text" NOT NULL,
    "replacement_score" numeric,
    "listing_risk_score" numeric,
    "roof_age" integer,
    "roof_type" "text",
    "year_built" integer,
    "neighborhood" "text",
    "field_score" numeric,
    "field_note" "text",
    "observations" "text"[] DEFAULT '{}'::"text"[]
);
ALTER TABLE "public"."properties" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."qr_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "text" DEFAULT 'gary'::"text" NOT NULL
);
ALTER TABLE "public"."qr_scans" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."report_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "tenant_id" "text" DEFAULT 'gary'::"text" NOT NULL,
    "event_type" "text" NOT NULL,
    "slide_index" integer,
    "cta" "text",
    "variant" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "report_events_cta_check" CHECK (("cta" = ANY (ARRAY['advance'::"text", 'decline'::"text"]))),
    CONSTRAINT "report_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['slide_view'::"text", 'slide_cta'::"text", 'report_open'::"text", 'baseline_view'::"text"])))
);
ALTER TABLE "public"."report_events" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "rep_id" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "homeowner_gender" "text",
    "receptivity" smallint,
    "observations" "text"[],
    "private_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "text" DEFAULT 'gary'::"text" NOT NULL,
    "photos_collected" integer DEFAULT 0,
    "disposition" "text",
    "damage_indicators" "text"[] DEFAULT '{}'::"text"[],
    "notes_locked" boolean DEFAULT false NOT NULL,
    "notes_submitted_at" timestamp with time zone,
    "appointment_id" "text",
    CONSTRAINT "visits_disposition_check" CHECK ((("disposition" IS NULL) OR ("disposition" = ANY (ARRAY['booked_inspection'::"text", 'read_report_not_ready'::"text", 'callback'::"text", 'wants_info'::"text", 'not_interested'::"text", 'not_home'::"text", 'hostile'::"text"]))))
);
ALTER TABLE "public"."visits" OWNER TO "postgres";
ALTER TABLE ONLY "public"."passport_lookups"
    ADD CONSTRAINT "passport_lookups_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_normalized_address_key" UNIQUE ("normalized_address");
ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."qr_scans"
    ADD CONSTRAINT "qr_scans_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."report_events"
    ADD CONSTRAINT "report_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_pkey" PRIMARY KEY ("id");
CREATE INDEX "passport_lookups_created_idx" ON "public"."passport_lookups" USING "btree" ("created_at" DESC);
CREATE INDEX "report_events_property_idx" ON "public"."report_events" USING "btree" ("property_id");
CREATE INDEX "report_events_type_time_idx" ON "public"."report_events" USING "btree" ("event_type", "created_at");
CREATE INDEX "report_events_visit_idx" ON "public"."report_events" USING "btree" ("visit_id");
ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");
ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id");
ALTER TABLE ONLY "public"."qr_scans"
    ADD CONSTRAINT "qr_scans_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");
ALTER TABLE ONLY "public"."report_events"
    ADD CONSTRAINT "report_events_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");
ALTER TABLE ONLY "public"."report_events"
    ADD CONSTRAINT "report_events_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id");
ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");
ALTER TABLE "public"."passport_lookups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."qr_scans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."report_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."visits" ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON TABLE "public"."passport_lookups" TO "anon";
GRANT ALL ON TABLE "public"."passport_lookups" TO "authenticated";
GRANT ALL ON TABLE "public"."passport_lookups" TO "service_role";
GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";
GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";
GRANT ALL ON TABLE "public"."qr_scans" TO "anon";
GRANT ALL ON TABLE "public"."qr_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_scans" TO "service_role";
GRANT ALL ON TABLE "public"."report_events" TO "anon";
GRANT ALL ON TABLE "public"."report_events" TO "authenticated";
GRANT ALL ON TABLE "public"."report_events" TO "service_role";
GRANT ALL ON TABLE "public"."visits" TO "anon";
GRANT ALL ON TABLE "public"."visits" TO "authenticated";
GRANT ALL ON TABLE "public"."visits" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
