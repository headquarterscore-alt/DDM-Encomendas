-- Repõe os acessos anteriores à 004, incluindo a leitura pública.
-- A revogação independente de reset_demo mantém-se.
begin;
alter policy "demo read orders" on public.orders to anon, authenticated;
alter policy "demo read items" on public.order_items to anon, authenticated;
alter policy "demo read tasks" on public.station_tasks to anon, authenticated;

revoke select on public.orders, public.order_items, public.station_tasks from authenticated;
do $restore$
declare g record;
begin
  for g in select * from ddm_004_restore.grants loop
    execute format('grant %s on %s public.%I to %s %s',g.privilege_type,
      case when g.is_sequence then 'sequence' else 'table' end,g.relname,g.grantee_sql,
      case when g.is_grantable then 'with grant option' else '' end);
  end loop;
end $restore$;
drop table ddm_004_restore.grants;
drop schema ddm_004_restore;

grant execute on function public.create_order(jsonb), public.update_task(uuid,integer,jsonb),
  public.change_order_status(uuid,text,text,integer,text), public.hand_off(uuid) to anon, authenticated;
grant execute on function public.lisbon_today() to public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
