// Optional: intersection observer for scroll-triggered animations on sections
document.addEventListener('DOMContentLoaded', function () {
  const panels = document.querySelectorAll('.panel__content, .center__card');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  panels.forEach((el) => observer.observe(el));
});
