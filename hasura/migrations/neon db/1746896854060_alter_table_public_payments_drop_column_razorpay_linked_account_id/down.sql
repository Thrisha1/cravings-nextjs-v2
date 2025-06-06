comment on column "public"."payments"."razorpay_linked_account_id" is E'payments from partners';
alter table "public"."payments" alter column "razorpay_linked_account_id" drop not null;
alter table "public"."payments" add column "razorpay_linked_account_id" text;
