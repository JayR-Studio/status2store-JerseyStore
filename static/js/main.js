document.addEventListener("DOMContentLoaded", function () {
    // Helper function to close menu
    function closeMenu(toggle, panel) {
        toggle.classList.remove("active");
        panel.classList.remove("active");
    }

    // =========================
    // Public mobile navbar
    // =========================
    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            menuToggle.classList.toggle("active");
            mobileMenu.classList.toggle("active");
        });

        mobileMenu.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        const mobileLinks = mobileMenu.querySelectorAll("a");

        mobileLinks.forEach(function (link) {
            link.addEventListener("click", function () {
                closeMenu(menuToggle, mobileMenu);
            });
        });

        document.addEventListener("click", function (e) {
            if (
                mobileMenu.classList.contains("active") &&
                !mobileMenu.contains(e.target) &&
                !menuToggle.contains(e.target)
            ) {
                closeMenu(menuToggle, mobileMenu);
            }
        });
    }

    // =========================
    // Admin mobile sidebar
    // =========================
    const adminMenuToggle = document.getElementById("adminMenuToggle");
    const adminSidebar = document.getElementById("adminSidebar");

    if (adminMenuToggle && adminSidebar) {
        adminMenuToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            adminMenuToggle.classList.toggle("active");
            adminSidebar.classList.toggle("active");
        });

        adminSidebar.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        const adminLinks = adminSidebar.querySelectorAll("a");

        adminLinks.forEach(function (link) {
            link.addEventListener("click", function () {
                closeMenu(adminMenuToggle, adminSidebar);
            });
        });

        document.addEventListener("click", function (e) {
            if (
                adminSidebar.classList.contains("active") &&
                !adminSidebar.contains(e.target) &&
                !adminMenuToggle.contains(e.target)
            ) {
                closeMenu(adminMenuToggle, adminSidebar);
            }
        });
    }

    // =========================
    // Product detail thumbnails
    // =========================
    const mainProductImage = document.querySelector(".main-product-image img");
    const thumbnails = document.querySelectorAll(".thumbnail");

    if (mainProductImage && thumbnails.length > 0) {
        thumbnails.forEach(function (thumbnail) {
            thumbnail.addEventListener("click", function () {
                thumbnails.forEach(function (item) {
                    item.classList.remove("active");
                });

                thumbnail.classList.add("active");

                const newImage = thumbnail.dataset.image;

                if (newImage) {
                    mainProductImage.src = newImage;
                }
            });
        });
    }

        // Product size selector + WhatsApp message
    const sizeOptions = document.querySelectorAll(".size-option");
    const whatsappOrderBtn = document.querySelector(".whatsapp-order-btn");

    if (sizeOptions.length > 0 && whatsappOrderBtn) {
        const isAvailable = whatsappOrderBtn.dataset.available === "true";

        sizeOptions.forEach(function (button) {
            button.addEventListener("click", function () {
                sizeOptions.forEach(function (item) {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                const selectedSize = button.dataset.size;
                const baseUrl = whatsappOrderBtn.dataset.baseUrl;
                const productName = whatsappOrderBtn.dataset.productName;

                let message;

                if (isAvailable) {
                    message = `Hi, I am interested in this ${productName}, Size: ${selectedSize}`;
                } else {
                    message = `Hi, I am interested in this ${productName}. Please notify me when it is back in stock.`;
                }

                const encodedMessage = encodeURIComponent(message);
                whatsappOrderBtn.href = `${baseUrl}?text=${encodedMessage}`;
            });
        });
    }

        // Image upload size guard
    const imageInputs = document.querySelectorAll('input[type="file"][name="images"], input[type="file"][name="hero_image"]');

    imageInputs.forEach(function (input) {
        input.addEventListener("change", function () {
            const maxSize = 3 * 1024 * 1024; // 3 MB
            const files = Array.from(input.files);

            const tooLarge = files.find(function (file) {
                return file.size > maxSize;
            });

            if (tooLarge) {
                alert("This image is too large. Please upload an image under 3 MB.");
                input.value = "";
            }
        });
    });
});