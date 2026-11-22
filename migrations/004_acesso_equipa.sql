-- Só aplicar depois de confirmar o login da equipa nos dois tablets.
begin;
-- Guardar as permissões reais para a reversão sem dar acessos adicionais.
create schema ddm_004_restore;
revoke all on schema ddm_004_restore from public, anon, authenticated;
create table ddm_004_restore.grants as
  select c.relname, c.relkind='S' as is_sequence, a.privilege_type, a.is_grantable,
         case when a.grantee=0 then 'PUBLIC' else quote_ident(pg_get_userbyid(a.grantee)) end as grantee_sql
  from pg_class c cross join lateral aclexplode(c.relacl) a
  where c.relnamespace='public'::regnamespace
    and c.relname in ('orders','order_items','station_tasks','order_ref_seq','order_events_id_seq')
    and a.grantee in (0,'anon'::regrole::oid,'authenticated'::regrole::oid);
revoke all on ddm_004_restore.grants from public, anon, authenticated;

revoke all on public.orders, public.order_items, public.station_tasks from public, anon, authenticated;
grant select on public.orders, public.order_items, public.station_tasks to authenticated;
revoke all on sequence public.order_ref_seq, public.order_events_id_seq from public, anon, authenticated;

alter policy "demo read orders" on public.orders to authenticated;
alter policy "demo read items" on public.order_items to authenticated;
alter policy "demo read tasks" on public.station_tasks to authenticated;

revoke execute on function public.create_order(jsonb), public.update_task(uuid,integer,jsonb),
  public.change_order_status(uuid,text,text,integer,text), public.hand_off(uuid),
  public.lisbon_today() from public, anon;
grant execute on function public.create_order(jsonb), public.update_task(uuid,integer,jsonb),
  public.change_order_status(uuid,text,text,integer,text), public.hand_off(uuid), public.lisbon_today() to authenticated;
-- reset_demo, create_order_before_003 e order_events continuam reservados.
notify pgrst, 'reload schema';
commit;
