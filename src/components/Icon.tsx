import {
  Activity, AtSign, Check, ChevronRight, CircleUserRound, Clock, Copy, Download, EyeOff, Flag, Hash, Languages,
  LayoutTemplate, Link, Menu, Moon, Paintbrush, Palette, Pipette, Radio, Ruler, ScrollText, Search, Server, ShieldCheck,
  Smile, Snowflake, Sparkles, SquareSlash, Star, Sun, Ticket, Type, UserSearch, Webhook, X, Lock, Globe, Zap, RefreshCw,
  Code, Plus, Trash2, ArrowUp, ArrowDown, Send, Upload, Share2, Tag, Eye, Pencil, Info, TriangleAlert, ExternalLink,
} from "lucide-preact";

const ICONS = {
  Activity, AtSign, Check, ChevronRight, CircleUserRound, Clock, Copy, Download, EyeOff, Flag, Hash, Languages,
  LayoutTemplate, Link, Menu, Moon, Paintbrush, Palette, Pipette, Radio, Ruler, ScrollText, Search, Server, ShieldCheck,
  Smile, Snowflake, Sparkles, SquareSlash, Star, Sun, Ticket, Type, UserSearch, Webhook, X, Lock, Globe, Zap, RefreshCw,
  Code, Plus, Trash2, ArrowUp, ArrowDown, Send, Upload, Share2, Tag, Eye, Pencil, Info, TriangleAlert, ExternalLink,
};

// lucide dropped brand icons, so the GitHub mark is inlined.
function Github({ size = 18, class: className }: { size?: number; class?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class={className}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export type IconName = keyof typeof ICONS;

export default function Icon({ name, size = 18, class: className }: { name: string; size?: number; class?: string }) {
  if (name === "Github") return <Github size={size} class={className} />;
  const C = ICONS[name as IconName] ?? Sparkles;
  return <C size={size} strokeWidth={1.75} aria-hidden="true" class={className} />;
}
