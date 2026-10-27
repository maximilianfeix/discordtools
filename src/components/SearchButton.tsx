import Icon from "./Icon";

/** Big search field look-alike on the home page; opens the command palette. */
export default function SearchButton({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <button type="button" class="hero-search" onClick={() => window.dispatchEvent(new CustomEvent("dt:search"))} aria-label={label}>
      <Icon name="Search" size={20} />
      <span>{placeholder}</span>
      <kbd>/</kbd>
    </button>
  );
}
