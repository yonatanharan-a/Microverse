# 🪲 Microverse

A modern, responsive, static website for showcasing arthropods and terrarium life you
**breed, sell, or trade**.
It is **not** an online shop — visitors browse species, view photos, watch videos, read care
guides, and contact you directly.

Built with plain **HTML + CSS + vanilla JavaScript**. No frameworks, no build step, no database.
Host it for free on GitHub Pages, Netlify, Cloudflare Pages, or any static web host.

> Species **names** are in English; **descriptions, care info, and notes** are written in Hebrew.
> Hebrew text auto-aligns right thanks to `dir="auto"` in the markup — just write naturally.

---

## 📁 Project structure

```
catalog/
├── index.html        ← page layout (rarely needs editing)
├── style.css         ← all styling + theme colors
├── script.js         ← loads species.json and builds the page
├── species.json      ← YOUR CONTENT lives here — edit this to add species
│
├── images/           ← species photos, one folder per species
│   └── Species_Name/
│
├── manuals/          ← PDF care guides
│
└── isopods/, millipedes/, ...  ← existing photo folders
```

---

## ▶️ Running the site locally

Because the site loads `species.json` with `fetch()`, you must open it through a
**local web server** (opening `index.html` directly with `file://` will be blocked by the browser).

Easiest options:

- **VS Code:** install the "Live Server" extension → right-click `index.html` → *Open with Live Server*.
- **Python:** run `python -m http.server` in this folder, then open http://localhost:8000
- **Node:** run `npx serve` in this folder.

When deployed to GitHub Pages / Netlify / Cloudflare it just works — those serve over HTTP.

---

## ✏️ Common maintenance tasks

### ➕ Add a new species

Open `species.json` and add an object to the `"species"` array:

```json
{
  "name": "Megasoma occidentalis",
  "category": "Beetles",
  "availability": "Available",
  "difficulty": "Intermediate",
  "description": "Large rhinoceros beetle.",
  "care": "Rear larvae in deep flake soil; feed adults beetle jelly.",
  "images": [
    "images/Megasoma_occidentalis/1.jpg",
    "images/Megasoma_occidentalis/2.jpg"
  ],
  "youtube": ["https://www.youtube.com/watch?v=VIDEO_ID"],
  "manuals": ["manuals/Megasoma_Care.pdf"],
  "notes": "Optional extra remarks shown to visitors."
}
```

**Field reference**

| Field          | Required | Notes                                                                 |
|----------------|----------|-----------------------------------------------------------------------|
| `name`         | ✅       | Scientific name (shown in italics).                                   |
| `category`     | ✅       | Must match a value in the `"categories"` list.                        |
| `availability` | ✅       | `"Available"`, `"Breeding Project"`, `"Coming Soon"`, or `"Not Available"`. |
| `difficulty`   | optional | e.g. `"Beginner"`, `"Intermediate"`, `"Advanced"`.                    |
| `description`  | optional | Short summary shown on the card and in the detail view.               |
| `care`         | optional | Longer care information shown in the detail view.                     |
| `images`       | optional | Array of image paths. The first one is the card cover.               |
| `youtube`      | optional | Array of YouTube URLs (watch, youtu.be, embed, or shorts links).      |
| `manuals`      | optional | Array of PDF paths in `manuals/`.                                     |
| `notes`        | optional | Any extra notes.                                                      |

> ⚠️ JSON is strict: use straight double quotes `"`, and **no trailing comma** after the last
> item in a list or object. If the page shows an error, a comma or quote is usually the cause.

### 🗂️ Add a new category

Add its name to the `"categories"` array at the top of `species.json`:

```json
"categories": ["Beetles", "Cockroaches", "Tarantulas", "Millipedes", "Scorpions", "Isopods", "Other Invertebrates", "Mantids"]
```

Then use that exact name in each species' `"category"` field. A new tab appears automatically.

### 🖼️ Add new photos

1. Create a folder in `images/`, e.g. `images/Megasoma_occidentalis/`.
2. Drop your JPG/WebP files in it.
3. List them in that species' `"images"` array. The first image becomes the card cover.

### 📄 Add a PDF care guide

1. Put the PDF in the `manuals/` folder.
2. Add its path to the species' `"manuals"` array, e.g. `"manuals/Megasoma_Care.pdf"`.

### ➕ Add a new field to every species (advanced)

1. Add the field to each species in `species.json`.
2. Show it in the detail view by editing the `openModal()` function in `script.js`
   (copy an existing `modal-section` block).

### 🎨 Change the theme / colors

All colors are CSS variables at the top of `style.css`, in the `:root` (light) and
`[data-theme="dark"]` (dark) blocks. Change `--accent` to re-brand the whole site.

### ✉️ Change the contact email

Edit the `mailto:` link in the footer of `index.html`.

---

## ✨ Features

- Category tabs (auto-generated, easy to extend)
- Two special tabs — **📄 Manuals** and **🎬 Videos** — that gather every PDF / YouTube
  video across all species into one place (defined by `SPECIAL_TABS` in `script.js`)
- Live search across names, descriptions, and care notes
- Availability filter + colored availability badges (incl. a blue **Coming Soon** badge)
- Responsive card grid (works 20 → 500+ species)
- Detail modal with image carousel, YouTube embeds, and PDF links
- English names with Hebrew (RTL) descriptions
- Dark mode with saved preference
- Fully static, fast, and mobile-friendly

---

## 🚀 Deploying

**GitHub Pages:** push this folder to a repo → *Settings → Pages* → deploy from the `main` branch root.

**Netlify / Cloudflare Pages:** drag-and-drop the folder, or connect the repo. No build command needed —
set the publish directory to this folder.
