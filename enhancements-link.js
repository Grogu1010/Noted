(() => {
  const storageKey = "noted-github-v1";
  const internalReloadKey = "noted-internal-reload";

  function readStore() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); }
    catch { return null; }
  }

  function activeNote(store) {
    const title = document.querySelector(".title-input")?.value?.trim() || "";
    return store?.notes?.find((note) => note.title === title) ||
      store?.notes?.find((note) => note.id === "welcome") || store?.notes?.[0];
  }

  function saveLink(rawValue) {
    let rawUrl = rawValue.trim();
    if (!rawUrl) return "Paste a link first.";
    if (!/^https?:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;
    let url;
    try { url = new URL(rawUrl); }
    catch { return "That link does not look valid."; }

    const store = readStore();
    const target = activeNote(store);
    if (!target) return "Open a note before adding a link.";

    target.links ||= [];
    target.links.push({
      id: `link-${Date.now()}`,
      type: "link",
      name: url.hostname.replace(/^www\./, ""),
      domain: url.hostname.replace(/^www\./, ""),
      linkUrl: url.href,
      screenshotUrl: `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url.href)}?w=1200`,
      createdAt: Date.now(),
    });
    target.media = (target.media || []).filter((item) => !item.linkUrl && item.type !== "link");

    if (target.id !== "welcome") {
      const selectedId = target.id;
      store.notes = store.notes.map((note) => {
        if (note.id === "welcome") return { ...note, id: `note-${Date.now()}-previous` };
        if (note.id === selectedId) return { ...note, id: "welcome" };
        return note;
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(store));
    sessionStorage.setItem(internalReloadKey, "1");
    location.reload();
    return "";
  }

  function openLinkDialog() {
    let dialog = document.querySelector(".noted-link-dialog");
    if (!dialog) {
      dialog = document.createElement("div");
      dialog.className = "noted-link-dialog";
      dialog.hidden = true;
      dialog.innerHTML = `<form class="noted-link-panel"><button class="noted-link-close" type="button" aria-label="Close">×</button><span class="noted-link-eyebrow">Add Link</span><h2>Paste your link here</h2><p>The page will be saved as a link with a screenshot preview.</p><input type="url" inputmode="url" autocomplete="url" placeholder="https://example.com" aria-label="Paste your link here"><small class="noted-link-error"></small><button class="noted-link-submit" type="submit">Add Link</button></form>`;
      document.body.append(dialog);
      const close = () => { dialog.hidden = true; dialog.querySelector("input").value = ""; dialog.querySelector(".noted-link-error").textContent = ""; };
      dialog.querySelector(".noted-link-close").addEventListener("click", close);
      dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
      dialog.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const error = saveLink(dialog.querySelector("input").value);
        dialog.querySelector(".noted-link-error").textContent = error;
      });
    }
    dialog.hidden = false;
    requestAnimationFrame(() => dialog.querySelector("input")?.focus());
  }

  function installLinkButton() {
    const original = document.querySelector(".canvas .add-link-preview:not([data-link-handler])");
    if (!original) return;
    const button = original.cloneNode(true);
    button.dataset.linkHandler = "true";
    original.replaceWith(button);
    button.addEventListener("click", openLinkDialog);
  }

  new MutationObserver(installLinkButton).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", installLinkButton);
})();