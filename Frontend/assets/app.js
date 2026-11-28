(() => {
  const API = "http://localhost:5000/api";
  const $ = (id) => document.getElementById(id);

  // API request helper with authentication token
  async function request(path, opts = {}) {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    const headers = {
      ...(opts.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(opts.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API + path, {
      ...opts,
      headers
    });

    let data = {};

    try {
      data = await response.json();
    } catch {}

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  // Message helper
  function msg(id, text, ok = false) {
    const element = $(id);

    if (!element) return;

    element.textContent = text;
    element.className = "msg " + (ok ? "ok" : "err");
  }

  // Registration
  if ($("f") && $("name") && $("pw2")) {
    $("f").addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = $("name").value.trim();
      const email = $("email").value.trim();
      const password = $("pw").value;
      const area = $("area")?.value || "";

      if (password !== $("pw2").value) {
        msg("msg", "Passwords do not match.");
        return;
      }

      try {
        await request("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            area
          })
        });

        msg("msg", "Account created. Please log in.", true);

        setTimeout(() => {
          location.href = "login.html";
        }, 700);

      } catch (error) {
        msg("msg", error.message);
      }
    });
  }

  // Login is handled inside login.html.
  // Do not add another login submit handler here.

  // Forgot password
  if ($("f") && $("email") && !$ ("pw")) {
    $("f").addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const data = await request("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({
            email: $("email").value.trim()
          })
        });

        msg(
          "msg",
          data.message ||
            "If the account exists, reset instructions are available.",
          true
        );

        if (
          data.resetToken &&
          location.hostname === "localhost"
        ) {
          msg(
            "msg",
            "Development reset token: " + data.resetToken,
            true
          );
        }

      } catch (error) {
        msg("msg", error.message);
      }
    });
  }

  // Reset password
  if (
    $("pw") &&
    $("pw2") &&
    new URLSearchParams(location.search).has("token")
  ) {
    $("f")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        await request("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            token: new URLSearchParams(location.search).get("token"),
            password: $("pw").value
          })
        });

        msg("msg", "Password updated. Log in now.", true);

        setTimeout(() => {
          location.href = "login.html";
        }, 700);

      } catch (error) {
        msg("msg", error.message);
      }
    });
  }

  // Citizen report submission
  if ($("reportForm")) {
    $("reportForm").addEventListener("submit", async (event) => {
      event.preventDefault();

      const lat = window.safeStreetPicked?.lat;
      const lng = window.safeStreetPicked?.lng;

      if (lat == null || lng == null) {
        msg("rmsg", "Select a point on the map first.");
        return;
      }

      const formData = new FormData();

      formData.append("category", $("type").value);
      formData.append("description", $("desc").value.trim());
      formData.append("lat", lat);
      formData.append("lng", lng);

      if ($("img")?.files?.[0]) {
        formData.append("image", $("img").files[0]);
      }

      try {
        const data = await request("/reports", {
          method: "POST",
          body: formData
        });

        msg(
          "rmsg",
          "Report submitted and saved. Reference: " +
            data.report.id,
          true
        );

        $("desc").value = "";

        if ($("img")) {
          $("img").value = "";
        }

        loadCitizenReports();

      } catch (error) {
        msg("rmsg", error.message);
      }
    }, true);
  }

  // Load citizen reports
  async function loadCitizenReports() {
    const panel = $("apiMyReports");

    if (!panel) return;

    try {
      const data = await request("/reports/mine");
      const reports = data.reports || [];

      panel.innerHTML =
        "<h3>My submitted reports</h3>" +
        (
          !reports.length
            ? "<p>No reports submitted yet.</p>"
            : reports.map((report) => `
                <article class="api-report">
                  <strong>${esc(report.category)}</strong>

                  <span class="api-status">
                    ${esc(report.status)}
                  </span>

                  <p>${esc(report.description)}</p>

                  <small>
                    Ref ${esc(report.id)} ·
                    ${new Date(report.createdAt).toLocaleString()}
                  </small>
                </article>
              `).join("")
        );

    } catch {
      panel.innerHTML =
        "<p>Sign in to view reports saved to your account.</p>";
    }
  }

  // Add citizen reports section
  if ($("reportForm")) {
    const panel = document.createElement("section");

    panel.id = "apiMyReports";
    panel.className = "api-panel";

    $("reportForm").parentElement.appendChild(panel);

    loadCitizenReports();
  }

  // Admin dashboard live data
  if (location.pathname.endsWith("admin-dashboard.html")) {
    const panel = document.createElement("section");

    panel.className = "api-panel api-admin-live";

    panel.innerHTML = `
      <h2>Live backend data</h2>

      <div id="apiAdminStats">
        Loading reports from database…
      </div>

      <div id="apiAdminList"></div>
    `;

    document.querySelector("main")?.appendChild(panel);

    request("/admin/analytics")
      .then((data) => {
        $("apiAdminStats").innerHTML = `
          <div class="api-stats">
            <b>Total ${Number(data.total || 0)}</b>
            <b>Pending ${Number(data.pending || 0)}</b>
            <b>Verified ${Number(data.verified || 0)}</b>
            <b>Resolved ${Number(data.resolved || 0)}</b>
          </div>
        `;

        const reports = data.latest || [];

        $("apiAdminList").innerHTML = reports.map((report) => `
          <article class="api-report">
            <strong>
              ${esc(report.category)} · ${esc(report.status)}
            </strong>

            <p>${esc(report.description)}</p>

            <small>
              ${esc(report.id)} ·
              ${esc(report.reporterName || "Citizen")}
            </small>

            <div class="api-actions">
              <button
                data-id="${esc(report.id)}"
                data-status="verified"
              >
                Verify
              </button>

              <button
                data-id="${esc(report.id)}"
                data-status="resolved"
              >
                Resolve
              </button>
            </div>
          </article>
        `).join("");
      })
      .catch((error) => {
        $("apiAdminStats").textContent =
          error.message ||
          "Admin login required to load live data.";
      });

    // Admin status update
    panel.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-id]");

      if (!button) return;

      try {
        await request(
          "/reports/" +
            encodeURIComponent(button.dataset.id) +
            "/status",
          {
            method: "PATCH",
            body: JSON.stringify({
              status: button.dataset.status,
              note: "Updated from admin dashboard"
            })
          }
        );

        button.closest(".api-report")
          .querySelector("strong")
          .textContent += " · Saved";

      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Logout
  document.querySelectorAll("a").forEach((link) => {
    if (
      (link.textContent || "").trim().toLowerCase() === "log out"
    ) {
      link.addEventListener("click", async (event) => {
        event.preventDefault();

        try {
          await request("/auth/logout", {
            method: "POST"
          });
        } catch {}

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        location.href = "index.html";
      });
    }
  });

  // Escape HTML to prevent unsafe markup
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

})();