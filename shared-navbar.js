(function () {
  const mount = document.getElementById('shared-navbar');
  if (!mount) return;

  mount.innerHTML = `
    <header>
      <div class="container">
        <nav class="main-nav">
          <div class="logo">
            <i class="fas fa-shield-check"></i>
            <span>MUNACHIM</span>
          </div>
          <div class="verification-form">
            <div class="scantext">
              <button type="button" class="scan-btn">Scan Product</button>
              <span></span>
            </div>
            <input type="text" class="verification-input" placeholder="Enter product code" aria-label="Enter product code for verification">
            <button type="button" class="verify-btn">Verify</button>
          </div>
          <div class="hamburger-menu">
            <button type="button" class="hamburger-btn">
              <i class="fas fa-bars"></i>
            </button>
            <div class="hamburger-content">
              <a href="index.html" class="menu-item">Home</a>
              <a href="products.html" class="menu-item">Products</a>
              <a href="about.html" class="menu-item">About Us</a>
              <a href="contact.html" class="menu-item">Contact</a>
              <a href="support.html" class="menu-item">Support</a>
              <a href="faq.html" class="menu-item">FAQ</a>
              <a href="blog.html" class="menu-item">Blog</a>
              <a href="creators.html" class="menu-item">creators</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
    <div class="secondary-nav">
      <div class="container">
        <div class="info-bar">
          <div class="info-item">
            <i class="far fa-calendar"></i>
            <span id="current-date">Loading date...</span>
            <button type="button" class="copy-btn" data-text="date"><i class="far fa-copy"></i></button>
          </div>
          <div class="info-item">
            <i class="far fa-clock"></i>
            <span id="current-time">Loading time...</span>
            <button type="button" class="copy-btn" data-text="time"><i class="far fa-copy"></i></button>
          </div>
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span id="user-location">Detecting location...</span>
            <button type="button" class="copy-btn" data-text="location"><i class="far fa-copy"></i></button>
          </div>
        </div>
      </div>
    </div>`;
})();
