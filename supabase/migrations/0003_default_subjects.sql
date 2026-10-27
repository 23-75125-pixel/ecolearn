-- ECoLearn - default subject catalog
-- Keeps new environments usable even when the optional demo seed has not run.

insert into public.subjects (name, slug)
values
  ('Mathematics', 'mathematics'),
  ('Science', 'science'),
  ('English', 'english'),
  ('Computer Programming', 'computer-programming')
on conflict (slug) do update
set name = excluded.name,
    is_active = true;
