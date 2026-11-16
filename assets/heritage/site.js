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
    if (dock) dock.classList.toggle("hide", n === 0);
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
})();
