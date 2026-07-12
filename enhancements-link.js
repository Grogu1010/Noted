(() => {
  const storageKey = "noted-github-v1";
  const internalReloadKey = "noted-internal-reload";

  function installLinkButton() {
    const original = document.querySelector(".canvas .add-link-preview:not([data-link-handler])");
    if (!original) return;

    const button = original.cloneNode(true);
    button.dataset.linkHandler = "true";
    original.replaceWith(button);
    button.addEventListener("click", () => {
      let rawUrl = window.prompt("Page address")?.trim();
      if (!rawUrl) return;
      if (!/^https?:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;

      let url;
      try {
        url = new URL(rawUrl);
      } catch {
        window.alert("Enter a valid page address.");
        return;
      }

      const defaultTitle = url.hostname.replace(/^www\./, "");
      const title = window.prompt("Link title", defaultTitle)?.trim() || defaultTitle;
      const activeTitle = document.querySelector(".title-input")?.value?.trim() || "";

      let store;
      try {
        store = JSON.parse(localStorage.getItem(storageKey) || "null");
      } catch {
        store = null;
      }
      if (!store?.notes?.length) return;

      const target = store.notes.find((note) => note.title === activeTitle) ||
        store.notes.find((note) => note.id === "welcome") || store.notes[0];
      target.media ||= [];
      target.media.push({
        id: `link-${Date.now()}`,
        type: "link",
        name: title,
        caption: url.hostname.replace(/^www\./, ""),
        linkUrl: url.href,
        previewUrl: window.makePreviewDataUrl(title, url.hostname),
      });

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
    });
  }

  new MutationObserver(installLinkButton).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("DOMContentLoaded", installLinkButton);
})();