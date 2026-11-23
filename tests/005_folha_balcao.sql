-- Executar depois da 005 numa base de teste. Todos os pedidos são revertidos.
begin;
do $$
declare
  contact uuid := gen_random_uuid();
  payload jsonb := jsonb_build_object('contact_id',contact,'client_token',gen_random_uuid(),
    'name','TESTE FOLHA','kind','restaurante','day',current_date,'time','',
    'drawing','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9rlKMAAAAASUVORK5CYII=');
  first_result jsonb;
  repeated jsonb;
begin
  if has_function_privilege('anon','public.create_counter_sheet(jsonb)','execute')
     or has_function_privilege('anon','public.counter_contacts()','execute') then
    raise exception 'Acesso anónimo indevido';
  end if;
  first_result := public.create_counter_sheet(payload);
  repeated := public.create_counter_sheet(payload);
  if repeated->>'id' <> first_result->>'id' or
     (select count(*) from public.orders where counter_contact_id=contact) <> 1 then
    raise exception 'Pedido duplicado';
  end if;
  if not exists(select from public.orders where id=(first_result->>'id')::uuid and counter_time_unset
                and counter_sheet=payload->>'drawing') then raise exception 'Folha perdida'; end if;
  perform public.create_counter_sheet(payload||jsonb_build_object('name','nome alterado','time','18:00','client_token',gen_random_uuid()));
  if (select count(*) from public.counter_contacts() where contact_id=contact and name='TESTE FOLHA' and kind='restaurante')<>1
     or not exists(select from public.orders where counter_contact_id=contact and scheduled_time='18:00' and not counter_time_unset) then
    raise exception 'Histórico ou hora incorretos';
  end if;
end $$;
rollback;
