UPDATE "sqrules" SET "operational_status" = upper("operational_status")
WHERE "operational_status" != upper("operational_status");
