/**
 * Replaces [data-include="path/to/partial.html"] with fetched HTML (single root element).
 * Runs recursively. Requires http(s) origin (e.g. npx serve .) — file:// blocks fetch.
 */
(function () {
  function resolveUrl(relative) {
    return new URL(relative, window.location.href).href;
  }

  async function processIncludes(root) {
    let el = root.querySelector("[data-include]");
    while (el) {
      const rel = el.getAttribute("data-include");
      if (!rel) break;
      const res = await fetch(resolveUrl(rel));
      if (!res.ok) {
        console.error("[includes] Failed:", rel, res.status);
        el.replaceWith(document.createComment(" include failed: " + rel + " "));
        el = root.querySelector("[data-include]");
        continue;
      }
      el.removeAttribute("data-include");
      const html = (await res.text()).trim();
      const wrap = document.createElement("div");
      wrap.innerHTML = html;
      const imported = wrap.firstElementChild;
      if (!imported) {
        el.remove();
      } else {
        el.replaceWith(imported);
      }
      el = root.querySelector("[data-include]");
    }
  }

  function run() {
    processIncludes(document.body).catch(function (err) {
      console.error("[includes]", err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
