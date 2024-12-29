document.addEventListener("DOMContentLoaded", () => {
  const reloadToolTips = () => {
    if (window.matchMedia("(hover: none)").matches) {
      return;
    }
    let tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-toggle="tooltip"]')
    );
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
      let tooltip = new bootstrap.Tooltip(tooltipTriggerEl);
      let timer;

      tooltipTriggerEl.addEventListener("mouseenter", () => {
        timer = setTimeout(() => tooltip.hide(), 1500);
        tooltip.show();
      });

      tooltipTriggerEl.addEventListener("mouseleave", () => {
        clearTimeout(timer);
        tooltip.hide();
      });
    });
  };
  reloadToolTips();

  function throttle(func, interval) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= interval) {
        lastTime = now;
        func.apply(this, args);
      }
    };
  }

  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      }
      return this.indexOf(search, start) !== -1;
    };
  }

  const scrollTopBtn = document.getElementById("scrollTopBtn");

  window.onscroll = throttle(function () {
    if (
      document.body.scrollTop > 200 ||
      document.documentElement.scrollTop > 200
    ) {
      scrollTopBtn.style.display = "flex";
    } else {
      scrollTopBtn.style.display = "none";
    }
  }, 200);

  scrollTopBtn.onclick = function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const productContainer = document.querySelector(".product-container");
  const shoppingCartButton = document.querySelector(".shopping-cart");

  const hotproductsText = document.querySelector(".hotproducts-text");
  const carouselInner = document.querySelector("#hotCarousel .carousel-inner");
  const carouselIndicators = document.querySelector(
    "#hotCarousel .carousel-indicators"
  );
  const _carouselInner = document.querySelector(
    "#modalCarousel .carousel-inner"
  );
  const _carouselIndicators = document.querySelector(
    "#modalCarousel .carousel-indicators"
  );

  let products;
  async function fetchProducts() {
    try {
      const response = await fetch("./products.json");
      products = await response.json();
      products = products.map((product) => {
        return {
          ...product,
          discount:
            product.sales > 0
              ? product.price - (product.price * product.sales) / 100
              : product.price,
        };
      });
      const params = new URLSearchParams(window.location.search);
      let page;
      if (params.get("search")) {
        let query = params.get("search");
        page = parseInt(params.get("page")) || 1;
        document.getElementById("searchInput").value = query;
        searchProducts(query, page);
      } else {
        page = parseInt(params.get("product-page")) || 1;
        displayProducts(products, page);
        updatePagination(products, page);
      }
      displayHotProducts(products);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
    }
  }

  function displayHotProducts(products) {
    const topProducts = products
      .filter((product) => product.point)
      .sort((a, b) => b.point - a.point)
      .slice(0, 5);

    carouselInner.innerHTML = "";
    carouselIndicators.innerHTML = "";

    topProducts.forEach((product, index) => {
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.setAttribute("data-bs-target", "#hotCarousel");
      indicator.setAttribute("data-bs-slide-to", index);
      if (index === 0) {
        indicator.classList.add("active");
        indicator.setAttribute("aria-current", "true");
      }
      carouselIndicators.appendChild(indicator);

      const carouselItem = document.createElement("div");
      carouselItem.className = "carousel-item";
      if (index === 0) carouselItem.classList.add("active");
      carouselItem.innerHTML = `
        <img src="${product.images[0]}" onclick="showProduct(${product.id})" class="d-block w-100" alt="${product.name}">
      `;
      carouselInner.appendChild(carouselItem);
    });

    updateHotProductText(topProducts[0]);

    const carousel = document.querySelector("#hotCarousel");
    carousel.addEventListener("slide.bs.carousel", (event) => {
      const newIndex = event.to;
      updateHotProductText(topProducts[newIndex]);
    });
  }

  function updateHotProductText(product) {
    const hotProductTitle = hotproductsText.querySelector("h6");
    const hotProductDescription = hotproductsText.querySelector("p");

    hotProductTitle.textContent = product.name;
    hotProductDescription.textContent = product.description;
  }

  let searchProduct = null;
  function updatePagination(data, currentPage = 1) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const params = new URLSearchParams(window.location.search);
    if (searchProduct) {
      params.set("search", searchProduct);
      params.set("page", currentPage);
      params.delete("product-page");
      if (data.length === 0) {
        pagination.innerHTML = `<li class="text-center">
        <span>Không có sản phẩm nào!</span>
        <br>
        <span
          style="color: #6666c2;
                text-decoration: underline;
                cursor: pointer;"
          onclick="let ipe = document.getElementById('searchInput'); ipe.value = ''; ipe.dispatchEvent(new Event('input'));";
        >
          Thoát tìm kiếm
        </span>
        </li>`;
        document.getElementById("searchCount").textContent = "";
        return;
      } else {
        document.getElementById(
          "searchCount"
        ).textContent = `${data.length} Sản phẩm`;
      }
    } else {
      params.set("product-page", currentPage);
      params.delete("search");
      params.delete("page");
    }
    window.history.pushState({}, "", `?${params.toString()}`);

    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
        <span class="sr-only">Previous</span>
      </a>`;
    prevLi.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        document
          .getElementById("products")
          .scrollIntoView({ behavior: "smooth" });
        displayProducts(data, currentPage - 1);
        updatePagination(data, currentPage - 1);
      }
    });
    pagination.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .getElementById("products")
          .scrollIntoView({ behavior: "smooth" });
        displayProducts(data, i);
        updatePagination(data, i);
      });
      pagination.appendChild(li);
    }

    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${
      currentPage === totalPages ? "disabled" : ""
    }`;
    nextLi.innerHTML = `<a class="page-link" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
        <span class="sr-only">Next</span>
      </a>`;
    nextLi.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        document
          .getElementById("products")
          .scrollIntoView({ behavior: "smooth" });
        displayProducts(data, currentPage + 1);
        updatePagination(data, currentPage + 1);
      }
    });
    reloadToolTips();
    pagination.appendChild(nextLi);
  }

  const screenWidth = window.innerWidth;
  const itemsPerPage =
    screenWidth >= 1200
      ? 4 * 3
      : screenWidth >= 992
      ? 3 * 3
      : screenWidth >= 576
      ? 2 * 3
      : 1 * 3;

  function searchProducts(query, page) {
    query = query.toLowerCase();
    const searchInput = document.getElementById("searchInput");
    if (query.trim() === "") {
      searchInput.classList.remove("has-value");
      searchProduct = null;
      document.getElementById("searchCount").textContent = "";
      displayProducts(products, 1);
      updatePagination(products, 1);
      return;
    }
    searchInput.classList.add("has-value");
    searchProduct = query;
    const filterProducts = products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    });
    displayProducts(filterProducts, page);
    updatePagination(filterProducts, page);
  }

  document.getElementById("searchInput").addEventListener(
    "input",
    debounce((event) => searchProducts(event.target.value, 1), 500)
  );

  function displayProducts(products, page = 1) {
    productContainer.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const items = products.slice(start, end);
    items.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "col-12 col-sm-6 col-md-4 col-lg-3";
      const priceStr =
        product.sales > 0
          ? `<strong>₫${product.discount.toLocaleString()}</strong><del style="margin-left: 5px; font-size: 0.75rem">₫${product.price.toLocaleString()}</del>
              <span style="padding: 0 3px; background-color: red; font-size: 0.75rem; color: white; border-radius: 4px;">${
                product.sales
              }%</span>`
          : `<strong>₫${product.price.toLocaleString()}</strong>`;
      productElement.innerHTML = `
        <div class="card" onclick="showProduct(${product.id})">
          <div class="product-img">
            <img src="${product.images[0]}" alt="${product.name}"/>
          </div>
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">${product.description}</p>
            <div class="price-text">${priceStr}</div>
            <div class="d-flex flex-column gap-2">
              <button class="btn btn-primary" onclick="buyProduct(${product.id}, event)">Mua ngay</button>
              <button class="btn btn-primary" onclick="addCart(${product.id}, event)">Thêm vào giỏ <i class="fa-solid fa-cart-shopping"></i></button>
            </div>
          </div>
        </div>
      `;
      productContainer.appendChild(productElement);
    });
  }

  function validateForm(phoneNumber, gmail, address) {
    let responseElement = document.getElementById("exampleMessage");
    if (phoneNumber.trim() == "") {
      responseElement.innerText = "Bạn chưa điền SDT!";
      return false;
    }
    if (!phoneNumber.match(/^\d+$/)) {
      responseElement.innerText = `${phoneNumber} không phải SDT!`;
      return false;
    }
    if (gmail.trim() == "") {
      responseElement.innerText = "Bạn chưa điền Gmail!";
      return false;
    }
    if (address.trim() == "") {
      responseElement.innerText = "Bạn chưa điền Địa chỉ!";
      return false;
    }
    return true;
  }

  window.buyProduct = function (productId, event = null) {
    if (event) {
      event.stopPropagation();
    }
    const product = products.filter((item) => item.id === productId)[0];

    let responseElement = document.getElementById("exampleMessage");
    responseElement.innerHTML = "";
    let listProducts = document.getElementById("listProducts");
    listProducts.innerHTML = "";

    let spanElement = document.createElement("span");
    spanElement.innerText = `SL: 1 - SP: ${product.name}`;
    listProducts.appendChild(spanElement);

    spanElement = document.createElement("span");
    spanElement.className = "d-flex justify-content-between";
    spanElement.innerHTML = `
        <strong>Tổng cộng:</strong>
        <strong>${product.discount.toLocaleString()} VND</strong>`;

    listProducts.appendChild(spanElement);

    document.getElementById("sendPurchaseForm").onclick = function (event) {
      event.preventDefault();
      let phoneNumber = document.getElementById("phone-number").value;
      let gmail = document.getElementById("buy-gmail").value;
      let address = document.getElementById("buy-address").value;
      let message = document.getElementById("buy-message").value;

      if (validateForm(phoneNumber, gmail, address)) {
        const request = {
          products: [{ id: productId, qty: 1 }],
          Buyer: {
            phoneNumber,
            gmail,
            address,
            message,
          },
        };
        responseElement.innerText = `Request JSON:\n${JSON.stringify(request)}`;
      }
    };

    const myModal = new bootstrap.Modal(
      document.getElementById("buyProductModal")
    );
    myModal.show();
  };

  // Hàm thêm sản phẩm vào giỏ hàng
  window.addCart = function (productId, event = null) {
    if (event) {
      event.stopPropagation();
    }

    const cartIcon = document.querySelector(".shopping-cart");
    cartIcon.classList.add("add-product");
    setTimeout(() => cartIcon.classList.remove("add-product"), 1000);

    const product = products.filter((item) => item.id === productId)[0];
    const shoppingImg = document.createElement("img");
    shoppingImg.classList.add("shopping-cart-image");
    shoppingImg.setAttribute("src", product.images[0]);
    shoppingImg.setAttribute("alt", product.name);
    document.body.appendChild(shoppingImg);
    shoppingImg.addEventListener("animationend", () => {
      shoppingImg.remove();
    });

    const cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];
    const existingProduct = cart.find((item) => item.id === productId);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      if (product) {
        cart.push({ ...product, quantity: 1 });
      }
    }
    console.log(cart);
    localStorage.setItem("shopping-cart", JSON.stringify(cart));
    updateCartOffcanvas();
    updateCartCount();
  };

  window.showProduct = function (productId) {
    // Cập nhật nội dung trong modal
    const product = products.filter((item) => item.id === productId)[0];

    document.getElementById("productModalLabel").textContent = product.name;
    document.getElementById("modalProductDescription").textContent =
      product.description;

    const priceStr =
      product.sales > 0
        ? `<p>Giá gốc: <del>${product.price.toLocaleString()} VND</del> <span>⬇${
            product.sales
          }%</span></p>
              <p><strong>Chỉ còn: ${product.discount.toLocaleString()} VND</strong></p>`
        : `<p><strong>Giá bán: ${product.price.toLocaleString()} VND</strong></p>`;

    document.getElementById("showPrice").innerHTML = priceStr;
    document.getElementById("buyNow").onclick = function () {
      buyProduct(productId);
    };

    _carouselIndicators.innerHTML = "";
    _carouselInner.innerHTML = "";
    product.images.forEach((image, index) => {
      // Tạo indicator
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.setAttribute("data-bs-target", "#modalCarousel");
      indicator.setAttribute("data-bs-slide-to", index);
      if (index === 0) {
        indicator.classList.add("active");
        indicator.setAttribute("aria-current", "true");
      }
      _carouselIndicators.appendChild(indicator);

      // Tạo slide
      const carouselItem = document.createElement("div");
      carouselItem.className = "carousel-item";
      if (index === 0) carouselItem.classList.add("active");
      carouselItem.innerHTML = `
        <img src="${image}" class="d-block w-100" alt="${product.name}">
      `;
      _carouselInner.appendChild(carouselItem);
    });

    const myModal = new bootstrap.Modal(
      document.getElementById("productModal")
    );
    myModal.show();
  };

  // Hàm cập nhật số lượng giỏ hàng hiển thị trên nút
  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    shoppingCartButton.setAttribute("data-count", totalItems);
  }

  // Hàm cập nhật giao diện giỏ hàng trong Offcanvas
  function updateCartOffcanvas() {
    const cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];
    const offcanvasBody = document.querySelector(".offcanvas-body");
    offcanvasBody.innerHTML = ""; // Xóa nội dung cũ

    if (cart.length === 0) {
      offcanvasBody.innerHTML = "<p>Giỏ hàng trống</p>";
      return;
    }

    let total = 0;

    cart.forEach((item) => {
      total += item.discount * item.quantity;
      offcanvasBody.innerHTML += `
        <div class="cart-item">
          <div class="d-flex align-items-center mb-3">
            <img src="${item.images[0]}" onclick="showProduct(${
        item.id
      })" class="rounded me-3" alt="${
        item.name
      }" style="width: 100px; height: 100px;" />
            <div>
              <h6 class="mb-0">${item.name}</h6>
              <small>Giá: ${item.discount.toLocaleString()} VND</small><br />
              <div class="d-flex align-items-center gap-2 mt-2">
                <button class="btn btn-sm btn-danger" onclick="removeItem(${
                  item.id
                })">Xóa</button>
                <button class="btn btn-sm btn-secondary" onclick="decreaseQuantity(${
                  item.id
                })">-</button>
                <span>${item.quantity}</span>
                <button class="btn btn-sm btn-secondary" onclick="increaseQuantity(${
                  item.id
                })">+</button>
              </div>
            </div>
          </div>
          <hr />
        </div>
      `;
    });

    offcanvasBody.innerHTML += `
      <div class="d-flex justify-content-between">
        <strong>Tổng cộng:</strong>
        <strong>${total.toLocaleString()} VND</strong>
      </div>
      <button class="btn btn-success w-100 mt-3" onclick="cartCheckout()">Thanh toán</button>
    `;
  }
  window.cartCheckout = function () {
    let cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];

    let responseElement = document.getElementById("exampleMessage");
    responseElement.innerHTML = "";
    let listProducts = document.getElementById("listProducts");
    listProducts.innerHTML = "";

    let total = 0;
    let spanElement;
    cart.forEach((product) => {
      spanElement = document.createElement("span");
      let quantity = product.quantity ?? 1;
      spanElement.innerText = `SL: ${quantity} - SP: ${product.name}`;
      listProducts.appendChild(spanElement);
      total += product.discount * quantity;
    });

    spanElement = document.createElement("span");
    spanElement.className = "d-flex justify-content-between";
    spanElement.innerHTML = `
        <strong>Tổng cộng:</strong>
        <strong>${total.toLocaleString()} VND</strong>`;
    listProducts.appendChild(spanElement);

    document.getElementById("sendPurchaseForm").onclick = function (event) {
      event.preventDefault();
      let phoneNumber = document.getElementById("phone-number").value;
      let gmail = document.getElementById("buy-gmail").value;
      let address = document.getElementById("buy-address").value;
      let message = document.getElementById("buy-message").value;
      if (validateForm(phoneNumber, gmail, address)) {
        const request = {
          products: cart.map((product) => ({
            id: product.id,
            qty: product.quantity,
          })),
          Buyer: {
            phoneNumber,
            gmail,
            address,
            message,
          },
        };
        responseElement.innerText = `Request JSON:\n${JSON.stringify(request)}`;
      }
    };

    const myModal = new bootstrap.Modal(
      document.getElementById("buyProductModal")
    );
    myModal.show();
  };

  // Hàm xóa sản phẩm khỏi giỏ hàng
  window.removeItem = function (productId) {
    let cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];
    cart = cart.filter((item) => item.id !== productId);
    localStorage.setItem("shopping-cart", JSON.stringify(cart));
    updateCartOffcanvas();
    updateCartCount();
  };

  // Hàm tăng số lượng sản phẩm
  window.increaseQuantity = function (productId) {
    const cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];
    const product = cart.find((item) => item.id === productId);
    if (product) {
      product.quantity += 1;
    }
    localStorage.setItem("shopping-cart", JSON.stringify(cart));
    updateCartOffcanvas();
    updateCartCount();
  };

  // Hàm giảm số lượng sản phẩm
  window.decreaseQuantity = function (productId) {
    const cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];
    const product = cart.find((item) => item.id === productId);
    if (product && product.quantity > 1) {
      product.quantity -= 1;
    }
    localStorage.setItem("shopping-cart", JSON.stringify(cart));
    updateCartOffcanvas();
    updateCartCount();
  };

  // Thêm CSS pseudo-element hiển thị số lượng
  const style = document.createElement("style");
  style.innerHTML = `
    .shopping-cart::after {
      content: attr(data-count);
      position: absolute;
      top: -5px;
      right: -10px;
      background: red;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 12px;
      display: inline-block;
    }
  `;
  document.head.appendChild(style);

  fetchProducts();
  updateCartOffcanvas();
  updateCartCount();
});
