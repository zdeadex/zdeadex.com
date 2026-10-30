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
  if (!nav) return;
  var onScroll = function () {
    nav.classList.toggle("is-scrolled", window.scrollY > 4);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
