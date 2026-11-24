-- Données de départ ALS Devices : réglages, catégories, marques, zones de livraison, pages.
-- Déjà appliqué sur le projet Supabase. À relancer seulement sur un nouveau projet.

insert into public.als_settings (id, data) values (1, jsonb_build_object(
  'name', 'ALS Devices',
  'currency', 'XOF', 'currency_symbol', 'FCFA', 'decimals', 0,
  'whatsapp', '221770000000', 'phone', '+221 77 000 00 00', 'email', 'contact@alsdevices.com',
  'address', 'Dakar, Sénégal', 'hours', 'Lun–Sam · 9h–20h',
  'pickup_enabled', true,
  'wave_number', '77 000 00 00', 'om_number', '77 000 00 00',
  'payment_methods', jsonb_build_array(
    jsonb_build_object('value', 'cod', 'label', 'Paiement à la livraison', 'hint', 'Espèces ou mobile money à la réception'),
    jsonb_build_object('value', 'wave', 'label', 'Wave', 'hint', 'Transfert Wave, confirmé par notre équipe'),
    jsonb_build_object('value', 'orange_money', 'label', 'Orange Money', 'hint', 'Transfert Orange Money, confirmé par notre équipe')),
  'social', jsonb_build_object('facebook', 'https://facebook.com/', 'tiktok', 'https://tiktok.com/', 'instagram', ''),
  'tracking', jsonb_build_object('meta_pixel', '', 'tiktok_pixel', ''),
  'break_even_monthly', 2810000
)) on conflict (id) do nothing;

insert into public.als_categories (name, slug, icon, description, position, meta_title, meta_description) values
  ('Smartphones', 'smartphones', 'phone', 'iPhone, Samsung Galaxy, Xiaomi, Tecno… neufs et reconditionnés, testés et garantis.', 1, 'Smartphones neufs et reconditionnés à Dakar', 'iPhone, Samsung Galaxy, Xiaomi, Tecno… neufs et reconditionnés, testés et garantis.'),
  ('Tablettes', 'tablettes', 'tablet', 'iPad et tablettes Android pour le travail, l''école et la famille.', 2, 'Tablettes neuves et reconditionnées à Dakar', 'iPad et tablettes Android pour le travail, l''école et la famille.'),
  ('Ordinateurs portables', 'ordinateurs-portables', 'laptop', 'MacBook et PC portables neufs ou reconditionnés, prêts à l''emploi.', 3, 'Ordinateurs portables neufs et reconditionnés à Dakar', 'MacBook et PC portables neufs ou reconditionnés, prêts à l''emploi.'),
  ('Objets connectés', 'objets-connectes', 'watch', 'Montres et bracelets connectés, caméras, domotique.', 4, 'Montres et objets connectés à Dakar', 'Montres et bracelets connectés, caméras, domotique.'),
  ('Accessoires', 'accessoires', 'accessory', 'Coques, chargeurs rapides, écouteurs, câbles, protections d''écran.', 5, 'Accessoires téléphone et ordinateur à Dakar', 'Coques, chargeurs rapides, écouteurs, câbles, protections d''écran.')
on conflict (slug) do nothing;

insert into public.als_brands (name, slug)
select b, lower(b) from unnest(array['Apple','Samsung','Xiaomi','Tecno','Infinix','HP','Lenovo','Dell','Anker','JBL']) b
on conflict (slug) do nothing;

insert into public.als_delivery_zones (name, fee, delay, position) values
  ('Dakar Plateau, Médina, Fann', 1500, '24 h', 1),
  ('Dakar — autres quartiers', 2000, '24 h', 2),
  ('Pikine, Guédiawaye, Parcelles', 2500, '24 h', 3),
  ('Rufisque, Keur Massar, Diamniadio', 3000, '24–48 h', 4),
  ('Thiès, Mbour, Saly', 3500, '48 h', 5),
  ('Autres régions (transporteur)', 5000, '2–4 jours', 6);

-- Pages (texte modifiable dans le back-office › Réglages › Pages)
insert into public.als_pages (slug, title, body) values
('a-propos', 'À propos d''ALS Devices', 'ALS Devices vend des smartphones, tablettes, ordinateurs portables, objets connectés et accessoires, **neufs et reconditionnés**.'),
('retours-et-garantie', 'Retours et garantie', '## Garantie' || E'\n' || '- **Neuf** : 12 mois.' || E'\n' || '- **Reconditionné** : durée indiquée sur la fiche (6 mois minimum).' || E'\n\n' || '## Retours' || E'\n' || 'Vous disposez de **7 jours** après réception pour signaler un problème.'),
('cgv', 'Conditions générales de vente', '*Trame à compléter : raison sociale, adresse, NINEA, RCCM.*'),
('mentions-legales', 'Mentions légales', '*Trame à compléter.*'),
('confidentialite', 'Politique de confidentialité', '*Trame à compléter conformément à la loi sénégalaise n° 2008-12 (CDP).*')
on conflict (slug) do nothing;
