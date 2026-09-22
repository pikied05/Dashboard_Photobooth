create table if not exists eventos (
  id bigserial primary key,
  nombre text not null,
  lugar text not null,
  fecha date not null,
  hora text not null default '',
  anfitrion text not null default '',
  paquete text not null default 'Estándar · 3h',
  activo boolean default false,
  invitados integer default 0,
  fotos integer default 0,
  notas text default '',
  created_at timestamptz default now()
);

create table if not exists pagos (
  id bigserial primary key,
  evento_id bigint references eventos(id) on delete set null,
  invitado text not null,
  email text not null default '',
  monto numeric not null default 0,
  fotos integer default 0,
  estado text default 'Pendiente',
  fecha date default current_date,
  created_at timestamptz default now()
);

create table if not exists marcos (
  id bigserial primary key,
  nombre text not null,
  activo boolean default true,
  usos integer default 0,
  created_at timestamptz default now()
);
