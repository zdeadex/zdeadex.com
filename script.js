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
    var lbBackdrop = lightbox.querySelector(".lightbox__backdrop");
    var lbHalo = lightbox.querySelector(".lightbox__halo");
    var lbFrame = lightbox.querySelector(".lightbox__frame");
    var lbImg = lbFrame.querySelector("img");
    var EASE = "cubic-bezier(.2,.8,.2,1)";
    var DUR = 420;
    var state = "closed";
    var current = null;
    var token = 0;
    var anims = [];

    function stopAnims() {
      anims.forEach(function (an) { try { an.cancel(); } catch (e) {} });
      anims = [];
    }
    function run(el, frames, opts) {
      opts.fill = "both";
      var an = el.animate(frames, opts);
      anims.push(an);
      return an;
    }
    function thumbOf(btn) { return btn.querySelector("img") || btn; }
    function nextFrame() { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); }

    function preload(src) {
      var im = new Image();
      im.src = src;
      var ready = im.decode ? im.decode() : new Promise(function (r) { im.onload = r; im.onerror = r; });
      return ready.then(function () { return im; }, function () { return im; });
    }

    function targetRect(w, h) {
      var maxW = Math.min(window.innerWidth * 0.92, 1400);
      var maxH = window.innerHeight * 0.88;
      var s = Math.min(maxW / w, maxH / h, 1.6);
      var tw = Math.round(w * s), th = Math.round(h * s);
      return { left: Math.round((window.innerWidth - tw) / 2), top: Math.round((window.innerHeight - th) / 2), width: tw, height: th };
    }

    function fromTransform(thumbRect, t) {
      var s = thumbRect.width / t.width;
      var dx = thumbRect.left - t.left;
      var dy = thumbRect.top - t.top;
      return "translate3d(" + dx + "px," + dy + "px,0) scale(" + s + ")";
    }

    function finishClose() {
      stopAnims();
      lightbox.hidden = true;
      lightbox.classList.remove("is-open");
      document.documentElement.classList.remove("lb-lock");
      lbFrame.style.transform = "";
      state = "closed";
      current = null;
    }

    function open(btn) {
      if (state === "opening" || state === "open") return;
      var my = ++token;
      if (state === "closing") {
        stopAnims();
        if (current) thumbOf(current).style.visibility = "";
        finishClose();
      }
      state = "opening";
      current = btn;
      var src = btn.getAttribute("data-full");
      var thumb = thumbOf(btn);
      preload(src).then(function (im) {
        if (my !== token) return;
        lbImg.src = src;
        return (lbImg.decode ? lbImg.decode().catch(function () {}) : Promise.resolve()).then(function () {
          if (my !== token) return;
          var w = im.naturalWidth || thumb.naturalWidth || 16;
          var h = im.naturalHeight || thumb.naturalHeight || 10;
          var t = targetRect(w, h);
          lbFrame.style.left = t.left + "px";
          lbFrame.style.top = t.top + "px";
          lbFrame.style.width = t.width + "px";
          lbFrame.style.height = t.height + "px";
          var start = fromTransform(thumb.getBoundingClientRect(), t);
          var scale = thumb.getBoundingClientRect().width / t.width;
          lbFrame.style.transform = reduce ? "none" : start;
          lbFrame.style.borderRadius = "";
          lightbox.hidden = false;
          lightbox.classList.add("is-open");
          document.documentElement.classList.add("lb-lock");
          if (reduce) {
            run(lightbox, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" })
              .finished.then(function () { if (my === token) state = "open"; }, function () {});
            return;
          }
          var r0 = 10 / scale;
          run(lbBackdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: DUR, easing: "ease-out" });
          run(lbHalo, [{ opacity: 0, transform: "translate(-50%,-50%) scale(.4)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: DUR + 120, easing: EASE });
          var an = run(lbFrame, [
            { transform: start, borderRadius: r0 + "px" },
            { transform: "translate3d(0,0,0) scale(1)", borderRadius: "12px" }
          ], { duration: DUR, easing: EASE });
          // Hide the thumbnail only once the clone is painted over it.
          nextFrame().then(function () { if (my === token) thumb.style.visibility = "hidden"; });
          an.finished.then(function () { if (my === token) state = "open"; }, function () {});
        });
      });
    }

    function close() {
      if (state !== "open" && state !== "opening") return;
      if (!current) return;
      var my = ++token;
      var btn = current;
      var thumb = thumbOf(btn);
      stopAnims();
      state = "closing";
      if (reduce || lightbox.hidden) {
        var done0 = function () { if (my !== token) return; thumb.style.visibility = ""; finishClose(); };
        if (lightbox.hidden) { done0(); return; }
        run(lightbox, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-in" }).finished.then(done0, function () {});
        return;
      }
      var t = lbFrame.getBoundingClientRect();
      var tr = { left: parseFloat(lbFrame.style.left), top: parseFloat(lbFrame.style.top), width: parseFloat(lbFrame.style.width) };
      var tb = thumb.getBoundingClientRect();
      var end = fromTransform(tb, tr);
      var r1 = 10 / (tb.width / tr.width);
      run(lbBackdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: DUR, easing: "ease-in" });
      run(lbHalo, [{ opacity: 1 }, { opacity: 0 }], { duration: DUR * 0.7, easing: "ease-in" });
      run(lbFrame, [
        { transform: "translate3d(0,0,0) scale(1)", borderRadius: "12px" },
        { transform: end, borderRadius: r1 + "px" }
      ], { duration: DUR, easing: EASE }).finished.then(function () {
        if (my !== token) return;
        // Show the thumbnail under the clone first, then drop the clone next frame.
        thumb.style.visibility = "";
        nextFrame().then(function () { if (my === token) finishClose(); });
      }, function () {});
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
