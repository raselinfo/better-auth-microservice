ALTER TABLE "oauth_access_token" DROP CONSTRAINT "oauth_access_token_refresh_id_oauth_refresh_token_id_fk";
--> statement-breakpoint
ALTER TABLE "oauth_access_token" DROP CONSTRAINT "oauth_access_token_session_id_session_id_fk";
--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" DROP CONSTRAINT "oauth_refresh_token_session_id_session_id_fk";
--> statement-breakpoint
ALTER TABLE "api_key" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "api_key" ALTER COLUMN "enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "scopes" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "scopes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "scopes" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "redirect_uris" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "redirect_uris" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "metadata" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "scopes" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "scopes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "scopes" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "scopes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN "permissions" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "permissions" text;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_token" DROP COLUMN "reference_id";--> statement-breakpoint
ALTER TABLE "oauth_access_token" DROP COLUMN "refresh_id";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "skip_consent";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "enable_end_session";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "uri";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "contacts";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "tos";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "policy";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "software_id";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "software_version";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "software_statement";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "post_logout_redirect_uris";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "token_endpoint_auth_method";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "grant_types";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "response_types";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "public";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP COLUMN "reference_id";--> statement-breakpoint
ALTER TABLE "oauth_consent" DROP COLUMN "reference_id";--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" DROP COLUMN "reference_id";--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" DROP COLUMN "revoked";--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_token_unique" UNIQUE("token");