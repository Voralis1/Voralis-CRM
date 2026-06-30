-- ---------------------------------------------------------------------------
-- Migration : découpler les leads des offres.
--
-- Les affiliés peuvent désormais envoyer n'importe quel lead, sans le rattacher
-- à une offre et sans restriction de pays. On rend donc offer_id et country
-- facultatifs sur la table orders.
--
-- Non destructif : aucune donnée existante n'est supprimée. La table offers et
-- la clé étrangère sont conservées (l'admin/les stats/le payout continuent de
-- fonctionner pour les leads qui ont une offre).
--
-- À exécuter dans Supabase : SQL Editor -> coller ce fichier -> Run.
-- ---------------------------------------------------------------------------

-- offer_id devient facultatif (la FK vers offers reste, NULL est autorisé).
alter table orders alter column offer_id drop not null;

-- country devient facultatif (un lead peut ne pas avoir de pays renseigné).
alter table orders alter column country drop not null;

-- Colonne "Produit" en texte libre : l'affilié envoie le produit directement,
-- sans dépendre d'une offre. Affiché dans la colonne "Produit" des leads.
alter table orders add column if not exists product text;
