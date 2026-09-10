-- Precios definidos por el cliente (MXN). Idempotente.
update service set price_cents = 120000 where slug = 'consultoria-1h';
update service set price_cents = 220000 where slug = 'consultoria-2h';
update service set price_cents = 300000 where slug = 'consultoria-3h';
-- diagnostico-15 se queda en 0 (gratis).
