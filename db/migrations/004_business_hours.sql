-- Horario de atención: 07:00–21:00, America/Tijuana. Idempotente.
update availability_rule
set start_time = '07:00', end_time = '21:00'
where timezone = 'America/Tijuana' and (start_time <> '07:00' or end_time <> '21:00');
