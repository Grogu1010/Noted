(() => {
  const storageKey = "noted-github-v1";
  const internalReloadKey = "noted-internal-reload";

  function readStore() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); }
    catch { return null; }
  }

  function writeStore(store) {
    localStorage.setItem(storageKey, JSON.stringify(store));
  }

  function activeNote(store = readStore()) {
    if (!store?.notes?.length) return null;
    const title = document.querySelector(".title-input")?.value?.trim();
    return store.notes.find((note) => note.title === title) || store.notes.find((note) => note.id === "welcome") || store.notes[0];
  }

  function migrateLinks() {
    const store = readStore();
    if (!store?.notes) return;
    let changed = false;
    for (const note of store.notes) {
      const oldLinks = (note.media || []).filter((item) => item.linkUrl || item.type === "link");
      if (!oldLinks.length) continue;
      note.links ||= [];
      for (const item of oldLinks) {
        if (!note.links.some((link) => link.id === item.id || link.linkUrl === item.linkUrl)) {
          note.links.push({
            id: item.id || `link-${Date.now()}`,
            type: "link",
            name: item.name || item.caption || "Link",
            domain: item.caption || "",
            linkUrl: item.linkUrl,
            screenshotUrl: item.screenshotUrl || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(item.linkUrl)}?w=1200`,
            createdAt: Date.now(),
          });
        }
      }
      note.media = (note.media || []).filter((item) => !item.linkUrl && item.type !== "link");
      changed = true;
    }
    if (changed) writeStore(store);
  }

  function buildAddMenu() {
    const canvas = document.querySelector(".canvas");
    if (!canvas || canvas.querySelector(".canvas-add-menu")) return;
    const addFile = canvas.querySelector(".add-media:not(.add-link-preview)");
    const addLink = canvas.querySelector(".add-link-preview");
    if (!addFile || !addLink) return;
    const menu = document.createElement("div");
    menu.className = "canvas-add-menu";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "canvas-add-trigger";
    trigger.setAttribute("aria-label", "Add to Canvas");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = '<span aria-hidden="true">+</span>';
    const actions = document.createElement("div");
    actions.className = "canvas-add-actions";
    addFile.classList.add("canvas-add-option");
    addFile.innerHTML = '<span class="canvas-add-option-icon" aria-hidden="true">＋</span><span>Add File</span>';
    addLink.classList.add("canvas-add-option");
    addLink.innerHTML = '<span class="canvas-add-option-icon" aria-hidden="true">↗</span><span>Add Link</span>';
    actions.append(addFile, addLink);
    menu.append(actions, trigger);
    canvas.append(menu);
    const setOpen = (open) => { menu.classList.toggle("open", open); trigger.setAttribute("aria-expanded", String(open)); };
    trigger.addEventListener("click", (event) => { event.stopPropagation(); setOpen(!menu.classList.contains("open")); });
    actions.addEventListener("click", () => setOpen(false));
    document.addEventListener("click", (event) => { if (!menu.contains(event.target)) setOpen(false); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") setOpen(false); });
  }

  function renderLinkCards() {
    const canvas = document.querySelector(".canvas");
    if (!canvas) return;
    const links = activeNote()?.links || [];
    const signature = links.map((item) => `${item.id}:${item.linkUrl}`).join("|");
    let list = canvas.querySelector(".canvas-link-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "canvas-link-list";
      canvas.insertBefore(list, canvas.querySelector(".canvas-add-menu") || null);
    }
    if (list.dataset.signature === signature) return;
    list.dataset.signature = signature;
    list.replaceChildren();
    for (const link of links) {
      const card = document.createElement("a");
      card.className = "canvas-link-card";
      card.href = link.linkUrl;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.innerHTML = '<div class="canvas-link-preview"><img alt=""></div><div class="canvas-link-copy"><span class="canvas-link-domain"></span><strong></strong><span class="canvas-link-url"></span></div><span class="canvas-link-arrow" aria-hidden="true">↗</span>';
      const image = card.querySelector("img");
      image.src = link.screenshotUrl || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(link.linkUrl)}?w=1200`;
      image.alt = `${link.name || "Link"} page preview`;
      card.querySelector("strong").textContent = link.name || "Untitled link";
      card.querySelector(".canvas-link-domain").textContent = link.domain || new URL(link.linkUrl).hostname;
      card.querySelector(".canvas-link-url").textContent = link.linkUrl;
      list.append(card);
    }
  }

  function openSavedNote(noteId) {
    const store = readStore();
    const target = store?.notes?.find((note) => note.id === noteId);
    if (!target) return;
    target.lastOpened = Date.now();
    if (target.id !== "welcome") {
      const current = store.notes.find((note) => note.id === "welcome");
      if (current) current.id = `note-${Date.now()}-previous`;
      target.id = "welcome";
    }
    sessionStorage.setItem(internalReloadKey, "1");
    writeStore(store);
    location.reload();
  }

  function recentScore(value) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function renderRecentItems() {
    const tree = document.querySelector(".sidebar .tree");
    const store = readStore();
    if (!tree || !store) return;
    tree.querySelectorAll(":scope > .unfiled-note").forEach((item) => item.remove());

    for (const note of store.notes || []) {
      if (note.folderId != null) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `unfiled-note${note.id === "welcome" ? " active" : ""}`;
      button.dataset.recentScore = String(recentScore(note.lastOpened || note.updatedAt || note.createdAt));
      button.innerHTML = '<span class="unfiled-note-icon" aria-hidden="true">▤</span><span><strong></strong><small></small></span>';
      button.querySelector("strong").textContent = note.title?.trim() || "Untitled note";
      button.querySelector("small").textContent = note.updated || "Saved";
      button.addEventListener("click", () => openSavedNote(note.id));
      tree.append(button);
    }

    const folders = [...tree.children].filter((item) => !item.classList.contains("unfiled-note"));
    for (const folderElement of folders) {
      const folderName = folderElement.textContent.trim();
      const folder = (store.folders || []).find((item) => folderName.includes(item.name || item.title || ""));
      const childScore = Math.max(0, ...(store.notes || []).filter((note) => note.folderId === folder?.id).map((note) => recentScore(note.lastOpened || note.updatedAt || note.createdAt)));
      folderElement.dataset.recentScore = String(Math.max(recentScore(folder?.lastOpened), childScore));
    }

    [...tree.children]
      .sort((a, b) => Number(b.dataset.recentScore || 0) - Number(a.dataset.recentScore || 0))
      .forEach((item) => tree.append(item));
  }

  function trackSidebarOpen(event) {
    const target = event.target.closest("button, [role='button'], .tree-row");
    if (!target || !target.closest(".sidebar")) return;
    const label = target.textContent.trim();
    const store = readStore();
    if (!store) return;
    const now = Date.now();
    const note = (store.notes || []).find((item) => item.title && label.includes(item.title));
    const folder = (store.folders || []).find((item) => (item.name || item.title) && label.includes(item.name || item.title));
    if (note) note.lastOpened = now;
    if (folder) folder.lastOpened = now;
    if (note || folder) writeStore(store);
  }

  function removeSearchShortcut() {
    document.querySelectorAll(".search kbd").forEach((element) => element.remove());
  }

  function enhance() {
    migrateLinks();
    buildAddMenu();
    renderLinkCards();
    renderRecentItems();
    removeSearchShortcut();
  }

  document.addEventListener("click", trackSidebarOpen, true);
  new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", enhance);
  window.addEventListener("storage", enhance);
})();