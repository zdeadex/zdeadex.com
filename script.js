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
  var sectionIds = ["work", "investments", "holdings", "rentals", "media"];

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
      var tabsEl = document.querySelector(".section-tab");
      if (tabsEl) tabsEl.scrollIntoView({ block: "start" });
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

  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    var EASE = "cubic-bezier(.2,.8,.2,1)";
    var DUR = 420;
    var current = null;
    var token = 0;
    var anims = [];

    function stopAnims() {
      anims.forEach(function (an) { try { an.cancel(); } catch (e) {} });
      anims = [];
    }

    function flipFrom(thumb) {
      var from = thumb.getBoundingClientRect();
      var to = lbImg.getBoundingClientRect();
      if (!to.width || !from.width) return null;
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      var s = from.width / to.width;
      return "translate(" + dx + "px," + dy + "px) scale(" + s + ")";
    }

    function run(el, frames, opts) {
      var an = el.animate(frames, opts);
      anims.push(an);
      return an;
    }

    function unhideThumbs() {
      document.querySelectorAll(".gallery__item img").forEach(function (im) { im.style.visibility = ""; });
    }

    function open(btn) {
      var my = ++token;
      stopAnims();
      unhideThumbs();
      current = btn;
      lbImg.src = btn.getAttribute("data-full");
      lightbox.hidden = false;
      lightbox.classList.add("is-open");
      document.documentElement.classList.add("lb-lock");
      var go = function () {
        if (my !== token) return;
        var thumbImg = btn.querySelector("img") || btn;
        if (reduce) {
          run(lightbox, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
          return;
        }
        var t = flipFrom(thumbImg);
        thumbImg.style.visibility = "hidden";
        run(lightbox, [{ opacity: 0 }, { opacity: 1 }], { duration: DUR * 0.8, easing: "ease-out", fill: "both" });
        run(lightbox, [{ "--halo": 0.4 }, { "--halo": 1 }], { duration: DUR, easing: EASE });
        var an = run(lbImg, [
          { transform: t || "scale(.92)", borderRadius: "14px", opacity: t ? 1 : 0 },
          { transform: "none", borderRadius: "10px", opacity: 1 }
        ], { duration: DUR, easing: EASE, fill: "both" });
        an.finished.then(function () { thumbImg.style.visibility = ""; }, function () { thumbImg.style.visibility = ""; });
      };
      if (lbImg.decode) lbImg.decode().then(go, go); else go();
    }

    function close() {
      if (lightbox.hidden || !current) return;
      var my = ++token;
      var btn = current;
      current = null;
      var thumbImg = btn.querySelector("img") || btn;
      var done = function () {
        thumbImg.style.visibility = "";
        if (my !== token) return;
        stopAnims();
        lightbox.hidden = true;
        lightbox.classList.remove("is-open");
        document.documentElement.classList.remove("lb-lock");
        lbImg.removeAttribute("src");
      };
      stopAnims();
      if (reduce) {
        run(lightbox, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "both" }).finished.then(done, done);
        return;
      }
      var t = flipFrom(thumbImg);
      thumbImg.style.visibility = "hidden";
      run(lightbox, [{ opacity: 1 }, { opacity: 0 }], { duration: DUR * 0.9, easing: "ease-in", fill: "both" });
      run(lbImg, [
        { transform: "none", borderRadius: "10px", opacity: 1 },
        { transform: t || "scale(.92)", borderRadius: "14px", opacity: t ? 1 : 0 }
      ], { duration: DUR, easing: EASE, fill: "both" }).finished.then(done, done);
    }

    document.querySelectorAll(".gallery__item").forEach(function (btn) {
      btn.addEventListener("click", function () { open(btn); });
    });
    lightbox.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  bindFilters(document.querySelector("#work"), ".showcase > li", "project");
  bindFilters(document.querySelector("#investments"), ".marks > li", "investment");
  bindFilters(document.querySelector("#holdings"), ".marks > li", "coin");
})();
