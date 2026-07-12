const STORAGE_KEY = "noted-github-v1";
const OPENED_KEY = `${STORAGE_KEY}-opened`;
const INTERNAL_RELOAD_KEY = "noted-internal-reload";

const welcomeHtml = `
  <p class="lead">Noted is your calm, focused space to think, write, and create. Everything you need, nothing you don’t.</p>
  <p>Capture ideas, connect thoughts, and bring clarity to the things that matter.</p>
  <p>Start simple. <mark>Write naturally, stay organized,</mark> and let your ideas grow.</p>
  <div class="callout blue"><span class="callout-icon">✦</span><div><strong>A note is more than words</strong><span>Add images, audio, video, and page links from the Canvas Bar.</span></div></div>
  <p>Take a moment, explore, and make Noted your own.</p>
  <p class="signature">— The Noted Team</p>
  <hr />
  <h2>Get started</h2>
  <ul class="checklist">
    <li><button class="check-control" contenteditable="false" aria-label="Toggle checkbox"></button>Create your first note</li>
    <li><button class="check-control" contenteditable="false" aria-label="Toggle checkbox"></button>Add a file or link from the Canvas Bar</li>
    <li><button class="check-control" contenteditable="false" aria-label="Toggle checkbox"></button>Make the page your own</li>
  </ul>`;

function welcomeNote(id = "welcome") {
  return {
    id,
    title: "Welcome to Noted",
    folderId: null,
    activeTabId: "welcome-tab",
    updated: "Just now",
    starred: false,
    style: { mood: "soft", font: "clean", width: "standard", accent: "#3156d9", texture: false },
    tabs: [{ id: "welcome-tab", name: "Welcome", html: welcomeHtml }],
    media: [],
  };
}

function freshNote(id = "welcome") {
  const stamp = Date.now();
  return {
    id,
    title: "Untitled note",
    folderId: null,
    activeTabId: `tab-${stamp}`,
    updated: "Just now",
    starred: false,
    style: { mood: "soft", font: "clean", width: "standard", accent: "#3156d9", texture: false },
    tabs: [{ id: `tab-${stamp}`, name: "Page one", html: '<p class="lead">Start anywhere.</p><p>Write something worth remembering…</p>' }],
    media: [],
  };
}

function normaliseStore(store) {
  const builtInFolders = new Set(["personal", "journal", "recipes", "projects", "website", "planning", "content", "design", "marketing", "travel", "archive"]);
  const builtInNotes = new Set(["daily", "launch", "cake"]);
  const folders = Array.isArray(store?.folders) ? store.folders.filter((folder) => !builtInFolders.has(folder.id)) : [];
  const validFolderIds = new Set(folders.map((folder) => folder.id));
  let notes = Array.isArray(store?.notes) ? store.notes.filter((note) => !builtInNotes.has(note.id)) : [];

  notes = notes.map((note) => ({
    ...note,
    folderId: validFolderIds.has(note.folderId) ? note.folderId : null,
    media: Array.isArray(note.media) ? note.media.filter((item) => !item.sample) : [],
  }));

  if (!notes.some((note) => note.title === "Welcome to Noted")) notes.push(welcomeNote("welcome-note"));
  return { ...store, folders, notes };
}

function prepareStartup() {
  const internalReload = sessionStorage.getItem(INTERNAL_RELOAD_KEY) === "1";
  sessionStorage.removeItem(INTERNAL_RELOAD_KEY);
  let store;
  try { store = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { store = null; }

  if (!store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders: [], notes: [welcomeNote()] }));
    localStorage.setItem(OPENED_KEY, "1");
    return;
  }

  store = normaliseStore(store);
  const hasOpened = localStorage.getItem(OPENED_KEY) === "1";
  if (hasOpened && !internalReload) {
    store.notes = store.notes.map((note) => note.id === "welcome" ? { ...note, id: `note-${Date.now()}-previous` } : note);
    store.notes.unshift(freshNote("welcome"));
  } else if (!hasOpened) {
    localStorage.setItem(OPENED_KEY, "1");
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const nativeSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function setItem(key, value) {
  if (key === STORAGE_KEY) {
    try {
      const store = normaliseStore(JSON.parse(value));
      for (const note of store.notes) if (note.folderId === "personal") note.folderId = null;
      value = JSON.stringify(store);
    } catch {}
  }
  return nativeSetItem.call(this, key, value);
};

prepareStartup();

function activeNoteTitle() {
  return document.querySelector(".title-input")?.value?.trim() || "";
}

function makePreviewDataUrl(title, domain) {
  const escapeXml = (value) => value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]);
  const safeTitle = escapeXml(title.slice(0, 42));
  const safeDomain = escapeXml(domain.slice(0, 48));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e9eeff"/><stop offset="1" stop-color="#fbfde8"/></linearGradient></defs><rect width="640" height="360" rx="28" fill="url(#g)"/><circle cx="525" cy="80" r="95" fill="#d9ee68" opacity=".55"/><rect x="44" y="44" width="552" height="272" rx="22" fill="#fffefa" stroke="#3156d9" stroke-opacity=".15"/><text x="78" y="112" fill="#3156d9" font-family="Arial, sans-serif" font-size="18" font-weight="700">PAGE PREVIEW</text><text x="78" y="174" fill="#172033" font-family="Arial, sans-serif" font-size="34" font-weight="700">${safeTitle}</text><text x="78" y="224" fill="#697083" font-family="Arial, sans-serif" font-size="20">${safeDomain}</text><text x="78" y="278" fill="#3156d9" font-family="Arial, sans-serif" font-size="18" font-weight="700">Open page →</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function addLinkToActiveNote() {
  let rawUrl = window.prompt("Page address")?.trim();
  if (!rawUrl) return;
  if (!/^https?:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;
  let url;
  try { url = new URL(rawUrl); } catch { window.alert("Enter a valid page address."); return; }

  const defaultTitle = url.hostname.replace(/^www\./, "");
  const title = window.prompt("Preview title", defaultTitle)?.trim() || defaultTitle;
  const currentTitle = activeNoteTitle();
  let store;
  try { store = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { store = null; }
  if (!store?.notes?.length) return;

  const note = store.notes.find((item) => item.title === currentTitle) || store.notes.find((item) => item.id === "welcome") || store.notes[0];
  note.media ||= [];
  note.media.push({ id: `link-${Date.now()}`, type: "image", name: title, caption: url.hostname.replace(/^www\./, ""), url: makePreviewDataUrl(title, url.hostname), linkUrl: url.href });
  nativeSetItem.call(localStorage, STORAGE_KEY, JSON.stringify(normaliseStore(store)));
  sessionStorage.setItem(INTERNAL_RELOAD_KEY, "1");
  location.reload();
}

function linkMap() {
  try {
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const map = new Map();
    for (const note of store?.notes || []) for (const item of note.media || []) if (item.linkUrl) map.set(item.name, item.linkUrl);
    return map;
  } catch { return new Map(); }
}

function enhanceCanvas() {
  const addFile = document.querySelector(".canvas .add-media");
  if (addFile && !document.querySelector(".canvas .add-link-preview")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "add-media add-link-preview";
    button.innerHTML = '<span class="enhancement-link-icon">↗</span><span>Add link</span><small>Show a page preview</small>';
    button.addEventListener("click", addLinkToActiveNote);
    addFile.insertAdjacentElement("afterend", button);
  }

  const links = linkMap();
  for (const card of document.querySelectorAll(".media-item")) {
    const name = card.querySelector("strong")?.textContent?.trim();
    const href = links.get(name);
    if (!href || card.dataset.linkEnhanced === "true") continue;
    card.dataset.linkEnhanced = "true";
    card.classList.add("link-media-item");
    const preview = card.querySelector("img")?.parentElement;
    if (preview) {
      const anchor = document.createElement("a");
      anchor.className = "canvas-link-overlay";
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("aria-label", `Open ${name}`);
      preview.parentElement?.insertBefore(anchor, preview);
      anchor.appendChild(preview);
    }
  }
}

const observer = new MutationObserver(enhanceCanvas);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", enhanceCanvas);
