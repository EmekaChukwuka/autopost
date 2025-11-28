  // Dark Mode Toggle
    const darkModeToggle = document.getElementById('toggle');
    const root = document.documentElement;
    let dashboardImg = document.getElementsByClassName('dashboard-preview');
    if (localStorage.getItem('theme') === 'dark') {
      root.setAttribute('data-theme', 'dark');
      darkModeToggle.checked = true;
      dashboardImg.srcObject= "autopost-dashboard-dark,jpg";
    }

    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      dashboardImg.srcObject= "autopost-dashboard-dark,jpg";
      } else {
        root.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
    });
// Handles the PWA installation prompt
let deferredPrompt;

// Listen for the "beforeinstallprompt" event
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); 
    deferredPrompt = event;

    // Show your custom install modal or button
    const installModal = document.getElementById("installPwaModal");
    if (installModal) installModal.style.display = "block";
});

// When the user clicks the install button
async function installPWA() {
    if (!deferredPrompt) {
        alert("Install prompt not available yet.");
        return;
    }

    // Show the browser install prompt
    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
        console.log("PWA installed!");
    } else {
        console.log("PWA installation dismissed.");
    }

    // Reset the prompt
    deferredPrompt = null;

    // Hide modal
    const installModal = document.getElementById("installPwaModal");
    if (installModal) installModal.style.display = "none";
}

// For pages that include an install button
window.installPWA = installPWA;
