(function () {
  "use strict";

  const STORAGE_KEY = "crimsonBite.cart.v1";
  const TAX_RATE = 0.08;
  const DELIVERY_FEE = 3.99;
  const FREE_DELIVERY_MIN = 25;

  const ICONS = {
    burgers:
      '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="6" y="20" width="36" height="8" fill="currentColor"/><path d="M8 20c0-8 7-12 16-12s16 4 16 12" stroke="currentColor" stroke-width="3"/><path d="M8 32h32v3a7 7 0 0 1-7 7H15a7 7 0 0 1-7-7v-3z" fill="currentColor"/></svg>',
    pizza:
      '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 6 42 40H6L24 6z" fill="currentColor"/><circle cx="24" cy="26" r="3" fill="#111"/><circle cx="17" cy="32" r="2" fill="#111"/><circle cx="30" cy="31" r="2" fill="#111"/></svg>',
    sides:
      '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M10 18h28l-3 22H13L10 18z" fill="currentColor"/><path d="M16 18V10M24 18V8M32 18v-8" stroke="#111" stroke-width="3"/></svg>',
    drinks:
      '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M16 8h16l-2 32H18L16 8z" fill="currentColor"/><path d="M15 16h18" stroke="#c8102e" stroke-width="3"/></svg>',
  };

  const MENU = [
    { id: "smash", name: "Classic Smash", description: "Two thin patties, pickles, onion, house sauce.", price: 11.5, category: "burgers" },
    { id: "flame", name: "Double Flame", description: "Charred chuck, smoked cheddar, hot relish.", price: 13.75, category: "burgers" },
    { id: "jalapeno", name: "Spicy Jalapeño", description: "Pepperjack, pickled heat, lime crema.", price: 12.95, category: "burgers" },
    { id: "swiss", name: "Mushroom Swiss", description: "Butter-seared mushrooms and melted Swiss.", price: 13.25, category: "burgers" },
    { id: "margherita", name: "Margherita", description: "Crushed tomato, basil oil, fresh mozzarella.", price: 14.0, category: "pizza" },
    { id: "pepperoni", name: "Pepperoni Heat", description: "Cupped pepperoni, chili honey, extra bake.", price: 15.5, category: "pizza" },
    { id: "bbq", name: "BBQ Chicken", description: "Pulled chicken, red onion, white cheddar.", price: 16.25, category: "pizza" },
    { id: "quatro", name: "Four Cheese", description: "Mozzarella, provolone, parmesan, ricotta.", price: 15.0, category: "pizza" },
    { id: "fries", name: "Loaded Fries", description: "Crisp russets, red sauce, herbs.", price: 6.5, category: "sides" },
    { id: "rings", name: "Onion Rings", description: "Buttermilk batter, black pepper salt.", price: 6.0, category: "sides" },
    { id: "knots", name: "Garlic Knots", description: "Soft dough, roasted garlic, parsley.", price: 5.75, category: "sides" },
    { id: "cola", name: "House Cola", description: "Cold, sharp, and not too sweet.", price: 2.75, category: "drinks" },
    { id: "lemon", name: "Lemon Spark", description: "Sparkling lemon with a bitter edge.", price: 3.25, category: "drinks" },
    { id: "tea", name: "Iced Tea", description: "Black tea, lemon wheel, no syrup.", price: 2.95, category: "drinks" },
  ];

  const MENU_IDS = new Set(MENU.map(function (item) {
    return item.id;
  }));

  let cart = [];
  let activeCategory = "all";
  let lastFocused = null;

  const els = {
    menuGrid: document.getElementById("menu-grid"),
    filters: document.getElementById("filters"),
    badge: document.getElementById("cart-badge"),
    toggle: document.getElementById("cart-toggle"),
    drawer: document.getElementById("cart-drawer"),
    cartOverlay: document.getElementById("cart-overlay"),
    cartClose: document.getElementById("cart-close"),
    cartItems: document.getElementById("cart-items"),
    cartEmpty: document.getElementById("cart-empty"),
    cartTotals: document.getElementById("cart-totals"),
    totalSub: document.getElementById("total-sub"),
    totalTax: document.getElementById("total-tax"),
    totalDelivery: document.getElementById("total-delivery"),
    deliveryLabel: document.getElementById("delivery-label"),
    totalGrand: document.getElementById("total-grand"),
    checkoutOpen: document.getElementById("checkout-open"),
    checkoutModal: document.getElementById("checkout-modal"),
    checkoutOverlay: document.getElementById("checkout-overlay"),
    checkoutClose: document.getElementById("checkout-close"),
    checkoutForm: document.getElementById("checkout-form"),
    fieldName: document.getElementById("field-name"),
    fieldPhone: document.getElementById("field-phone"),
    fieldAddress: document.getElementById("field-address"),
    errorName: document.getElementById("error-name"),
    errorPhone: document.getElementById("error-phone"),
    errorAddress: document.getElementById("error-address"),
    confirmModal: document.getElementById("confirm-modal"),
    confirmOverlay: document.getElementById("confirm-overlay"),
    confirmDone: document.getElementById("confirm-done"),
    orderId: document.getElementById("order-id"),
    confirmSummary: document.getElementById("confirm-summary"),
    confirmTotal: document.getElementById("confirm-total"),
  };

  function money(value) {
    return "$" + value.toFixed(2);
  }

  function getMenuItem(id) {
    return MENU.find(function (item) {
      return item.id === id;
    });
  }

  function getTotals() {
    var subtotal = cart.reduce(function (sum, line) {
      return sum + line.price * line.qty;
    }, 0);
    var tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    var delivery = subtotal >= FREE_DELIVERY_MIN || subtotal === 0 ? 0 : DELIVERY_FEE;
    var total = Math.round((subtotal + tax + delivery) * 100) / 100;
    var count = cart.reduce(function (sum, line) {
      return sum + line.qty;
    }, 0);
    return { subtotal: subtotal, tax: tax, delivery: delivery, total: total, count: count };
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      /* private mode or quota — keep in-memory cart */
    }
  }

  function loadCart() {
    try {
      var raw;
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (storageErr) {
        cart = [];
        return;
      }
      if (!raw) {
        cart = [];
        return;
      }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("shape");
      }
      var merged = {};
      parsed.forEach(function (item) {
        if (
          !item ||
          !MENU_IDS.has(item.id) ||
          !Number.isFinite(item.price) ||
          !Number.isInteger(item.qty) ||
          item.qty < 1
        ) {
          return;
        }
        var menu = getMenuItem(item.id);
        if (merged[item.id]) {
          merged[item.id].qty += item.qty;
        } else {
          merged[item.id] = {
            id: menu.id,
            name: menu.name,
            price: menu.price,
            qty: item.qty,
          };
        }
      });
      cart = Object.keys(merged).map(function (id) {
        return merged[id];
      });
      saveCart();
    } catch (err) {
      cart = [];
      saveCart();
    }
  }

  function addItem(id) {
    var menu = getMenuItem(id);
    if (!menu) {
      return;
    }
    var existing = cart.find(function (line) {
      return line.id === id;
    });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: menu.id, name: menu.name, price: menu.price, qty: 1 });
    }
    persistAndRender();
  }

  function setQty(id, qty) {
    if (qty < 1) {
      removeItem(id);
      return;
    }
    var line = cart.find(function (item) {
      return item.id === id;
    });
    if (!line) {
      return;
    }
    line.qty = qty;
    persistAndRender();
  }

  function removeItem(id) {
    cart = cart.filter(function (item) {
      return item.id !== id;
    });
    persistAndRender();
  }

  function clearCart() {
    cart = [];
    persistAndRender();
  }

  function persistAndRender() {
    saveCart();
    renderCart();
  }

  function renderMenu() {
    var items = MENU.filter(function (item) {
      return activeCategory === "all" || item.category === activeCategory;
    });
    els.menuGrid.innerHTML = items
      .map(function (item) {
        return (
          '<article class="menu-card">' +
          '<div class="card-media" data-category="' +
          item.category +
          '" aria-hidden="true">' +
          ICONS[item.category] +
          "</div>" +
          '<div class="card-body">' +
          "<h3>" +
          item.name +
          "</h3>" +
          "<p>" +
          item.description +
          "</p>" +
          '<div class="card-row">' +
          '<span class="price">' +
          money(item.price) +
          "</span>" +
          '<button type="button" class="add-btn" data-add="' +
          item.id +
          '">Add</button>' +
          "</div></div></article>"
        );
      })
      .join("");
  }

  function renderFilters() {
    var buttons = els.filters.querySelectorAll(".filter-btn");
    buttons.forEach(function (btn) {
      var active = btn.getAttribute("data-category") === activeCategory;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function renderCart() {
    var totals = getTotals();
    els.badge.textContent = String(totals.count);

    if (cart.length === 0) {
      els.cartItems.innerHTML = "";
      els.cartEmpty.hidden = false;
      els.cartTotals.hidden = true;
      els.checkoutOpen.disabled = true;
      return;
    }

    els.cartEmpty.hidden = true;
    els.cartTotals.hidden = false;
    els.checkoutOpen.disabled = false;
    els.cartItems.innerHTML = cart
      .map(function (line) {
        return (
          '<li class="cart-item">' +
          "<h3>" +
          line.name +
          "</h3>" +
          '<span class="line-price">' +
          money(line.price * line.qty) +
          "</span>" +
          '<div class="qty-row">' +
          '<button type="button" class="qty-btn" data-qty-delta="-1" data-id="' +
          line.id +
          '" aria-label="Decrease quantity">−</button>' +
          "<span>" +
          line.qty +
          "</span>" +
          '<button type="button" class="qty-btn" data-qty-delta="1" data-id="' +
          line.id +
          '" aria-label="Increase quantity">+</button>' +
          '<button type="button" class="remove-btn" data-remove="' +
          line.id +
          '">Remove</button>' +
          "</div></li>"
        );
      })
      .join("");

    els.totalSub.textContent = money(totals.subtotal);
    els.totalTax.textContent = money(totals.tax);
    els.totalDelivery.textContent = money(totals.delivery);
    els.deliveryLabel.textContent =
      totals.delivery === 0 && totals.subtotal > 0 ? "Delivery (free)" : "Delivery";
    els.totalGrand.textContent = money(totals.total);
  }

  function setHidden(el, hidden) {
    el.hidden = hidden;
  }

  function syncScrollLock() {
    var open =
      !els.drawer.hidden || !els.checkoutModal.hidden || !els.confirmModal.hidden;
    document.body.classList.toggle("lock-scroll", open);
  }

  function openDrawer() {
    lastFocused = document.activeElement;
    setHidden(els.drawer, false);
    setHidden(els.cartOverlay, false);
    els.drawer.classList.add("is-open");
    els.toggle.setAttribute("aria-expanded", "true");
    syncScrollLock();
    els.cartClose.focus();
  }

  function closeDrawer(options) {
    els.drawer.classList.remove("is-open");
    setHidden(els.drawer, true);
    setHidden(els.cartOverlay, true);
    els.toggle.setAttribute("aria-expanded", "false");
    syncScrollLock();
    if ((!options || !options.skipFocus) && lastFocused) {
      lastFocused.focus();
    }
  }

  function openCheckout() {
    if (cart.length === 0) {
      return;
    }
    closeDrawer({ skipFocus: true });
    setHidden(els.checkoutModal, false);
    setHidden(els.checkoutOverlay, false);
    syncScrollLock();
    els.fieldName.focus();
  }

  function closeCheckout() {
    setHidden(els.checkoutModal, true);
    setHidden(els.checkoutOverlay, true);
    syncScrollLock();
    els.toggle.focus();
  }

  function showFieldError(input, errorEl, message) {
    input.classList.toggle("is-invalid", Boolean(message));
    errorEl.textContent = message;
    return !message;
  }

  function validateCheckout() {
    var name = els.fieldName.value.trim();
    var phone = els.fieldPhone.value.trim();
    var address = els.fieldAddress.value.trim();
    var nameOk = showFieldError(
      els.fieldName,
      els.errorName,
      name.length >= 2 ? "" : "Enter your full name."
    );
    var phoneOk = showFieldError(
      els.fieldPhone,
      els.errorPhone,
      /^[\d\s().+-]{7,}$/.test(phone) ? "" : "Enter a valid phone number."
    );
    var addressOk = showFieldError(
      els.fieldAddress,
      els.errorAddress,
      address.length >= 8 ? "" : "Enter a delivery address."
    );
    return nameOk && phoneOk && addressOk;
  }

  function openConfirm() {
    var snapshot = cart.slice();
    var totals = getTotals();
    var orderId = "CB-" + String(Date.now()).slice(-8);
    els.orderId.textContent = orderId;
    els.confirmSummary.innerHTML = snapshot
      .map(function (line) {
        return (
          "<li><span>" +
          line.qty +
          " × " +
          line.name +
          "</span><span>" +
          money(line.price * line.qty) +
          "</span></li>"
        );
      })
      .join("");
    els.confirmTotal.textContent = money(totals.total);

    setHidden(els.checkoutModal, true);
    setHidden(els.checkoutOverlay, true);
    setHidden(els.confirmModal, false);
    setHidden(els.confirmOverlay, false);
    clearCart();
    els.checkoutForm.reset();
    showFieldError(els.fieldName, els.errorName, "");
    showFieldError(els.fieldPhone, els.errorPhone, "");
    showFieldError(els.fieldAddress, els.errorAddress, "");
    syncScrollLock();
    els.confirmDone.focus();
  }

  function closeConfirm() {
    setHidden(els.confirmModal, true);
    setHidden(els.confirmOverlay, true);
    syncScrollLock();
    els.toggle.focus();
  }

  function onDocumentClick(event) {
    var addEl = event.target.closest && event.target.closest("[data-add]");
    if (addEl) {
      addItem(addEl.getAttribute("data-add"));
      return;
    }

    var filter = event.target.closest && event.target.closest(".filter-btn");
    if (filter && els.filters.contains(filter)) {
      activeCategory = filter.getAttribute("data-category");
      renderFilters();
      renderMenu();
      return;
    }

    var removeEl = event.target.closest && event.target.closest("[data-remove]");
    if (removeEl) {
      removeItem(removeEl.getAttribute("data-remove"));
      return;
    }

    var qtyEl = event.target.closest && event.target.closest("[data-qty-delta]");
    if (qtyEl) {
      var id = qtyEl.getAttribute("data-id");
      var line = cart.find(function (item) {
        return item.id === id;
      });
      if (line) {
        setQty(id, line.qty + Number(qtyEl.getAttribute("data-qty-delta")));
      }
    }
  }

  function onKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }
    if (!els.confirmModal.hidden) {
      closeConfirm();
      return;
    }
    if (!els.checkoutModal.hidden) {
      closeCheckout();
      return;
    }
    if (!els.drawer.hidden) {
      closeDrawer();
    }
  }

  function init() {
    loadCart();
    renderMenu();
    renderFilters();
    renderCart();

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
    els.toggle.addEventListener("click", openDrawer);
    els.cartClose.addEventListener("click", closeDrawer);
    els.cartOverlay.addEventListener("click", closeDrawer);
    els.checkoutOpen.addEventListener("click", openCheckout);
    els.checkoutClose.addEventListener("click", closeCheckout);
    els.checkoutOverlay.addEventListener("click", closeCheckout);
    els.confirmDone.addEventListener("click", closeConfirm);
    els.confirmOverlay.addEventListener("click", closeConfirm);
    els.checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (cart.length === 0) {
        return;
      }
      if (validateCheckout()) {
        openConfirm();
      }
    });
    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) {
        loadCart();
        renderCart();
      }
    });
  }

  init();
})();
