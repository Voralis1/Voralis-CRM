-- ---------------------------------------------------------------------------
-- Remplissage de project_products.quantity à partir du relevé de stock fourni.
-- Chaque ligne de project_products (projet id=3) est spécifique à un pays
-- (suffixe dans le nom, ex. "(GN)", "(GAB)") ou couvre plusieurs pays quand
-- une seule ligne existe pour ce produit (ex. PERDA DE PESO = BZV + AGO,
-- alors sommé). Correspondance établie à partir de la capture pays/quantité
-- et de la table project_products réelle (requête de vérification fournie).
-- À exécuter dans Supabase : SQL Editor -> coller -> Run.
-- ---------------------------------------------------------------------------

-- GN (nom de ville "Conakry" dans la base = Guinée)
UPDATE project_products SET quantity = 59  WHERE project_id = '3' AND name = 'Capsule Lumora Conakry';   -- Lumora capsules (GN)
UPDATE project_products SET quantity = 222 WHERE project_id = '3' AND name = 'Creme Marukaya Conakry';    -- Marukaya crème (GN)
UPDATE project_products SET quantity = 47  WHERE project_id = '3' AND name = 'VORALIS BALANCE (GN)';
UPDATE project_products SET quantity = 93  WHERE project_id = '3' AND name = 'VORALIS CALME (GN)';
UPDATE project_products SET quantity = 97  WHERE project_id = '3' AND name = 'VORALIS CONFORT (GN)';

-- GAB (Gabon)
UPDATE project_products SET quantity = 99  WHERE project_id = '3' AND name = 'VORALIS CONFORT ( GAB)';
UPDATE project_products SET quantity = 95  WHERE project_id = '3' AND name = 'VORALIS F ( GABON)';

-- AGO (Angola)
UPDATE project_products SET quantity = 270 WHERE project_id = '3' AND name = 'VORALIS DIABÉTICA ( AGO)';           -- Diabetica Voralis (AGO)
UPDATE project_products SET quantity = 280 WHERE project_id = '3' AND name = 'VORALIS SALUD DE LA PROSTATA (AG)';  -- Voralis Salud de la prostata (AGO)

-- Produits sans suffixe pays dans le nom -> une seule ligne couvre plusieurs pays -> quantités additionnées
UPDATE project_products SET quantity = 376 WHERE project_id = '3' AND name = 'PERDA DE PESO';        -- 196 (BZV) + 180 (AGO)
UPDATE project_products SET quantity = 297 WHERE project_id = '3' AND name = 'Potência Masculina';   -- 177 (BZV) + 120 (AGO)

-- ---------------------------------------------------------------------------
-- NON APPLIQUÉ FAUTE DE LIGNE CORRESPONDANTE DANS project_products (projet 3) :
--   - Voralis confort (ML)=167, voralis light (ML)=182, Voralis F (ML)=0,
--     Voralis Balance (ML)=212, Voralis Calme (ML)=168, Voralis Élan (ML)=312
--   - Voralis Balance (CI)=100, Voralis Élan (CI)=100
--   - Marukaya crème (SN)=0
--   - Zenifaya gélules (BZV)=96
--   - VORALIS CONFORT (BF) existe en base mais aucune quantité n'a été fournie pour BF
-- Ces produits/pays n'ont pas de ligne dans project_products pour ce projet ;
-- il faudrait d'abord les créer (page Gestion des produits) avant de pouvoir
-- leur assigner une quantité.
-- ---------------------------------------------------------------------------

-- Vérification rapide après exécution :
-- select id, project_id, name, quantity from project_products where project_id = '3' order by name;
