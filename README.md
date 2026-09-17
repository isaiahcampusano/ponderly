# Ponderly

Static Ponderly debate site. Stories are defined in `data/stories.json` and
their locally committed editorial illustrations live in `assets/stories`.

## Optimizing story images

Place source PNG/JPEG/TIFF files in `assets/stories/originals`, install the
development dependency, and run:

```sh
npm install
npm run build:images
```

The image script writes 400px and 800px WebP variants. Add the generated
variants to a story's `image.srcset` when a source needs responsive sizes.

---
# Assets 
https://github.com/isaiahcampusano/ponderly/issues/2#issue-5468639799
