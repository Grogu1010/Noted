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

  new MutationObserver(makeCardsClickable).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("DOMContentLoaded", makeCardsClickable);
})();
