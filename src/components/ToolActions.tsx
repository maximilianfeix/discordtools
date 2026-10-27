import { useEffect, useState } from "preact/hooks";
import Icon from "./Icon";
import { getFavorites, pushRecent, toggleFavorite } from "../lib/storage";
import { copyText, toast } from "./ui/toast";
import type { Lang } from "../i18n/ui";

const L = {
  de: { fav: "Favorit", unfav: "Favorit", favAria: "Zu Favoriten hinzufügen", unfavAria: "Aus Favoriten entfernen", share: "Link", shareAria: "Link zu diesem Tool kopieren", copied: "Link kopiert", fail: "Kopieren fehlgeschlagen", added: "Zu Favoriten hinzugefügt", removed: "Aus Favoriten entfernt" },
  en: { fav: "Favorite", unfav: "Favorite", favAria: "Add to favorites", unfavAria: "Remove from favorites", share: "Link", shareAria: "Copy link to this tool", copied: "Link copied", fail: "Copy failed", added: "Added to favorites", removed: "Removed from favorites" },
};

export default function ToolActions({ id, lang }: { id: string; lang: Lang }) {
  const s = L[lang];
  const [fav, setFav] = useState(false);
  useEffect(() => {
    setFav(getFavorites().includes(id));
    pushRecent(id);
  }, [id]);
  return (
    <div class="row tool-actions">
      <button
        type="button"
        class={fav ? "btn btn-sm is-fav" : "btn btn-sm"}
        aria-pressed={fav}
        aria-label={fav ? s.unfavAria : s.favAria}
        onClick={() => {
          const on = toggleFavorite(id);
          setFav(on);
          toast(on ? s.added : s.removed);
        }}
      >
        <Icon name="Star" size={15} />
        <span>{s.fav}</span>
      </button>
      <button type="button" class="btn btn-sm" aria-label={s.shareAria} onClick={() => copyText(location.href, s.copied, s.fail)}>
        <Icon name="Share2" size={15} />
        <span>{s.share}</span>
      </button>
    </div>
  );
}
