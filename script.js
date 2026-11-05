const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "×" : "☰";
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "☰";
}));
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

/* DJ Kena prod — Public booking form */

const bookingForm = document.getElementById("booking-form");

if (bookingForm) {
  bookingForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const bookingMessage = document.getElementById("booking-message");
    const submitButton = bookingForm.querySelector('button[type="submit"]');

    bookingMessage.textContent = "Sending your booking request...";
    submitButton.disabled = true;

    const formData = new FormData(bookingForm);

    const booking = {
      customer_name: formData.get("customer_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      event_type: formData.get("event_type"),
      event_date: formData.get("event_date"),
      event_time: formData.get("event_time") || null,
      location: formData.get("location"),
      venue: formData.get("venue") || null,
      budget: formData.get("budget") || null,
      message: formData.get("message") || null,
      status: "pending"
    };

    try {
      const { error } = await window.djKenaSupabase
        .from("bookings")
        .insert([booking]);

      if (error) throw error;

      bookingMessage.textContent =
        "Your booking request has been received! DJ Kena prod will get back to you.";

      bookingForm.reset();

    } catch (error) {
      console.error("Booking error:", error);

      bookingMessage.textContent =
        "Sorry, your request could not be sent. Please try again or contact us on WhatsApp.";

    } finally {
      submitButton.disabled = false;
    }
  });
}
