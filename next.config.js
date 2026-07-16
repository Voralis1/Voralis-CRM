/** @type {import('next').NextConfig} */
// Pas de basePath ici : vercel.json réécrit déjà /crm/:path* -> /:path* au
// niveau du edge, donc l'app Next.js reçoit les requêtes sans le préfixe
// /crm et doit continuer à router depuis la racine.
const nextConfig = { reactStrictMode: true };
module.exports = nextConfig;
