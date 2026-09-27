-- Extra angles of the same item (label, connector, QR code). photo_path stays the main photo.
alter table items add column extra_photos text[] not null default '{}';
alter table items add column codes jsonb;
