/* ===========================
   AUTOPOST PWA CORE JS
   Handles auth, routing, install prompt, offline fallback
=========================== */

// ---------- AUTH CHECK ----------
function checkAuth() {
    const token = localStorage.getItem("authToken");

    // If no token → send user to sign in page
    if (!token) {
        window.location.href = "signin.html";
        return false;
    }
    return true;
}

// Run on every PWA page
checkAuth();


// ---------- ONLINE / OFFLINE HANDLING ----------
window.addEventListener("offline", () => {
    showOfflineToast("You're offline — some features may not work.");
});

window.addEventListener("online", () => {
    showOfflineToast("Back online!", true);
});

function showOfflineToast(message, success = false) {
    let toast = document.getElementById("offline-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "offline-toast";
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${success ? "#10B981" : "#EF4444"};
            color: #fff;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 99999;
            animation: fade 0.3s ease;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;

    setTimeout(() => {
        toast.remove();
    }, 3000);
}


// ---------- PWA INSTALL PROMPT ----------
let deferredPrompt;

// Listen for install availability
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show your custom "Install App" modal
    showInstallModal();
});

// Show modal
function showInstallModal() {
    const modal = document.getElementById("install-modal");
    if (modal) modal.style.display = "flex";
}

// Called when user clicks "Install"
async function installPWA() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;
    console.log("PWA Installation:", choice.outcome);

    deferredPrompt = null;

    const modal = document.getElementById("install-modal");
    if (modal) modal.style.display = "none";
}

// Close modal
function closeInstallModal() {
    const modal = document.getElementById("install-modal");
    if (modal) modal.style.display = "none";
}

