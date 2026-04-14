"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BellRing, Check, ChevronRight, Monitor, PanelLeftOpen, PencilLine, Plus, UserCircle2, Users2, X } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { OpsPanel, PageHeader, SectionHeader } from "@/components/ops-ui";

type SettingsPayload = {
  profile: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "operator" | "supervisor";
    station: string;
  };
  settings: {
    theme: "light" | "dark";
    compactRows: boolean;
    sidebarCollapsed: boolean;
    autoRefresh: boolean;
    refreshIntervalSeconds: number;
    cutoffAlert: boolean;
    exceptionAlert: boolean;
    soundAlert: boolean;
    emailDigest: boolean;
  } | null;
  users: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "operator" | "supervisor";
    station: string;
    status: "active" | "invited" | "disabled";
  }[];
};

const tabs = [
  { label: "Profile", icon: UserCircle2 },
  { label: "User & Role", icon: Users2 },
  { label: "Notifications", icon: BellRing },
  { label: "Display Preferences", icon: Monitor },
  { label: "Sidebar Preferences", icon: PanelLeftOpen },
] as const;

const tabGroups = [
  {
    id: "account",
    label: "Account",
    items: ["Profile", "User & Role"] as const,
  },
  {
    id: "workspace",
    label: "Workspace",
    items: ["Notifications", "Display Preferences", "Sidebar Preferences"] as const,
  },
] as const;

const stationOptions = ["CGK", "SUB", "DPS", "SOQ", "UPG", "BPN"] as const;

const rolePillClasses: Record<SettingsPayload["profile"]["role"], string> = {
  admin:
    "border border-[color:var(--tone-danger-soft)] bg-[color:var(--tone-danger-soft)] text-[color:var(--tone-danger)]",
  operator:
    "border border-[color:var(--brand-primary-soft)] bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary)]",
  supervisor:
    "border border-[color:var(--tone-warning-soft)] bg-[color:var(--tone-warning-soft)] text-[color:var(--tone-warning)]",
};

const userStatusLabels: Record<SettingsPayload["users"][number]["status"], string> = {
  active: "Active",
  invited: "Invited",
  disabled: "Disabled",
};

const roleDefinitionCards = [
  {
    title: "Admin",
    copy: "Akses penuh, manajemen user, semua settings",
  },
  {
    title: "Operator",
    copy: "CRUD shipment, tracking AWB, handling cargo",
  },
  {
    title: "Supervisor",
    copy: "Monitoring, approval manifest, eskalasi",
  },
] as const;

type PreferenceToggleCardProps = {
  title: string;
  copy: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function PreferenceToggleCard({ title, copy, checked, onChange }: PreferenceToggleCardProps) {
  return (
    <label className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-4 py-4">
      <div className="min-w-0">
        <p className="font-semibold text-[color:var(--text-strong)]">{title}</p>
        <p className="mt-1 text-sm text-[color:var(--muted-fg)]">{copy}</p>
      </div>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="h-7 w-12 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--panel-bg)] transition-colors peer-checked:border-[color:var(--brand-primary)] peer-checked:bg-[color:var(--brand-primary)]" />
        <span className="pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function toDraft(data: SettingsPayload | null) {
  return {
    name: data?.profile.name ?? "",
    station: data?.profile.station ?? "SOQ",
    theme: data?.settings?.theme ?? "light",
    compactRows: data?.settings?.compactRows ?? false,
    sidebarCollapsed: data?.settings?.sidebarCollapsed ?? false,
    autoRefresh: data?.settings?.autoRefresh ?? true,
    refreshIntervalSeconds: data?.settings?.refreshIntervalSeconds ?? 5,
    cutoffAlert: data?.settings?.cutoffAlert ?? true,
    exceptionAlert: data?.settings?.exceptionAlert ?? true,
    soundAlert: data?.settings?.soundAlert ?? false,
    emailDigest: data?.settings?.emailDigest ?? false,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SettingsPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["label"]>("Profile");
  const [saving, setSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "operator", station: "SOQ" });
  const [draft, setDraft] = useState(() => toDraft(null));
  const [openGroupId, setOpenGroupId] = useState<(typeof tabGroups)[number]["id"]>("account");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserDraft, setEditingUserDraft] = useState<{
    role: SettingsPayload["users"][number]["role"];
    status: SettingsPayload["users"][number]["status"];
    station: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: SettingsPayload) => {
        setData(payload);
        setDraft(toDraft(payload));
      })
      .catch(() => undefined);
  }, []);

  async function saveSettings() {
    setSaving(true);
    const nextDraft = { ...draft };
    setTheme(nextDraft.theme);
    window.dispatchEvent(new CustomEvent("skyhub:theme-change", { detail: nextDraft.theme }));
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextDraft),
    });
    if (!response.ok) {
      setSaving(false);
      return;
    }
    const payload = (await response.json()) as SettingsPayload;
    setData(payload);
    setDraft(toDraft(payload));
    router.refresh();
    setSaving(false);
  }

  async function inviteUser() {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { user: SettingsPayload["users"][number] };
    setData((current) => (current ? { ...current, users: [...current.users, payload.user] } : current));
    setInviteForm({ name: "", email: "", role: "operator", station: "SOQ" });
    setShowInviteForm(false);
  }

  async function updateUser(userId: string, patch: Partial<SettingsPayload["users"][number]>) {
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { user: SettingsPayload["users"][number] };
    setData((current) =>
      current
        ? {
            ...current,
            users: current.users.map((user) => (user.id === payload.user.id ? payload.user : user)),
          }
        : current,
    );
    return payload.user;
  }

  function startEditingUser(user: SettingsPayload["users"][number]) {
    setEditingUserId(user.id);
    setEditingUserDraft({
      role: user.role,
      status: user.status,
      station: user.station,
    });
  }

  async function saveEditingUser() {
    if (!editingUserId || !editingUserDraft) return;
    const updatedUser = await updateUser(editingUserId, editingUserDraft);
    if (!updatedUser) return;
    setEditingUserId(null);
    setEditingUserDraft(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        subtitle="Kelola profil, role, notifikasi, tampilan, dan preferensi sidebar secara persisten agar pengalaman operator tetap stabil lintas sesi."
        actions={
          <button type="button" className="btn btn-primary" onClick={saveSettings} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <OpsPanel className="p-4">
          <div className="space-y-3">
            {tabGroups.map((group) => (
              <div key={group.id} className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-3 py-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-[18px] px-2 py-2 text-left text-[color:var(--text-strong)]"
                  onClick={() => setOpenGroupId(group.id)}
                >
                  <span>
                    <span className="block text-sm font-semibold">{group.label}</span>
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted-2)]">
                      {group.items.length} submenu
                    </span>
                  </span>
                  <ChevronRight size={16} className={cn("transition-transform", openGroupId === group.id && "rotate-90")} />
                </button>

                {openGroupId === group.id ? (
                  <div className="mt-2 space-y-1">
                    {group.items.map((label) => {
                      const tab = tabs.find((entry) => entry.label === label)!;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.label}
                          type="button"
                          className={cn(
                            "sidebar-link w-full justify-between px-4",
                            activeTab === tab.label && "sidebar-link-active",
                          )}
                          onClick={() => {
                            setOpenGroupId(group.id);
                            setActiveTab(tab.label);
                          }}
                        >
                          <span className="flex items-center gap-3">
                            <Icon size={18} />
                            <span>{tab.label}</span>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </OpsPanel>

        <div className="space-y-6">
          {activeTab === "Profile" ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-[2rem] font-[family:var(--font-heading)] font-black tracking-[-0.04em] text-[color:var(--text-strong)]">
                  Profile
                </h2>
                <p className="mt-1 text-base text-[color:var(--muted-fg)]">Informasi akun operator</p>
              </div>

              <OpsPanel className="p-5">
                <SectionHeader title="Profil Operator" subtitle="Informasi akun dan identitas operator aktif" />

                <div className="mt-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-primary)] font-[family:var(--font-heading)] text-[2rem] font-black tracking-[-0.04em] text-white">
                      {getInitials(draft.name || data?.profile.name || "Sky Hub")}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-[family:var(--font-heading)] text-[2rem] font-black tracking-[-0.04em] text-[color:var(--text-strong)]">
                        {draft.name || data?.profile.name || "-"}
                      </p>
                      <p className="truncate text-base text-[color:var(--muted-fg)]">{data?.profile.email ?? "-"}</p>
                      {data?.profile.role ? (
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-xl px-3 py-1 text-sm font-semibold",
                            rolePillClasses[data.profile.role],
                          )}
                        >
                          {ROLE_LABELS[data.profile.role]}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    <div>
                      <label className="label">Nama Lengkap</label>
                      <input
                        className="input-field"
                        value={draft.name}
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="label">Email</label>
                      <input className="input-field" value={data?.profile.email ?? ""} readOnly />
                    </div>

                    <div>
                      <label className="label">Stasiun</label>
                      <select
                        className="select-field"
                        value={draft.station}
                        onChange={(event) => setDraft((current) => ({ ...current, station: event.target.value }))}
                      >
                        {stationOptions.map((station) => (
                          <option key={station} value={station}>
                            {station}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </OpsPanel>
            </div>
          ) : null}

          {activeTab === "User & Role" ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-[2rem] font-[family:var(--font-heading)] font-black tracking-[-0.04em] text-[color:var(--text-strong)]">
                  User &amp; Role
                </h2>
                <p className="mt-1 text-base text-[color:var(--muted-fg)]">Tim, undangan, hak akses</p>
              </div>

              <OpsPanel className="p-5">
                <SectionHeader
                  title="Anggota Tim"
                  subtitle="Operator aktif dan penempatan stasiun"
                  action={
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowInviteForm((current) => !current)}
                    >
                      <Plus size={16} />
                      {showInviteForm ? "Tutup" : "Undang User"}
                    </button>
                  }
                />

                {showInviteForm ? (
                  <div className="mt-5 grid gap-4 rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4 lg:grid-cols-[1.1fr_1.5fr_0.9fr_0.8fr_auto]">
                    <input
                      className="input-field"
                      placeholder="Nama"
                      value={inviteForm.name}
                      onChange={(event) => setInviteForm((current) => ({ ...current, name: event.target.value }))}
                    />
                    <input
                      className="input-field"
                      placeholder="Email"
                      value={inviteForm.email}
                      onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                    />
                    <select
                      className="select-field"
                      value={inviteForm.role}
                      onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
                    >
                      <option value="operator">Operator</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select
                      className="select-field"
                      value={inviteForm.station}
                      onChange={(event) => setInviteForm((current) => ({ ...current, station: event.target.value }))}
                    >
                      {stationOptions.map((station) => (
                        <option key={station} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-primary" onClick={inviteUser}>
                      <Plus size={16} />
                      Kirim
                    </button>
                  </div>
                ) : null}

                <div className="mt-5 overflow-hidden rounded-[24px] border border-[color:var(--border-soft)]">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Stasiun</th>
                        <th>Status</th>
                        <th className="text-right"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.users ?? []).map((user) => {
                        const isEditing = editingUserId === user.id && editingUserDraft;

                        return (
                          <tr key={user.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-primary-soft)] text-sm font-bold text-[color:var(--brand-primary)]">
                                  {getInitials(user.name)}
                                </div>
                                <p className="font-semibold text-[color:var(--text-strong)]">{user.name}</p>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              {isEditing ? (
                                <select
                                  className="select-field h-10"
                                  value={editingUserDraft.role}
                                  onChange={(event) =>
                                    setEditingUserDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            role: event.target.value as SettingsPayload["users"][number]["role"],
                                          }
                                        : current,
                                    )
                                  }
                                >
                                  <option value="operator">Operator</option>
                                  <option value="supervisor">Supervisor</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <span className="font-medium text-[color:var(--text-strong)]">{ROLE_LABELS[user.role]}</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  className="select-field h-10"
                                  value={editingUserDraft.station}
                                  onChange={(event) =>
                                    setEditingUserDraft((current) =>
                                      current ? { ...current, station: event.target.value } : current,
                                    )
                                  }
                                >
                                  {stationOptions.map((station) => (
                                    <option key={station} value={station}>
                                      {station}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-semibold text-[color:var(--brand-primary)]">{user.station}</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  className="select-field h-10"
                                  value={editingUserDraft.status}
                                  onChange={(event) =>
                                    setEditingUserDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            status: event.target.value as SettingsPayload["users"][number]["status"],
                                          }
                                        : current,
                                    )
                                  }
                                >
                                  <option value="active">Active</option>
                                  <option value="invited">Invited</option>
                                  <option value="disabled">Disabled</option>
                                </select>
                              ) : (
                                <StatusBadge value={user.status} label={userStatusLabels[user.status]} className="normal-case tracking-normal" />
                              )}
                            </td>
                            <td className="text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button type="button" className="btn btn-primary h-10 px-4" onClick={saveEditingUser}>
                                    <Check size={15} />
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary h-10 px-4"
                                    onClick={() => {
                                      setEditingUserId(null);
                                      setEditingUserDraft(null);
                                    }}
                                  >
                                    <X size={15} />
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary h-10 px-4"
                                  onClick={() => startEditingUser(user)}
                                >
                                  <PencilLine size={15} />
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </OpsPanel>

              <OpsPanel className="p-5">
                <SectionHeader title="Definisi Role" subtitle="Hak akses untuk setiap role" />
                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {roleDefinitionCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-[20px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4"
                    >
                      <h3 className="font-[family:var(--font-heading)] text-[1.25rem] font-extrabold tracking-[-0.03em] text-[color:var(--text-strong)]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-base leading-7 text-[color:var(--muted-fg)]">{card.copy}</p>
                    </div>
                  ))}
                </div>
              </OpsPanel>
            </div>
          ) : null}

          {activeTab === "Notifications" ? (
            <OpsPanel className="p-5">
              <SectionHeader title="Notifications" subtitle="Pilih alert yang penting untuk operator control room dan supervisor." />
              <div className="mt-5 space-y-4">
                {[
                  ["cutoffAlert", "Cutoff alerts", "Peringatan saat cutoff penerbangan sudah dekat."],
                  ["exceptionAlert", "Exception alerts", "Peringatan untuk shipment hold atau data bermasalah."],
                  ["soundAlert", "Sound alerts", "Aktifkan bunyi notifikasi di control room."],
                  ["emailDigest", "Email digest", "Ringkasan harian untuk supervisor atau admin."],
                ].map(([key, title, copy]) => (
                  <PreferenceToggleCard
                    key={key}
                    title={title}
                    copy={copy}
                    checked={Boolean(draft[key as keyof typeof draft])}
                    onChange={(checked) => setDraft((current) => ({ ...current, [key]: checked }))}
                  />
                ))}
              </div>
            </OpsPanel>
          ) : null}

          {activeTab === "Display Preferences" ? (
            <OpsPanel className="p-5">
              <SectionHeader title="Display Preferences" subtitle="Atur mode tampilan utama tanpa mengubah perilaku backend atau data." />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Theme</label>
                  <select className="select-field" value={draft.theme} onChange={(event) => setDraft((current) => ({ ...current, theme: event.target.value as "light" | "dark" }))}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div>
                  <label className="label">Refresh Interval (detik)</label>
                  <input className="input-field" type="number" min={5} max={60} value={draft.refreshIntervalSeconds} onChange={(event) => setDraft((current) => ({ ...current, refreshIntervalSeconds: Number(event.target.value) }))} />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <PreferenceToggleCard
                  title="Compact row mode"
                  copy="Menghemat ruang untuk operator dengan banyak tabel."
                  checked={draft.compactRows}
                  onChange={(checked) => setDraft((current) => ({ ...current, compactRows: checked }))}
                />
                <PreferenceToggleCard
                  title="Auto-refresh"
                  copy="Refresh data otomatis untuk ritme kargo udara yang cepat."
                  checked={draft.autoRefresh}
                  onChange={(checked) => setDraft((current) => ({ ...current, autoRefresh: checked }))}
                />
              </div>
            </OpsPanel>
          ) : null}

          {activeTab === "Sidebar Preferences" ? (
            <OpsPanel className="p-5">
              <SectionHeader title="Sidebar Preferences" subtitle="Kontrol perilaku shell agar nyaman dipakai pada layar lebar maupun sempit." />
              <div className="mt-5">
                <PreferenceToggleCard
                  title="Default collapsed sidebar"
                  copy="Aktifkan mode collapse sebagai default untuk layar yang lebih sempit."
                  checked={draft.sidebarCollapsed}
                  onChange={(checked) => setDraft((current) => ({ ...current, sidebarCollapsed: checked }))}
                />
              </div>
            </OpsPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
