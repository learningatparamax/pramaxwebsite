"use client";

import React, { useCallback, useEffect, useState } from "react";

type ResourceKey = "services" | "industry-solutions" | "case-studies" | "knowledge";
type TabKey = "leads" | ResourceKey;

interface FieldConfig {
  name: string;
  label: string;
  multiline?: boolean;
  optional?: boolean;
}

interface ResourceConfig {
  label: string;
  singular: string;
  titleField: string;
  subtitleField?: string;
  // The backend has no PUT for knowledge entries, only add and delete.
  editable: boolean;
  fields: FieldConfig[];
}

const RESOURCES: Record<ResourceKey, ResourceConfig> = {
  services: {
    label: "Services",
    singular: "service",
    titleField: "title",
    subtitleField: "category",
    editable: true,
    fields: [
      { name: "title", label: "Title" },
      { name: "category", label: "Category", optional: true },
      { name: "description", label: "Description", multiline: true }
    ]
  },
  "industry-solutions": {
    label: "Industry solutions",
    singular: "industry solution",
    titleField: "title",
    subtitleField: "industry",
    editable: true,
    fields: [
      { name: "industry", label: "Industry" },
      { name: "title", label: "Title" },
      { name: "description", label: "Description", multiline: true }
    ]
  },
  "case-studies": {
    label: "Case studies",
    singular: "case study",
    titleField: "title",
    subtitleField: "industry",
    editable: true,
    fields: [
      { name: "title", label: "Title" },
      { name: "industry", label: "Industry" },
      { name: "challenge", label: "Challenge", multiline: true },
      { name: "solution", label: "Solution", multiline: true },
      { name: "outcome", label: "Outcome", multiline: true, optional: true }
    ]
  },
  knowledge: {
    label: "Chat knowledge",
    singular: "knowledge entry",
    titleField: "trigger",
    editable: false,
    fields: [
      { name: "trigger", label: "Topic / trigger" },
      { name: "response", label: "Approved answer", multiline: true }
    ]
  }
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "leads", label: "Leads" },
  ...(Object.keys(RESOURCES) as ResourceKey[]).map((key) => ({
    key,
    label: RESOURCES[key].label
  }))
];

interface Row {
  id: number;
  created_at: string;
  [field: string]: string | number | null;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

// sessionStorage keeps the key only until the tab is closed.
const KEY_STORAGE = "pramax-admin-key";

function readStoredKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

function storeKey(key: string | null) {
  try {
    if (key) {
      sessionStorage.setItem(KEY_STORAGE, key);
    } else {
      sessionStorage.removeItem(KEY_STORAGE);
    }
  } catch {
    // Storage unavailable (e.g. private mode); the key just won't persist.
  }
}

function adminFetch(path: string, adminKey: string, init: RequestInit = {}) {
  return fetch(`/api/admin/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
    cache: "no-store"
  });
}

// Proxy errors look like { error }, FastAPI errors like { detail: "..." } or,
// for validation, { detail: [{ loc: [..., "field"], msg }] }.
async function errorMessage(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item: { loc?: unknown[]; msg?: string }) => {
        const field = item.loc?.[item.loc.length - 1];
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join("; ");
  }
  return `Request failed (${res.status})`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<TabKey>("leads");

  const verifyKey = useCallback(async (key: string) => {
    setChecking(true);
    setLoginError(null);
    try {
      const res = await adminFetch("leads", key);
      if (res.ok) {
        storeKey(key);
        setAdminKey(key);
        setKeyInput("");
      } else {
        storeKey(null);
        setLoginError(
          res.status === 401 ? "That admin key is not valid." : await errorMessage(res)
        );
      }
    } catch {
      setLoginError("Could not reach the server.");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const stored = readStoredKey();
    if (stored) {
      verifyKey(stored);
    } else {
      setChecking(false);
    }
  }, [verifyKey]);

  const logOut = useCallback((message: string | null = null) => {
    storeKey(null);
    setAdminKey(null);
    setLoginError(message);
  }, []);

  const handleUnauthorized = useCallback(
    () => logOut("Your admin key was rejected. Please sign in again."),
    [logOut]
  );

  if (!adminKey) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (keyInput.trim()) verifyKey(keyInput.trim());
          }}
          className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8"
        >
          <img src="/logo.jpg" alt="Pramax Logo" className="h-14 w-auto mb-6" />
          <h1 className="text-xl font-bold text-black mb-1">Admin sign-in</h1>
          <p className="text-sm text-gray-600 mb-6">
            Enter the admin key configured as <code>ADMIN_API_KEY</code> on the backend.
          </p>
          <label htmlFor="admin-key" className="block text-sm font-medium text-gray-700 mb-1">
            Admin key
          </label>
          <input
            id="admin-key"
            type="password"
            autoComplete="current-password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {loginError && <p className="mt-3 text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            disabled={checking || !keyInput.trim()}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {checking ? "Checking…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Pramax Logo" className="h-10 w-auto" />
            <span className="text-sm font-semibold text-gray-700">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-600 hover:text-blue-600">
              View site
            </a>
            <button
              onClick={() => logOut()}
              className="text-sm font-medium text-gray-600 hover:text-black cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto scrollbar-hidden">
          {TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 cursor-pointer ${
                tab === item.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-black"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab === "leads" ? (
          <LeadsView adminKey={adminKey} onUnauthorized={handleUnauthorized} />
        ) : (
          <ResourceManager
            key={tab}
            resource={tab}
            config={RESOURCES[tab]}
            adminKey={adminKey}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </div>
    </main>
  );
}

function LeadsView({
  adminKey,
  onUnauthorized
}: {
  adminKey: string;
  onUnauthorized: () => void;
}) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await adminFetch("leads", adminKey);
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) return setError(await errorMessage(res));
      setLeads(await res.json());
    } catch {
      setError("Could not reach the server.");
    }
  }, [adminKey, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">Leads</h2>
        <button
          onClick={load}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {leads === null ? (
        !error && <p className="text-sm text-gray-500">Loading leads…</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-gray-500">No leads yet.</p>
      ) : (
        <ul className="space-y-4">
          {leads.map((lead) => (
            <li key={lead.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-black">
                  {lead.name}
                  {lead.company && <span className="font-normal text-gray-500"> · {lead.company}</span>}
                </p>
                <span className="text-xs text-gray-500">{formatDate(lead.created_at)}</span>
              </div>
              <p className="mt-1 text-sm">
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline break-all">
                  {lead.email}
                </a>
                {lead.phone && <span className="text-gray-600"> · {lead.phone}</span>}
                <span className="ml-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {lead.status}
                </span>
              </p>
              {lead.message && (
                <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function emptyValues(config: ResourceConfig): Record<string, string> {
  return Object.fromEntries(config.fields.map((field) => [field.name, ""]));
}

function ResourceManager({
  resource,
  config,
  adminKey,
  onUnauthorized
}: {
  resource: ResourceKey;
  config: ResourceConfig;
  adminKey: string;
  onUnauthorized: () => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(config));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    try {
      const res = await adminFetch(resource, adminKey);
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) return setListError(await errorMessage(res));
      setRows(await res.json());
    } catch {
      setListError("Could not reach the server.");
    }
  }, [resource, adminKey, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setValues(emptyValues(config));
    setEditingId(null);
    setFormError(null);
  };

  const startEdit = (row: Row) => {
    setValues(
      Object.fromEntries(config.fields.map((field) => [field.name, String(row[field.name] ?? "")]))
    );
    setEditingId(row.id);
    setFormError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setNotice(null);

    const body = Object.fromEntries(
      config.fields.map((field) => {
        const value = values[field.name].trim();
        return [field.name, field.optional && !value ? null : value];
      })
    );

    try {
      const res = await adminFetch(
        editingId === null ? resource : `${resource}/${editingId}`,
        adminKey,
        { method: editingId === null ? "POST" : "PUT", body: JSON.stringify(body) }
      );
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) return setFormError(await errorMessage(res));

      setNotice(editingId === null ? `Added ${config.singular}.` : `Updated ${config.singular}.`);
      resetForm();
      load();
    } catch {
      setFormError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Row) => {
    if (!window.confirm(`Delete ${config.singular} "${row[config.titleField]}"? This cannot be undone.`)) {
      return;
    }
    setNotice(null);
    try {
      const res = await adminFetch(`${resource}/${row.id}`, adminKey, { method: "DELETE" });
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) return setListError(await errorMessage(res));
      if (editingId === row.id) resetForm();
      setNotice(`Deleted ${config.singular}.`);
      load();
    } catch {
      setListError("Could not reach the server.");
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-6"
      >
        <h2 className="text-lg font-bold text-black mb-4">
          {editingId === null ? `Add ${config.singular}` : `Edit ${config.singular}`}
        </h2>

        <div className="space-y-4">
          {config.fields.map((field) => {
            const id = `${resource}-${field.name}`;
            const inputClass =
              "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
            return (
              <div key={field.name}>
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.optional && <span className="font-normal text-gray-400"> (optional)</span>}
                </label>
                {field.multiline ? (
                  <textarea
                    id={id}
                    rows={4}
                    required={!field.optional}
                    value={values[field.name]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={id}
                    type="text"
                    required={!field.optional}
                    value={values[field.name]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </div>
            );
          })}
        </div>

        {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving…" : editingId === null ? "Add" : "Save changes"}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-black">{config.label}</h2>
          {rows && <span className="text-sm text-gray-500">{rows.length} total</span>}
        </div>

        {notice && <p className="mb-4 text-sm text-green-700">{notice}</p>}
        {listError && <p className="mb-4 text-sm text-red-600">{listError}</p>}

        {rows === null ? (
          !listError && <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing here yet. Use the form to add one.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`bg-white border rounded-xl p-5 shadow-sm ${
                  editingId === row.id ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {config.subtitleField && row[config.subtitleField] && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                        {row[config.subtitleField]}
                      </p>
                    )}
                    <p className="font-semibold text-black break-words">{row[config.titleField]}</p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    {config.editable && (
                      <button
                        onClick={() => startEdit(row)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(row)}
                      className="text-sm font-medium text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <dl className="mt-3 space-y-2">
                  {config.fields
                    .filter(
                      (field) =>
                        field.name !== config.titleField &&
                        field.name !== config.subtitleField &&
                        row[field.name]
                    )
                    .map((field) => (
                      <div key={field.name}>
                        <dt className="text-xs font-medium text-gray-500">{field.label}</dt>
                        <dd className="text-sm text-gray-700 whitespace-pre-wrap">{row[field.name]}</dd>
                      </div>
                    ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
