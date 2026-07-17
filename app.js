/* =========================================================================
   Jeremiah Da'a — Cybersecurity Portfolio
   app.js — shared nav behaviour, academic planner, contact form validation
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. Global navigation (hamburger menu) — runs on every page
   ------------------------------------------------------------------------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close the mobile menu when a link is chosen
  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* -------------------------------------------------------------------------
   2. Scroll-driven polish: reveal-on-scroll, progress bar, back-to-top
   ------------------------------------------------------------------------- */
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

function initScrollProgress() {
  const bar = document.getElementById("scrollProgress");
  if (!bar) return;

  let ticking = false;
  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + "%";
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
  update();
}

function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 480);
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* -------------------------------------------------------------------------
   3. Academic Planner (planner.html)
   Modular state stored in an in-memory array. Each task:
   { id, name, priority, dueDate, completed }
   ------------------------------------------------------------------------- */
const Planner = (() => {
  let tasks = [
    { id: cryptoId(), name: "Submit COS 106 lab report", priority: "high", dueDate: "2026-07-20", completed: false },
    { id: cryptoId(), name: "Review OSI model flashcards", priority: "medium", dueDate: "2026-07-18", completed: true },
  ];

  function cryptoId() {
    return "t-" + Math.random().toString(36).slice(2, 10);
  }

  function addTask(name, priority, dueDate) {
    tasks.unshift({ id: cryptoId(), name, priority, dueDate, completed: false });
    render();
  }

  function toggleTask(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    render();
  }

  function stats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pct };
  }

  function formatDate(iso) {
    if (!iso) return "No due date";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function taskRowHTML(task) {
    return `
      <li class="task-item ${task.completed ? "is-complete" : ""}" data-id="${task.id}">
        <button class="task-check" type="button" aria-label="${task.completed ? "Mark as not completed" : "Mark as completed"}" data-action="toggle">
          ${task.completed ? "✓" : ""}
        </button>
        <div class="task-main">
          <span class="task-name">${escapeHTML(task.name)}</span>
          <span class="task-meta">
            <span class="priority-pill priority-${task.priority}">${task.priority}</span>
            Due ${formatDate(task.dueDate)}
          </span>
        </div>
        <button class="task-delete" type="button" aria-label="Delete task" data-action="delete">✕</button>
      </li>`;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const list = document.getElementById("taskList");
    const emptyState = document.getElementById("emptyState");
    if (!list) return;

    if (tasks.length === 0) {
      list.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
    } else {
      if (emptyState) emptyState.style.display = "none";
      list.innerHTML = tasks.map(taskRowHTML).join("");
    }

    const { total, completed, pct } = stats();
    const totalEl = document.getElementById("statTotal");
    const completedEl = document.getElementById("statCompleted");
    const pctEl = document.getElementById("statProgress");
    const barEl = document.getElementById("progressFill");
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pctEl) pctEl.textContent = pct + "%";
    if (barEl) barEl.style.width = pct + "%";
  }

  function initEvents() {
    const form = document.getElementById("taskForm");
    const list = document.getElementById("taskList");
    if (!form || !list) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("taskName");
      const priorityInput = document.getElementById("taskPriority");
      const dateInput = document.getElementById("taskDue");
      const errorEl = document.getElementById("taskNameError");

      const name = nameInput.value.trim();
      if (!name) {
        errorEl.textContent = "Please enter a task name.";
        nameInput.focus();
        return;
      }
      errorEl.textContent = "";

      addTask(name, priorityInput.value, dateInput.value);
      form.reset();
      nameInput.focus();
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const row = btn.closest(".task-item");
      const id = row?.dataset.id;
      if (!id) return;

      if (btn.dataset.action === "toggle") toggleTask(id);
      if (btn.dataset.action === "delete") deleteTask(id);
    });
  }

  function init() {
    if (!document.getElementById("taskList")) return;
    initEvents();
    render();
  }

  return { init };
})();

/* -------------------------------------------------------------------------
   4. Contact form validation (contact.html)
   ------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const fields = {
    name: { input: document.getElementById("cName"), error: document.getElementById("cNameError") },
    email: { input: document.getElementById("cEmail"), error: document.getElementById("cEmailError") },
    phone: { input: document.getElementById("cPhone"), error: document.getElementById("cPhoneError") },
    message: { input: document.getElementById("cMessage"), error: document.getElementById("cMessageError") },
  };

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phonePattern = /^[0-9]+$/;

  function setFieldError(field, message) {
    field.error.textContent = message;
    field.input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    let valid = true;

    if (!fields.name.input.value.trim()) {
      setFieldError(fields.name, "Name is required.");
      valid = false;
    } else {
      setFieldError(fields.name, "");
    }

    const emailVal = fields.email.input.value.trim();
    if (!emailVal) {
      setFieldError(fields.email, "Email is required.");
      valid = false;
    } else if (!emailPattern.test(emailVal)) {
      setFieldError(fields.email, "Enter a valid email address.");
      valid = false;
    } else {
      setFieldError(fields.email, "");
    }

    const phoneVal = fields.phone.input.value.trim();
    if (!phoneVal) {
      setFieldError(fields.phone, "Phone number is required.");
      valid = false;
    } else if (!phonePattern.test(phoneVal)) {
      setFieldError(fields.phone, "Digits only, no spaces or symbols.");
      valid = false;
    } else {
      setFieldError(fields.phone, "");
    }

    if (!fields.message.input.value.trim()) {
      setFieldError(fields.message, "Please add a short message.");
      valid = false;
    } else {
      setFieldError(fields.message, "");
    }

    return valid;
  }

  function showStatus(type, message) {
    status.textContent = message;
    status.className = "form-status is-visible " + (type === "success" ? "is-success" : "is-error");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validate()) {
      showStatus("success", "Message sent — thank you, Jeremiah will reply within 48 hours.");
      form.reset();
    } else {
      showStatus("error", "Please fix the highlighted fields and try again.");
    }
  });

  // Live-clear a field's error once the user starts correcting it
  Object.values(fields).forEach(({ input, error }) => {
    input.addEventListener("input", () => {
      if (error.textContent) error.textContent = "";
    });
  });
}

/* -------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initScrollReveal();
  initScrollProgress();
  initBackToTop();
  Planner.init();
  initContactForm();
});
    tasks.unshift({ id: cryptoId(), name, priority, dueDate, completed: false });
    render();
  }

  function toggleTask(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    render();
  }

  function stats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pct };
  }

  function formatDate(iso) {
    if (!iso) return "No due date";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function taskRowHTML(task) {
    return `
      <li class="task-item ${task.completed ? "is-complete" : ""}" data-id="${task.id}">
        <button class="task-check" type="button" aria-label="${task.completed ? "Mark as not completed" : "Mark as completed"}" data-action="toggle">
          ${task.completed ? "✓" : ""}
        </button>
        <div class="task-main">
          <span class="task-name">${escapeHTML(task.name)}</span>
          <span class="task-meta">
            <span class="priority-pill priority-${task.priority}">${task.priority}</span>
            Due ${formatDate(task.dueDate)}
          </span>
        </div>
        <button class="task-delete" type="button" aria-label="Delete task" data-action="delete">✕</button>
      </li>`;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const list = document.getElementById("taskList");
    const emptyState = document.getElementById("emptyState");
    if (!list) return;

    if (tasks.length === 0) {
      list.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
    } else {
      if (emptyState) emptyState.style.display = "none";
      list.innerHTML = tasks.map(taskRowHTML).join("");
    }

    const { total, completed, pct } = stats();
    const totalEl = document.getElementById("statTotal");
    const completedEl = document.getElementById("statCompleted");
    const pctEl = document.getElementById("statProgress");
    const barEl = document.getElementById("progressFill");
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pctEl) pctEl.textContent = pct + "%";
    if (barEl) barEl.style.width = pct + "%";
  }

  function initEvents() {
    const form = document.getElementById("taskForm");
    const list = document.getElementById("taskList");
    if (!form || !list) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("taskName");
      const priorityInput = document.getElementById("taskPriority");
      const dateInput = document.getElementById("taskDue");
      const errorEl = document.getElementById("taskNameError");

      const name = nameInput.value.trim();
      if (!name) {
        errorEl.textContent = "Please enter a task name.";
        nameInput.focus();
        return;
      }
      errorEl.textContent = "";

      addTask(name, priorityInput.value, dateInput.value);
      form.reset();
      nameInput.focus();
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const row = btn.closest(".task-item");
      const id = row?.dataset.id;
      if (!id) return;

      if (btn.dataset.action === "toggle") toggleTask(id);
      if (btn.dataset.action === "delete") deleteTask(id);
    });
  }

  function init() {
    if (!document.getElementById("taskList")) return;
    initEvents();
    render();
  }

  return { init };
})();

/* -------------------------------------------------------------------------
   4. Contact form validation (contact.html)
   ------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const fields = {
    name: { input: document.getElementById("cName"), error: document.getElementById("cNameError") },
    email: { input: document.getElementById("cEmail"), error: document.getElementById("cEmailError") },
    phone: { input: document.getElementById("cPhone"), error: document.getElementById("cPhoneError") },
    message: { input: document.getElementById("cMessage"), error: document.getElementById("cMessageError") },
  };

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phonePattern = /^[0-9]+$/;

  function setFieldError(field, message) {
    field.error.textContent = message;
    field.input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    let valid = true;

    if (!fields.name.input.value.trim()) {
      setFieldError(fields.name, "Name is required.");
      valid = false;
    } else {
      setFieldError(fields.name, "");
    }

    const emailVal = fields.email.input.value.trim();
    if (!emailVal) {
      setFieldError(fields.email, "Email is required.");
      valid = false;
    } else if (!emailPattern.test(emailVal)) {
      setFieldError(fields.email, "Enter a valid email address.");
      valid = false;
    } else {
      setFieldError(fields.email, "");
    }

    const phoneVal = fields.phone.input.value.trim();
    if (!phoneVal) {
      setFieldError(fields.phone, "Phone number is required.");
      valid = false;
    } else if (!phonePattern.test(phoneVal)) {
      setFieldError(fields.phone, "Digits only, no spaces or symbols.");
      valid = false;
    } else {
      setFieldError(fields.phone, "");
    }

    if (!fields.message.input.value.trim()) {
      setFieldError(fields.message, "Please add a short message.");
      valid = false;
    } else {
      setFieldError(fields.message, "");
    }

    return valid;
  }

  function showStatus(type, message) {
    status.textContent = message;
    status.className = "form-status is-visible " + (type === "success" ? "is-success" : "is-error");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validate()) {
      showStatus("success", "Message sent — thank you, Jeremiah will reply within 48 hours.");
      form.reset();
    } else {
      showStatus("error", "Please fix the highlighted fields and try again.");
    }
  });

  // Live-clear a field's error once the user starts correcting it
  Object.values(fields).forEach(({ input, error }) => {
    input.addEventListener("input", () => {
      if (error.textContent) error.textContent = "";
    });
  });
}

/* -------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initScrollReveal();
  initScrollProgress();
  initBackToTop();
  Planner.init();
  initContactForm();
});
