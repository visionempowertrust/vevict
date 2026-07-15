create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  category text,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_order_idx on faqs(display_order, question);
create index if not exists faqs_active_idx on faqs(is_active, display_order);

drop trigger if exists faqs_set_updated_at on faqs;
create trigger faqs_set_updated_at
before update on faqs
for each row
execute function set_updated_at();

alter table faqs enable row level security;

drop policy if exists "prototype read faqs" on faqs;
create policy "prototype read faqs" on faqs for select using (true);

drop policy if exists "prototype write faqs" on faqs;
create policy "prototype write faqs" on faqs for all using (true) with check (true);
