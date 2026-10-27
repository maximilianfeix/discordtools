import { useEffect, useState } from "preact/hooks";
import Icon from "./Icon";
import { getFavorites, getRecent } from "../lib/storage";

interface Item { id: string; name: string; href: string; icon: string }

/** Favorites + recently used row on the home page. Renders nothing until there is something to show. */
export default function HomeFavorites({ items, labels }: { items: Item[]; labels: { favorites: string; recent: string } }) {
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const load = () => {
      setFavs(getFavorites());
      setRecent(getRecent());
    };
    load();
    window.addEventListener("dt:favorites", load);
    return () => window.removeEventListener("dt:favorites", load);
  }, []);
  const pick = (ids: string[]) => ids.map((id) => items.find((i) => i.id === id)).filter(Boolean) as Item[];
  const groups = [
    { title: labels.favorites, list: pick(favs), icon: "Star" },
    { title: labels.recent, list: pick(recent.filter((r) => !favs.includes(r))), icon: "Clock" },
  ].filter((g) => g.list.length);
  if (!groups.length) return null;
  return (
    <div class="home-quick">
      {groups.map((g) => (
        <div class="hq-group" key={g.title}>
          <span class="hq-title"><Icon name={g.icon} size={14} />{g.title}</span>
          <div class="hq-list">
            {g.list.map((i) => (
              <a class="chip hq-chip" href={i.href} key={i.id}>
                <Icon name={i.icon} size={14} />
                {i.name}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
