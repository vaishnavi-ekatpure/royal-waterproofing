const PREVIEW_PHOTOS = 2;
const PREVIEW_VIDEOS = 1;
const PAGE_PHOTOS = 6;
const PAGE_VIDEOS = 2;

function countLabel(photoCount, videoCount) {
  const photoText = photoCount === 1 ? "1 photo" : `${photoCount} photos`;
  const videoText = videoCount === 1 ? "1 video" : `${videoCount} videos`;
  if (photoCount && videoCount) return `${photoText} · ${videoText}`;
  return photoCount ? photoText : videoText;
}

function moreLinkLabel(photoCount, videoCount) {
  const extraPhotos = photoCount > PREVIEW_PHOTOS;
  const extraVideos = videoCount > PREVIEW_VIDEOS;
  if (extraPhotos && extraVideos) return "More photos and videos";
  if (extraVideos) return "More videos";
  if (extraPhotos) return "More photos";
  return "";
}

function itemLabel(kind, index, total) {
  const name = kind === "photo" ? "Photo" : "Video";
  return `${name} ${index + 1} of ${total}`;
}

function mediaFile(entry) {
  return typeof entry === "string" ? entry : entry.file;
}

function mediaName(entry, fallback) {
  if (typeof entry === "string" || !entry.name) return fallback;
  return entry.name;
}

function photoButton(work, entry, index) {
  const fileName = mediaFile(entry);
  const label = itemLabel("photo", index, work.photos.length);
  const captionTitle = mediaName(entry, work.title);
  const button = document.createElement("button");
  button.className = "shot";
  button.type = "button";
  button.dataset.title = captionTitle;
  button.dataset.detail = label;

  const image = document.createElement("img");
  image.src = `/work/${work.slug}/${fileName}`;
  image.alt = `${captionTitle}, ${label}`;
  image.loading = "lazy";

  const caption = document.createElement("span");
  caption.className = "shot-caption";
  const title = document.createElement("strong");
  title.textContent = captionTitle;
  const detail = document.createElement("span");
  detail.textContent = label;
  caption.append(title, detail);
  button.append(image, caption);
  return button;
}

function videoCard(work, entry, index) {
  const fileName = mediaFile(entry);
  const label = itemLabel("video", index, work.videos.length);
  const captionTitle = mediaName(entry, work.title);
  const figure = document.createElement("figure");
  figure.className = "video-card";

  const video = document.createElement("video");
  video.controls = true;
  video.preload = "none";
  video.playsInline = true;
  if (work.photos[0]) video.poster = `/work/${work.slug}/${mediaFile(work.photos[0])}`;

  const source = document.createElement("source");
  source.src = `/work/${work.slug}/${fileName}`;
  source.type = "video/mp4";
  video.append(source);

  const caption = document.createElement("figcaption");
  const title = document.createElement("strong");
  title.textContent = captionTitle;
  const detail = document.createElement("span");
  detail.textContent = label;
  caption.append(title, detail);
  figure.append(video, caption);
  return figure;
}

function mediaGrid(className, items) {
  const grid = document.createElement("div");
  grid.className = className;
  items.forEach((item) => grid.append(item));
  return grid;
}

function showMoreButton(panelId, count, noun) {
  const button = document.createElement("button");
  button.className = "btn btn-ghost more-toggle";
  button.type = "button";
  button.setAttribute("aria-controls", panelId);
  button.textContent = `Show ${count} more ${noun}${count === 1 ? "" : "s"}`;
  return button;
}

function renderMedia(parent, work, photoLimit, videoLimit, idPrefix, includeExtras) {
  const shownPhotos = work.photos.slice(0, photoLimit);
  const extraPhotos = includeExtras ? work.photos.slice(photoLimit) : [];
  const shownVideos = work.videos.slice(0, videoLimit);
  const extraVideos = includeExtras ? work.videos.slice(videoLimit) : [];

  if (shownPhotos.length) {
    parent.append(mediaGrid("shot-grid", shownPhotos.map((file, index) => photoButton(work, file, index))));
  }
  if (extraPhotos.length) {
    const panelId = `${idPrefix}-photos`;
    const extra = mediaGrid("shot-grid", extraPhotos.map((file, index) => photoButton(work, file, index + shownPhotos.length)));
    extra.id = panelId;
    extra.hidden = true;
    parent.append(extra, showMoreButton(panelId, extraPhotos.length, "photo"));
  }
  if (shownVideos.length) {
    const videoClass = shownVideos.length === 1 ? "video-grid video-single" : "video-grid";
    parent.append(mediaGrid(videoClass, shownVideos.map((file, index) => videoCard(work, file, index))));
  }
  if (extraVideos.length) {
    const panelId = `${idPrefix}-videos`;
    const extra = mediaGrid("video-grid", extraVideos.map((file, index) => videoCard(work, file, index + shownVideos.length)));
    extra.id = panelId;
    extra.hidden = true;
    parent.append(extra, showMoreButton(panelId, extraVideos.length, "video"));
  }
}

function renderPreview(root) {
  WORK_GALLERY.forEach((work) => {
    const article = document.createElement("article");
    article.className = "work-block";
    const heading = document.createElement("h3");
    heading.textContent = work.title;
    const meta = document.createElement("p");
    meta.className = "work-meta";
    meta.textContent = countLabel(work.photos.length, work.videos.length);
    article.append(heading, meta);
    renderMedia(article, work, PREVIEW_PHOTOS, PREVIEW_VIDEOS, `home-${work.slug}`, false);

    const label = moreLinkLabel(work.photos.length, work.videos.length);
    if (label) {
      const actions = document.createElement("p");
      actions.className = "work-actions";
      const link = document.createElement("a");
      link.className = "btn btn-navy";
      link.href = `/work.html#${work.slug}`;
      link.textContent = label;
      actions.append(link);
      article.append(actions);
    }
    root.append(article);
  });
}

function renderWorkPage() {
  const select = document.querySelector("#proc-select");
  const nav = document.querySelector("#work-nav");
  const list = document.querySelector("#work-list");
  if (!list) return;

  WORK_GALLERY.forEach((work) => {
    if (select) {
      const option = document.createElement("option");
      option.value = `#${work.slug}`;
      option.textContent = work.title;
      select.append(option);
    }
    if (nav) {
      const link = document.createElement("a");
      link.href = `#${work.slug}`;
      link.textContent = work.title;
      nav.append(link);
    }

    const section = document.createElement("section");
    section.className = "work-group";
    section.id = work.slug;
    const heading = document.createElement("h2");
    heading.textContent = work.title;
    const meta = document.createElement("p");
    meta.className = "work-meta";
    meta.textContent = countLabel(work.photos.length, work.videos.length);
    section.append(heading, meta);
    renderMedia(section, work, PAGE_PHOTOS, PAGE_VIDEOS, work.slug, true);
    list.append(section);
  });
}

const preview = document.querySelector("#work-preview");
if (preview && typeof WORK_GALLERY !== "undefined") renderPreview(preview);
if (document.querySelector("#work-list") && typeof WORK_GALLERY !== "undefined") renderWorkPage();
