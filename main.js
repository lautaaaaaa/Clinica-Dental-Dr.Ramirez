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

  /* ── 3. Scroll reveals + 4. Count-up — scroll-event based (CDN-safe) ── */
  function initReveals() {
    var revealEls = Array.prototype.slice.call(
      document.querySelectorAll(".reveal, .reveal-left, .reveal-right")
    );
    var counterEls = Array.prototype.slice.call(
      document.querySelectorAll("[data-count-to]")
    );
    if (!revealEls.length && !counterEls.length) return;

    var countFired = [];

    function animateCount(el) {
      if (countFired.indexOf(el) !== -1) return;
      countFired.push(el);
      var target = parseInt(el.getAttribute("data-count-to"), 10);
      var label = el.parentElement.querySelector(".about-stat-label");
      var suffix = (label && label.textContent.indexOf("Estrellas") !== -1) ? "" : "+";
      var duration = 1600;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        var p = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target) + (p < 1 ? "" : suffix);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }

    function check() {
      var vh = window.innerHeight;

      // Reveals
      revealEls = revealEls.filter(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.93) {
          el.classList.remove("will-animate");
          el.classList.add("is-visible");
          return false; // done, remove from list
        }
        return true;
      });

      // Counters
      counterEls = counterEls.filter(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.93 && rect.bottom > 0) {
          animateCount(el);
          return false;
        }
        return true;
      });

      if (!revealEls.length && !counterEls.length) {
        window.removeEventListener("scroll", check, { passive: true });
      }
    }

    // Mark below-fold elements as will-animate
    revealEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top >= window.innerHeight * 0.93) {
        el.classList.add("will-animate");
      } else {
        el.classList.add("is-visible");
      }
    });

    window.addEventListener("scroll", check, { passive: true });

    // Run immediately (catches elements already in viewport) + after short delay
    check();
    setTimeout(check, 300);
    setTimeout(check, 800);

    // Nuclear fallback: reveal everything at 4s no matter what
    setTimeout(function () {
      document.querySelectorAll(".will-animate").forEach(function (el) {
        el.classList.remove("will-animate");
        el.classList.add("is-visible");
      });
      counterEls.forEach(function (el) { animateCount(el); });
    }, 4000);
  }

  function initCounters() { /* handled inside initReveals */ }

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
        start: "top 80%",
      }
    });

    // Review cards stagger
    gsap.from(".review-card", {
      opacity: 0, y: 24, scale: 0.97,
      stagger: 0.07,
      dura