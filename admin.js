(function () {
var supabase = window.djKenaSupabase;

const loginPanel = document.getElementById("login-panel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const bookingsBody = document.getElementById("bookings-body");
const bookingCount = document.getElementById("booking-count");
const dashboardMessage = document.getElementById("dashboard-message");

function showLogin() {
  loginPanel.classList.remove("hidden");
  dashboard.classList.add("hidden");
}

function showDashboard() {
  loginPanel.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

async function loadBookings() {
  dashboardMessage.textContent = "Loading bookings...";

  const { data, error } = await supabase
    .from("bookings")
    .select("customer_name, event_type, event_date, status")
    .order("created_at", { ascending: false });

  if (error) {
    dashboardMessage.textContent = "Error: " + error.message;
    return;
  }

  bookingsBody.replaceChildren();
  bookingCount.textContent = "Total bookings: " + data.length;

  if (data.length === 0) {
    bookingsBody.innerHTML =
      '<tr><td colspan="4">No bookings received yet.</td></tr>';
  } else {
    data.forEach(booking => {
      const row = document.createElement("tr");

      [
        booking.customer_name,
        booking.event_type,
        booking.event_date,
        booking.status
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value || "";
        row.appendChild(cell);
      });

      bookingsBody.appendChild(row);
    });
  }

  dashboardMessage.textContent = "Bookings updated.";
}

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

document.getElementById("refresh").addEventListener("click", loadBookings);

document.getElementById("signout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
  loginMessage.textContent = "You have signed out.";
});

supabase.auth.getSession().then(({ data }) => {
  verifyAdmin(data.session);
});
})();
