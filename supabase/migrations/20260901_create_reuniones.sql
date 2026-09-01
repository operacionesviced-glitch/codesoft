create table if not exists public.reuniones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  fecha date not null,
  hora time not null,
  mensaje text,
  estado text not null default 'pendiente',
  created_at timestamptz not null default now()
);

alter table public.reuniones enable row level security;

-- Solo el backend (service_role, usado por la Edge Function) puede leer/escribir.
-- No se crea policy para anon: los inserts pasan por la Edge Function con la service_role key.
