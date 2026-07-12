(() => {
  const storageKey = "noted-github-v1";

  // Existing installations may still have the original multi-tab Welcome note.
  // Replace only that premade note; user-created notes are left untouched.
  try {
    const store = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (store?.notes && typeof window.welcomeNote === "function") {
      store.notes = store.notes.map((note) =>
        note.title === "Welcome to Noted" ? window.welcomeNote(note.id) : note,
      );
      localStorage.setItem(storageKey, JSON.stringify(store));
    }
  } catch {}

  function getLinks() {
    const links = new Map();
    try {
      const store = JSON.parse(localStorage.getItem(storageKey) || "null");
      for (const note of store?.notes || []) {
        for (const item of note.media || []) {
          if (item.linkUrl) links.set(item.name, item.linkUrl);
        }
      }
    } catch {}
    return links;
  }

  function makeCardsClickable() {
    const links = getLinks();
    for (const card of document.querySelectorAll(".media-card")) {
      const name = card.querySelector("footer strong")?.textContent?.trim();
      const href = links.get(name);
      const image = card.querySelector(":scope > img");
      if (!href || !image || image.closest(".canvas-link-overlay")) continue;

      card.classList.add("link-media-item");
      const anchor = document.createElement("a");
      anchor.className = "canvas-link-overlay";
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("aria-label", `Open ${name}`);
      card.insertBefore(anchor, image);
      anchor.appendChild(image);
    }
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
    menu.append(trigger, actions);
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

  function enhance() {
    makeCardsClickable();
    buildAddMenu();
  }

  new MutationObserver(enhance).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("DOMContentLoaded", enhance);
})();