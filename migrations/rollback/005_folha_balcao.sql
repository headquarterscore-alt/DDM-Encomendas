begin;
-- Evita eliminar manuscritos já recebidos. A versão anterior da app pode correr com a 005 instalada.
do $$ begin
 if exists(select from public.orders where counter_sheet is not null) then
  raise exception 'Existem folhas de balcão guardadas. Preserve-as antes de remover as colunas.';
 end if;
end $$;
drop function public.create_counter_sheet(jsonb), public.counter_contacts();
alter table public.orders drop column counter_sheet, drop column counter_contact_id, drop column counter_time_unset;
notify pgrst, 'reload schema';
commit;
