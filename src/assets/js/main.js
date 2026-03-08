// ── Utility functions (available immediately, no DOM needed) ──

function debounce(fn, wait) {
  var timer;
  return function() {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, wait);
  };
}

function timeAgo(dateString) {
  var date = new Date(dateString);
  var now = new Date();
  var seconds = Math.floor((now - date) / 1000);
  var intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (var i = 0; i < intervals.length; i++) {
    var count = Math.floor(seconds / intervals[i].seconds);
    if (count >= 1) return count + " " + intervals[i].label + (count > 1 ? "s" : "") + " ago";
  }
  return "Just now";
}

function renderJobCard(job) {
  var visaBadge = job.visa
    ? '<span class="badge badge-visa">' + job.visa + "</span>"
    : "";
  var relocBadge = job.reloc
    ? '<span class="badge badge-reloc">' + job.reloc + "</span>"
    : "";
  var posted = timeAgo(job.post_date);

  return (
    '<div class="job-card">' +
    '<div class="flex flex-col sm:flex-row sm:items-start gap-4">' +
    '<img src="' + job.logo + '" alt="' + job.company + '" class="w-12 h-12 rounded-lg object-cover shrink-0" loading="lazy" onerror="this.src=\'/favicon/android-chrome-192x192.png\'">' +
    '<div class="flex-1 min-w-0">' +
    '<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">' + job.position + "</h3>" +
    '<p class="text-gray-600 dark:text-gray-400 mb-2">' + job.company + "</p>" +
    '<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-3">' +
    '<span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i>' + job.location + "</span>" +
    '<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i>' + posted + "</span>" +
    "</div>" +
    '<div class="flex flex-wrap gap-2">' +
    relocBadge + " " + visaBadge +
    '<span class="badge badge-contract">' + job.contract + "</span>" +
    "</div></div>" +
    '<a href="' + job.description + '" target="_blank" rel="noopener" class="job-card-apply">Apply <i data-lucide="external-link" class="w-3.5 h-3.5 ml-1.5"></i></a>' +
    "</div></div>"
  );
}

function renderSkeletons(count) {
  var html = "";
  for (var i = 0; i < count; i++) {
    html +=
      '<div class="card p-5 sm:p-6">' +
      '<div class="flex flex-col sm:flex-row sm:items-start gap-4">' +
      '<div class="w-12 h-12 rounded-lg skeleton shrink-0"></div>' +
      '<div class="flex-1 space-y-3">' +
      '<div class="h-5 skeleton w-3/5"></div>' +
      '<div class="h-4 skeleton w-2/5"></div>' +
      '<div class="flex gap-3"><div class="h-4 skeleton w-28"></div><div class="h-4 skeleton w-20"></div></div>' +
      '<div class="flex gap-2"><div class="h-5 skeleton rounded-full w-24"></div><div class="h-5 skeleton rounded-full w-20"></div></div>' +
      "</div></div></div>";
  }
  return html;
}

// ── DOM-dependent setup (runs after parsing completes) ──

document.addEventListener("DOMContentLoaded", function() {
  // Dark mode toggle
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function() {
      var isDark = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
      if (window.lucide) lucide.createIcons();
    });
  }

  // Mobile menu
  var btn = document.getElementById("mobile-menu-btn");
  var menu = document.getElementById("mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", function() {
      var open = !menu.classList.contains("hidden");
      menu.classList.toggle("hidden", open);
      btn.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("click", function(e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.add("hidden");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();
});
