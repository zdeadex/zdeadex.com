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

  var chips = document.querySelectorAll(".chip");
  var cards = document.querySelectorAll(".vcard");
  var count = document.querySelector(".filters__count");
  if (!chips.length || !cards.length) return;

  var timer = 0;

  function matches(card, filter) {
    if (filter === "all") return true;
    return card.getAttribute("data-filters").split(/\s+/).indexOf(filter) !== -1;
  }

  function visibleCount() {
    var n = 0;
    cards.forEach(function (card) { if (!card.hidden && !card.classList.contains("is-leaving")) n += 1; });
    return n;
  }

  function writeCount(n) {
    if (count) count.textContent = n + (n === 1 ? " project" : " projects");
  }

  function flip() {
    cards.forEach(function (card) {
      if (card.hidden || !card._first) return;
      var last = card.getBoundingClientRect();
      var dx = card._first.left - last.left;
      var dy = card._first.top - last.top;
      card._first = null;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      card.animate(
        [{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }],
        { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    });
  }

  function apply(filter) {
    clearTimeout(timer);
    chips.forEach(function (chip) {
      var on = chip.getAttribute("data-filter") === filter;
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });

    if (reduce) {
      cards.forEach(function (card) { card.hidden = !matches(card, filter); });
      writeCount(visibleCount());
      return;
    }

    cards.forEach(function (card) {
      var show = matches(card, filter);
      card.classList.remove("is-leaving");
      if (!show && !card.hidden) card.classList.add("is-leaving");
      if (show && card.hidden) {
        card.hidden = false;
        card.classList.add("is-entering");
      }
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        cards.forEach(function (card) { card.classList.remove("is-entering"); });
      });
    });

    timer = setTimeout(function () {
      cards.forEach(function (card) {
        if (!card.hidden) card._first = card.getBoundingClientRect();
      });
      cards.forEach(function (card) {
        if (!card.classList.contains("is-leaving")) return;
        card.hidden = true;
        card.classList.remove("is-leaving");
      });
      flip();
      writeCount(visibleCount());
    }, 220);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      apply(chip.getAttribute("data-filter"));
    });
  });
})();
