-- Ajoute une image (URL ou data-URL base64) à chaque produit de catalogue.
alter table project_products
  add column if not exists image_url text;
