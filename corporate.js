(function () {
    const menuButton = document.querySelector(".menu-button");
    const nav = document.querySelector(".site-nav");

    if (menuButton && nav) {
        const closeMenu = () => {
            menuButton.setAttribute("aria-expanded", "false");
            nav.classList.remove("open");
            document.body.classList.remove("menu-open");
        };

        menuButton.addEventListener("click", () => {
            const isOpen = menuButton.getAttribute("aria-expanded") === "true";
            menuButton.setAttribute("aria-expanded", String(!isOpen));
            nav.classList.toggle("open", !isOpen);
            document.body.classList.toggle("menu-open", !isOpen);
        });

        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760) closeMenu();
        });
    }

    const inquirySelect = document.getElementById("service");
    if (inquirySelect) {
        const requestedInquiry = new URLSearchParams(window.location.search).get("inquiry");
        if (requestedInquiry && [...inquirySelect.options].some((option) => option.value === requestedInquiry)) {
            inquirySelect.value = requestedInquiry;
        }
    }
})();
