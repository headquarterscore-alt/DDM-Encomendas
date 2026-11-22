-- Os valores dos seis campos do questionário são eliminados por esta reversão.
begin;
drop function public.create_order(jsonb);
alter function public.create_order_before_003(jsonb) rename to create_order;
grant execute on function public.create_order(jsonb) to anon, authenticated, service_role;

alter table public.orders
  drop column party_size,
  drop column occasion,
  drop column occasion_other,
  drop column shellfish_preferred,
  drop column shellfish_avoid,
  drop column customer_phone;

notify pgrst, 'reload schema';
commit;
