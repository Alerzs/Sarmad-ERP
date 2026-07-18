document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".has-submenu > .toggle").forEach(toggle => {
        toggle.style.cursor = "pointer";
        toggle.addEventListener("click", () => {
            const submenu = toggle.nextElementSibling;
            if (submenu) {
                submenu.style.display = submenu.style.display === "block" ? "none" : "block";
            }
        });
    });
});