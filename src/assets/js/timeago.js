// Relative times are baked at build time. Recompute them in the browser
// from the employer timestamp so "17 hours ago" does not stay frozen,
// and so a date-only noon placeholder is not what visitors keep seeing.
(function () {
  function refresh(root) {
    if (typeof timeAgo !== "function") return;
    var nodes = (root || document).querySelectorAll("time.js-timeago");
    for (var i = 0; i < nodes.length; i++) {
      var iso = nodes[i].getAttribute("datetime");
      if (!iso) continue;
      nodes[i].textContent = timeAgo(iso);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { refresh(document); });
  } else {
    refresh(document);
  }
})();
