document.addEventListener("DOMContentLoaded", () => {
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
  // Hàm fetch dữ liệu từ file products.json
  let products;
  async function fetchProducts() {
    try {
      const response = await fetch("./products.json");
      products = await response.json();
      displayProducts(products);
      displayHotProducts(products);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
    }
  }

  // Hiển thị sản phẩm nổi bật
  function displayHotProducts(products) {
    const topProducts = products
      .filter((product) => product.point)
      .sort((a, b) => b.point - a.point) // Sắp xếp theo điểm từ cao xuống thấp
      .slice(0, 5); // Lấy 3 sản phẩm có điểm cao nhất

    carouselInner.innerHTML = ""; // Xóa nội dung cũ
    carouselIndicators.innerHTML = "";

    topProducts.forEach((product, index) => {
      // Tạo indicator
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.setAttribute("data-bs-target", "#hotCarousel");
      indicator.setAttribute("data-bs-slide-to", index);
      if (index === 0) {
        indicator.classList.add("active");
        indicator.setAttribute("aria-current", "true");
      }
      carouselIndicators.appendChild(indicator);

      // Tạo slide
      const carouselItem = document.createElement("div");
      carouselItem.className = "carousel-item";
      if (index === 0) carouselItem.classList.add("active");
      carouselItem.innerHTML = `
        <img src="${product.images[0]}" onclick="showProduct(${product.id})" class="d-block w-100" alt="${product.name}">
      `;
      carouselInner.appendChild(carouselItem);
    });

    // Cập nhật thông tin sản phẩm đầu tiên
    updateHotProductText(topProducts[0]);

    // Thêm sự kiện khi chuyển slide
    const carousel = document.querySelector("#hotCarousel");
    carousel.addEventListener("slide.bs.carousel", (event) => {
      const newIndex = event.to;
      updateHotProductText(topProducts[newIndex]);
    });
  }

  // Cập nhật thông tin sản phẩm trong phần text (#hotproducts-text)
  function updateHotProductText(product) {
    const hotProductTitle = hotproductsText.querySelector("h6");
    const hotProductDescription = hotproductsText.querySelector("p");

    hotProductTitle.textContent = product.name;
    hotProductDescription.textContent = product.description;
  }

  // Hàm hiển thị danh sách sản phẩm
  function displayProducts(products) {
    productContainer.innerHTML = ""; // Xóa nội dung cũ
    products.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "col-12 col-sm-6 col-md-4 col-lg-3";
      productElement.innerHTML = `
        <div class="card" onclick="showProduct(${product.id})">
          <img src="${product.images[0]}" class="card-img-top" alt="${
        product.name
      }" />
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">${product.description}</p>
            <p class="card-text"><strong>Giá: ${product.price.toLocaleString()} VND</strong></p>
            <div class="d-flex flex-column gap-2">
              <button class="btn btn-primary" onclick="buyProduct(${
                product.id
              }, event)">Mua ngay</button>
              <button class="btn btn-primary" onclick="addCart(${
                product.id
              }, event)">Thêm vào giỏ <i class="fa-solid fa-cart-shopping"></i></button>
            </div>
          </div>
        </div>
      `;
      productContainer.appendChild(productElement);
    });
  }

  // Hàm mua sản phẩm
  window.buyProduct = function (productId, event = null) {
    if (event) {
      event.stopPropagation();
    }
    const product = products.filter((item) => item.id === productId)[0];

    let responseElement = document.getElementById("exampleMessage");
    responseElement.innerHTML = "";
    let listProducts = document.getElementById("listProducts");
    listProducts.innerHTML = "";
    let total = 0;
    let spanElement;
    Array.from([product]).forEach((product) => {
      total += product.price;
      spanElement = document.createElement("span");
      let quantity = product.quantity ?? 1;
      spanElement.innerText = `SL: ${quantity} - SP: ${product.name}`;
      listProducts.appendChild(spanElement);
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
      const request = {
        products: product,
        Buyer: {
          phoneNumber,
          gmail,
          address,
          message,
        },
      };
      responseElement.innerText = `Request:\n${JSON.stringify(request)}`;
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
    const cart = JSON.parse(localStorage.getItem("shopping-cart")) || [];
    const existingProduct = cart.find((item) => item.id === productId);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      const product = products.find((p) => p.id === productId);
      if (product) {
        cart.push({ ...product, quantity: 1 });
      }
    }

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
      total += item.price * item.quantity;
      offcanvasBody.innerHTML += `
        <div class="cart-item">
          <div class="d-flex align-items-center mb-3">
            <img src="${item.images[0]}" class="rounded me-3" alt="${
        item.name
      }" style="width: 100px; height: 100px;" />
            <div>
              <h6 class="mb-0">${item.name}</h6>
              <small>Giá: ${item.price.toLocaleString()} VND</small><br />
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
      total += product.price * quantity;
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

      const result = cart.reduce((obj, tag) => {
        obj["id"] = tag.id;
        obj["name"] = tag.name;
        obj["description"] = tag.description;
        obj["amount"] = tag.amount;
        obj["price"] = tag.price;
        obj["date"] = tag.date;
        obj["point"] = tag.point;
        obj["images"] = tag.images;
        obj["isSell"] = tag.isSell;
        return obj;
      }, {});
      const request = {
        products: { ...cart },
        Buyer: {
          phoneNumber,
          gmail,
          address,
          message,
        },
      };
      responseElement.innerText = `Request:\n${JSON.stringify(request)}`;
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

  // Khởi động
  fetchProducts();
  updateCartOffcanvas();
  updateCartCount();
});
