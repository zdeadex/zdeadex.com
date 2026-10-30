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

  var work = document.querySelector("#work");
  var chips = work ? work.querySelectorAll(".chip") : [];
  var items = work ? work.querySelectorAll(".showcase > li") : [];
  var count = work ? work.querySelector(".filters__count") : null;
  if (!chips.length || !items.length) return;

  function matches(item, filter) {
    var card = item.querySelector(".vcard");
    if (!card) return false;
    if (filter === "all") return true;
    return card.getAttribute("data-filters").split(/\s+/).indexOf(filter) !== -1;
  }

  function writeCount() {
    var n = 0;
    items.forEach(function (item) { if (!item.hidden) n += 1; });
    if (count) count.textContent = n + (n === 1 ? " project" : " projects");
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
})();
