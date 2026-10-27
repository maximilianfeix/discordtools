# Legal texts that are not in the repository

`legal/impressum.md` holds the operator details (name, address, contact) for `/impressum` and `/en/imprint`.
It is gitignored on purpose. In CI it comes from the repository secret `IMPRESSUM_MD`.

Format: paragraphs separated by blank lines, `## ` for headings, single line breaks are kept.

```
## Angaben gemäß § 5 DDG
Max Mustermann
Musterstraße 1
12345 Musterstadt

## Kontakt
E-Mail: kontakt@discordtools.de
```
