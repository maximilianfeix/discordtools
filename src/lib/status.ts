/** Types, grouping and German/English labels for discordstatus.com (Atlassian Statuspage v2). */
import type { Lang } from "../i18n/ui";

export const SUMMARY_URL = "https://discordstatus.com/api/v2/summary.json";

export type ComponentStatus = "operational" | "degraded_performance" | "partial_outage" | "major_outage" | "under_maintenance";
export type Indicator = "none" | "minor" | "major" | "critical" | "maintenance";

export interface SpComponent {
  id: string;
  name: string;
  status: ComponentStatus;
  description: string | null;
  position: number;
  group: boolean;
  group_id: string | null;
  only_show_if_degraded: boolean;
  components?: string[];
  updated_at?: string;
}

export interface SpUpdate {
  id: string;
  status: string;
  body: string;
  created_at: string;
  display_at?: string;
}

export interface SpIncident {
  id: string;
  name: string;
  status: string;
  impact: string;
  shortlink?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  resolved_at?: string | null;
  scheduled_for?: string | null;
  scheduled_until?: string | null;
  incident_updates: SpUpdate[];
  components?: { id: string; name: string }[];
}

export interface Summary {
  page: { id: string; name: string; url: string; updated_at: string };
  status: { indicator: Indicator; description: string };
  components: SpComponent[];
  incidents: SpIncident[];
  scheduled_maintenances: SpIncident[];
}

export interface ComponentGroup {
  id: string;
  name: string;
  status: ComponentStatus;
  /** worst child status (groups report their own status too, but we compute it to be safe) */
  children: SpComponent[];
  standalone: boolean;
}

const SEVERITY: Record<ComponentStatus, number> = {
  operational: 0,
  under_maintenance: 1,
  degraded_performance: 2,
  partial_outage: 3,
  major_outage: 4,
};

export function worst(statuses: ComponentStatus[]): ComponentStatus {
  return statuses.reduce<ComponentStatus>((w, s) => ((SEVERITY[s] ?? 0) > (SEVERITY[w] ?? 0) ? s : w), "operational");
}

/** Groups components the way discordstatus.com shows them. Hidden-unless-degraded entries are dropped while operational. */
export function groupComponents(list: SpComponent[]): ComponentGroup[] {
  const visible = (c: SpComponent) => !c.only_show_if_degraded || c.status !== "operational";
  const byId = new Map(list.map((c) => [c.id, c]));
  const out: ComponentGroup[] = [];
  for (const c of [...list].sort((a, b) => a.position - b.position)) {
    if (c.group_id) continue;
    if (c.group) {
      const children = list
        .filter((x) => x.group_id === c.id)
        .concat((c.components ?? []).map((id) => byId.get(id)).filter((x): x is SpComponent => !!x && x.group_id !== c.id))
        .sort((a, b) => a.position - b.position);
      out.push({ id: c.id, name: c.name, status: worst([c.status, ...children.map((x) => x.status)]), children, standalone: false });
    } else if (visible(c)) {
      out.push({ id: c.id, name: c.name, status: c.status, children: [], standalone: true });
    }
  }
  return out;
}

export function overallFromComponents(list: SpComponent[]): ComponentStatus {
  return worst(list.map((c) => c.status));
}

type L = Record<Lang, string>;

export const COMPONENT_STATUS: Record<ComponentStatus, L> = {
  operational: { de: "Läuft", en: "Operational" },
  degraded_performance: { de: "Eingeschränkt", en: "Degraded performance" },
  partial_outage: { de: "Teilausfall", en: "Partial outage" },
  major_outage: { de: "Großer Ausfall", en: "Major outage" },
  under_maintenance: { de: "Wartung", en: "Maintenance" },
};

export const INDICATOR: Record<Indicator, L> = {
  none: { de: "Alle Systeme laufen", en: "All systems operational" },
  minor: { de: "Kleinere Störung", en: "Minor disruption" },
  major: { de: "Größere Störung", en: "Major disruption" },
  critical: { de: "Kritischer Ausfall", en: "Critical outage" },
  maintenance: { de: "Wartungsarbeiten", en: "Under maintenance" },
};

export const INCIDENT_STATUS: Record<string, L> = {
  investigating: { de: "Wird untersucht", en: "Investigating" },
  identified: { de: "Ursache gefunden", en: "Identified" },
  monitoring: { de: "Wird beobachtet", en: "Monitoring" },
  resolved: { de: "Behoben", en: "Resolved" },
  postmortem: { de: "Nachbericht", en: "Postmortem" },
  scheduled: { de: "Geplant", en: "Scheduled" },
  in_progress: { de: "Läuft gerade", en: "In progress" },
  verifying: { de: "Wird geprüft", en: "Verifying" },
  completed: { de: "Abgeschlossen", en: "Completed" },
};

export const IMPACT: Record<string, L> = {
  none: { de: "Keine Auswirkung", en: "No impact" },
  minor: { de: "Geringe Auswirkung", en: "Minor impact" },
  major: { de: "Große Auswirkung", en: "Major impact" },
  critical: { de: "Kritisch", en: "Critical" },
  maintenance: { de: "Wartung", en: "Maintenance" },
};

/** German names (and a one-line meaning) for discordstatus.com components. Unknown names pass through. */
export const COMPONENT_INFO: Record<string, { de: string; hint: L }> = {
  API: { de: "API", hint: { de: "Bots, Integrationen und die Apps selbst", en: "Bots, integrations and the apps themselves" } },
  Gateway: { de: "Gateway", hint: { de: "Echtzeit-Verbindung: neue Nachrichten, Online-Status", en: "Real-time connection: new messages, presence" } },
  CloudFlare: { de: "Cloudflare", hint: { de: "Netzwerk vor Discord", en: "Network in front of Discord" } },
  "Media Proxy": { de: "Medien-Proxy", hint: { de: "Bilder, Link-Vorschauen und Anhänge", en: "Images, link previews and attachments" } },
  "Push Notifications": { de: "Push-Benachrichtigungen", hint: { de: "Benachrichtigungen auf dem Handy", en: "Notifications on your phone" } },
  Search: { de: "Suche", hint: { de: "Nachrichtensuche", en: "Message search" } },
  Voice: { de: "Sprache (Voice)", hint: { de: "Sprachkanäle, Anrufe, Streams – nach Region", en: "Voice channels, calls, streams – by region" } },
  Client: { de: "Apps", hint: { de: "Desktop, Web, iOS und Android", en: "Desktop, web, iOS and Android" } },
  "Third-party": { de: "Drittanbieter", hint: { de: "Dienste, auf die Discord angewiesen ist", en: "Services Discord depends on" } },
  "Server Web Pages": { de: "Server-Webseiten", hint: { de: "Öffentliche Server-Seiten", en: "Public server pages" } },
  Payments: { de: "Zahlungen", hint: { de: "Nitro, Boosts und Shop", en: "Nitro, boosts and shop" } },
  "Marketing Site": { de: "Website", hint: { de: "discord.com", en: "discord.com" } },
  Desktop: { de: "Desktop", hint: { de: "", en: "" } },
  Web: { de: "Web", hint: { de: "", en: "" } },
  iOS: { de: "iOS", hint: { de: "", en: "" } },
  Android: { de: "Android", hint: { de: "", en: "" } },
  "Tax Calculation Service": { de: "Steuerberechnung", hint: { de: "", en: "" } },
  "Creator Payouts": { de: "Creator-Auszahlungen", hint: { de: "", en: "" } },
  Brazil: { de: "Brasilien", hint: { de: "", en: "" } },
  "Hong Kong": { de: "Hongkong", hint: { de: "", en: "" } },
  India: { de: "Indien", hint: { de: "", en: "" } },
  Russia: { de: "Russland", hint: { de: "", en: "" } },
  Singapore: { de: "Singapur", hint: { de: "", en: "" } },
  "South Africa": { de: "Südafrika", hint: { de: "", en: "" } },
  "South Korea": { de: "Südkorea", hint: { de: "", en: "" } },
  "US Central": { de: "USA Mitte", hint: { de: "", en: "" } },
  "US East": { de: "USA Ost", hint: { de: "", en: "" } },
  "US South": { de: "USA Süd", hint: { de: "", en: "" } },
  "US West": { de: "USA West", hint: { de: "", en: "" } },
  Europe: { de: "Europa", hint: { de: "", en: "" } },
};

export function componentName(name: string, lang: Lang): string {
  return lang === "de" ? (COMPONENT_INFO[name]?.de ?? name) : name;
}
export function componentHint(name: string, lang: Lang): string {
  return COMPONENT_INFO[name]?.hint[lang] ?? "";
}

export function label(map: Record<string, L>, key: string, lang: Lang): string {
  return map[key]?.[lang] ?? key.replace(/_/g, " ");
}
