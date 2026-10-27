import { useMemo, useState } from "preact/hooks";
import { Lock, Search, TriangleAlert } from "lucide-preact";
import type { Lang } from "../../i18n/ui";
import { bit, toggleBit } from "../../lib/bitfield";
import { CATEGORIES, PERMISSIONS, PRESETS, presetValue, searchText, type Permission } from "../../lib/permissions";
import "./PermissionPicker.css";

const L = {
  de: {
    search: "Rechte suchen",
    searchPh: "z. B. bannen, Webhook, 8, MANAGE_",
    presets: "Vorlagen",
    all: "Alle",
    none: "Keine",
    clear: "Alles abwählen",
    noHits: "Kein Recht gefunden.",
    twoFA: "2FA",
    twoFATitle: "Braucht 2FA beim Server-Besitzer, wenn der Server 2FA für Moderation verlangt",
    danger: "Riskant",
    dangerTitle: "Gibt Macht über andere Mitglieder, den Server oder Massen-Pings",
    serverOnly: "nur Server",
    serverOnlyTitle: "Kann nicht pro Kanal überschrieben werden",
    selectedOnly: "Nur ausgewählte",
    of: "von",
  },
  en: {
    search: "Search permissions",
    searchPh: "e.g. ban, webhook, 8, MANAGE_",
    presets: "Presets",
    all: "All",
    none: "None",
    clear: "Clear all",
    noHits: "No permission found.",
    twoFA: "2FA",
    twoFATitle: "Owner needs 2FA when the server requires 2FA for moderation",
    danger: "Risky",
    dangerTitle: "Gives power over members, the server or mass pings",
    serverOnly: "server only",
    serverOnlyTitle: "Cannot be overwritten per channel",
    selectedOnly: "Selected only",
    of: "of",
  },
};

interface Props {
  value: bigint;
  onChange: (v: bigint) => void;
  lang: Lang;
  /** compact: collapsible groups, no descriptions – for embedding in other tools */
  compact?: boolean;
  /** unique prefix for element ids */
  idPrefix?: string;
  showPresets?: boolean;
}

export default function PermissionPicker({ value, onChange, lang, compact = false, idPrefix = "pp", showPresets = true }: Props) {
  const s = L[lang];
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => {
        const perms = PERMISSIONS.filter((p) => p.category === c.id).sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang));
        return { ...c, perms };
      }),
    [lang],
  );

  const matches = (p: Permission) => {
    if (selectedOnly && (value & bit(p.bit)) === 0n) return false;
    if (!q) return true;
    return q.split(/\s+/).every((w) => searchText(p).includes(w));
  };

  const setGroup = (perms: Permission[], on: boolean) => {
    let v = value;
    for (const p of perms) v = toggleBit(v, p.bit, on);
    onChange(v);
  };

  let anyHit = false;

  return (
    <div class={`pp ${compact ? "pp-compact" : ""}`}>
      <div class="pp-toolbar">
        <div class="field pp-search">
          <label for={`${idPrefix}-search`}>{s.search}</label>
          <div class="pp-search-box">
            <Search size={16} strokeWidth={1.75} aria-hidden="true" />
            <input
              id={`${idPrefix}-search`}
              class="input"
              type="search"
              value={query}
              placeholder={s.searchPh}
              autocomplete="off"
              spellcheck={false}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
        <div class="row pp-toolbar-actions">
          <label class="check pp-only">
            <input type="checkbox" checked={selectedOnly} onChange={(e) => setSelectedOnly((e.target as HTMLInputElement).checked)} />
            <span>{s.selectedOnly}</span>
          </label>
          <button type="button" class="btn btn-sm btn-ghost" onClick={() => onChange(value & ~PERMISSIONS.reduce((a, p) => a | bit(p.bit), 0n))}>
            {s.clear}
          </button>
        </div>
      </div>

      {showPresets && (
        <div class="pp-presets" role="group" aria-label={s.presets}>
          <span class="label">{s.presets}</span>
          <div class="pp-preset-list">
            {PRESETS.map((p) => {
              const pv = presetValue(p.id);
              const active = pv === value;
              return (
                <button
                  type="button"
                  key={p.id}
                  class={`pp-preset ${p.warn ? "is-warn" : ""}`}
                  aria-pressed={active}
                  title={p.hint[lang]}
                  onClick={() => onChange(pv)}
                >
                  {p.warn && <TriangleAlert size={14} strokeWidth={1.75} aria-hidden="true" />}
                  <span>{p.name[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div class="pp-groups">
        {groups.map((g) => {
          const visible = g.perms.filter(matches);
          if (!visible.length) return null;
          anyHit = true;
          const selected = g.perms.filter((p) => (value & bit(p.bit)) !== 0n).length;
          const allOn = visible.every((p) => (value & bit(p.bit)) !== 0n);
          const list = (
            <ul class="pp-list">
              {visible.map((p) => {
                const on = (value & bit(p.bit)) !== 0n;
                const id = `${idPrefix}-p${p.bit}`;
                return (
                  <li key={p.key} class={`pp-item ${on ? "is-on" : ""} ${p.dangerous ? "is-danger" : ""}`}>
                    <input id={id} type="checkbox" checked={on} onChange={() => onChange(toggleBit(value, p.bit))} />
                    <label for={id} class="pp-label">
                      <span class="pp-name">{p.name[lang]}</span>
                      <span class="pp-badges">
                        {p.dangerous && (
                          <span class="pp-badge pp-badge-danger" title={s.dangerTitle}>
                            <TriangleAlert size={12} strokeWidth={2} aria-hidden="true" />
                            {s.danger}
                          </span>
                        )}
                        {p.twoFA && (
                          <span class="pp-badge" title={s.twoFATitle}>
                            <Lock size={12} strokeWidth={2} aria-hidden="true" />
                            {s.twoFA}
                          </span>
                        )}
                        {!compact && p.scope.length === 0 && (
                          <span class="pp-badge pp-badge-muted" title={s.serverOnlyTitle}>
                            {s.serverOnly}
                          </span>
                        )}
                      </span>
                      {!compact && <span class="pp-desc">{p.desc[lang]}</span>}
                      <span class="pp-key mono">
                        {p.key} · 1 &lt;&lt; {p.bit}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          );
          const head = (
            <>
              <span class="pp-group-name">{g.name[lang]}</span>
              <span class="pp-count">
                {selected} {s.of} {g.perms.length}
              </span>
            </>
          );
          const toggleAll = (
            <button
              type="button"
              class="btn btn-sm btn-ghost pp-all"
              onClick={(e) => {
                e.preventDefault();
                setGroup(visible, !allOn);
              }}
              aria-label={`${allOn ? s.none : s.all}: ${g.name[lang]}`}
            >
              {allOn ? s.none : s.all}
            </button>
          );
          if (compact) {
            return (
              <details class="pp-group" key={g.id} open={!!q || selected > 0 || undefined}>
                <summary class="pp-group-head">
                  {head}
                  {toggleAll}
                </summary>
                {list}
              </details>
            );
          }
          return (
            <section class="pp-group" key={g.id} aria-label={g.name[lang]}>
              <div class="pp-group-head">
                {head}
                {toggleAll}
              </div>
              {list}
            </section>
          );
        })}
        {!anyHit && <p class="notice">{s.noHits}</p>}
      </div>
    </div>
  );
}
