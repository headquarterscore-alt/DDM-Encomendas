-- Aplicar após 001_fluxo_postos.sql. Toda a migração é atómica.
begin;

alter table public.orders drop constraint orders_status_check,
  add constraint orders_status_check check (status in ('ativa','entregue','cancelada')),
  add column history_version integer not null default 0,
  add column cancel_reason text;

-- Guardar o identificador mesmo quando o reset da demonstração remove a encomenda.
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null,
  action text not null,
  occurred_at timestamptz not null default clock_timestamp(),
  device_station text check (device_station in ('barcas','bancada')),
  task_station text check (task_station in ('barcas','bancada')),
  reason text
);
create index order_events_by_order on public.order_events(order_id, id);
alter table public.order_events enable row level security;
revoke all on public.order_events from public, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_task(p_task_id uuid, p_expected_version integer, p_patch jsonb)
 RETURNS station_tasks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
declare t station_tasks; o orders; n station_tasks;
begin
  -- A mesma ordem de bloqueio em todas as operações: encomenda, depois tarefa.
  select * into o from orders where id = (
    select order_id from station_tasks where id = p_task_id
  ) for update;
  if o.status <> 'ativa' then raise exception 'Esta encomenda já está encerrada'; end if;
  select * into t from station_tasks where id = p_task_id for update;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  if t.version <> p_expected_version then raise exception 'CONFLITO: este posto foi atualizado noutro ecrã'; end if;
  n := t;
  if p_patch ? 'shellfish_collected' then n.shellfish_collected := (p_patch->>'shellfish_collected')::boolean; end if;
  if p_patch ? 'cooking' then n.cooking := p_patch->>'cooking'; end if;
  if p_patch ? 'assembly_done' then n.assembly_done := (p_patch->>'assembly_done')::boolean; end if;
  if p_patch ? 'status' then n.status := p_patch->>'status'; end if;
  if n.status = 'por_iniciar' and t.status = 'por_iniciar' and (n.shellfish_collected or n.assembly_done or n.cooking <> 'por_cozer') then
    n.status := 'em_preparacao';
  end if;
  update station_tasks set status = n.status, shellfish_collected = n.shellfish_collected, cooking = n.cooking,
    assembly_done = n.assembly_done, version = version + 1, updated_at = now()
  where id = p_task_id returning * into n;
  update orders set history_version = history_version + 1 where id = o.id;
  insert into order_events(order_id, action, device_station, task_station)
    values (o.id, n.status, p_patch->>'device_station', n.station);
  return n;
end $function$;

create function public.change_order_status(
  p_order_id uuid, p_action text, p_station text, p_version integer, p_reason text default null
) returns public.orders language plpgsql security definer set search_path = public, pg_temp as $$
declare
  o public.orders;
  next_status text;
  reason text := nullif(btrim(p_reason),'');
begin
  select * into strict o from orders where id = p_order_id for update;
  if p_version is distinct from o.history_version then
    raise exception 'A encomenda mudou. Confirma o estado atual.';
  end if;
  case p_action
    when 'handoff' then
      if o.status <> 'ativa' or not exists (select from station_tasks where order_id=o.id)
         or exists (select from station_tasks where order_id=o.id and status <> 'pronta') then
        raise exception 'A encomenda não está pronta';
      end if;
      next_status := 'entregue';
    when 'undo' then
      if o.status <> 'entregue' then raise exception 'A encomenda não está entregue'; end if;
      next_status := 'ativa';
    when 'cancel' then
      if o.status <> 'ativa' then raise exception 'Só pode cancelar uma encomenda em aberto'; end if;
      if reason is null or length(reason)>200 then raise exception 'Indique um motivo até 200 caracteres'; end if;
      next_status := 'cancelada';
    when 'reopen' then
      if o.status <> 'cancelada' then raise exception 'A encomenda não está cancelada'; end if;
      next_status := 'ativa';
    else raise exception 'Ação desconhecida';
  end case;
  update orders set status=next_status, history_version=history_version+1,
    cancel_reason=case when p_action='cancel' then reason end,
    handed_off_at=case when p_action='handoff' then now() end
    where id=o.id returning * into o;
  insert into order_events(order_id,action,device_station,reason)
    values(o.id,p_action,p_station,case when p_action='cancel' then reason end);
  return o;
end $$;
revoke all on function public.change_order_status(uuid,text,text,integer,text) from public;
grant execute on function public.change_order_status(uuid,text,text,integer,text) to anon,authenticated,service_role;

-- Clientes anteriores não enviam o posto. O evento fica com posto desconhecido.
create or replace function public.hand_off(p_order_id uuid) returns public.orders
language plpgsql security definer set search_path=public, pg_temp as $$
declare v integer;
begin
  select history_version into strict v from orders where id=p_order_id for update;
  return change_order_status(p_order_id,'handoff',null,v);
end $$;

commit;
