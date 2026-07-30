# Images

Put species photos here, one folder per species.

Recommended structure:

```
images/
  Megasoma_occidentalis/
    1.jpg
    2.jpg
  Gromphadorhina_portentosa/
    1.jpg
```

Then reference them in `species.json`:

```json
"images": [
  "images/Megasoma_occidentalis/1.jpg",
  "images/Megasoma_occidentalis/2.jpg"
]
```

Tips:
- Use JPG or WebP and keep files under ~500 KB each for fast loading.
- File and folder names can contain spaces, but underscores are cleaner.
- The first image in the list is used as the card cover.
