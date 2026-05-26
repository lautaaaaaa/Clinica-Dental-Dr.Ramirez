/* ============================================================
   Clínica Dental Dr. Ramón A. Ramírez Otero — main.js
   v=20260525 | IIFE pattern, no ES modules
   ============================================================ */
(function () {
  "use strict";

  /* ── Safe wrapper: one failing init won't break the rest ── */
  function safe(fn, name) {
    try { fn(); }
    catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ── Boot ── */
  function boot() {
    safe(initSplash,      "initSplash");
    safe(initNav,         "initNav");
    safe(initReveals,     "initReveals");
    safe(initCounters,    "initCounters");
    safe(initCalendar,    "initCalendar");
    safe(initTimeSlots,   "initTimeSlots");
    safe(initHamburger,   "initHamburger");
    safe(initGSAP,        "initGSAP");
  }

  /* ── 1. Splash ── */
  function initSplash() {
    var splash = document.querySelector("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") {
      setTimeout(hide, 700);
    } else {
      window.addEventListener("load", function () { setTimeout(hide, 500); });
    }
    setTimeout(hide, 3800); // safety
  }

  /* ── 2. Sticky nav ── */
  function initNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var scrolled = false;
    window.addEventListener("scroll", function () {
      var now = window.scrollY > 60;
      if (now !== scrolled) {
        scrolled = now;
        nav.classList.toggle("scrolled", scrolled);
      }
    }, { passive: true });
  }

  /* ── 3. Scroll reveals (IntersectionObserver) ── */
  function initReveals() {
    var selectors = ".reveal, .reveal-left, .reveal-right";
    var els = document.querySelectorAll(selectors);
    if (!els.length) return;

    var vh = window.innerHeight;

    // Only animate elements below the fold — elements already visible get revealed instantly
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.92) {
        // Already in view: show immediately, no animation needed
        el.classList.add("is-visible");
      } else {
        // Below fold: hide and animate on scroll
        el.classList.add("will-animate");
      }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.remove("will-animate");
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px 0px 0px" });

    els.forEach(function (el) {
      if (el.classList.contains("will-animate")) io.observe(el);
    });

    // Safety: force reveal everything at 5s
    setTimeout(function () {
      document.querySelectorAll(".will-animate").forEach(function (el) {
        el.classList.remove("will-animate");
        el.classList.add("is-visible");
      });
    }, 5000);
  }

  /* ── 4. Count-up numbers ── */
  function initCounters() {
    var els = document.querySelectorAll("[data-count-to]");
    if (!els.length) return;

    var fired = [];

    function animateCount(el) {
      if (fired.indexOf(el) !== -1) return;
      fired.push(el);

      var target = parseInt(el.getAttribute("data-count-to"), 10);
      var label = el.parentElement.querySelector(".about-stat-label");
      var isStars = label && label.textContent.indexOf("Estrellas") !== -1;
      var suffix = isStars ? "" : "+";
      var duration = 1600;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + (progress < 1 ? "" : suffix);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }

    // Observer with low threshold so it fires as soon as element enters view
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCount(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });

    els.forEach(function (el) { io.observe(el); });

    // Safety net: after 2s check if any counter is still at 0 and is already in view
    setTimeout(function () {
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) animateCount(el);
      });
    }, 2000);
  }

  /* ── 5. Calendar ── */
  function initCalendar() {
    var container = document.getElementById("calDays");
    if (!container) return;

    // June 2026: starts Wednesday (day index 3), 30 days
    var firstDay = 3; // 0=Sun
    var daysInMonth = 30;
    var today = 25; // demo: 25th selected
    var selectedDay = 10; // pre-selected

    var html = "";

    // Empty cells before first day
    for (var i = 0; i < firstDay; i++) {
      html += '<div class="cal-day cal-day--empty"></div>';
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var classes = ["cal-day"];
      var isPast = d < 3;
      var isWeekend = false;
      // Figure out day of week: d=1 is Thursday (firstDay=3 means Mon=1)
      // firstDay is Sunday=0. June 1 = Wednesday (3), so:
      // dayOfWeek = (firstDay + d - 1) % 7
      var dayOfWeek = (firstDay + d - 1) % 7;
      if (dayOfWeek === 0) isWeekend = true; // Sunday

      if (isPast) {
        classes.push("cal-day--past");
      } else if (isWeekend) {
        // Saturdays open until 12
        if (dayOfWeek === 6) classes.push("cal-day--available");
        else classes.push("cal-day--past"); // Sundays closed
      } else {
        classes.push("cal-day--available");
      }

      if (d === selectedDay) classes.push("cal-day--selected");
      if (d === today) classes.push("cal-day--today");

      html += '<div class="' + classes.join(" ") + '" data-day="' + d + '">' + d + '</div>';
    }

    container.innerHTML = html;

    // Click to select
    container.addEventListener("click", function (e) {
      var day = e.target.closest(".cal-day");
      if (!day || day.classList.contains("cal-day--past") || day.classList.contains("cal-day--empty")) return;
      container.querySelectorAll(".cal-day--selected").forEach(function (el) { el.classList.remove("cal-day--selected"); });
      day.classList.add("cal-day--selected");
    });
  }

  /* ── 6. Time slots ── */
  function initTimeSlots() {
    var slots = document.querySelectorAll(".time-slot");
    slots.forEach(function (slot) {
      slot.addEventListener("click", function () {
        slots.forEach(function (s) { s.classList.remove("selected"); });
        slot.classList.add("selected");
      });
    });
  }

  /* ── 7. Hamburger menu ── */
  function initHamburger() {
    var hamburger = document.getElementById("hamburger");
    var navLinks = document.querySelector(".nav-links");
    if (!hamburger || !navLinks) return;

    var open = false;
    hamburger.addEventListener("click", function () {
      open = !open;
      navLinks.style.display = open ? "flex" : "";
      navLinks.style.flexDirection = open ? "column" : "";
      navLinks.style.position = open ? "absolute" : "";
      navLinks.style.top = open ? "100%" : "";
      navLinks.style.left = open ? "0" : "";
      navLinks.style.right = open ? "0" : "";
      navLinks.style.background = open ? "rgba(248,245,241,0.98)" : "";
      navLinks.style.padding = open ? "1rem 2.5rem 1.5rem" : "";
      navLinks.style.backdropFilter = open ? "blur(18px)" : "";
      navLinks.style.boxShadow = open ? "0 8px 24px rgba(10,22,40,0.1)" : "";
      navLinks.style.gap = open ? "1.25rem" : "";
    });

    // Close on link click
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        open = false;
        navLinks.style.display = "";
      });
    });
  }

  /* ── 8. GSAP ScrollTrigger (enhanced animations) ── */
  function initGSAP() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // Parallax on hero image
    gsap.to(".hero-img", {
      y: "15%",
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      }
    });

    // About image parallax
    gsap.to(".about-img", {
      y: "8%",
      ease: "none",
      scrollTrigger: {
        trigger: "#nosotros",
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      }
    });

    // Service cards stagger
    gsap.from(".service-card", {
      opacity: 0, y: 30,
      stagger: 0.08,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#servicios .services-grid",
