begin;

alter table public.orders
  add column counter_sheet text,
  add column counter_contact_id uuid,
  add column counter_time_unset boolean not null default false;
create index orders_counter_contact_idx on public.orders(counter_contact_id, business_date desc)
  where counter_contact_id is not null;

create function public.counter_contacts()
returns table(contact_id uuid, name text, kind text)
language sql stable security invoker set search_path = public, pg_temp as $$
  select recent.counter_contact_id, recent.customer_name, recent.customer_type::text
  from (
    select distinct on (counter_contact_id) counter_contact_id, customer_name, customer_type, business_date, id
    from public.orders where counter_contact_id is not null
    order by counter_contact_id, business_date desc, id desc
  ) recent order by recent.business_date desc, recent.id desc;
$$;

create function public.create_counter_sheet(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  drawing text := payload->>'drawing';
  contact uuid := (payload->>'contact_id')::uuid;
  customer text := trim(payload->>'name');
  kind text := payload->>'kind';
  clock_time text := nullif(payload->>'time','');
  previous public.orders%rowtype;
  result jsonb;
begin
  if drawing is null or length(drawing) > 450000 or drawing !~ '^data:image/png;base64,iVBORw0KGgo[A-Za-z0-9+/]+=*\Z' then
    raise exception 'Escreva o pedido na folha antes de guardar.';
  end if;
  if contact is null or nullif(payload->>'client_token','') is null then
    raise exception 'Falta identificar a folha ou o cliente.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(contact::text,1));
  select * into previous from public.orders where counter_contact_id=contact limit 1;
  if found then customer := previous.customer_name; kind := previous.customer_type; end if;
  if kind is null or kind not in ('particular','restaurante') or nullif(customer,'') is null or length(customer)>120000 then
    raise exception 'Indique o cliente ou restaurante.';
  end if;
  if clock_time is not null and clock_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Indique uma hora válida.';
  end if;
  -- A RPC existente requer uma hora. A marca explícita distingue "a combinar" de uma hora real.
  result := public.create_order(jsonb_build_object(
    'client_token',payload->>'client_token','source','equipa','customer_name',customer,'customer_type',kind,
    'fulfilment','recolha','address','','priority','normal','business_date',payload->>'day',
    'scheduled_time',coalesce(clock_time,'23:59'),'notes',case when clock_time is null then 'Hora a combinar' else '' end,
    'items',jsonb_build_array(jsonb_build_object('product','Folha de balcão','category','peixe_fresco','unit','un','quantity',1))
  ));
  if not coalesce((result->>'duplicate')::boolean,false) then
    update public.orders set counter_sheet=drawing, counter_contact_id=contact, counter_time_unset=clock_time is null
      where id=(result->>'id')::uuid;
  end if;
  return result;
end $$;

revoke all on function public.create_counter_sheet(jsonb), public.counter_contacts() from public, anon;
grant execute on function public.create_counter_sheet(jsonb), public.counter_contacts() to authenticated;
notify pgrst, 'reload schema';
commit;
