begin;

alter table public.orders
  add column party_size integer check (party_size between 1 and 300),
  add column occasion text check (occasion in ('refeicao','evento','petisco','outro')),
  add column occasion_other varchar(100),
  add column shellfish_preferred varchar(60)[] check (cardinality(shellfish_preferred) <= 30),
  add column shellfish_avoid varchar(60)[] check (cardinality(shellfish_avoid) <= 30),
  add column customer_phone text check (customer_phone ~ '^[+][1-9][0-9]{7,14}$');

alter function public.create_order(jsonb) rename to create_order_before_003;
revoke all on function public.create_order_before_003(jsonb)
  from public, anon, authenticated, service_role;

create function public.create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  result jsonb;
  field text;
  list jsonb;
  phone text := nullif(regexp_replace(payload->>'customer_phone', '[[:space:]()-]', '', 'g'), '');
begin
  if payload->>'client_token' is not null then
    perform pg_advisory_xact_lock(hashtextextended(payload->>'client_token', 0));
  end if;
  result := public.create_order_before_003(payload);
  if (result->>'duplicate')::boolean then return result; end if;
  if not (payload ?| array['party_size','occasion','occasion_other','shellfish_preferred',
                            'shellfish_avoid','customer_phone']) then return result; end if;

  foreach field in array array['shellfish_preferred','shellfish_avoid'] loop
    if not (payload ? field) then continue; end if;
    list := payload->field;
    if jsonb_typeof(list) <> 'array' then
      raise exception 'Envie o marisco preferido e o marisco a evitar como listas.';
    end if;
    if jsonb_array_length(list) > 30 then
      raise exception 'Cada lista de marisco pode ter até 30 itens.';
    end if;
    if exists (select from jsonb_array_elements(list) as e(item)
               where jsonb_typeof(item) <> 'string' or length(item #>> '{}') > 60) then
      raise exception 'Cada item de marisco tem de ser um texto com até 60 caracteres.';
    end if;
  end loop;

  if jsonb_typeof(payload->'occasion_other') not in ('string','null')
     or length(payload->>'occasion_other') > 100 then
    raise exception 'A descrição da ocasião tem de ser um texto com até 100 caracteres.';
  end if;
  if phone ~ '^[0-9]{9}$' then phone := '+351' || phone; end if;
  if phone !~ '^[+][1-9][0-9]{7,14}$' then
    raise exception 'Indique 9 dígitos para Portugal ou + seguido do indicativo e do número (8 a 15 dígitos).';
  end if;

  update public.orders set
    party_size = (payload->>'party_size')::integer,
    occasion = nullif(payload->>'occasion',''),
    occasion_other = case when payload->>'occasion'='outro'
                          then nullif(btrim(payload->>'occasion_other'),'') end,
    shellfish_preferred = array(select jsonb_array_elements_text(payload->'shellfish_preferred')),
    shellfish_avoid = array(select jsonb_array_elements_text(payload->'shellfish_avoid')),
    customer_phone = phone
  where id = (result->>'id')::uuid;
  return result;
exception when data_exception or integrity_constraint_violation then
  raise exception 'Verifique os dados da encomenda, a ocasião, o número de pessoas e os artigos.';
end $$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated, service_role;
notify pgrst, 'reload schema';
commit;
