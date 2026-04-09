// Mobile Menu Toggle
function toggleMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  const mobileToggle = document.querySelector('.mobile-toggle');
  
  if (navMenu) {
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
  }
}

// Mobile Dropdown Toggle
function toggleMobileDropdown(element) {
  const parent = element.closest('.nav-item');
  if (parent) {
    parent.classList.toggle('dropdown-active');
    const icon = element.querySelector('i');
    if (icon) {
      icon.style.transform = parent.classList.contains('dropdown-active') ? 'rotate(180deg)' : 'rotate(0)';
    }
  }
}

// FAQ Accordion Toggle
function toggleFaq(element) {
  const allItems = document.querySelectorAll('.accordion-item');
  const clickedItem = element.closest('.accordion-item');
  
  allItems.forEach(item => {
    if (item !== clickedItem) {
      item.classList.remove('active');
    }
  });
  
  if (clickedItem) {
    clickedItem.classList.toggle('active');
  }
}

// Scroll to Top Button Visibility
function handleScrollToTopVisibility() {
  const scrollToTop = document.querySelector('.scroll-to-top');
  if (scrollToTop) {
    if (window.pageYOffset > 300) {
      scrollToTop.classList.add('show');
    } else {
      scrollToTop.classList.remove('show');
    }
  }
}

// Scroll to Top Function
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Sticky Header
function handleStickyHeader() {
  const header = document.querySelector('.header');
  if (header) {
    if (window.pageYOffset > 50) {
      header.classList.add('sticky');
    } else {
      header.classList.remove('sticky');
    }
  }
}

// Counter Animation
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target')) || parseInt(counter.textContent);
    const increment = target / 100;
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current);
        setTimeout(updateCounter, 20);
      } else {
        counter.textContent = target.toLocaleString();
      }
    };
    
    updateCounter();
  });
}

// Animate Counters on Scroll (Intersection Observer)
function observeCounters() {
  const options = {
    threshold: 0.5
  };
  
  const callback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
        entry.target.classList.add('animated');
        animateCounters();
      }
    });
  };
  
  const observer = new IntersectionObserver(callback, options);
  const counterSection = document.querySelector('.impact-section');
  
  if (counterSection) {
    observer.observe(counterSection);
  }
}

// Form Validation
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  
  const inputs = form.querySelectorAll('[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = '#f72585';
      isValid = false;
    } else {
      input.style.borderColor = '';
    }
    
    // Email validation
    if (input.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        input.style.borderColor = '#f72585';
        isValid = false;
      }
    }
    
    // Password match validation
    if (input.name === 'confirm-password') {
      const password = form.querySelector('input[name="password"]');
      if (password && input.value !== password.value) {
        input.style.borderColor = '#f72585';
        isValid = false;
      }
    }
  });
  
  return isValid;
}

// Price Calculator
function calculateTotal(price, couponCode = '') {
  let total = price;
  const discounts = {
    'WELCOME10': 0.10,
    'SAVE20': 0.20,
    'SPECIAL50': 0.50
  };
  
  if (couponCode && discounts[couponCode]) {
    total -= price * discounts[couponCode];
  }
  
  return total;
}

// Add to Cart
function addToCart(itemId, itemType, itemData = {}) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  const existingItem = cart.find(item => item.id === itemId && item.type === itemType);
  
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({
      id: itemId,
      type: itemType,
      quantity: 1,
      ...itemData
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  showCartPopup(itemData.name || 'Item', itemData.price || 0);
}

// Remove from Cart
function removeFromCart(itemId, itemType) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => !(item.id === itemId && item.type === itemType));
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Get Cart Items
function getCartItems() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

// Show Notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 1000;
    animation: slideInRight 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Password Strength Indicator
function checkPasswordStrength(password) {
  let strength = 0;
  const indicator = document.querySelector('.password-strength');
  
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (indicator) {
    indicator.className = 'password-strength';
    if (strength === 0) indicator.textContent = 'Very Weak';
    else if (strength === 1) indicator.textContent = 'Weak';
    else if (strength === 2) indicator.textContent = 'Fair';
    else if (strength === 3) indicator.textContent = 'Good';
    else if (strength === 4) indicator.textContent = 'Strong';
    
    indicator.style.color = strength <= 1 ? '#ef4444' : strength === 2 ? '#f97316' : strength === 3 ? '#eab308' : '#10b981';
  }
  
  return strength;
}

// Show Cart Popup Modal
function showCartPopup(itemName = 'Item', itemPrice = 0) {
  // Remove existing modal if any
  const existingModal = document.getElementById('cart-modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }

  const modalHTML = `
    <div id="cart-modal-overlay" class="cart-modal-overlay active">
      <div class="cart-modal">
        <button class="cart-modal-close" onclick="closeCartModal()">
          <i class="fas fa-times"></i>
        </button>
        
        <div class="cart-modal-checkmark">
          <i class="fas fa-check"></i>
        </div>
        
        <h2>Added to Cart!</h2>
        <div class="cart-modal-item-name">${itemName} Plan</div>
        <div class="cart-modal-price">₹${itemPrice.toLocaleString('en-IN')}</div>
        <div class="cart-modal-divider"></div>
        
        <div class="cart-modal-buttons">
          <button class="cart-modal-btn cart-modal-btn-primary" onclick="goToCheckout()">
            <i class="fas fa-shopping-cart"></i> Proceed to Checkout
          </button>
          <button class="cart-modal-btn cart-modal-btn-secondary" onclick="closeCartModal()">
            <i class="fas fa-arrow-left"></i> Continue Browsing
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Click outside modal to close
  const modalOverlay = document.getElementById('cart-modal-overlay');
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === this) {
      closeCartModal();
    }
  });

  // Auto close after 8 seconds if user doesn't interact
  setTimeout(() => {
    const modal = document.getElementById('cart-modal-overlay');
    if (modal && modal.classList.contains('active')) {
      closeCartModal();
    }
  }, 8000);
}

// Close Cart Modal
function closeCartModal() {
  const modal = document.getElementById('cart-modal-overlay');
  if (modal) {
    const box = modal.querySelector('.cart-modal');
    if (box) {
      box.style.animation = 'cartModalPop 0.3s ease reverse forwards';
    }
    modal.style.animation = 'cartOverlayIn 0.25s ease reverse forwards';
    setTimeout(() => modal.remove(), 300);
  }
}

// Go to Checkout
function goToCheckout() {
  window.location.href = 'checkout.html';
}

// Filter Courses
function filterCourses(category = '', minPrice = 0, maxPrice = Infinity) {
  const cards = document.querySelectorAll('.course-card');
  let visibleCount = 0;
  
  cards.forEach(card => {
    const cardCategory = card.getAttribute('data-category');
    const cardPrice = parseInt(card.getAttribute('data-price'));
    
    const matchesCategory = !category || cardCategory === category;
    const matchesPrice = cardPrice >= minPrice && cardPrice <= maxPrice;
    
    if (matchesCategory && matchesPrice) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  if (visibleCount === 0) {
    const noResults = document.querySelector('.no-results');
    if (!noResults) {
      const message = document.createElement('p');
      message.className = 'no-results';
      message.textContent = 'No courses found matching your filters.';
      document.querySelector('.courses-grid').appendChild(message);
    }
  }
}

// Sort Courses
function sortCourses(sortBy) {
  const coursesGrid = document.querySelector('.courses-grid');
  const cards = Array.from(document.querySelectorAll('.course-card'));
  
  if (sortBy === 'price-low') {
    cards.sort((a, b) => parseInt(a.getAttribute('data-price')) - parseInt(b.getAttribute('data-price')));
  } else if (sortBy === 'price-high') {
    cards.sort((a, b) => parseInt(b.getAttribute('data-price')) - parseInt(a.getAttribute('data-price')));
  } else if (sortBy === 'rating') {
    cards.sort((a, b) => parseFloat(b.getAttribute('data-rating')) - parseFloat(a.getAttribute('data-rating')));
  } else if (sortBy === 'newest') {
    cards.sort((a, b) => new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date')));
  }
  
  coursesGrid.innerHTML = '';
  cards.forEach(card => coursesGrid.appendChild(card));
}

// Search Courses
function searchCourses(query) {
  const cards = document.querySelectorAll('.course-card');
  const queryLower = query.toLowerCase();
  
  cards.forEach(card => {
    const title = card.querySelector('.course-card-title')?.textContent.toLowerCase();
    const description = card.querySelector('.course-card-description')?.textContent.toLowerCase();
    
    if (title.includes(queryLower) || description.includes(queryLower)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Lazy Load Images
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  } else {
    images.forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  }
}

// Initialize Event Listeners
function initializeEventListeners() {
  // Mobile Menu Toggle - skip addEventListener since onclick is in HTML
  // const mobileToggle = document.querySelector('.mobile-toggle');
  // if (mobileToggle) {
  //   mobileToggle.addEventListener('click', toggleMobileMenu);
  // }
  
  // Mobile Dropdowns
  const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown > .nav-link');
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        toggleMobileDropdown(item);
      }
    });
  });
  
  // FAQ Accordion
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => toggleFaq(header));
  });
  
  // Scroll to Top
  const scrollToTopBtn = document.querySelector('.scroll-to-top');
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', scrollToTop);
  }
  
  // Form Submit
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm(form.id)) {
        showNotification('Form submitted successfully!', 'success');
        // form.submit(); // Uncomment when ready to submit
      } else {
        showNotification('Please fill in all required fields correctly.', 'error');
      }
    });
  });
  
  // Password Strength Indicator
  const passwordInputs = document.querySelectorAll('input[name="password"]');
  passwordInputs.forEach(input => {
    input.addEventListener('input', () => checkPasswordStrength(input.value));
  });
  
  // Sort Courses
  const sortSelect = document.querySelector('.sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => sortCourses(e.target.value));
  }
  
  // Search Input
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => searchCourses(e.target.value));
  }
}

// Close Mobile Menu on Link Click
function closeMenuOnNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const navMenu = document.querySelector('.nav-menu');
      if (navMenu) {
        navMenu.classList.remove('active');
        const toggle = document.querySelector('.mobile-toggle');
        if (toggle) toggle.classList.remove('active');
      }
    });
  });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  closeMenuOnNavigation();
  lazyLoadImages();
  observeCounters();
});

// Handle Scroll Events
window.addEventListener('scroll', () => {
  handleStickyHeader();
  handleScrollToTopVisibility();
});

// Handle Window Resize
window.addEventListener('resize', () => {
  const navMenu = document.querySelector('.nav-menu');
  const mobileToggle = document.querySelector('.mobile-toggle');
  
  if (window.innerWidth > 768) {
    if (navMenu) navMenu.classList.remove('active');
    if (mobileToggle) mobileToggle.classList.remove('active');
  }
});

// Smooth Scrolling for Anchor Links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  // Ignore bare '#' links — do nothing, stay in place
  if (href === '#') {
    e.preventDefault();
    return;
  }
  // Smooth scroll to actual targets like #courses-section
  const targetElement = document.querySelector(href);
  if (targetElement) {
    e.preventDefault();
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
});
