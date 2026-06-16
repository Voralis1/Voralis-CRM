"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  productCount: string;
}

const initialFormState: Project = {
  id: "",
  name: "",
  createdAt: new Date().toISOString().slice(0, 10),
  expiresAt: new Date().toISOString().slice(0, 10),
  productCount: "0",
};

export default function ProductsAdminPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Project>(initialFormState);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les projets.");
      setProjects(data.projects || []);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const canSubmit = useMemo(
    () => form.id.trim() !== "" && form.name.trim() !== "" && form.createdAt !== "" && form.expiresAt !== "",
    [form]
  );

  const handleChange = (key: keyof Project, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          createdAt: form.createdAt,
          expiresAt: form.expiresAt,
          productCount: form.productCount,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors de la création du projet.");

      setProjects((current) => [...current, form]);
      setForm(initialFormState);
      setIsModalOpen(false);
      router.push(`/admin/products/${encodeURIComponent(form.id)}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion de produits</h1>
          <p className="text-sm text-slate-500">Créez des projets puis administrez les produits associés.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary max-w-max"
        >
          Créer un nouveau projet
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Nouveau projet</h2>
                <p className="text-sm text-slate-500">Remplis les informations du projet puis enregistre.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>ID</span>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                    className="input w-full"
                    placeholder="project_001"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Nom du projet</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="input w-full"
                    placeholder="Projet campagne printemps"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Date de création</span>
                  <input
                    type="date"
                    value={form.createdAt}
                    onChange={(e) => handleChange("createdAt", e.target.value)}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Date d'expiration</span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => handleChange("expiresAt", e.target.value)}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span>Nombre de produits</span>
                  <input
                    type="number"
                    min="0"
                    value={form.productCount}
                    onChange={(e) => handleChange("productCount", e.target.value)}
                    className="input w-full"
                  />
                </label>
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || isSaving}
                  onClick={handleCreate}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {isSaving ? "Création…" : "Enregistrer le projet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-brand-mist">
            <tr>
              <th className="th">ID</th>
              <th className="th">Nom du projet</th>
              <th className="th">Créé le</th>
              <th className="th">Expiration</th>
              <th className="th">Nombre de produits</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td className="td text-center text-slate-500" colSpan={6}>
                  Aucun projet créé pour le moment.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-brand-mist/40 cursor-pointer"
                  onClick={() => router.push(`/admin/products/${encodeURIComponent(project.id)}`)}
                >
                  <td className="td font-mono text-xs">{project.id}</td>
                  <td className="td">{project.name}</td>
                  <td className="td">{new Date(project.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="td">{new Date(project.expiresAt).toLocaleDateString("fr-FR")}</td>
                  <td className="td">{project.productCount}</td>
                  <td className="td">
                    <span className="text-sm text-brand-600 hover:underline">Voir le projet</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
