const fs = require("fs");
const path = require("path");

const sourceRoot = path.join("C:\\Users\\User\\Downloads");
const publicDir = path.join(__dirname, "public");
const destRoot = path.join(publicDir, "work");

const WORKS = [
  { folders: ["Balcony Waterproofing"], slug: "balcony", title: "Balcony Waterproofing" },
  { folders: ["Basement Waterproofing"], slug: "basement", title: "Basement Shahabad Stone Box Type Waterproofing" },
  { folders: ["Bathroom Waterproofing"], slug: "bathroom", title: "Bathroom Waterproofing" },
  { folders: ["Kemperol Waterproofing"], slug: "kemperol", title: "Kemperol Waterproofing" },
  { folders: ["Kitchen Waterproofing"], slug: "kitchen", title: "Kitchen Waterproofing" },
  { folders: ["Over Head Water Tank Waterproofing"], slug: "overhead-tank", title: "Overhead Water Tank Waterproofing" },
  { folders: ["Planters Waterproofing"], slug: "planters", title: "Planters Waterproofing" },
  { folders: ["Podium Waterproofing"], slug: "podium", title: "Podium Waterproofing" },
  { folders: ["Slopping Roof Waterproofing"], slug: "sloping-roof", title: "Sloping Roof Waterproofing" },
  { folders: ["STP Tank Waterproofing"], slug: "stp-tank", title: "STP Tank Waterproofing" },
  { folders: ["Terrace Waterproofing", "Terrace Waterproofing v1"], slug: "terrace", title: "Terrace Waterproofing" },
  { folders: ["Top Waterproofing"], slug: "top", title: "Top Waterproofing" },
  { folders: ["Under Ground Water Tank Waterproofing"], slug: "underground-tank", title: "Underground Water Tank Waterproofing" },
];

function copyNumbered(files, destDir, prefix) {
  return files.map((file, index) => {
    const ext = path.extname(file).toLowerCase();
    const name = `${prefix}-${String(index + 1).padStart(2, "0")}${ext}`;
    fs.copyFileSync(file, path.join(destDir, name));
    return name;
  });
}

function filesIn(folder) {
  const source = path.join(sourceRoot, folder);
  if (!fs.existsSync(source)) throw new Error(`Missing folder: ${source}`);
  return fs.readdirSync(source).map((name) => path.join(source, name)).filter((file) => fs.statSync(file).isFile());
}

const htmlOnly = process.argv.includes("--html-only");
if (!htmlOnly) {
  fs.rmSync(destRoot, { recursive: true, force: true });
  fs.mkdirSync(destRoot, { recursive: true });
}

const catalog = WORKS.map(({ folders, slug, title }) => {
  const dest = path.join(destRoot, slug);
  if (htmlOnly) {
    const names = fs.readdirSync(dest).sort();
    return {
      slug,
      title,
      photos: names.filter((name) => name.startsWith("photo-")),
      videos: names.filter((name) => name.startsWith("video-")),
    };
  }
  fs.mkdirSync(dest, { recursive: true });
  const photos = folders.flatMap((folder) => filesIn(folder).filter((file) => /\.(jpe?g|png|webp)$/i.test(file)).sort((a, b) => path.basename(a).localeCompare(path.basename(b))));
  const videos = folders.flatMap((folder) => filesIn(folder).filter((file) => /\.mp4$/i.test(file)).sort((a, b) => path.basename(a).localeCompare(path.basename(b))));
  return {
    slug,
    title,
    photos: copyNumbered(photos, dest, "photo"),
    videos: copyNumbered(videos, dest, "video"),
  };
});

function existingNames() {
  const file = path.join(publicDir, "js", "gallery-data.js");
  if (!fs.existsSync(file)) return new Map();
  const text = fs.readFileSync(file, "utf8");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) return new Map();
  let saved;
  try {
    saved = JSON.parse(text.slice(start, end + 1));
  } catch {
    return new Map();
  }
  const names = new Map();
  saved.forEach((work) => {
    ["photos", "videos"].forEach((kind) => {
      (work[kind] || []).forEach((item) => {
        if (item && typeof item === "object" && item.file && item.name) {
          names.set(`${work.slug}|${item.file}`, item.name);
        }
      });
    });
  });
  return names;
}

function withSavedName(slug, file, names) {
  const name = names.get(`${slug}|${file}`);
  return name ? { file, name } : file;
}

const names = existingNames();
const galleryData = catalog.map((work) => ({
  title: work.title,
  slug: work.slug,
  photos: work.photos.map((file) => withSavedName(work.slug, file, names)),
  videos: work.videos.map((file) => withSavedName(work.slug, file, names)),
}));
const galleryNote = [
  "// A photo or video is a file name until it has its own subtitle.",
  "// To name one item, replace that line with:",
  "// { \"file\": \"photo-01.jpeg\", \"name\": \"Wall after the first coat\" }",
  "",
].join("\n");
fs.writeFileSync(
  path.join(publicDir, "js", "gallery-data.js"),
  `${galleryNote}const WORK_GALLERY = ${JSON.stringify(galleryData, null, 2)};\n`
);

const homeSection = `    <section class="section band" id="work">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Finished work</p>
          <h2>Photographs and videos</h2>
          <p class="note">Each type of work shows a few photographs here, and one video when that work has a video. More opens the rest of that work.</p>
        </div>
        <div id="work-preview"></div>
      </div>
    </section>
`;

const indexPath = path.join(publicDir, "index.html");
const index = fs.readFileSync(indexPath, "utf8");
const start = index.indexOf('    <section class="section band" id="work">');
const end = index.indexOf('    <section class="section band" id="why">');
if (start < 0 || end < 0 || end <= start) throw new Error("Could not find the work section in index.html");
fs.writeFileSync(indexPath, `${index.slice(0, start)}${homeSection}\n${index.slice(end)}`);

const workPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Photographs and Videos | Royal Waterproofing Company</title>
  <meta name="description" content="Photographs and videos of waterproofing work by Royal Waterproofing Company in Pune, arranged by the type of work.">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/styles.css?v=8">
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">RW</span>
      <span>
        <strong>Royal Waterproofing</strong>
        <small>Company · Pune</small>
      </span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Primary">
      <a href="/">Home</a>
      <a href="/#services">Services</a>
      <a href="/procedures.html">Procedures</a>
      <a href="/work.html" aria-current="page">Work</a>
      <a href="/#why">Why us</a>
      <a href="/#faq">FAQ</a>
      <a href="/#contact">Contact</a>
    </nav>
    <a class="header-call" href="tel:+919112970129">Call 9112970129</a>
  </header>

  <main id="content">
    <section class="proc-hero">
      <div class="wrap">
        <p class="eyebrow">Finished work</p>
        <h1>Photographs and videos</h1>
        <p>These are the site photographs and videos for each type of work. A few are on the home page. The rest are in the matching section below.</p>
        <div class="actions">
          <a class="btn btn-navy" href="/#contact">Request a quote</a>
          <a class="btn btn-ghost" href="https://wa.me/919112970129?text=Hello%20Royal%20Waterproofing%20Company%2C%20I%20would%20like%20to%20enquire%20about%20waterproofing." target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </section>

    <div class="wrap proc-layout">
      <aside>
        <label class="proc-select">Jump to a work
          <select id="proc-select"></select>
        </label>
        <nav class="proc-nav" aria-label="Work">
          <h2>Work</h2>
          <div id="work-nav"></div>
        </nav>
      </aside>
      <div id="work-list"></div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <strong>Royal Waterproofing Company</strong>
        <p>Professional Waterproofing &amp; Leakage Treatment Solutions</p>
      </div>
      <ul class="contact-list">
        <li>
          <span class="contact-mark contact-mark-phone" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1z"/></svg></span>
          <a href="tel:+919112970129">9112970129</a>
        </li>
        <li>
          <span class="contact-mark contact-mark-whatsapp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.4L2.4 21.6l5.3-1.4A9.7 9.7 0 1 0 12 2.2zm5.5 13.7c-.2.7-1.3 1.2-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.7-1.2-4.5-3.9-4.6-4.1s-1.1-1.5-1.1-2.8.7-2 1-2.2a.8.8 0 0 1 .6-.3h.4c.2 0 .3 0 .5.4.2.6.8 1.9.8 2.1s.1.3 0 .5-.3.4-.4.6-.2.3-.1.5a5.4 5.4 0 0 0 2.5 2.2c.2.1.4 0 .5-.1s.8-.9.9-1.2.2-.2.4-.1 1.5.7 1.8.9.4.2.5.3.1.6-.1 1.3z"/></svg></span>
          <a href="https://wa.me/919112970129" target="_blank" rel="noopener">9112970129</a>
        </li>
        <li>
          <span class="contact-mark contact-mark-mail" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5L4 8V6l8 5 8-5z"/></svg></span>
          <a href="mailto:royalwpco@gmail.com">royalwpco@gmail.com</a>
        </li>
        <li>
          <span class="contact-mark contact-mark-instagram" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 3.4h8A4.6 4.6 0 0 1 20.6 8v8a4.6 4.6 0 0 1-4.6 4.6H8A4.6 4.6 0 0 1 3.4 16V8A4.6 4.6 0 0 1 8 3.4zm8 1.8H8A2.8 2.8 0 0 0 5.2 8v8A2.8 2.8 0 0 0 8 18.8h8a2.8 2.8 0 0 0 2.8-2.8V8A2.8 2.8 0 0 0 16 5.2zM12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm0 1.7A2.3 2.3 0 1 0 14.3 12 2.3 2.3 0 0 0 12 9.7zM17.3 7.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg></span>
          <span class="contact-links"><a href="https://www.instagram.com/anup.bhujbal/" target="_blank" rel="noopener">anup.bhujbal</a><span aria-hidden="true">·</span><a href="https://www.instagram.com/royal_wp_co/" target="_blank" rel="noopener">royal_wp_co</a></span>
        </li>
        <li>
          <span class="contact-mark contact-mark-pin" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg></span>
          <span>Pune, Maharashtra, India</span>
        </li>
      </ul>
      <ul class="footer-nav">
        <li><a href="/#services">Services</a></li>
        <li><a href="/procedures.html">Procedures</a></li>
        <li><a href="/work.html">Work</a></li>
        <li><a href="/#contact">Contact</a></li>
      </ul>
    </div>
    <div class="wrap">
      <p class="legal">© Royal Waterproofing Company. All Rights Reserved.</p>
    </div>
  </footer>

  <div class="mobile-cta">
    <a href="tel:+919112970129">Call</a>
    <a href="https://wa.me/919112970129?text=Hello%20Royal%20Waterproofing%20Company%2C%20I%20would%20like%20to%20enquire%20about%20waterproofing." target="_blank" rel="noopener">WhatsApp</a>
  </div>

  <dialog id="lightbox" aria-label="Project photo">
    <menu><button id="lightbox-close" type="button">Close</button></menu>
    <div id="lightbox-body"></div>
    <p id="lightbox-caption"></p>
  </dialog>
  <script src="/js/gallery-data.js?v=3"></script>
  <script src="/js/gallery.js?v=2"></script>
  <script src="/js/main.js?v=6"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(publicDir, "work.html"), workPage);

catalog.forEach((work) => {
  console.log(`${work.title}: ${work.photos.length} photos, ${work.videos.length} videos`);
});
