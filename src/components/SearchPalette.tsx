import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import Icon from "./Icon";
import { getFavorites, getRecent } from "../lib/storage";

interface Item {
  id: string;
  icon: string;
  name: string;
  short: string;
  href: string;
  category: string;
  terms: string;
}

interface Strings {
  placeholder: string;
  empty: string;
  recent: string;
  favorites: string;
  all: string;
  hint: string;
  label: string;
  short: string;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
}

function score(item: Item, q: string): number {
  const name = normalize(item.name);
  const terms = normalize(item.terms + " " + item.short);
  let total = 0;
  for (const word of q.split(/\s+/).filter(Boolean)) {
    if (name.startsWith(word)) total += 10;
    else if (name.includes(word)) total += 6;
    else if (terms.includes(word)) total += 3;
    else return 0;
  }
  return total;
}

export default function SearchPalette({ items, strings }: { items: Item[]; strings: Strings }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [mac, setMac] = useState(false);

  const open = () => {
    setFavs(getFavorites());
    setRecent(getRecent());
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  };

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        dialog.current?.open ? dialog.current.close() : open();
      } else if (e.key === "/" && !typing && !dialog.current?.open) {
        e.preventDefault();
        open();
      }
    };
    const onOpen = () => open();
    window.addEventListener("keydown", onKey);
    window.addEventListener("dt:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("dt:search", onOpen);
    };
  }, []);

  const sections = useMemo(() => {
    const q = normalize(query.trim());
    if (q) {
      const hits = items
        .map((item) => ({ item, s: score(item, q) }))
        .filter((h) => h.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((h) => h.item);
      return [{ title: "", list: hits }];
    }
    const byId = (id: string) => items.find((i) => i.id === id);
    const out: { title: string; list: Item[] }[] = [];
    const f = favs.map(byId).filter(Boolean) as Item[];
    const r = recent.filter((id) => !favs.includes(id)).map(byId).filter(Boolean) as Item[];
    if (f.length) out.push({ title: strings.favorites, list: f });
    if (r.length) out.push({ title: strings.recent, list: r });
    out.push({ title: strings.all, list: items.filter((i) => !favs.includes(i.id) && !recent.includes(i.id)) });
    return out;
  }, [query, items, favs, recent]);

  const flat = sections.flatMap((s) => s.list);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    dialog.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const hit = flat[active];
      if (hit) {
        e.preventDefault();
        location.href = hit.href;
      }
    }
  };

  let index = -1;
  return (
    <>
      <button type="button" class="search-trigger" onClick={open} aria-haspopup="dialog">
        <Icon name="Search" size={16} />
        <span class="label">{strings.short}</span>
        <kbd>{mac ? "⌘" : "Ctrl"} K</kbd>
        <span class="sr-only">{strings.label}</span>
      </button>
      <dialog
        ref={dialog}
        class="palette"
        aria-label={strings.label}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div class="palette-box">
          <div class="palette-input">
            <Icon name="Search" size={18} />
            <input
              ref={input}
              type="search"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
              onKeyDown={onKeyDown}
              placeholder={strings.placeholder}
              aria-label={strings.label}
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-activedescendant={flat[active] ? `pi-${flat[active]!.id}` : undefined}
              autocomplete="off"
              spellcheck={false}
            />
            <button type="button" class="btn btn-ghost btn-sm btn-icon" onClick={() => dialog.current?.close()} aria-label="Esc">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div class="palette-list" id="palette-list" role="listbox">
            {flat.length === 0 && <p class="palette-empty">{strings.empty}</p>}
            {sections.map((section) =>
              section.list.length ? (
                <div role="group" aria-label={section.title || undefined} key={section.title}>
                  {section.title && <div class="palette-section">{section.title}</div>}
                  {section.list.map((item) => {
                    index++;
                    const i = index;
                    return (
                      <a
                        id={`pi-${item.id}`}
                        key={item.id}
                        href={item.href}
                        role="option"
                        aria-selected={i === active}
                        data-index={i}
                        class="palette-item"
                        onMouseMove={() => setActive(i)}
                      >
                        <span class="pi-icon"><Icon name={item.icon} size={18} /></span>
                        <span class="pi-text">
                          <span class="pi-name">{item.name}</span>
                          <span class="pi-short">{item.short}</span>
                        </span>
                        <span class="pi-cat">{item.category}</span>
                      </a>
                    );
                  })}
                </div>
              ) : null,
            )}
          </div>
          <div class="palette-foot">{strings.hint}</div>
        </div>
      </dialog>
    </>
  );
}
