/* Melhoria progressiva: todo o conteudo ja esta no HTML. Este script so cuida de progresso, video e eventos. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };

  function track(name) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: name });
      if (typeof window.gtag === "function") window.gtag("event", name);
    } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-track]") : null;
    if (t) track(t.getAttribute("data-track"));
  });

  var copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    var ta = document.getElementById("msgText");
    var note = document.getElementById("copyNote");
    copyBtn.addEventListener("click", function () {
      var done = function () { note.textContent = "Message copied."; };
      var fail = function () { ta.focus(); ta.select(); note.textContent = "Select and copy the text above."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, fail);
      else fail();
    });
  }


  /* Voltar como no iPhone: lembra onde o visitante estava e aceita deslizar da borda esquerda */
  var SKEY = "rw:scroll:" + location.pathname;
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  function saveScroll() { try { sessionStorage.setItem(SKEY, String(window.scrollY)); } catch (e) {} }
  function restoreScroll() {
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      var back = nav && nav.type === "back_forward";
      var y = Number(sessionStorage.getItem(SKEY));
      if ((back || window.__rwPersisted) && y > 0) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { window.scrollTo(0, y); }); });
      }
    } catch (e) {}
  }
  window.addEventListener("pagehide", saveScroll);
  window.addEventListener("pageshow", function (e) { window.__rwPersisted = e.persisted; restoreScroll(); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a[href]")) saveScroll(); }, true);

  var sx = null, sy = null, tracking = false;
  document.addEventListener("touchstart", function (e) {
    var t0 = e.touches[0];
    tracking = e.touches.length === 1 && t0.clientX <= 24;
    sx = t0.clientX; sy = t0.clientY;
  }, { passive: true });
  document.addEventListener("touchcancel", function () { tracking = false; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (!tracking) return; tracking = false;
    var t1 = e.changedTouches[0], dx = t1.clientX - sx, dy = Math.abs(t1.clientY - sy);
    if (dx > 80 && dy < 60) {
      var page = document.querySelector(".page");
      if (page) { page.style.transition = "transform .18s ease, opacity .18s ease"; page.style.transform = "translateX(40px)"; page.style.opacity = "0.4"; }
      setTimeout(function () {
        var sameSite = document.referrer && document.referrer.indexOf(location.origin) === 0;
        if (history.length > 1 && sameSite) history.back();
        else if (location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") !== "") location.href = document.querySelector(".brand").href;
        else if (page) { page.style.transform = ""; page.style.opacity = ""; }
      }, 160);
    }
  }, { passive: true });

  [].forEach.call(document.querySelectorAll(".faq"), function (box) {
    var items = [].slice.call(box.querySelectorAll("details"));
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  var form = document.getElementById("assessForm");
  if (form) {
    var svc = new URLSearchParams(location.search).get("service");
    var opt = svc && form.querySelector('option[data-key="' + svc + '"]'); if (opt) form.elements["Service"].value = opt.value;
    var fnote = document.getElementById("formNote");
    form.addEventListener("input", function () { if (fnote.className.indexOf("err") > -1) { fnote.className = "small"; fnote.textContent = ""; } });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      ["First name", "Last name", "Phone", "Service"].forEach(function (n) {
        var el = form.elements[n]; var v = (el.value || "").trim();
        var ok = v && (n !== "Phone" || v.replace(/\D/g, "").length >= 10);
        el.classList.toggle("invalid", !ok);
        if (!ok && !bad) bad = el;
      });
      var pref = form.querySelector('input[name="Contact preference"]:checked');
      if (!pref && !bad) bad = form.querySelector('input[name="Contact preference"]');
      if (bad) { fnote.className = "small err"; fnote.textContent = "Please complete every field. Use a phone number with at least 10 digits."; bad.focus(); return; }
      var btn = form.querySelector(".submit"); btn.disabled = true; fnote.className = "small"; fnote.textContent = "Sending...";
      var fd = new FormData(form);
      fetch(form.action, { method: "POST", body: fd, headers: { Accept: "application/json" } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.success !== "false" && j.success !== false, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error("send");
          track("form_submit_success");
          form.hidden = true;
          document.getElementById("doneText").textContent = pref.value === "Text message" ? "We will text you soon to set up your assessment." : "We will call you soon to set up your assessment.";
          document.getElementById("formDone").hidden = false;
        })
        .catch(function () {
          btn.disabled = false; fnote.className = "small err";
          fnote.textContent = "We could not send your request. Please call (510) 938-3188 or text us.";
        });
    });
  }

  var steps = [].slice.call(document.querySelectorAll("[data-step]"));
  if (!steps.length) return;
  var total = steps.filter(function (s) { return s.getAttribute("data-step") !== "0"; }).length;
  var ticks = document.getElementById("ticks");
  var count = document.getElementById("count");

  var dock = document.querySelector(".cta-dock");
  function setActive(n) {
    if (count) count.textContent = pad(n) + "/" + pad(total);
    if (!ticks) return;
    [].forEach.call(ticks.children, function (t, i) {
      t.classList.toggle("on", i + 1 === n);
      t.classList.toggle("done", i + 1 < n);
    });
  }
  if (ticks) {
    for (var i = 1; i <= total; i++) {
      (function (n) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "tick"; b.setAttribute("aria-label", "Go to screen " + n);
        b.addEventListener("click", function () {
          var el = document.querySelector('[data-step="' + n + '"]');
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        ticks.appendChild(b);
      })(i);
    }
  }
  setActive(0);

  var visible = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var n = Number(en.target.getAttribute("data-step"));
      var v = en.target.querySelector("video");
      if (en.isIntersecting) {
        visible[n] = en.intersectionRatio;
        if (v && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      } else {
        delete visible[n];
        if (v) v.pause();
      }
    });
    var best = null, ratio = -1;
    Object.keys(visible).forEach(function (k) { if (visible[k] > ratio) { ratio = visible[k]; best = Number(k); } });
    if (best !== null) setActive(best);
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  steps.forEach(function (s) { io.observe(s); });
  if (dock) {
    var covers = [].slice.call(document.querySelectorAll('[data-step="0"], .light, .band'));
    var seen = {};
    var dio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { seen[covers.indexOf(e.target)] = e.intersectionRatio > 0.12 || (e.target.getAttribute("data-step") === "0" && e.intersectionRatio > 0.5); });
      dock.classList.toggle("hide", Object.keys(seen).some(function (k) { return seen[k]; }));
    }, { threshold: [0, 0.12, 0.5, 1] });
    covers.forEach(function (c) { dio.observe(c); });
  }
})();
