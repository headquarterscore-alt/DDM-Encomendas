begin;

alter table public.orders
  add column party_size integer check (party_size between 1 and 300),
  add column occasion text check (occasion in ('refeicao','evento','petisco','outro')),
  add column occasion_other text,
  add column shellfish_preferred text[],
  add column shellfish_avoid text[],
  add column customer_phone text check (customer_phone ~ '^[+]351[0-9]{9}$');

-- Conservar a implementação instalada e o contrato público create_order(payload jsonb).
alter function public.create_order(jsonb) rename to create_order_before_003;
revoke all on function public.create_order_before_003(jsonb)
  from public, anon, authenticated, service_role;

create function public.create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  result jsonb;
  phone text := nullif(regexp_replace(payload->>'customer_phone', '[[:space:]()-]', '', 'g'), '');
begin
  if payload->>'client_token' is not null then
    perform pg_advisory_xact_lock(hashtextextended(payload->>'client_token', 0));
  end if;

  result := public.create_order_before_003(payload);
  if (result->>'duplicate')::boolean then return result; end if;
  if not (payload ?| array['party_size','occasion','occasion_other','shellfish_preferred',
                            'shellfish_avoid','customer_phone']) then return result; end if;

  if phone ~ '^[0-9]{9}$' then phone := '+351' || phone; end if;
  update public.orders set
    party_size = (payload->>'party_size')::integer,
    occasion = nullif(payload->>'occasion',''),
    occasion_other = case when payload->>'occasion'='outro'
                          then nullif(btrim(payload->>'occasion_other'),'') end,
    shellfish_preferred = array(select jsonb_array_elements_text(nullif(payload->'shellfish_preferred','null'::jsonb))),
    shellfish_avoid = array(select jsonb_array_elements_text(nullif(payload->'shellfish_avoid','null'::jsonb))),
    customer_phone = phone
  where id = (result->>'id')::uuid;
  return result;
end $$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated, service_role;
notify pgrst, 'reload schema';
commit;
