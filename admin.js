
(function () {
  const supabase = window.djKenaSupabase;

  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const bookingsBody = document.getElementById("bookings-body");
  const bookingCount = document.getElementById("booking-count");
  const dashboardMessage = document.getElementById("dashboard-message");
  const detailsPanel = document.getElementById("booking-details");
  const detailsContent = document.getElementById("booking-details-content");

  function showLogin() {
    loginPanel.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }

  function showDashboard() {
    loginPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value || "";
    row.appendChild(cell);
    return cell;
  }

  function addAction(row, label, action, bookingId) {
    const cell = row.cells[4] || row.insertCell();
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.style.margin = "4px";
    button.style.padding = "8px";
    button.addEventListener("click", () => action(bookingId));

    cell.appendChild(button);
  }

  async function loadBookings() {
    dashboardMessage.textContent = "Loading bookings...";

    const { data, error } = await supabase
      .from("bookings")
      .select("id, customer_name, email, phone, event_type, event_date, event_time, location, venue, budget, message, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      dashboardMessage.textContent = "Error: " + error.message;
      return;
    }

    bookingsBody.replaceChildren();
    bookingCount.textContent = "Total bookings: " + data.length;

    if (data.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.textContent = "No bookings received yet.";
      row.appendChild(cell);
      bookingsBody.appendChild(row);
    }

    data.forEach(booking => {
      const row = document.createElement("tr");

      addCell(row, booking.customer_name);
      addCell(row, booking.event_type);
      addCell(row, booking.event_date);
      addCell(row, booking.status);

      const actions = document.createElement("td");
      row.appendChild(actions);

      addAction(row, "View", showBookingDetails, booking.id);
      addAction(row, "Confirm", confirmBooking, booking.id);
      addAction(row, "Reject", rejectBooking, booking.id);
      addAction(row, "Delete", deleteBooking, booking.id);

      bookingsBody.appendChild(row);
    });

    dashboardMessage.textContent = "Bookings updated.";
  }

  async function showBookingDetails(id) {
    dashboardMessage.textContent = "Loading booking details...";

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      dashboardMessage.textContent = "Error: " + error.message;
      return;
    }

    detailsContent.replaceChildren();

    const fields = [
      ["Customer", data.customer_name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Event type", data.event_type],
      ["Event date", data.event_date],
      ["Event time", data.event_time],
      ["Location", data.location],
      ["Venue", data.venue],
      ["Budget", data.budget],
      ["Message", data.message],
      ["Status", data.status],
      ["Submitted", data.created_at]
    ];

    fields.forEach(([label, value]) => {
      const paragraph = document.createElement("p");
      const strong = document.createElement("strong");

      strong.textContent = label + ": ";
      paragraph.appendChild(strong);
      paragraph.appendChild(document.createTextNode(value || "Not provided"));

      detailsContent.appendChild(paragraph);
    });

    detailsPanel.classList.remove("hidden");
    dashboardMessage.textContent = "Booking details loaded.";
  }

  async function updateBookingStatus(id, status) {
    dashboardMessage.textContent = "Updating booking...";

    const { error } = await supabase
      .from("bookings")
      .update({ status: status })
      .eq("id", id);

    if (error) {
      dashboardMessage.textContent = "Update failed: " + error.message;
      return;
    }

    detailsPanel.classList.add("hidden");
    await loadBookings();
    dashboardMessage.textContent = "Booking marked as " + status + ".";
  }

  function confirmBooking(id) {
    if (window.confirm("Confirm this booking?")) {
      updateBookingStatus(id, "confirmed");
    }
  }

  function rejectBooking(id) {
    if (window.confirm("Reject this booking?")) {
      updateBookingStatus(id, "rejected");
    }
  }

  async function deleteBooking(id) {
    if (!window.confirm("Permanently delete this booking?")) return;

    dashboardMessage.textContent = "Deleting booking...";

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      dashboardMessage.textContent = "Delete failed: " + error.message;
      return;
    }

    detailsPanel.classList.add("hidden");
    await loadBookings();
    dashboardMessage.textContent = "Booking deleted.";
  }

  document.getElementById("close-details").addEventListener("click", () => {
    detailsPanel.classList.add("hidden");
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginMessage.textContent = "Signing in...";

    const { data, error } = await supabase.auth.signInWithPassword({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });

    if (error) {
      loginMessage.textContent = "Login failed: " + error.message;
      return;
    }

    await verifyAdmin(data.session);
  });

  async function verifyAdmin(session) {
    if (!session) {
      showLogin();
      return;
    }

    const { data, error } = await supabase.rpc("is_admin");

    if (error || data !== true) {
      await supabase.auth.signOut();
      showLogin();
      loginMessage.textContent =
        "This account is not registered as an administrator.";
      return;
    }

    showDashboard();
    await loadBookings();
  }

  document.getElementById("refresh").addEventListener("click", loadBookings);

  document.getElementById("signout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    detailsPanel.classList.add("hidden");
    showLogin();
    loginMessage.textContent = "You have signed out.";
  });

  supabase.auth.getSession().then(({ data }) => {
    verifyAdmin(data.session);
  });
})();
