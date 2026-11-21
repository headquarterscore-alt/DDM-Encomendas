BEGIN;

CREATE OR REPLACE FUNCTION public.update_task(p_task_id uuid, p_expected_version integer, p_patch jsonb)
 RETURNS station_tasks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t station_tasks; o orders; n station_tasks;
begin
  select * into t from station_tasks where id = p_task_id for update;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  if t.version <> p_expected_version then raise exception 'CONFLITO: este posto foi atualizado noutro ecrã'; end if;
  select * into o from orders where id = t.order_id;
  if o.status = 'entregue' then raise exception 'Encomenda já entregue — não pode ser alterada'; end if;
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
  return n;
end $function$;

COMMIT;
