alter table "public"."reviews"
  add constraint "reviews_partner_id_fkey"
  foreign key ("partner_id")
  references "public"."partners"
  ("id") on update restrict on delete restrict;
