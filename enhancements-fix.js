(() => {
  const storageKey = "noted-github-v1";
  const internalReloadKey = "noted-internal-reload";

  function readStore() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); }
    catch { return null; }
  }

  function activeNote(store = readStore()) {
    if (!store?.notes?.length) return null;
    const title = document.querySelector(".title-input")?.value?.trim();
    return store.notes.find((note) => note.title === title) ||
      store.notes.find((note) => note.id === "welcome") || store.notes[0];
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

    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", String(open));
    };
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      setOpen(!menu.classList.contains("open"));
    });
    actions.addEventListener("click", () => setOpen(false));
    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function renderLinkCards() {
    const canvas = document.querySelector(".canvas");
    if (!canvas) return;
    const note = activeNote();
    const links = (note?.media || []).filter((item) => item.type === "link" && item.linkUrl);
    const signature = links.map((item) => `${item.id}:${item.name}:${item.linkUrl}`).join("|");

    let list = canvas.querySelector(".canvas-link-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "canvas-link-list";
      const addMenu = canvas.querySelector(".canvas-add-menu");
      canvas.insertBefore(list, addMenu || null);
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
      const img = card.querySelector("img");
      img.src = link.previewUrl || link.url || "";
      img.alt = `${link.name || "Link"} preview`;
      card.querySelector("strong").textContent = link.name || "Untitled link";
      card.querySelector(".canvas-link-domain").textContent = link.caption || new URL(link.linkUrl).hostname;
      card.querySelector(".canvas-link-url").textContent = link.linkUrl;
      list.append(card);
    }
  }

  function openSavedNote(noteId) {
    const store = readStore();
    if (!store?.notes?.length) return;
    const target = store.notes.find((note) => note.id === noteId);
    if (!target || target.id === "welcome") return;
    const current = store.notes.find((note) => note.id === "welcome");
    if (current) current.id = `note-${Date.now()}-previous`;
    target.id = "welcome";
    sessionStorage.setItem(internalReloadKey, "1");
    localStorage.setItem(storageKey, JSON.stringify(store));
    location.reload();
  }

  function renderUnfiledNotes() {
    const sidebar = document.querySelector(".sidebar");
    const tree = sidebar?.querySelector(".tree");
    if (!sidebar || !tree) return;

    const notes = (readStore()?.notes || []).filter((note) => note.folderId == null);
    const signature = notes.map((note) => `${note.id}:${note.title}:${note.updated || ""}`).join("|");
    let section = tree.querySelector(":scope > .unfiled-notes");

    if (!section) {
      section = document.createElement("section");
      section.className = "unfiled-notes";
      tree.prepend(section);
    } else if (tree.firstElementChild !== section) {
      tree.prepend(section);
    }

    if (section.dataset.signature === signature) return;
    section.dataset.signature = signature;

    const label = document.createElement("div");
    label.className = "unfiled-notes-heading";
    label.textContent = "Unfiled";
    const list = document.createElement("div");
    list.className = "unfiled-notes-list";
    for (const note of notes) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `unfiled-note${note.id === "welcome" ? " active" : ""}`;
      button.innerHTML = '<span class="unfiled-note-icon" aria-hidden="true">▤</span><span><strong></strong><small></small></span>';
      button.querySelector("strong").textContent = note.title?.trim() || "Untitled note";
      button.querySelector("small").textContent = note.updated || "Saved";
      button.addEventListener("click", () => openSavedNote(note.id));
      list.append(button);
    }
    section.replaceChildren(label, list);
  }

  function removeSearchShortcut() {
    document.querySelectorAll(".search kbd").forEach((element) => element.remove());
  }

  function enhance() {
    buildAddMenu();
    renderLinkCards();
    renderUnfiledNotes();
    removeSearchShortcut();
  }

  new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", enhance);
  window.addEventListener("storage", enhance);
})();