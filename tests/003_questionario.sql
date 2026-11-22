-- Executar numa base de testes com a migração 003 instalada.
begin;
do $test$
declare
  base jsonb := '{"customer_name":"TESTE LOCAL","items":[{"category":"peixe_fresco","product":"Robalo","quantity":1,"unit":"kg"}]}';
  bad record;
  key text;
  r jsonb;
  saved public.orders;
  n integer;
begin
  select count(*) into n from public.orders;
  foreach key in array array['shellfish_preferred','shellfish_avoid'] loop
    for bad in select * from (values
      ('null'::jsonb,'como listas'), ('{}','como listas'), ('"Ostras"','como listas'),
      (to_jsonb(array_fill('x'::text,array[31])),'30 itens'),
      (jsonb_build_array(repeat('x',61)),'60 caracteres'),
      ('[false]','60 caracteres'), ('[["Ostras"]]','60 caracteres')
    ) as invalid(value,expected) loop
      begin
        perform public.create_order(base || jsonb_build_object(key,bad.value));
        raise exception 'Aceitou lista inválida: %', bad.value;
      exception when raise_exception then
        if strpos(sqlerrm,bad.expected)=0 then raise; end if;
      end;
    end loop;
  end loop;
  for bad in select * from (values
    (jsonb_build_object('occasion_other',repeat('a',101)),'100 caracteres'),
    ('{"customer_phone":"+0123456789"}'::jsonb,'indicativo'),
    ('{"customer_phone":"+1234567"}','indicativo'),
    ('{"customer_phone":"+1234567890123456"}','indicativo')
  ) as invalid(value,expected) loop
    begin
      perform public.create_order(base || bad.value);
      raise exception 'Aceitou dados inválidos: %', bad.value;
    exception when raise_exception then
      if strpos(sqlerrm,bad.expected)=0 then raise; end if;
    end;
  end loop;
  if (select count(*) from public.orders) <> n then raise exception 'Ficou uma encomenda inválida'; end if;
  base := base || jsonb_build_object('occasion','outro','occasion_other',repeat('a',100),
    'shellfish_preferred',array_fill(repeat('á',60),array[30]),'shellfish_avoid',array[]::text[]);
  for bad in select * from (values
    ('900000000','+351900000000'), ('+351 900 000 000','+351900000000'),
    ('+1 (202) 555-0143','+12025550143'), ('+12345678','+12345678'),
    ('+123456789012345','+123456789012345')
  ) as valid(phone,expected) loop
    r := public.create_order(base || jsonb_build_object('customer_phone',bad.phone));
    select * into strict saved from public.orders where id=(r->>'id')::uuid;
    if saved.customer_phone is distinct from bad.expected or cardinality(saved.shellfish_preferred)<>30
       or length(saved.shellfish_preferred[1])<>60 or length(saved.occasion_other)<>100 then
      raise exception 'Dados guardados diferentes do pedido';
    end if;
  end loop;
end $test$;
rollback;
