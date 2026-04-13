grant insert on table public.newsletter_signups to public;

drop policy if exists "Allow public newsletter inserts"
  on public.newsletter_signups;

create policy "Allow public newsletter inserts"
  on public.newsletter_signups
  for insert
  to public
  with check (
    coalesce(source, 'homepage') = 'homepage'
  );
