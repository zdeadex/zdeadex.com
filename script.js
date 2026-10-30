(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nodes = document.querySelectorAll(".reveal");

  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (el) { io.observe(el); });
  }

  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var tabs = document.querySelectorAll(".section-tab");
  var panels = document.querySelectorAll(".panel");
  var sectionIds = ["work", "investments", "holdings"];

  function showSection(id, updateHash) {
    if (sectionIds.indexOf(id) === -1) id = "work";
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("aria-controls") === id;
      tab.classList.toggle("is-on", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (panel) {
      panel.classList.toggle("is-on", panel.id === id);
    });
    if (updateHash && location.hash !== "#" + id) {
      history.pushState(null, "", "#" + id);
    }
    if (updateHash) {
      var row = document.querySelector(".section-tabs");
      if (row) row.scrollIntoView({ block: "start" });
    }
  }

  function idFromHash() {
    var id = (location.hash || "").replace("#", "");
    return sectionIds.indexOf(id) === -1 ? null : id;
  }

  if (tabs.length && panels.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        showSection(tab.getAttribute("aria-controls"), true);
      });
    });
    window.addEventListener("hashchange", function () {
      var id = idFromHash();
      if (id) showSection(id, false);
    });
    window.addEventListener("popstate", function () {
      showSection(idFromHash() || "work", false);
    });
    var initial = idFromHash();
    showSection(initial || "work", false);
    if (initial) {
      var row = document.querySelector(".section-tabs");
      if (row) row.scrollIntoView({ block: "start" });
    }
  }

  function bindFilters(root, itemSelector, noun) {
    if (!root) return;
    var chips = root.querySelectorAll(".chip");
    var items = root.querySelectorAll(itemSelector);
    var count = root.querySelector(".filters__count");
    if (!chips.length || !items.length) return;

    function matches(item, filter) {
      var card = item.querySelector("[data-filters]");
      if (!card) return false;
      if (filter === "all") return true;
      return card.getAttribute("data-filters").split(/\s+/).indexOf(filter) !== -1;
    }

    function writeCount() {
      var n = 0;
      items.forEach(function (item) { if (!item.hidden) n += 1; });
      if (count) count.textContent = n + " " + noun + (n === 1 ? "" : "s");
    }

    function apply(filter) {
      chips.forEach(function (chip) {
        var on = chip.getAttribute("data-filter") === filter;
        chip.classList.toggle("is-on", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
      items.forEach(function (item) {
        item.hidden = !matches(item, filter);
      });
      writeCount();
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        apply(chip.getAttribute("data-filter"));
      });
    });
  }

  bindFilters(document.querySelector("#work"), ".showcase > li", "project");
  bindFilters(document.querySelector("#investments"), ".marks > li", "investment");
})();
