(() => {
  const key = "noted-ui-settings-v1";
  const defaults = {
    appearance: "system",
    compactSidebar: false,
    wideEditor: false,
    reducedMotion: false,
    canvasOpen: true,
  };

  function readSettings() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || "{}") }; }
    catch { return { ...defaults }; }
  }

  function writeSettings(settings) {
    localStorage.setItem(key, JSON.stringify(settings));
    applySettings(settings);
  }

  function applySettings(settings = readSettings()) {
    const root = document.documentElement;
    root.dataset.notedAppearance = settings.appearance;
    root.classList.toggle("noted-compact-sidebar", settings.compactSidebar);
    root.classList.toggle("noted-wide-editor", settings.wideEditor);
    root.classList.toggle("noted-reduced-motion", settings.reducedMotion);

    if (settings.canvasOpen) {
      const canvas = document.querySelector(".canvas");
      const toggle = document.querySelector(".canvas-toggle");
      if (canvas && toggle && getComputedStyle(canvas).display === "none") toggle.click();
    }
  }

  function settingRow(label, description, control) {
    const row = document.createElement("label");
    row.className = "noted-setting-row";
    const copy = document.createElement("span");
    copy.className = "noted-setting-copy";
    copy.innerHTML = "<strong></strong><small></small>";
    copy.querySelector("strong").textContent = label;
    copy.querySelector("small").textContent = description;
    row.append(copy, control);
    return row;
  }

  function buildModal() {
    if (document.querySelector(".noted-settings-backdrop")) return document.querySelector(".noted-settings-backdrop");
    const settings = readSettings();
    const backdrop = document.createElement("div");
    backdrop.className = "noted-settings-backdrop";
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="noted-settings-modal" role="dialog" aria-modal="true" aria-labelledby="noted-settings-title">
        <header><div><span>Preferences</span><h2 id="noted-settings-title">Settings</h2></div><button type="button" class="noted-settings-close" aria-label="Close settings">×</button></header>
        <div class="noted-settings-body"></div>
        <footer><button type="button" class="noted-settings-reset">Reset settings</button><button type="button" class="noted-settings-done">Done</button></footer>
      </section>`;
    document.body.append(backdrop);
    const body = backdrop.querySelector(".noted-settings-body");

    const appearance = document.createElement("select");
    appearance.innerHTML = '<option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>';
    appearance.value = settings.appearance;
    appearance.addEventListener("change", () => {
      const next = readSettings(); next.appearance = appearance.value; writeSettings(next);
    });
    body.append(settingRow("Appearance", "Choose the overall page theme.", appearance));

    const switches = [
      ["compactSidebar", "Compact sidebar", "Fit more notes and folders on screen."],
      ["wideEditor", "Wide editor", "Use more horizontal space for writing."],
      ["reducedMotion", "Reduce motion", "Minimise interface animation."],
      ["canvasOpen", "Open Canvas by default", "Keep the Canvas Bar visible when Noted loads."],
    ];
    for (const [property, label, description] of switches) {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "noted-setting-switch";
      input.checked = settings[property];
      input.addEventListener("change", () => {
        const next = readSettings(); next[property] = input.checked; writeSettings(next);
      });
      body.append(settingRow(label, description, input));
    }

    const close = () => { backdrop.hidden = true; document.body.classList.remove("noted-settings-open"); };
    backdrop.querySelector(".noted-settings-close").addEventListener("click", close);
    backdrop.querySelector(".noted-settings-done").addEventListener("click", close);
    backdrop.querySelector(".noted-settings-reset").addEventListener("click", () => {
      localStorage.removeItem(key); applySettings(defaults); backdrop.remove(); openSettings();
    });
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !backdrop.hidden) close(); });
    return backdrop;
  }

  function openSettings() {
    const backdrop = buildModal();
    backdrop.hidden = false;
    document.body.classList.add("noted-settings-open");
    backdrop.querySelector(".noted-settings-close")?.focus();
  }

  function bindSettingsButton() {
    const candidates = [...document.querySelectorAll("button")];
    const button = candidates.find((item) => item.textContent.trim().toLowerCase() === "settings");
    if (!button || button.dataset.notedSettingsBound) return;
    button.dataset.notedSettingsBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openSettings();
    }, true);
  }

  applySettings();
  new MutationObserver(() => { bindSettingsButton(); applySettings(); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", () => { bindSettingsButton(); applySettings(); });
})();