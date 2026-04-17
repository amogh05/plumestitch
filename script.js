const API_BASE = window.location.protocol === "file:" ? "" : window.location.origin;
const CART_KEY = "threadtheory_cart";
const FALLBACK_PRODUCTS = [
  {
    id: "tee-core-black",
    name: "Core Black Tee",
    price: 899,
    image: "Images/Tshirt/PLUMEANDSTICH Printed Men Round Neck Green T-Shirt - Buy PLUMEANDSTICH Printed Men Round Neck Green T-Shirt Online at Best Prices in India _ Flipkart.com_files/s-pl0003-black-plumeandstich-original-imahmaqpvtytjpan.jpeg",
    description: "Minimal premium black tee with everyday regular fit."
  },
  {
    id: "tee-cloud-white",
    name: "Cloud White Tee",
    price: 799,
    image: "Images/Tshirt/PLUMEANDSTICH Printed Men Round Neck Green T-Shirt - Buy PLUMEANDSTICH Printed Men Round Neck Green T-Shirt Online at Best Prices in India _ Flipkart.com_files/s-pl0003-yellow-plumeandstich-original-imahmaqw56xxkgsj.jpeg",
    description: "Soft cotton white t-shirt with clean structure."
  },
  {
    id: "tee-street-graphic",
    name: "Street Graphic Tee",
    price: 999,
    image: "Images/Tshirt/PLUMEANDSTICH Printed Men Round Neck Green T-Shirt - Buy PLUMEANDSTICH Printed Men Round Neck Green T-Shirt Online at Best Prices in India _ Flipkart.com_files/s-pl0003-green-plumeandstich-original-imahmaqunhezajkq.jpeg",
    description: "Bold chest print and breathable knit for long wear."
  },
  {
    id: "tee-oversized-sand",
    name: "Oversized Sand Tee",
    price: 1099,
    image: "Images/Tshirt/PLUMEANDSTICH Printed Men Round Neck Green T-Shirt - Buy PLUMEANDSTICH Printed Men Round Neck Green T-Shirt Online at Best Prices in India _ Flipkart.com_files/s-pl0003-maroon-plumeandstich-original-imahmaqzanqykshw.jpeg",
    description: "Relaxed oversized silhouette in muted sand tone."
  }
];

// Set your own display names for each t-shirt ID here.
const CUSTOM_PRODUCT_NAMES = {
  "tee-core-black": "My Black Signature Tee",
  "tee-cloud-white": "My White Everyday Tee",
  "tee-street-graphic": "My Street Graphic Tee",
  "tee-oversized-sand": "My Maroon Sand Tee",
  "tee-ink-blue": "My Ink Blue Tee",
  "tee-vintage-red": "My Vintage Red Tee"
};

const state = {
  products: [],
  cart: parseCartStorage()
};

const el = {
  featured: document.getElementById("featured-products"),
  shop: document.getElementById("shop-products"),
  productDetails: document.getElementById("product-details"),
  cartPanel: document.getElementById("cart-panel"),
  cartItems: document.getElementById("cart-items"),
  cartTotal: document.getElementById("cart-total"),
  cartCount: document.getElementById("cart-count"),
  cartToggle: document.getElementById("cart-toggle"),
  closeCart: document.getElementById("close-cart"),
  checkoutBtn: document.getElementById("checkout-btn"),
  contactForm: document.getElementById("contact-form"),
  toast: document.getElementById("toast")
};

init();

async function init() {
  bindUI();
  renderCart();
  await loadProducts();
  applyCustomProductNames();
  renderProductSections();
  renderProductDetailsPage();
}

function applyCustomProductNames() {
  if (!Array.isArray(state.products) || state.products.length === 0) {
    return;
  }

  state.products = state.products.map((product) => {
    const customName = CUSTOM_PRODUCT_NAMES[product.id];

    if (!customName || !customName.trim()) {
      return product;
    }

    return {
      ...product,
      name: customName.trim()
    };
  });
}

function bindUI() {
  if (el.cartToggle) {
    el.cartToggle.addEventListener("click", openCart);
  }

  if (el.closeCart) {
    el.closeCart.addEventListener("click", closeCart);
  }

  if (el.checkoutBtn) {
    el.checkoutBtn.addEventListener("click", checkout);
  }

  if (el.contactForm) {
    el.contactForm.addEventListener("submit", submitContactForm);
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) {
      throw new Error("Products endpoint returned non-OK status.");
    }
    state.products = await response.json();
  } catch (error) {
    console.error("Failed to load products", error);
    state.products = FALLBACK_PRODUCTS;
    showToast("Using offline catalog. Start server for live data.");
  }
}

function renderProductSections() {
  if (el.featured) {
    const featuredItems = state.products.slice(0, 3);
    el.featured.innerHTML = featuredItems.map(renderProductCard).join("");
  }

  if (el.shop) {
    el.shop.innerHTML = state.products.map(renderProductCard).join("");
  }
}

function renderProductCard(product) {
  return `
    <article class="product-card">
      <a href="Product.html?id=${encodeURIComponent(product.id)}">
        <img src="${product.image}" alt="${product.name}">
      </a>
      <div class="product-meta">
        <h3><a href="Product.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
        <span class="price">INR ${product.price}</span>
      </div>
      <p>${product.description}</p>
      <div class="card-actions">
        <a class="btn btn-secondary" href="Product.html?id=${encodeURIComponent(product.id)}">View Details</a>
        <button class="btn btn-primary" type="button" data-id="${product.id}">Add to Cart</button>
      </div>
    </article>
  `;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) {
    return;
  }

  const productId = button.getAttribute("data-id");
  addToCart(productId, "M");
});

function addToCart(productId, selectedSize) {
  const product = state.products.find((item) => item.id === productId);
  const size = selectedSize || "M";

  if (!product) {
    showToast("Item not found.");
    return;
  }

  const existing = state.cart.find((item) => item.id === productId && (item.size || "M") === size);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      size,
      quantity: 1
    });
  }

  syncCart();
  showToast(`${product.name} (${size}) added to cart`);
}

function removeFromCart(productId, size) {
  state.cart = state.cart.filter((item) => !(item.id === productId && (item.size || "M") === size));
  syncCart();
}

function syncCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  renderCart();
}

function renderCart() {
  const detailedCart = state.cart
    .map((item) => {
      const product = state.products.find((p) => p.id === item.id);
      if (!product) {
        return null;
      }
      return {
        ...item,
        name: product.name,
        size: item.size || "M",
        price: product.price,
        lineTotal: product.price * item.quantity
      };
    })
    .filter(Boolean);

  const total = detailedCart.reduce((sum, item) => sum + item.lineTotal, 0);
  const count = detailedCart.reduce((sum, item) => sum + item.quantity, 0);

  if (el.cartCount) {
    el.cartCount.textContent = String(count);
  }

  if (el.cartTotal) {
    el.cartTotal.textContent = `INR ${total}`;
  }

  if (el.cartItems) {
    if (detailedCart.length === 0) {
      el.cartItems.innerHTML = "<p>Your cart is empty.</p>";
      return;
    }

    el.cartItems.innerHTML = detailedCart
      .map(
        (item) => `
          <article class="cart-item">
            <h4>${item.name}</h4>
            <p>Size: ${item.size}</p>
            <p>Qty: ${item.quantity}</p>
            <p>INR ${item.lineTotal}</p>
            <button class="btn btn-secondary" type="button" data-remove-id="${item.id}" data-remove-size="${item.size}">Remove</button>
          </article>
        `
      )
      .join("");
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-id]");
  if (!button) {
    return;
  }

  removeFromCart(button.getAttribute("data-remove-id"), button.getAttribute("data-remove-size") || "M");
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-detail-id]");
  if (!button) {
    return;
  }

  const productId = button.getAttribute("data-detail-id");
  const selectedSize = getSelectedSize();
  addToCart(productId, selectedSize);
});

function openCart() {
  if (!el.cartPanel) {
    return;
  }
  el.cartPanel.classList.add("open");
  el.cartPanel.setAttribute("aria-hidden", "false");
}

function closeCart() {
  if (!el.cartPanel) {
    return;
  }
  el.cartPanel.classList.remove("open");
  el.cartPanel.setAttribute("aria-hidden", "true");
}

async function checkout() {
  if (!API_BASE) {
    showToast("Run the backend server to place orders.");
    return;
  }

  if (state.cart.length === 0) {
    showToast("Add at least one item before checkout.");
    return;
  }

  const name = prompt("Enter your name for the order:");
  if (!name) {
    return;
  }

  const email = prompt("Enter your email:");
  if (!email) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerName: name,
        customerEmail: email,
        items: state.cart
      })
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.error || "Checkout failed");
      return;
    }

    state.cart = [];
    syncCart();
    closeCart();
    showToast(`Order placed. ID: ${result.orderId}`);
  } catch (error) {
    console.error(error);
    showToast("Checkout error. Try again.");
  }
}

async function submitContactForm(event) {
  event.preventDefault();

  if (!API_BASE) {
    showToast("Run the backend server to send messages.");
    return;
  }

  const formData = new FormData(el.contactForm);
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message")
  };

  try {
    const response = await fetch(`${API_BASE}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.error || "Unable to submit form");
      return;
    }

    el.contactForm.reset();
    showToast("Message sent successfully.");
  } catch (error) {
    console.error(error);
    showToast("Network error while sending message.");
  }
}

function showToast(message) {
  if (!el.toast) {
    return;
  }

  el.toast.textContent = message;
  el.toast.classList.add("show");

  window.setTimeout(() => {
    el.toast.classList.remove("show");
  }, 1800);
}

function parseCartStorage() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

function renderProductDetailsPage() {
  if (!el.productDetails) {
    return;
  }

  const productId = new URLSearchParams(window.location.search).get("id");
  const product = state.products.find((item) => item.id === productId);

  if (!product) {
    el.productDetails.innerHTML = `
      <article class="detail-empty">
        <h2>Product Not Found</h2>
        <p>The requested t-shirt is not available.</p>
        <a class="btn btn-primary" href="Shop.html">Go Back to Shop</a>
      </article>
    `;
    return;
  }

  el.productDetails.innerHTML = `
    <article class="detail-card">
      <img src="${product.image}" alt="${product.name}" class="detail-image">
      <div class="detail-content">
        <h1>${product.name}</h1>
        <p class="detail-price">INR ${product.price}</p>
        <p>${product.description}</p>
        <div class="size-block">
          <p class="size-title">Choose Size</p>
          <div class="size-options" role="radiogroup" aria-label="Choose t-shirt size">
            <label><input type="radio" name="size" value="S"> S</label>
            <label><input type="radio" name="size" value="M" checked> M</label>
            <label><input type="radio" name="size" value="L"> L</label>
            <label><input type="radio" name="size" value="XL"> XL</label>
          </div>
        </div>
        <button class="btn btn-primary" type="button" data-detail-id="${product.id}">Add to Cart</button>
      </div>
    </article>
  `;
}

function getSelectedSize() {
  const selected = document.querySelector('input[name="size"]:checked');
  return selected ? selected.value : "M";
}