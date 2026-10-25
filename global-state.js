/*
  ElectroMart shared cart state.
  Uses the existing storage key:
  electroMartCart = [{ name, price, image, quantity }]
*/

(function () {
  "use strict";

  const CART_KEY = "electroMartCart";
  const CART_UPDATED_EVENT = "electromart:cart-updated";

  // Homepage product details.
  // Update these details if your product names, prices, or image paths differ.
  const PRODUCT_CATALOG = {
    "iPhone 15 Pro": {
      name: "iPhone 15 Pro",
      price: 129999,
      image: "phone.jpeg"
    },
    "MacBook Air M3": {
      name: "MacBook Air M3",
      price: 114900,
      image: "laptop.jpeg"
    },
    "Sony WH-1000XM5": {
      name: "Sony WH-1000XM5",
      price: 29990,
      image: "headphones.jpeg"
    },
    "Apple Watch Series 10": {
      name: "Apple Watch Series 10",
      price: 46900,
      image: "smartWatch.jpeg"
    }
  };

  function readCart() {
    try {
      const value = JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      );

      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .filter(item => item && typeof item.name === "string")
        .map(item => ({
          name: item.name,
          price: Math.max(0, Number(item.price) || 0),
          image: typeof item.image === "string" ? item.image : "",
          quantity: Math.max(
            1,
            Math.floor(Number(item.quantity) || 1)
          )
        }));
    } catch (error) {
      console.warn("Could not read cart data.", error);
      return [];
    }
  }

  function getCart() {
    return readCart();
  }

  function getCartCount(cart) {
    return (cart || readCart()).reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    document.dispatchEvent(
      new CustomEvent(CART_UPDATED_EVENT, {
        detail: {
          cart: cart,
          count: getCartCount(cart)
        }
      })
    );

    updateCartBadges(cart);
  }

  function addProduct(product, quantity = 1) {
    if (
      !product ||
      !product.name ||
      !Number.isFinite(Number(product.price))
    ) {
      console.warn("A product name and numeric price are required.");
      return false;
    }

    const cleanProduct = {
      name: String(product.name).trim(),
      price: Math.max(0, Number(product.price)),
      image: String(product.image || ""),
      quantity: Math.max(
        1,
        Math.floor(Number(quantity) || 1)
      )
    };

    if (!cleanProduct.name) {
      return false;
    }

    const cart = readCart();

    const existing = cart.find(item =>
      item.name.toLowerCase() ===
      cleanProduct.name.toLowerCase()
    );

    if (existing) {
      existing.quantity += cleanProduct.quantity;
      existing.price = cleanProduct.price;

      if (!existing.image && cleanProduct.image) {
        existing.image = cleanProduct.image;
      }
    } else {
      cart.push(cleanProduct);
    }

    saveCart(cart);
    return true;
  }

  function addToCart(name, price, image) {
    let product = PRODUCT_CATALOG[name];

    // Also support passing product details directly.
    if (!product && price !== undefined) {
      product = {
        name: name,
        price: price,
        image: image || ""
      };
    }

    if (!product) {
      console.warn(
        "Add this product to PRODUCT_CATALOG:",
        name
      );

      alert(
        "Product details were not found for " +
        name +
        ". Add the product to PRODUCT_CATALOG in global-state.js."
      );

      return false;
    }

    const success = addProduct(product, 1);

    if (success) {
      showCartNotice(product.name + " added to cart");
    }

    return success;
  }

  function changeCartQuantity(index, change) {
    const cart = readCart();

    if (!Number.isInteger(index) || !cart[index]) {
      return;
    }

    cart[index].quantity += Number(change) || 0;

    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }

    saveCart(cart);
  }

  function removeCartItem(index) {
    const cart = readCart();

    if (!Number.isInteger(index) || !cart[index]) {
      return;
    }

    cart.splice(index, 1);
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function updateCartBadges(cart) {
    const count = getCartCount(cart || readCart());

    document
      .querySelectorAll(
        "[data-cart-count], .cart-count, #cartCount"
      )
      .forEach(element => {
        element.textContent = String(count);
        element.hidden = false;
      });
  }

  function showCartNotice(message) {
    let notice = document.getElementById(
      "electromart-cart-notice"
    );

    if (!notice) {
      notice = document.createElement("div");
      notice.id = "electromart-cart-notice";
      notice.setAttribute("role", "status");

      notice.style.cssText = [
        "position:fixed",
        "right:20px",
        "bottom:20px",
        "z-index:99999",
        "background:#111",
        "color:#fff",
        "padding:13px 18px",
        "border-left:4px solid rgb(32,110,198)",
        "box-shadow:0 8px 25px #0002",
        "font:14px Arial,sans-serif",
        "max-width:calc(100vw - 40px)"
      ].join(";");

      document.body.appendChild(notice);
    }

    notice.textContent = message;
    notice.style.display = "block";

    clearTimeout(notice._hideTimer);

    notice._hideTimer = setTimeout(() => {
      notice.style.display = "none";
    }, 1800);
  }

  // Connect Add to Cart and Buy Now buttons in product-detail modals.
  function bindProductModalButtons() {
    document.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest(
          ".modal-actions button"
        );

        if (!button) {
          return;
        }

        const modal = button.closest(".product-modal");

        if (!modal) {
          return;
        }

        const title = modal.querySelector(
          ".modal-details h2"
        );

        const priceElement = modal.querySelector(
          ".modal-price"
        );

        const imageElement = modal.querySelector(
          ".modal-image img"
        );

        if (!title || !priceElement) {
          return;
        }

        const name = title.textContent.trim();

        const price = Number(
          priceElement.textContent.replace(/[^\d.]/g, "")
        );

        const image = imageElement
          ? imageElement.getAttribute("src") || ""
          : "";

        if (!Number.isFinite(price) || !name) {
          event.preventDefault();
          alert("This product's details are incomplete.");
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const success = addProduct(
          { name, price, image },
          1
        );

        if (!success) {
          return;
        }

        if (button.classList.contains("buy-button")) {
          window.location.href = "cart.html";
        } else {
          const originalText = button.textContent;

          button.textContent = "Added ✓";

          showCartNotice(name + " added to cart");

          setTimeout(() => {
            button.textContent = originalText;
          }, 1200);
        }
      },
      true
    );
  }

  // Shared API for all pages.
  window.ElectroMartStore = {
    cartKey: CART_KEY,
    getCart: getCart,
    getCartCount: () => getCartCount(readCart()),
    addProduct: addProduct,
    addToCart: addToCart,
    changeCartQuantity: changeCartQuantity,
    removeCartItem: removeCartItem,
    clearCart: clearCart,
    subscribe: callback =>
      document.addEventListener(
        CART_UPDATED_EVENT,
        callback
      )
  };

  // Support existing homepage buttons that use:
  // onclick="addToCart('iPhone 15 Pro')"
  window.addToCart = addToCart;

  function initialiseCartIntegration() {
    updateCartBadges();
    bindProductModalButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseCartIntegration
    );
  } else {
    initialiseCartIntegration();
  }
})();