const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && header && nav) {
  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    }
  });
}

document.querySelectorAll("input[name='started']").forEach((field) => {
  field.value = String(Date.now());
});

const lightbox = document.querySelector("#lightbox");
const lightboxBody = document.querySelector("#lightbox-body");
const lightboxCaption = document.querySelector("#lightbox-caption");

document.querySelectorAll(".shot").forEach((shot) => {
  shot.addEventListener("click", () => {
    if (!lightbox || !lightboxBody || !lightboxCaption) return;
    const image = shot.querySelector("img");
    const title = shot.dataset.title || "Project photo";
    const detail = shot.dataset.detail || "";
    lightboxBody.replaceChildren();
    if (image) {
      const full = image.cloneNode(true);
      full.removeAttribute("width");
      full.removeAttribute("loading");
      lightboxBody.append(full);
    } else {
      const frame = document.createElement("div");
      frame.className = "lightbox-visual";
      frame.innerHTML = "<span class='shot-kicker'>Photo coming soon</span><strong>This frame is reserved for a real project photograph.</strong>";
      lightboxBody.append(frame);
    }
    lightboxCaption.textContent = detail ? `${title}. ${detail}` : title;
    if (typeof lightbox.showModal === "function") lightbox.showModal();
  });
});

document.querySelector("#lightbox-close")?.addEventListener("click", () => lightbox?.close());

document.querySelectorAll(".more-toggle").forEach((button) => {
  const moreLabel = button.textContent;
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    const showExtras = panel.hidden;
    panel.hidden = !showExtras;
    button.setAttribute("aria-expanded", String(showExtras));
    button.textContent = showExtras ? "Show less" : moreLabel;
    if (!showExtras) {
      panel.querySelectorAll("video").forEach((video) => video.pause());
    }
  });
});

const procSelect = document.querySelector("#proc-select");
if (procSelect) {
  procSelect.addEventListener("change", () => {
    const target = document.querySelector(procSelect.value);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function showStatus(form, message, isError) {
  const status = form.querySelector(".form-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", Boolean(isError));
}

function clearErrors(form) {
  form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
}

async function submitForm(form) {
  clearErrors(form);
  const button = form.querySelector("button[type='submit']");
  if (button) button.disabled = true;
  showStatus(form, "Sending…", false);

  const fields = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.errors) {
        Object.entries(data.errors).forEach(([name, message]) => {
          const slot = form.querySelector(`[data-error='${name}']`);
          if (slot) slot.textContent = message;
        });
      }
      showStatus(form, data.message || "Please check the form and try again.", true);
      return;
    }

    form.reset();
    const started = form.querySelector("input[name='started']");
    if (started) started.value = String(Date.now());
    if (form.dataset.kind === "quote") {
      const quote = data.quote || fields;
      const lines = [
        "Quote request for Royal Waterproofing Company",
        `Name: ${quote.name}`,
        `Mobile: ${quote.mobile}`,
        `Location: ${quote.location}`,
        `Service: ${quote.service}`,
        `Problem: ${quote.problem}`,
      ];
      if (String(quote.preferredTime || "").trim()) {
        lines.push(`Preferred contact time: ${quote.preferredTime}`);
      }
      showStatus(
        form,
        "Your quote request was sent to the owner. You can also message the same details on WhatsApp.",
        false
      );
      const link = form.querySelector(".whatsapp-followup");
      if (link) {
        link.hidden = false;
        link.href = `https://wa.me/919112970129?text=${encodeURIComponent(lines.join("\n"))}`;
      }
    }
  } catch (error) {
    showStatus(form, "The message could not be sent. Please call or WhatsApp the owner.", true);
  } finally {
    if (button) button.disabled = false;
  }
}

document.querySelectorAll("form[data-kind]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(form);
  });
});

const params = new URLSearchParams(window.location.search);
const quoteStatus = document.querySelector("#quote-form .form-status");
if (params.get("quote") === "sent" && quoteStatus) {
  quoteStatus.textContent = "Your quote request was sent to the owner.";
}
if (params.get("error") === "1" && quoteStatus) {
  quoteStatus.textContent = "The message could not be sent. Please call or WhatsApp the owner.";
  quoteStatus.classList.add("error");
}
if (params.has("quote") || params.has("error")) {
  const clean = window.location.pathname + window.location.hash;
  history.replaceState({}, "", clean);
}
