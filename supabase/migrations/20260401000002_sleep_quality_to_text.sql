-- Change sleep_quality from integer (0-10) to text enum
-- Values: muy_malo, malo, regular, bueno, excelente

alter table dy_check_ins
  drop constraint if exists dy_check_ins_sleep_quality_check;

alter table dy_check_ins
  alter column sleep_quality type text using (
    case
      when sleep_quality between 0 and 2 then 'muy_malo'
      when sleep_quality between 3 and 4 then 'malo'
      when sleep_quality between 5 and 6 then 'regular'
      when sleep_quality between 7 and 8 then 'bueno'
      when sleep_quality between 9 and 10 then 'excelente'
      else null
    end
  );

alter table dy_check_ins
  add constraint dy_check_ins_sleep_quality_check
  check (
    sleep_quality is null
    or sleep_quality in ('muy_malo', 'malo', 'regular', 'bueno', 'excelente')
  );
