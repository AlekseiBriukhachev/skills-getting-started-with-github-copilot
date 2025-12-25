document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const template = document.getElementById("activity-template");

  function createParticipantItem(email, activityName) {
    const li = document.createElement("li");

    const bullet = document.createElement("span");
    bullet.className = "participant-bullet";
    bullet.setAttribute("aria-hidden", "true");

    const span = document.createElement("span");
    span.className = "participant-email";
    span.textContent = email;

    const removeBtn = document.createElement("button");
    removeBtn.className = "participant-remove";
    removeBtn.setAttribute("aria-label", `Remove ${email}`);
    removeBtn.textContent = "✖";

    removeBtn.addEventListener("click", async () => {
      if (!confirm(`Unregister ${email} from ${activityName}?`)) return;
      try {
        const res = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
          method: "DELETE"
        });
        const json = await res.json();
        if (!res.ok) throw json;
        // Refresh activities to reflect removal
        await loadActivities();
      } catch (err) {
        console.error("Failed to remove participant", err);
        alert(err?.detail || err?.message || "Failed to remove participant");
      }
    });

    li.appendChild(bullet);
    li.appendChild(span);
    li.appendChild(removeBtn);
    return li;
  }

  function renderActivities(data) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(data).forEach(([name, info]) => {
      // populate select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);

      // render card from template
      const node = template.content.cloneNode(true);
      node.querySelector(".activity-name").textContent = name;
      node.querySelector(".activity-desc").textContent = info.description;
      node.querySelector(".activity-schedule").textContent = `Schedule: ${info.schedule}`;
      node.querySelector(".activity-capacity").textContent = `Capacity: ${info.participants.length} / ${info.max_participants}`;

      const ul = node.querySelector(".participants-list");
      if (info.participants && info.participants.length) {
        info.participants.forEach(email => ul.appendChild(createParticipantItem(email, name)));
      } else {
        const li = document.createElement("li");
        li.textContent = "No participants yet.";
        ul.appendChild(li);
      }

      activitiesList.appendChild(node);
    });
  }

  async function loadActivities() {
    try {
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      renderActivities(data);
    } catch (err) {
      activitiesList.innerHTML = `<p class="error">Unable to load activities.</p>`;
      console.error(err);
    }
  }

  // Initial load
  loadActivities();

  // Keep existing signup behavior (if any) intact — also update participants after signup
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    messageEl.className = "hidden";
    if (!email || !activity) return;

    try {
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });
      const json = await res.json();
      if (!res.ok) throw json;
      messageEl.textContent = json.message || "Signed up!";
      messageEl.className = "message success";
      // clear form input
      document.getElementById("email").value = "";
      // refresh list to show new participant
      await loadActivities();
    } catch (err) {
      const msg = err?.detail || err?.message || "Signup failed";
      messageEl.textContent = msg;
      messageEl.className = "message error";
    }
  });
});
