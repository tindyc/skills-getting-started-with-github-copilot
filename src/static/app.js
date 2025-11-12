document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (avoid duplicate options if function re-runs)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create markup for main fields
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("p");
        participantsHeader.className = "participants-header";
        participantsHeader.innerHTML = `<strong>Participants:</strong>`;

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");

            // participant text
            const span = document.createElement("span");
            span.className = "participant-name";
            span.textContent = p;

            // delete/unregister button (uses a simple × symbol)
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
            deleteBtn.textContent = "×";

            // click handler to unregister participant
            deleteBtn.addEventListener("click", async () => {
              // confirm quick removal
              if (!confirm(`Unregister ${p} from ${name}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const result = await resp.json();

                if (resp.ok) {
                  // remove list item from DOM
                  li.remove();

                  // If no participants remain, show the placeholder
                  const remaining = participantsList.querySelectorAll("li");
                  if (remaining.length === 0) {
                    const noOne = document.createElement("li");
                    noOne.className = "no-participants";
                    noOne.textContent = "No participants yet.";
                    participantsList.appendChild(noOne);
                  }
                } else {
                  alert(result.detail || result.message || "Failed to unregister participant.");
                }
              } catch (error) {
                console.error("Error unregistering participant:", error);
                alert("Network error while unregistering. Please try again.");
              }
            });

            li.appendChild(span);
            li.appendChild(deleteBtn);
            participantsList.appendChild(li);
          });
        } else {
          const noOne = document.createElement("li");
          noOne.className = "no-participants";
          noOne.textContent = "No participants yet.";
          participantsList.appendChild(noOne);
        }

        participantsSection.appendChild(participantsHeader);
        participantsSection.appendChild(participantsList);

        // Assemble card
        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears without a manual reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
