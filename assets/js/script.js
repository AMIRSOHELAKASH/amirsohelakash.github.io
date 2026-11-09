document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menuButton?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const toast = document.querySelector(".toast");
  const copyButton = document.getElementById("copy-profile");
  copyButton?.addEventListener("click", async () => {
    const value = copyButton.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      toast.textContent = "GitHub profile link copied";
    } catch {
      toast.textContent = value;
    }
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  const sections = document.querySelectorAll("main section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navAnchors.forEach(anchor => {
            anchor.classList.toggle("active", anchor.getAttribute("href") === `#${entry.target.id}`);
          });
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach(section => sectionObserver.observe(section));
  }
});
