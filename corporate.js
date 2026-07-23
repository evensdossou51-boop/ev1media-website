(function () {
    const menuButton = document.querySelector(".menu-button");
    const nav = document.querySelector(".site-nav");
    const launcher = document.querySelector(".company-launcher");
    const launcherButton = document.querySelector(".company-launcher-button");
    const launcherPanel = document.querySelector(".company-launcher-panel");

    const closeMenu = () => {
        if (!menuButton || !nav) return;
        menuButton.setAttribute("aria-expanded", "false");
        nav.classList.remove("open");
        document.body.classList.remove("menu-open");
    };

    const closeLauncher = () => {
        if (!launcherButton || !launcherPanel) return;
        launcherButton.setAttribute("aria-expanded", "false");
        launcherPanel.hidden = true;
    };

    if (menuButton && nav) {
        menuButton.addEventListener("click", () => {
            const isOpen = menuButton.getAttribute("aria-expanded") === "true";
            closeLauncher();
            menuButton.setAttribute("aria-expanded", String(!isOpen));
            nav.classList.toggle("open", !isOpen);
            document.body.classList.toggle("menu-open", !isOpen);
        });

        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });
    }

    if (launcher && launcherButton && launcherPanel) {
        launcherButton.addEventListener("click", () => {
            const isOpen = launcherButton.getAttribute("aria-expanded") === "true";
            closeMenu();
            launcherButton.setAttribute("aria-expanded", String(!isOpen));
            launcherPanel.hidden = isOpen;
        });

        document.addEventListener("click", (event) => {
            if (!launcher.contains(event.target)) closeLauncher();
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeLauncher();
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) closeMenu();
        closeLauncher();
    });

    const inquirySelect = document.getElementById("service");
    if (inquirySelect) {
        const requestedInquiry = new URLSearchParams(window.location.search).get("inquiry");
        if (requestedInquiry && [...inquirySelect.options].some((option) => option.value === requestedInquiry)) {
            inquirySelect.value = requestedInquiry;
        }
    }
})();
