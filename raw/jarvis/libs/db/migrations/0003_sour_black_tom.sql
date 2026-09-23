CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_type" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_subject_type_subject_unique" UNIQUE("subject_type","subject")
);
