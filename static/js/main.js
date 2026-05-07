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

    // =========================
    // Browser-side image compression
    // =========================

    function loadImageFromFile(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();

            reader.onload = function (event) {
                const img = new Image();

                img.onload = function () {
                    resolve(img);
                };

                img.onerror = reject;
                img.src = event.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function canvasToBlob(canvas, quality) {
        return new Promise(function (resolve) {
            canvas.toBlob(
                function (blob) {
                    resolve(blob);
                },
                "image/jpeg",
                quality
            );
        });
    }

    async function compressImageFile(file, options = {}) {
        const maxWidth = options.maxWidth || 1400;
        const maxHeight = options.maxHeight || 1400;
        const quality = options.quality || 0.72;

        const img = await loadImageFromFile(file);

        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const blob = await canvasToBlob(canvas, quality);

        const cleanName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/\s+/g, "-")
            .toLowerCase();

        return new File(
            [blob],
            `${cleanName}.jpg`,
            {
                type: "image/jpeg",
                lastModified: Date.now()
            }
        );
    }

    const imageCompressInputs = document.querySelectorAll(".image-compress-input");

    imageCompressInputs.forEach(function (input) {
        input.addEventListener("change", async function () {
            const statusBox = document.getElementById("uploadStatus");

            if (!input.files || input.files.length === 0) {
                return;
            }

            const originalFiles = Array.from(input.files);

            if (statusBox) {
                statusBox.className = "upload-status active";
                statusBox.textContent = "Optimizing images. Please wait...";
            }

            try {
                const compressedFiles = [];

                for (const file of originalFiles) {
                    if (!file.type.startsWith("image/")) {
                        continue;
                    }

                    const compressed = await compressImageFile(file, {
                        maxWidth: 1400,
                        maxHeight: 1400,
                        quality: 0.72
                    });

                    compressedFiles.push(compressed);
                }

                const totalSize = compressedFiles.reduce(function (total, file) {
                    return total + file.size;
                }, 0);

                const maxTotalSize = 4 * 1024 * 1024; // keep safely under Vercel limit

                if (totalSize > maxTotalSize) {
                    input.value = "";

                    if (statusBox) {
                        statusBox.className = "upload-status active error";
                        statusBox.textContent = "The selected images are still too large after optimization. Try fewer images at once.";
                    }

                    return;
                }

                const dataTransfer = new DataTransfer();

                compressedFiles.forEach(function (file) {
                    dataTransfer.items.add(file);
                });

                input.files = dataTransfer.files;

                if (statusBox) {
                    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
                    statusBox.className = "upload-status active success";
                    statusBox.textContent = `Images optimized successfully. Total upload size: ${sizeInMB} MB.`;
                }
            } catch (error) {
                input.value = "";

                if (statusBox) {
                    statusBox.className = "upload-status active error";
                    statusBox.textContent = "Could not optimize these images. Please try different images.";
                }

                console.error("Image compression failed:", error);
            }
        });
    });
});