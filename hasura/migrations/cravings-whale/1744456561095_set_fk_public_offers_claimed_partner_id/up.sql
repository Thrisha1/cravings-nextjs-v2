alter table "public"."offers_claimed"
  add constraint "offers_claimed_partner_id_fkey"
  foreign key ("partner_id")
  references "public"."partners"
  ("id") on update restrict on delete restrict;
