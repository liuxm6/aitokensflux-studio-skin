// Browser-side, read-only inspection helpers for the local design review.
// Navigation and review switches use the real UI; this never imports application stores.
export const pages = [
  "home", "models", "models/openai/gpt-4.1", "discover", "providers", "pricing", "status", "docs", "rankings",
  "console", "console/keys", "console/activity", "console/logs", "console/credits", "console/settings", "console/profile", "console/notifications", "console/privacy", "console/preferences",
  "o", "invite/demo", "o/studio/console", "o/studio/members", "o/studio/billing", "o/studio/invoices", "o/studio/activity", "o/studio/audit", "o/studio/settings",
  "o/studio/w/default/console", "o/studio/w/default/keys", "o/studio/w/default/members", "o/studio/w/default/usage", "o/studio/w/default/guardrails", "o/studio/w/default/settings",
  "console/files", "console/guardrails", "console/byok", "console/routing", "console/presets", "console/tools", "console/observability",
];
const records = [];
const observedErrors = [];
window.addEventListener("error", (event) => observedErrors.push(event.message));
window.addEventListener("unhandledrejection", (event) => observedErrors.push(String(event.reason)));

export async function waitFor(check, label, timeout = 10000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const value = check();
      if (value) { resolve(value); return; }
      if (Date.now() - started > timeout) { reject(new Error(`Timed out: ${label}`)); return; }
      setTimeout(tick, 60);
    };
    tick();
  });
}

export function finishTransitions() {
  for (const animation of document.getAnimations()) {
    try { animation.finish(); } catch { /* Infinite loading indicators are intentionally retained. */ }
  }
}

export async function choose(selector, text) {
  const trigger = document.querySelector(selector);
  if (!trigger) throw new Error(`Missing dropdown: ${selector}`);
  if (trigger.getAttribute("aria-expanded") !== "true") trigger.click();
  const option = await waitFor(() => [...document.querySelectorAll('[role="option"]')].find((item) => item.textContent.trim() === text), `option ${text}`);
  option.click();
  finishTransitions();
  await waitFor(() => trigger.getAttribute("aria-expanded") !== "true", "dropdown closes");
}

export async function language(code) {
  const names = { zh: "简体中文", "zh-TW": "繁體中文", en: "English", ru: "Русский" };
  await choose('.top-actions [role="combobox"]', names[code]);
  await waitFor(() => document.documentElement.lang === (code === "zh" ? "zh-CN" : code), "language updated");
}

export async function prepare() {
  document.querySelector(".review-trigger").click();
  await waitFor(() => document.querySelector('[role="dialog"]:not([data-closed]) .review-grid'), "review controls");
  for (const id of ["preview-role", "preview-state"]) {
    const trigger = document.getElementById(id);
    trigger.click();
    const firstOption = await waitFor(() => document.getElementById(trigger.getAttribute("aria-controls"))?.querySelector('[role="option"]'), id);
    firstOption.click();
    finishTransitions();
    await waitFor(() => document.getElementById(id).getAttribute("aria-expanded") !== "true", id);
  }
  const optional = document.querySelector('[role="dialog"]:not([data-closed]) [role="switch"]');
  if (optional.getAttribute("aria-checked") !== "true") optional.click();
  document.querySelector('[role="dialog"]:not([data-closed]) [data-slot="dialog-close"]').click();
  finishTransitions();
  await waitFor(() => !document.querySelector('[role="dialog"]:not([data-closed])'), "review closed");
}

export async function visit(route) {
  const previous = document.querySelector("main h1, main h2, main h3");
  const changed = location.hash !== `#/${route}`;
  location.hash = `#/${route}`;
  await waitFor(() => {
    const title = document.querySelector("main h1, main h2, main h3");
    return title && !document.querySelector("main .skeleton") && (!changed || title !== previous);
  }, route);
  window.scrollTo({ top: 0, behavior: "instant" });
  finishTransitions();
}

function visible(element) {
  const style = getComputedStyle(element);
  return element.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && !element.closest('[hidden], [aria-hidden="true"], [inert]');
}

function accessibleName(element) {
  const labelledBy = element.getAttribute("aria-labelledby");
  return element.getAttribute("aria-label") || (labelledBy && labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ")) || element.labels?.[0]?.textContent || element.textContent?.trim() || element.getAttribute("title") || "";
}

const interactiveSelector = 'button, a[href], input:not([type="hidden"]), textarea, select, summary, [contenteditable="true"], [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="radio"], [role="slider"], [role="switch"], [role="tab"], [role="menuitem"]';

export function inspect(route) {
  const width = document.documentElement.clientWidth;
  const main = document.querySelector("main");
  const issues = [];
  if (width < 320) return { route, state: "viewport-unavailable", width };
  if (!main) return { route, state: "missing-main", width };
  if (main.querySelectorAll("h1").length !== 1) issues.push(`h1-count:${main.querySelectorAll("h1").length}`);
  if (document.documentElement.scrollWidth > width + 1) issues.push(`page-overflow:${document.documentElement.scrollWidth - width}`);
  const closedPopups = [...document.querySelectorAll('.studio-select-positioner[data-closed]')].filter((element) => element.getBoundingClientRect().width > 0);
  if (closedPopups.length) issues.push(`closed-popup-footprint:${closedPopups.length}`);
  const cards = [...main.querySelectorAll(".model-card")];
  const hiddenCards = cards.filter((card) => !visible(card)).map((card) => card.getAttribute("aria-label"));
  if (hiddenCards.length) issues.push(`hidden-models:${hiddenCards.join(",")}`);
  const interactive = [...document.querySelectorAll(interactiveSelector)];
  const unnamed = interactive.filter(visible).filter((element) => !accessibleName(element));
  if (unnamed.length) issues.push(`unnamed-controls:${unnamed.length}`);
  const invalidStates = interactive.filter(visible).filter((element) => {
    const attributes = ["aria-pressed", "aria-selected", "aria-checked"];
    return attributes.some((attribute) => {
      const value = element.getAttribute(attribute);
      return value !== null && !["true", "false", "mixed"].includes(value);
    });
  });
  if (invalidStates.length) issues.push(`invalid-aria-state:${invalidStates.length}`);
  const missingControls = interactive.filter(visible).filter((element) => {
    const target = element.getAttribute("aria-controls");
    return target !== null && !document.getElementById(target);
  });
  if (missingControls.length) issues.push(`missing-aria-controls:${missingControls.length}`);
  const viewportHeight = document.documentElement.clientHeight;
  const clippedControls = [...main.querySelectorAll(interactiveSelector)].filter(visible).filter((element) => {
    const box = element.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= viewportHeight) return false;
    // Tables and tab strips may intentionally scroll inside their own container.
    let parent = element.parentElement;
    while (parent && parent !== main) {
      const overflow = getComputedStyle(parent).overflowX;
      if ((overflow === "auto" || overflow === "scroll") && parent.scrollWidth > parent.clientWidth) return false;
      parent = parent.parentElement;
    }
    return box.left < -1 || box.right > width + 1;
  });
  if (clippedControls.length) issues.push(`offscreen-controls:${clippedControls.map(accessibleName).join("|")}`);
  const duplicateIds = new Set();
  const ids = new Set();
  for (const element of document.querySelectorAll("[id]")) {
    if (!visible(element)) continue;
    if (ids.has(element.id)) duplicateIds.add(element.id);
    ids.add(element.id);
  }
  if (duplicateIds.size) issues.push(`duplicate-ids:${[...duplicateIds].join(",")}`);
  return {
    route, width, language: document.documentElement.lang,
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    heading: main.querySelector("h1, h2, h3")?.textContent.trim(),
    nativeSelects: main.querySelectorAll("select").length,
    controls: [...main.querySelectorAll(interactiveSelector)].filter(visible).length,
    cards: cards.length, issues,
  };
}

export async function auditBatch(routes = pages, expectedWidth = 0) {
  const batch = [];
  for (const route of routes) {
    try {
      if (expectedWidth && Math.abs(document.documentElement.clientWidth - expectedWidth) > 20) {
        batch.push({ route, state: "viewport-unavailable", width: document.documentElement.clientWidth });
        break;
      }
      await visit(route);
      batch.push(inspect(route));
    } catch (error) {
      batch.push({ route, state: "inspection-error", error: String(error) });
    }
  }
  records.push(...batch);
  return { count: batch.length, failures: batch.filter((row) => row.state || row.issues?.length), headings: batch.map((row) => [row.route, row.heading]), errors: [...observedErrors] };
}

export function summary() {
  return { records: [...records], runtimeErrors: [...observedErrors] };
}
