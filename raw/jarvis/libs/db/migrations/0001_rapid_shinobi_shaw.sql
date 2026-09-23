CREATE TABLE "deep_wisdom_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"config" jsonb NOT NULL,
	"creation_time" timestamp with time zone DEFAULT now() NOT NULL,
	"update_time" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer NOT NULL,
	"file_url" text NOT NULL,
	"is_active" boolean NOT NULL,
	CONSTRAINT "deep_wisdom_models_model_name_unique" UNIQUE("model_name")
);
--> statement-breakpoint
CREATE TABLE "deep_wisdom_models_objects" (
	"object_name" varchar(255) NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"detection_order" integer NOT NULL,
	CONSTRAINT "deep_wisdom_models_objects_object_name_model_name_pk" PRIMARY KEY("object_name","model_name")
);
--> statement-breakpoint
CREATE TABLE "dexter_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"config" jsonb NOT NULL,
	"creation_time" timestamp with time zone DEFAULT now() NOT NULL,
	"update_time" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer NOT NULL,
	"file_url" text NOT NULL,
	"is_active" boolean NOT NULL,
	"embedder_id" integer NOT NULL,
	CONSTRAINT "dexter_models_model_name_unique" UNIQUE("model_name")
);
--> statement-breakpoint
CREATE TABLE "dexter_models_objects" (
	"object_name" varchar(255) NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"detection_order" integer NOT NULL,
	CONSTRAINT "dexter_models_objects_object_name_model_name_pk" PRIMARY KEY("object_name","model_name")
);
--> statement-breakpoint
CREATE TABLE "embedder_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"creation_time" timestamp with time zone DEFAULT now() NOT NULL,
	"update_time" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer NOT NULL,
	"file_url" text NOT NULL,
	"is_active" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geography" (
	"name" varchar(255) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "object_categories" (
	"english_name" varchar(255) PRIMARY KEY NOT NULL,
	"hebrew_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "object_categories_hebrew_name_unique" UNIQUE("hebrew_name")
);
--> statement-breakpoint
CREATE TABLE "objects" (
	"english_name" varchar(255) PRIMARY KEY NOT NULL,
	"hebrew_name" varchar(255) NOT NULL,
	"creation_time" timestamp with time zone DEFAULT now() NOT NULL,
	"update_time" timestamp with time zone DEFAULT now() NOT NULL,
	"create_user" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"is_active" boolean NOT NULL,
	CONSTRAINT "objects_hebrew_name_unique" UNIQUE("hebrew_name")
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"name" varchar(255) PRIMARY KEY NOT NULL,
	"min_resolution" integer,
	"max_resolution" integer,
	"sensing_type" varchar(255),
	"sensor_group_name" varchar(255),
	"geography_name" varchar(255),
	"user_ids" varchar(255)[]
);
--> statement-breakpoint
CREATE TABLE "sensing_types" (
	"name" varchar(255) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensor_groups" (
	"name" varchar(255) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"sensors" varchar(255)[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensors" (
	"name" varchar(255) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequence_model_names" (
	"sequence_name" varchar(255) PRIMARY KEY NOT NULL,
	"deep_wisdom_model_name" varchar(255) NOT NULL,
	"dexter_model_names" varchar(255)[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"english_name" varchar(255) NOT NULL,
	"hebrew_name" varchar(255) NOT NULL,
	"creation_time" timestamp with time zone DEFAULT now() NOT NULL,
	"update_time" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer NOT NULL,
	"is_active" boolean NOT NULL,
	"deep_wisdom_model_id" integer NOT NULL,
	"dexter_model_ids" integer[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sqrules" (
	"id" serial PRIMARY KEY NOT NULL,
	"english_name" varchar(255) NOT NULL,
	"hebrew_name" varchar(255) NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"sequence_id" integer NOT NULL,
	"creation_time" timestamp with time zone DEFAULT now() NOT NULL,
	"update_time" timestamp with time zone DEFAULT now() NOT NULL,
	"config" jsonb NOT NULL,
	"performance_rate" jsonb NOT NULL,
	"operational_status" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deep_wisdom_models_objects" ADD CONSTRAINT "deep_wisdom_models_objects_object_name_objects_english_name_fk" FOREIGN KEY ("object_name") REFERENCES "public"."objects"("english_name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "deep_wisdom_models_objects" ADD CONSTRAINT "deep_wisdom_models_objects_model_name_deep_wisdom_models_model_name_fk" FOREIGN KEY ("model_name") REFERENCES "public"."deep_wisdom_models"("model_name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dexter_models" ADD CONSTRAINT "dexter_models_embedder_id_embedder_models_id_fk" FOREIGN KEY ("embedder_id") REFERENCES "public"."embedder_models"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dexter_models_objects" ADD CONSTRAINT "dexter_models_objects_object_name_objects_english_name_fk" FOREIGN KEY ("object_name") REFERENCES "public"."objects"("english_name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dexter_models_objects" ADD CONSTRAINT "dexter_models_objects_model_name_dexter_models_model_name_fk" FOREIGN KEY ("model_name") REFERENCES "public"."dexter_models"("model_name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "objects" ADD CONSTRAINT "objects_category_name_object_categories_english_name_fk" FOREIGN KEY ("category_name") REFERENCES "public"."object_categories"("english_name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_sensing_type_sensing_types_name_fk" FOREIGN KEY ("sensing_type") REFERENCES "public"."sensing_types"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_sensor_group_name_sensor_groups_name_fk" FOREIGN KEY ("sensor_group_name") REFERENCES "public"."sensor_groups"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_geography_name_geography_name_fk" FOREIGN KEY ("geography_name") REFERENCES "public"."geography"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sequence_model_names" ADD CONSTRAINT "sequence_model_names_deep_wisdom_model_name_deep_wisdom_models_model_name_fk" FOREIGN KEY ("deep_wisdom_model_name") REFERENCES "public"."deep_wisdom_models"("model_name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_deep_wisdom_model_id_deep_wisdom_models_id_fk" FOREIGN KEY ("deep_wisdom_model_id") REFERENCES "public"."deep_wisdom_models"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sqrules" ADD CONSTRAINT "sqrules_rule_name_rules_name_fk" FOREIGN KEY ("rule_name") REFERENCES "public"."rules"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sqrules" ADD CONSTRAINT "sqrules_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE cascade;