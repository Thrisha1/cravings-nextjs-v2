alter table "public"."offers" drop constraint "offers_partner_id_fkey",
  add constraint "offers_partner_id_fkey"
  foreign key ("partner_id")
  references "public"."partners"
  ("id") on update restrict on delete restrict;
