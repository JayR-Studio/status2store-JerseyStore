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

    // =========================
    // Product size selector + WhatsApp message
    // =========================
    const sizeOptions = document.querySelectorAll(".size-option");
    const whatsappOrderBtn = document.querySelector(".whatsapp-order-btn");
    const detailAddButton = document.querySelector(".detail-add");

    function updateWhatsAppOrderMessage(selectedSize) {
        if (!whatsappOrderBtn) {
            return;
        }

        const isAvailable = whatsappOrderBtn.dataset.available === "true";
        const baseUrl = whatsappOrderBtn.dataset.baseUrl;
        const productName = whatsappOrderBtn.dataset.productName || "Product";
        const productCategory = whatsappOrderBtn.dataset.productCategory || "Jersey";
        const productPrice = whatsappOrderBtn.dataset.productPrice || "";
        const productDescription = whatsappOrderBtn.dataset.productDescription || "No description provided.";
        const productUrl = whatsappOrderBtn.dataset.productUrl || window.location.href;

        let message;

        if (isAvailable) {
            message = `Hello, I want to order this item:

    Product: ${productName}
    Category: ${productCategory}
    Size: ${selectedSize}
    Price: ${productPrice}

    Description:
    ${productDescription}

    Product link:
    ${productUrl}

    Please confirm availability, payment, and delivery details.`;
        } else {
            message = `Hello, I am interested in this item:

    Product: ${productName}
    Category: ${productCategory}
    Price: ${productPrice}

    Description:
    ${productDescription}

    Product link:
    ${productUrl}

    Please notify me when it is back in stock.`;
        }

        const encodedMessage = encodeURIComponent(message);
        whatsappOrderBtn.href = `${baseUrl}?text=${encodedMessage}`;
    }

    if (sizeOptions.length > 0) {
        const activeSize = document.querySelector(".size-option.active");
        const defaultSize = activeSize ? activeSize.dataset.size : sizeOptions[0].dataset.size;

        if (detailAddButton) {
            detailAddButton.dataset.size = defaultSize;
        }

        updateWhatsAppOrderMessage(defaultSize);

        sizeOptions.forEach(function (button) {
            button.addEventListener("click", function () {
                sizeOptions.forEach(function (item) {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                const selectedSize = button.dataset.size;
                if (detailAddButton) {
                    detailAddButton.dataset.size = selectedSize;
                }
                updateWhatsAppOrderMessage(selectedSize);
            });
        });
    }

    // =========================
    // Order basket
    // =========================
    const basketKey = "footballchannel_basket";
    const basketDrawer = document.getElementById("basketDrawer");
    const basketOverlay = document.getElementById("basketOverlay");
    const basketToggle = document.getElementById("basketToggle");
    const mobileBasketToggle = document.getElementById("mobileBasketToggle");
    const basketClose = document.getElementById("basketClose");
    const basketItems = document.getElementById("basketItems");
    const basketTotal = document.getElementById("basketTotal");
    const basketCheckout = document.getElementById("basketCheckout");
    const basketClear = document.getElementById("basketClear");
    const basketToast = document.getElementById("basketToast");
    const basketCountEls = document.querySelectorAll(".basket-count");
    const addToBasketButtons = document.querySelectorAll(".add-to-basket");

    function getBasket() {
        try {
            return JSON.parse(localStorage.getItem(basketKey)) || [];
        } catch (error) {
            return [];
        }
    }

    function saveBasket(items) {
        localStorage.setItem(basketKey, JSON.stringify(items));
    }

    function formatNaira(value) {
        return `₦${Number(value || 0).toLocaleString()}`;
    }

    function getSizesFromValue(value, fallback) {
        const sizes = String(value || fallback || "S,M,L,XL,XXL")
            .split(",")
            .map(function (size) {
                return size.trim();
            })
            .filter(Boolean);

        return sizes.length ? sizes : ["S", "M", "L", "XL", "XXL"];
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function openBasket() {
        if (!basketDrawer || !basketOverlay) {
            return;
        }

        basketDrawer.classList.add("active");
        basketOverlay.classList.add("active");
        basketDrawer.setAttribute("aria-hidden", "false");
        document.body.classList.add("basket-open");
    }

    function closeBasket() {
        if (!basketDrawer || !basketOverlay) {
            return;
        }

        basketDrawer.classList.remove("active");
        basketOverlay.classList.remove("active");
        basketDrawer.setAttribute("aria-hidden", "true");
        document.body.classList.remove("basket-open");
    }

    function showBasketToast(message) {
        if (!basketToast) {
            return;
        }

        basketToast.textContent = message;
        basketToast.classList.add("active");

        setTimeout(function () {
            basketToast.classList.remove("active");
        }, 1800);
    }

    function renderBasket() {
        if (!basketItems || !basketTotal) {
            return;
        }

        const items = getBasket();
        const itemCount = items.reduce(function (total, item) {
            return total + item.quantity;
        }, 0);
        const total = items.reduce(function (sum, item) {
            return sum + (item.price * item.quantity);
        }, 0);

        basketCountEls.forEach(function (countEl) {
            countEl.textContent = itemCount;
        });

        basketTotal.textContent = formatNaira(total);

        if (basketCheckout) {
            basketCheckout.disabled = items.length === 0;
        }

        if (basketClear) {
            basketClear.disabled = items.length === 0;
        }

        if (items.length === 0) {
            basketItems.innerHTML = `
                <div class="basket-empty">
                    <h3>Your basket is empty</h3>
                    <p>Add jerseys from the catalogue, then send everything to WhatsApp at once.</p>
                </div>
            `;
            return;
        }

        basketItems.innerHTML = items.map(function (item) {
            const imageMarkup = item.image
                ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">`
                : `<span>${escapeHtml(item.name.charAt(0))}</span>`;

            const sizeOptionsMarkup = getSizesFromValue(item.sizes, item.size).map(function (size) {
                const selected = size === item.size ? "selected" : "";
                return `<option value="${escapeHtml(size)}" ${selected}>${escapeHtml(size)}</option>`;
            }).join("");

            return `
                <div class="basket-item" data-key="${escapeHtml(item.key)}">
                    <div class="basket-item-image">${imageMarkup}</div>
                    <div class="basket-item-info">
                        <h3>${escapeHtml(item.name)}</h3>
                        <label class="basket-size-label">
                            Size
                            <select class="basket-size-select" data-key="${escapeHtml(item.key)}">
                                ${sizeOptionsMarkup}
                            </select>
                        </label>
                        <strong>${formatNaira(item.price)}</strong>
                        <div class="quantity-control">
                            <button type="button" class="basket-qty" data-action="decrease" data-key="${escapeHtml(item.key)}">-</button>
                            <span>${item.quantity}</span>
                            <button type="button" class="basket-qty" data-action="increase" data-key="${escapeHtml(item.key)}">+</button>
                        </div>
                    </div>
                    <button type="button" class="basket-remove" data-key="${escapeHtml(item.key)}" aria-label="Remove ${escapeHtml(item.name)}">&times;</button>
                </div>
            `;
        }).join("");
    }

    function addItemToBasket(button) {
        const id = button.dataset.id;
        const size = button.dataset.size || "Not selected";
        const key = `${id}-${size}`;
        const items = getBasket();
        const existingItem = items.find(function (item) {
            return item.key === key;
        });

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            items.push({
                key,
                id,
                name: button.dataset.name || "Jersey",
                price: Number(button.dataset.price || 0),
                image: button.dataset.image || "",
                url: button.dataset.url || window.location.href,
                size,
                sizes: getSizesFromValue(button.dataset.sizes, size).join(","),
                quantity: 1
            });
        }

        saveBasket(items);
        renderBasket();
        showBasketToast("Added to basket");
    }

    function updateBasketQuantity(key, action) {
        let items = getBasket();

        items = items.map(function (item) {
            if (item.key !== key) {
                return item;
            }

            const nextQuantity = action === "increase" ? item.quantity + 1 : item.quantity - 1;
            return {
                ...item,
                quantity: nextQuantity
            };
        }).filter(function (item) {
            return item.quantity > 0;
        });

        saveBasket(items);
        renderBasket();
    }

    function updateBasketSize(key, nextSize) {
        const items = getBasket();
        const currentItem = items.find(function (item) {
            return item.key === key;
        });

        if (!currentItem) {
            return;
        }

        const nextKey = `${currentItem.id}-${nextSize}`;
        const existingItem = items.find(function (item) {
            return item.key === nextKey && item.key !== key;
        });

        if (existingItem) {
            existingItem.quantity += currentItem.quantity;
            saveBasket(items.filter(function (item) {
                return item.key !== key;
            }));
        } else {
            currentItem.size = nextSize;
            currentItem.key = nextKey;
            saveBasket(items);
        }

        renderBasket();
    }

    function removeBasketItem(key) {
        const items = getBasket().filter(function (item) {
            return item.key !== key;
        });

        saveBasket(items);
        renderBasket();
    }

    function clearBasket() {
        saveBasket([]);
        renderBasket();
        showBasketToast("Basket cleared");
    }

    function checkoutBasket() {
        const items = getBasket();
        const whatsappNumber = basketDrawer ? basketDrawer.dataset.whatsappNumber : "";

        if (!items.length) {
            showBasketToast("Your basket is empty");
            return;
        }

        if (!whatsappNumber) {
            showBasketToast("WhatsApp number is not set");
            return;
        }

        const total = items.reduce(function (sum, item) {
            return sum + (item.price * item.quantity);
        }, 0);

        const lines = items.map(function (item, index) {
            return `${index + 1}. ${item.name}
Size: ${item.size}
Quantity: ${item.quantity}
Unit Price: ${formatNaira(item.price)}
Subtotal: ${formatNaira(item.price * item.quantity)}
Link: ${item.url}`;
        }).join("\n\n");

        const message = `Hello, I want to place this jersey order:

${lines}

Total: ${formatNaira(total)}

Please confirm availability, payment, and delivery details.`;

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
    }

    addToBasketButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            if (!button.disabled) {
                addItemToBasket(button);
            }
        });
    });

    if (basketItems) {
        basketItems.addEventListener("click", function (event) {
            const quantityButton = event.target.closest(".basket-qty");
            const removeButton = event.target.closest(".basket-remove");

            if (quantityButton) {
                updateBasketQuantity(quantityButton.dataset.key, quantityButton.dataset.action);
            }

            if (removeButton) {
                removeBasketItem(removeButton.dataset.key);
            }
        });

        basketItems.addEventListener("change", function (event) {
            const sizeSelect = event.target.closest(".basket-size-select");

            if (sizeSelect) {
                updateBasketSize(sizeSelect.dataset.key, sizeSelect.value);
            }
        });
    }

    [basketToggle, mobileBasketToggle].forEach(function (button) {
        if (button) {
            button.addEventListener("click", openBasket);
        }
    });

    [basketClose, basketOverlay].forEach(function (button) {
        if (button) {
            button.addEventListener("click", closeBasket);
        }
    });

    if (basketCheckout) {
        basketCheckout.addEventListener("click", checkoutBasket);
    }

    if (basketClear) {
        basketClear.addEventListener("click", clearBasket);
    }

    renderBasket();

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
        return new Promise(function (resolve, reject) {
            canvas.toBlob(
                function (blob) {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Image compression failed."));
                    }
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

        // Prevent transparent PNGs from turning black after JPEG conversion
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

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
            if (!input.files || input.files.length === 0) {
                return;
            }

            const form = input.closest("form");
            const submitButton = form ? form.querySelector('button[type="submit"]') : null;
            const originalButtonText = submitButton ? submitButton.textContent : "";

            const statusBox = input.parentElement.querySelector(".upload-status");
            const originalFiles = Array.from(input.files);

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Optimizing...";
            }

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

                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
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

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            } catch (error) {
                input.value = "";

                if (statusBox) {
                    statusBox.className = "upload-status active error";
                    statusBox.textContent = "Could not optimize these images. Please try different images.";
                }

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }

                console.error("Image compression failed:", error);
            }
        });
    });
});
