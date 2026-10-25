/* ElectroMart cart page functionality.
   Requires global-state.js to load first.
*/

(function () {
  "use strict";

  const store = window.ElectroMartStore;

  if (!store) {
    console.error("Load global-state.js before cart.js.");
    return;
  }

  const $ = id => document.getElementById(id);

  const currency = amount =>
    "₹" + Math.round(Number(amount) || 0).toLocaleString("en-IN");

  // Display all cart products.
  function renderCart() {
    const cartItems = $("cartItems");

    if (!cartItems) return;

    const cart = store.getCart();

    cartItems.replaceChildren();

    if (cart.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-cart";

      empty.innerHTML = `
        <div class="empty-cart-icon" aria-hidden="true">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a href="products.html" class="shop-btn">
          Explore Products
        </a>
      `;

      cartItems.appendChild(empty);
      updateSummary(0, 0);
      return;
    }

    let subtotal = 0;

    cart.forEach((item, index) => {
      const lineTotal = item.price * item.quantity;

      subtotal += lineTotal;

      const article = document.createElement("article");
      article.className = "cart-item";

      // Product image
      const imageWrap = document.createElement("div");
      imageWrap.className = "product-image";

      const img = document.createElement("img");
      img.src = item.image || "";
      img.alt = item.name;
      img.loading = "lazy";

      img.onerror = function () {
        this.style.display = "none";
        imageWrap.classList.add("image-fallback");
        imageWrap.textContent = "ElectroMart";
      };

      imageWrap.appendChild(img);

      // Product information
      const info = document.createElement("div");
      info.className = "product-info";

      const name = document.createElement("h3");
      name.textContent = item.name;

      const description = document.createElement("p");
      description.className = "item-description";
      description.textContent = "Electronics · Ready to ship";

      const price = document.createElement("div");
      price.className = "price";
      price.textContent = currency(item.price) + " each";

      // Quantity controls
      const quantityArea = document.createElement("div");
      quantityArea.className = "quantity-area";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "quantity-button";
      minus.textContent = "−";
      minus.setAttribute(
        "aria-label",
        "Decrease quantity of " + item.name
      );

      minus.addEventListener("click", () => {
        store.changeCartQuantity(index, -1);
      });

      const quantity = document.createElement("span");
      quantity.className = "quantity";
      quantity.textContent = String(item.quantity);
      quantity.setAttribute("aria-label", "Quantity");

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "quantity-button";
      plus.textContent = "+";
      plus.setAttribute(
        "aria-label",
        "Increase quantity of " + item.name
      );

      plus.addEventListener("click", () => {
        store.changeCartQuantity(index, 1);
      });

      quantityArea.append(minus, quantity, plus);

      // Remove button
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-btn";
      remove.textContent = "Remove item";

      remove.addEventListener("click", () => {
        store.removeCartItem(index);
      });

      info.append(
        name,
        description,
        price,
        quantityArea,
        remove
      );

      // Total for this product
      const total = document.createElement("div");
      total.className = "item-total";

      const totalStrong = document.createElement("strong");
      totalStrong.textContent = currency(lineTotal);

      total.appendChild(totalStrong);

      article.append(imageWrap, info, total);
      cartItems.appendChild(article);
    });

    const tax = Math.round(subtotal * 0.18);

    updateSummary(subtotal, tax);
  }

  // Update subtotal, GST, total and cart count.
  function updateSummary(subtotal, tax) {
    const count = store.getCartCount();

    if ($("subtotal")) {
      $("subtotal").textContent = currency(subtotal);
    }

    if ($("tax")) {
      $("tax").textContent = currency(tax);
    }

    if ($("grandTotal")) {
      $("grandTotal").textContent =
        currency(subtotal + tax);
    }

    if ($("itemCount")) {
      $("itemCount").textContent =
        count + (count === 1 ? " Item" : " Items");
    }

    document
      .querySelectorAll(
        "[data-cart-count], .cart-count, #cartCount"
      )
      .forEach(element => {
        element.textContent = String(count);
      });
  }

  // Open checkout.
  function openCheckout() {
    const cart = store.getCart();

    if (cart.length === 0) {
      alert(
        "Your cart is empty. Add a product before checkout."
      );
      return;
    }

    const modal = $("checkoutModal");

    if (modal) {
      modal.hidden = false;

      const firstInput = modal.querySelector("input");

      if (firstInput) {
        firstInput.focus();
      }
    }
  }

  // Close checkout.
  function closeCheckout() {
    const modal = $("checkoutModal");

    if (modal) {
      modal.hidden = true;
    }
  }

  // Handle demo checkout form submission.
  function submitCheckout(event) {
    event.preventDefault();

    const form = $("checkoutForm");

    if (!form || !form.reportValidity()) {
      return;
    }

    const cart = store.getCart();

    if (cart.length === 0) {
      closeCheckout();
      renderCart();
      alert("Your cart is empty.");
      return;
    }

    const name = $("customerName").value.trim();
    const email = $("customerEmail").value.trim();
    const phone = $("customerPhone").value.trim();
    const address = $("customerAddress").value.trim();

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderId =
      "EM" + Date.now().toString().slice(-8);

    // This is a front-end demonstration only.
    // It does not send the order to a real server.
    const order = {
      id: orderId,
      name: name,
      email: email,
      phone: phone,
      address: address,
      items: cart,
      total: Math.round(subtotal + subtotal * 0.18),
      createdAt: new Date().toISOString(),
      demo: true
    };

    sessionStorage.setItem(
      "electroMartLastDemoOrder",
      JSON.stringify(order)
    );

    store.clearCart();

    closeCheckout();
    renderCart();

    const confirmation = $("checkoutConfirmation");

    if (confirmation) {
      confirmation.hidden = false;

      confirmation.innerHTML = `
        <div class="confirmation-panel">
          <span class="confirmation-check" aria-hidden="true">✓</span>
          <h2>Demo order placed!</h2>
          <p>
            Thank you, <strong></strong>.
            Your demo order reference is
            <strong class="order-reference"></strong>.
          </p>
          <p class="demo-note">
            This is a classroom demonstration only.
            No payment was taken and no real order was submitted.
          </p>
          <a href="products.html" class="shop-btn">
            Continue Shopping
          </a>
        </div>
      `;

      confirmation.querySelector("p strong").textContent = name;

      confirmation.querySelector(
        ".order-reference"
      ).textContent = orderId;

      confirmation.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } else {
      alert(
        "Demo order " + orderId +
        " placed. No payment was taken."
      );
    }

    form.reset();
  }

  // Set up all cart page buttons and event listeners.
  function initialiseCartPage() {
    renderCart();

    if ($("checkoutButton")) {
      $("checkoutButton").addEventListener(
        "click",
        openCheckout
      );
    }

    if ($("closeCheckout")) {
      $("closeCheckout").addEventListener(
        "click",
        closeCheckout
      );
    }

    if ($("checkoutForm")) {
      $("checkoutForm").addEventListener(
        "submit",
        submitCheckout
      );
    }

    const modal = $("checkoutModal");

    if (modal) {
      modal.addEventListener("click", event => {
        if (event.target === modal) {
          closeCheckout();
        }
      });
    }

    // Re-render whenever shared cart data changes.
    store.subscribe(renderCart);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseCartPage
    );
  } else {
    initialiseCartPage();
  }
})();