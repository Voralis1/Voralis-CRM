"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/I18nProvider";

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
  const t = useT();
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
      if (!response.ok) throw new Error(data.error || t("adm.products.errLoadProjects"));
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

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(t("adm.products.confirmDeleteProject"))) return;
    try {
      const response = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t("adm.products.errDelete"));
      setProjects((current) => current.filter((p) => p.id !== projectId));
    } catch (err) {
      setError((err as Error).message);
    }
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
      if (!response.ok) throw new Error(data.error || t("adm.products.errCreateProject"));

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
          <h1 className="text-2xl font-bold">{t("adm.products.title")}</h1>
          <p className="text-sm text-ink-muted">{t("adm.products.subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary max-w-max"
        >
          {t("adm.products.createProject")}
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-surface p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-ink-muted hover:bg-hovered"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{t("adm.products.newProject")}</h2>
                <p className="text-sm text-ink-muted">{t("adm.products.newProjectHint")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.id")}</span>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                    className="input w-full"
                    placeholder={t("adm.products.phProjectId")}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.projectName")}</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="input w-full"
                    placeholder={t("adm.products.phProjectName")}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.createdDate")}</span>
                  <input
                    type="date"
                    value={form.createdAt}
                    onChange={(e) => handleChange("createdAt", e.target.value)}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("adm.products.expiryDate")}</span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => handleChange("expiresAt", e.target.value)}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span>{t("adm.products.productCount")}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.productCount}
                    onChange={(e) => handleChange("productCount", e.target.value)}
                    className="input w-full"
                  />
                </label>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {t("adm.products.cancel")}
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || isSaving}
                  onClick={handleCreate}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {isSaving ? t("adm.products.creating") : t("adm.products.saveProject")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-elevated">
            <tr>
              <th className="th">{t("adm.products.colId")}</th>
              <th className="th">{t("adm.products.colProjectName")}</th>
              <th className="th">{t("adm.products.colCreatedAt")}</th>
              <th className="th">{t("adm.products.colExpiry")}</th>
              <th className="th">{t("adm.products.colProductCount")}</th>
              <th className="th">{t("adm.products.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td className="td text-center text-ink-muted" colSpan={6}>
                  {t("adm.products.emptyProjects")}
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="row-hover cursor-pointer"
                  onClick={() => router.push(`/admin/products/${encodeURIComponent(project.id)}`)}
                >
                  <td className="td font-mono text-xs">{project.id}</td>
                  <td className="td">{project.name}</td>
                  <td className="td">{new Date(project.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="td">{new Date(project.expiresAt).toLocaleDateString("fr-FR")}</td>
                  <td className="td">{project.productCount}</td>
                  <td className="td">
                    <div className="flex gap-3">
                      <span className="text-sm text-accent hover:underline">{t("adm.products.viewProject")}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="text-sm text-danger hover:underline"
                      >
                        {t("adm.products.delete")}
                      </button>
                    </div>
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
