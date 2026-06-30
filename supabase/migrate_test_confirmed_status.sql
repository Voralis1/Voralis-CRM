-- Ajoute un statut « Test confirmé » pour valider les commandes de test
-- avec les affiliate networks (sans impacter les stats / payout réels).
alter type order_status add value if not exists 'test_confirmed';
