/* ===== Admin Panel JavaScript ===== */

// ============ ADMIN CREDENTIALS ============
// Default admin credentials (stored in localStorage after first setup)
const DEFAULT_ADMIN = {
  email: 'admin@richer.com',
  password: 'Admin@123'
};

// ============ AUTHENTICATION ============
function initAdmin() {
  if (!localStorage.getItem('richer_admin')) {
    localStorage.setItem('richer_admin', JSON.stringify(DEFAULT_ADMIN));
  }
}
initAdmin();

function adminLogin(email, password) {
  const admin = JSON.parse(localStorage.getItem('richer_admin'));
  if (admin && admin.email === email && admin.password === password) {
    const session = {
      loggedIn: true,
      email: admin.email,
      loginTime: new Date().toISOString()
    };
    sessionStorage.setItem('richer_admin_session', JSON.stringify(session));
    return true;
  }
  return false;
}

function getAdminSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem('richer_admin_session'));
    return session && session.loggedIn ? session : null;
  } catch { return null; }
}

function requireAdmin() {
  if (!getAdminSession()) {
    window.location.href = 'login.html';
  }
  // Set admin name in topbar
  const nameEl = document.getElementById('adminName');
  if (nameEl) {
    const session = getAdminSession();
    nameEl.textContent = session ? session.email.split('@')[0] : 'Admin';
  }
}

function adminLogout() {
  sessionStorage.removeItem('richer_admin_session');
  window.location.href = 'login.html';
}

// ============ SIDEBAR TOGGLE ============
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = toggleSidebar;
    document.body.appendChild(overlay);
  }
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || '');
  toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle') + '"></i> ' + message;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3000);
}

// ============ CONFIRM DIALOG ============
function showConfirm(title, message) {
  return new Promise(function(resolve) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML =
      '<div class="confirm-dialog">' +
        '<h3>' + title + '</h3>' +
        '<p>' + message + '</p>' +
        '<div class="confirm-actions">' +
          '<button class="btn-ghost" id="confirmNo">Cancel</button>' +
          '<button class="btn-danger" id="confirmYes"><i class="fas fa-check"></i> Confirm</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('confirmYes').onclick = function() { overlay.remove(); resolve(true); };
    document.getElementById('confirmNo').onclick = function() { overlay.remove(); resolve(false); };
  });
}

// ============ HELPER: Generate ID ============
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============ HELPER: Format Date ============
function formatDate(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============ HELPER: Sanitize HTML ============
function sanitize(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============ DATA LAYER ============
function getData(key) {
  try { return JSON.parse(localStorage.getItem('richer_' + key)) || []; }
  catch { return []; }
}

function setData(key, data) {
  localStorage.setItem('richer_' + key, JSON.stringify(data));
}

// ============ COURSES MANAGEMENT ============
function showCourseForm(id) {
  var panel = document.getElementById('courseFormPanel');
  var title = document.getElementById('courseFormTitle');
  var form = document.getElementById('courseForm');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });

  if (id) {
    title.innerHTML = '<i class="fas fa-edit"></i> Edit Course';
    var courses = getData('courses');
    var course = courses.find(function(c) { return c.id === id; });
    if (course) {
      document.getElementById('courseId').value = course.id;
      document.getElementById('courseTitle').value = course.title || '';
      document.getElementById('courseCategory').value = course.category || '';
      document.getElementById('courseDescription').value = course.description || '';
      document.getElementById('courseInstructor').value = course.instructor || '';
      document.getElementById('courseLessons').value = course.lessons || '';
      document.getElementById('coursePrice').value = course.price || '';
      document.getElementById('courseOriginalPrice').value = course.originalPrice || '';
      document.getElementById('courseRating').value = course.rating || '';
      document.getElementById('courseImage').value = course.image || '';
      document.getElementById('courseBadge').value = course.badge || '';
      document.getElementById('courseStatus').value = course.status || 'published';
      document.getElementById('courseDuration').value = course.duration || '';
    }
  } else {
    title.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Course';
    form.reset();
    document.getElementById('courseId').value = '';
  }
}

function hideCourseForm() {
  document.getElementById('courseFormPanel').style.display = 'none';
}

function saveCourse(e) {
  e.preventDefault();
  var courses = getData('courses');
  var id = document.getElementById('courseId').value;

  var courseData = {
    title: document.getElementById('courseTitle').value.trim(),
    category: document.getElementById('courseCategory').value,
    description: document.getElementById('courseDescription').value.trim(),
    instructor: document.getElementById('courseInstructor').value.trim(),
    lessons: parseInt(document.getElementById('courseLessons').value) || 0,
    price: parseFloat(document.getElementById('coursePrice').value) || 0,
    originalPrice: parseFloat(document.getElementById('courseOriginalPrice').value) || 0,
    rating: parseFloat(document.getElementById('courseRating').value) || 0,
    image: document.getElementById('courseImage').value.trim() || 'https://picsum.photos/600/400?random=' + Math.floor(Math.random() * 100),
    badge: document.getElementById('courseBadge').value,
    status: document.getElementById('courseStatus').value,
    duration: document.getElementById('courseDuration').value.trim()
  };

  if (id) {
    var idx = courses.findIndex(function(c) { return c.id === id; });
    if (idx !== -1) {
      courseData.id = id;
      courseData.createdAt = courses[idx].createdAt;
      courseData.updatedAt = new Date().toISOString();
      courses[idx] = courseData;
    }
    showToast('Course updated successfully', 'success');
  } else {
    courseData.id = generateId();
    courseData.createdAt = new Date().toISOString();
    courseData.updatedAt = new Date().toISOString();
    courses.push(courseData);
    showToast('Course created successfully', 'success');
  }

  setData('courses', courses);
  hideCourseForm();
  loadCoursesList();
}

function deleteCourse(id) {
  showConfirm('Delete Course', 'Are you sure you want to delete this course?').then(function(ok) {
    if (ok) {
      var courses = getData('courses').filter(function(c) { return c.id !== id; });
      setData('courses', courses);
      loadCoursesList();
      showToast('Course deleted', 'success');
    }
  });
}

function loadCoursesList() {
  var tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;
  var courses = getData('courses');

  if (courses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-book-open"></i><p>No courses found. Click "Add Course" to create one.</p></td></tr>';
    return;
  }

  var categoryLabels = { digital: 'Digital Marketing', branding: 'Personal Branding', affiliate: 'Affiliate Marketing', ecommerce: 'E-Commerce', finance: 'Finance', development: 'Web Dev', design: 'Design', other: 'Other' };

  tbody.innerHTML = courses.map(function(c) {
    var discount = c.originalPrice > 0 ? Math.round((1 - c.price / c.originalPrice) * 100) : 0;
    return '<tr>' +
      '<td><div class="course-cell"><img src="' + sanitize(c.image) + '" class="course-thumb" alt="" onerror="this.src=\'https://picsum.photos/48/48\'"><div class="course-cell-info"><h4>' + sanitize(c.title) + '</h4><span>' + (c.lessons || 0) + ' lessons' + (c.duration ? ' &bull; ' + sanitize(c.duration) : '') + '</span></div></div></td>' +
      '<td><span class="badge badge-primary">' + sanitize(categoryLabels[c.category] || c.category) + '</span></td>' +
      '<td>' + sanitize(c.instructor) + '</td>' +
      '<td><strong>₹' + c.price + '</strong>' + (c.originalPrice > 0 ? ' <del style="color:#8e8ea0;font-size:0.75rem">₹' + c.originalPrice + '</del>' : '') + (discount > 0 ? ' <span class="badge badge-success">' + discount + '% OFF</span>' : '') + '</td>' +
      '<td><span class="stars">★</span> ' + (c.rating || '-') + '</td>' +
      '<td><span class="badge ' + (c.status === 'published' ? 'badge-success' : 'badge-warning') + '">' + (c.status === 'published' ? 'Published' : 'Draft') + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="showCourseForm(\'' + c.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteCourse(\'' + c.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

function filterCourses() {
  var search = (document.getElementById('courseSearch').value || '').toLowerCase();
  var category = document.getElementById('courseFilter').value;
  var courses = getData('courses');
  var filtered = courses.filter(function(c) {
    var matchSearch = !search || c.title.toLowerCase().includes(search) || (c.instructor || '').toLowerCase().includes(search);
    var matchCategory = category === 'all' || c.category === category;
    return matchSearch && matchCategory;
  });

  var tbody = document.getElementById('coursesTableBody');
  var categoryLabels = { digital: 'Digital Marketing', branding: 'Personal Branding', affiliate: 'Affiliate Marketing', ecommerce: 'E-Commerce', finance: 'Finance', development: 'Web Dev', design: 'Design', other: 'Other' };

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No courses match your search</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(c) {
    var discount = c.originalPrice > 0 ? Math.round((1 - c.price / c.originalPrice) * 100) : 0;
    return '<tr>' +
      '<td><div class="course-cell"><img src="' + sanitize(c.image) + '" class="course-thumb" alt="" onerror="this.src=\'https://picsum.photos/48/48\'"><div class="course-cell-info"><h4>' + sanitize(c.title) + '</h4><span>' + (c.lessons || 0) + ' lessons</span></div></div></td>' +
      '<td><span class="badge badge-primary">' + sanitize(categoryLabels[c.category] || c.category) + '</span></td>' +
      '<td>' + sanitize(c.instructor) + '</td>' +
      '<td><strong>₹' + c.price + '</strong>' + (discount > 0 ? ' <span class="badge badge-success">' + discount + '%</span>' : '') + '</td>' +
      '<td><span class="stars">★</span> ' + (c.rating || '-') + '</td>' +
      '<td><span class="badge ' + (c.status === 'published' ? 'badge-success' : 'badge-warning') + '">' + (c.status === 'published' ? 'Published' : 'Draft') + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="showCourseForm(\'' + c.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteCourse(\'' + c.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

// ============ USERS MANAGEMENT ============
function showUserForm(id) {
  var panel = document.getElementById('userFormPanel');
  var title = document.getElementById('userFormTitle');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });

  if (id) {
    title.innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
    var users = getData('users');
    var user = users.find(function(u) { return u.id === id; });
    if (user) {
      document.getElementById('userId').value = user.id;
      document.getElementById('userFirstName').value = user.firstName || '';
      document.getElementById('userLastName').value = user.lastName || '';
      document.getElementById('userEmail').value = user.email || '';
      document.getElementById('userPhone').value = user.phone || '';
      document.getElementById('userRole').value = user.role || 'student';
      document.getElementById('userStatus').value = user.status || 'active';
    }
  } else {
    title.innerHTML = '<i class="fas fa-user-plus"></i> Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
  }
}

function hideUserForm() {
  document.getElementById('userFormPanel').style.display = 'none';
}

function saveUser(e) {
  e.preventDefault();
  var users = getData('users');
  var id = document.getElementById('userId').value;

  var userData = {
    firstName: document.getElementById('userFirstName').value.trim(),
    lastName: document.getElementById('userLastName').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    phone: document.getElementById('userPhone').value.trim(),
    role: document.getElementById('userRole').value,
    status: document.getElementById('userStatus').value
  };

  if (id) {
    var idx = users.findIndex(function(u) { return u.id === id; });
    if (idx !== -1) {
      userData.id = id;
      userData.joinedAt = users[idx].joinedAt;
      users[idx] = userData;
    }
    showToast('User updated', 'success');
  } else {
    userData.id = generateId();
    userData.joinedAt = new Date().toISOString();
    users.push(userData);
    showToast('User added', 'success');
  }

  setData('users', users);
  hideUserForm();
  loadUsersList();
}

function deleteUser(id) {
  showConfirm('Delete User', 'Are you sure you want to delete this user?').then(function(ok) {
    if (ok) {
      var users = getData('users').filter(function(u) { return u.id !== id; });
      setData('users', users);
      loadUsersList();
      showToast('User deleted', 'success');
    }
  });
}

function loadUsersList() {
  var tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  var users = getData('users');

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-users"></i><p>No users found</p></td></tr>';
    return;
  }

  tbody.innerHTML = users.map(function(u) {
    var initials = ((u.firstName || '')[0] || '') + ((u.lastName || '')[0] || '');
    return '<tr>' +
      '<td><div class="user-cell"><div class="user-avatar">' + sanitize(initials.toUpperCase()) + '</div><div class="user-cell-info"><h4>' + sanitize(u.firstName + ' ' + u.lastName) + '</h4></div></div></td>' +
      '<td>' + sanitize(u.email) + '</td>' +
      '<td><span class="badge ' + (u.role === 'instructor' ? 'badge-primary' : 'badge-info') + '">' + sanitize(u.role) + '</span></td>' +
      '<td>' + formatDate(u.joinedAt) + '</td>' +
      '<td><span class="badge ' + (u.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + sanitize(u.status) + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="showUserForm(\'' + u.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteUser(\'' + u.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

function filterUsers() {
  var search = (document.getElementById('userSearch').value || '').toLowerCase();
  var role = document.getElementById('userFilter').value;
  var users = getData('users');
  var filtered = users.filter(function(u) {
    var name = (u.firstName + ' ' + u.lastName).toLowerCase();
    var matchSearch = !search || name.includes(search) || (u.email || '').toLowerCase().includes(search);
    var matchRole = role === 'all' || u.role === role;
    return matchSearch && matchRole;
  });

  var tbody = document.getElementById('usersTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No users match your search</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(u) {
    var initials = ((u.firstName || '')[0] || '') + ((u.lastName || '')[0] || '');
    return '<tr>' +
      '<td><div class="user-cell"><div class="user-avatar">' + sanitize(initials.toUpperCase()) + '</div><div class="user-cell-info"><h4>' + sanitize(u.firstName + ' ' + u.lastName) + '</h4></div></div></td>' +
      '<td>' + sanitize(u.email) + '</td>' +
      '<td><span class="badge ' + (u.role === 'instructor' ? 'badge-primary' : 'badge-info') + '">' + sanitize(u.role) + '</span></td>' +
      '<td>' + formatDate(u.joinedAt) + '</td>' +
      '<td><span class="badge ' + (u.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + sanitize(u.status) + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="showUserForm(\'' + u.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteUser(\'' + u.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

// ============ ORDERS MANAGEMENT ============
function loadOrdersList() {
  var tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  var orders = getData('orders');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-receipt"></i><p>No orders found</p></td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(function(o) {
    var statusClass = o.status === 'completed' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : 'badge-danger';
    return '<tr>' +
      '<td><strong>#' + sanitize(o.id.substr(0,8).toUpperCase()) + '</strong></td>' +
      '<td>' + sanitize(o.customerName || 'Guest') + '</td>' +
      '<td>' + sanitize(o.courseName || '-') + '</td>' +
      '<td><strong>₹' + (o.amount || 0) + '</strong></td>' +
      '<td>' + formatDate(o.createdAt) + '</td>' +
      '<td><span class="badge ' + statusClass + '">' + sanitize(o.status) + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="changeOrderStatus(\'' + o.id + '\')"><i class="fas fa-exchange-alt"></i></button><button class="btn-icon delete" onclick="deleteOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

function changeOrderStatus(id) {
  var orders = getData('orders');
  var order = orders.find(function(o) { return o.id === id; });
  if (!order) return;
  var statuses = ['pending', 'completed', 'refunded'];
  var current = statuses.indexOf(order.status);
  order.status = statuses[(current + 1) % statuses.length];
  setData('orders', orders);
  loadOrdersList();
  showToast('Order status changed to ' + order.status, 'success');
}

function deleteOrder(id) {
  showConfirm('Delete Order', 'Are you sure?').then(function(ok) {
    if (ok) {
      setData('orders', getData('orders').filter(function(o) { return o.id !== id; }));
      loadOrdersList();
      showToast('Order deleted', 'success');
    }
  });
}

function filterOrders() {
  var search = (document.getElementById('orderSearch').value || '').toLowerCase();
  var status = document.getElementById('orderFilter').value;
  var orders = getData('orders');
  var filtered = orders.filter(function(o) {
    var matchSearch = !search || (o.customerName || '').toLowerCase().includes(search) || (o.courseName || '').toLowerCase().includes(search) || o.id.includes(search);
    var matchStatus = status === 'all' || o.status === status;
    return matchSearch && matchStatus;
  });
  var tbody = document.getElementById('ordersTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No orders match</p></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function(o) {
    var statusClass = o.status === 'completed' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : 'badge-danger';
    return '<tr>' +
      '<td><strong>#' + sanitize(o.id.substr(0,8).toUpperCase()) + '</strong></td>' +
      '<td>' + sanitize(o.customerName || 'Guest') + '</td>' +
      '<td>' + sanitize(o.courseName || '-') + '</td>' +
      '<td><strong>₹' + (o.amount || 0) + '</strong></td>' +
      '<td>' + formatDate(o.createdAt) + '</td>' +
      '<td><span class="badge ' + statusClass + '">' + sanitize(o.status) + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="changeOrderStatus(\'' + o.id + '\')"><i class="fas fa-exchange-alt"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

// ============ COUPONS MANAGEMENT ============
function showCouponForm(id) {
  var panel = document.getElementById('couponFormPanel');
  var title = document.getElementById('couponFormTitle');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });

  if (id) {
    title.innerHTML = '<i class="fas fa-edit"></i> Edit Coupon';
    var coupons = getData('coupons');
    var coupon = coupons.find(function(c) { return c.id === id; });
    if (coupon) {
      document.getElementById('couponId').value = coupon.id;
      document.getElementById('couponCode').value = coupon.code || '';
      document.getElementById('couponType').value = coupon.type || 'percentage';
      document.getElementById('couponValue').value = coupon.value || '';
      document.getElementById('couponMaxUses').value = coupon.maxUses || '';
      document.getElementById('couponExpiry').value = coupon.expiry || '';
      document.getElementById('couponStatus').value = coupon.status || 'active';
    }
  } else {
    title.innerHTML = '<i class="fas fa-tag"></i> Create Coupon';
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = '';
  }
}

function hideCouponForm() {
  document.getElementById('couponFormPanel').style.display = 'none';
}

function saveCoupon(e) {
  e.preventDefault();
  var coupons = getData('coupons');
  var id = document.getElementById('couponId').value;

  var couponData = {
    code: document.getElementById('couponCode').value.trim().toUpperCase(),
    type: document.getElementById('couponType').value,
    value: parseFloat(document.getElementById('couponValue').value) || 0,
    maxUses: parseInt(document.getElementById('couponMaxUses').value) || null,
    usedCount: 0,
    expiry: document.getElementById('couponExpiry').value || null,
    status: document.getElementById('couponStatus').value
  };

  if (id) {
    var idx = coupons.findIndex(function(c) { return c.id === id; });
    if (idx !== -1) {
      couponData.id = id;
      couponData.usedCount = coupons[idx].usedCount || 0;
      coupons[idx] = couponData;
    }
    showToast('Coupon updated', 'success');
  } else {
    couponData.id = generateId();
    coupons.push(couponData);
    showToast('Coupon created', 'success');
  }

  setData('coupons', coupons);
  hideCouponForm();
  loadCouponsList();
}

function deleteCoupon(id) {
  showConfirm('Delete Coupon', 'Are you sure?').then(function(ok) {
    if (ok) {
      setData('coupons', getData('coupons').filter(function(c) { return c.id !== id; }));
      loadCouponsList();
      showToast('Coupon deleted', 'success');
    }
  });
}

function loadCouponsList() {
  var tbody = document.getElementById('couponsTableBody');
  if (!tbody) return;
  var coupons = getData('coupons');

  if (coupons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-tags"></i><p>No coupons found</p></td></tr>';
    return;
  }

  tbody.innerHTML = coupons.map(function(c) {
    return '<tr>' +
      '<td><strong style="font-family:monospace;letter-spacing:1px">' + sanitize(c.code) + '</strong></td>' +
      '<td>' + (c.type === 'percentage' ? 'Percentage' : 'Fixed') + '</td>' +
      '<td><strong>' + (c.type === 'percentage' ? c.value + '%' : '₹' + c.value) + '</strong></td>' +
      '<td>' + (c.usedCount || 0) + ' / ' + (c.maxUses || '∞') + '</td>' +
      '<td>' + (c.expiry ? formatDate(c.expiry) : 'No Expiry') + '</td>' +
      '<td><span class="badge ' + (c.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + sanitize(c.status) + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="showCouponForm(\'' + c.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteCoupon(\'' + c.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

// ============ BLOG MANAGEMENT ============
function showBlogForm(id) {
  var panel = document.getElementById('blogFormPanel');
  var title = document.getElementById('blogFormTitle');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });

  if (id) {
    title.innerHTML = '<i class="fas fa-edit"></i> Edit Post';
    var posts = getData('blogPosts');
    var post = posts.find(function(p) { return p.id === id; });
    if (post) {
      document.getElementById('blogId').value = post.id;
      document.getElementById('blogTitle').value = post.title || '';
      document.getElementById('blogAuthor').value = post.author || '';
      document.getElementById('blogCategory').value = post.category || 'marketing';
      document.getElementById('blogExcerpt').value = post.excerpt || '';
      document.getElementById('blogContent').value = post.content || '';
      document.getElementById('blogImage').value = post.image || '';
      document.getElementById('blogStatus').value = post.status || 'published';
    }
  } else {
    title.innerHTML = '<i class="fas fa-edit"></i> New Blog Post';
    document.getElementById('blogForm').reset();
    document.getElementById('blogId').value = '';
  }
}

function hideBlogForm() {
  document.getElementById('blogFormPanel').style.display = 'none';
}

function saveBlogPost(e) {
  e.preventDefault();
  var posts = getData('blogPosts');
  var id = document.getElementById('blogId').value;

  var postData = {
    title: document.getElementById('blogTitle').value.trim(),
    author: document.getElementById('blogAuthor').value.trim(),
    category: document.getElementById('blogCategory').value,
    excerpt: document.getElementById('blogExcerpt').value.trim(),
    content: document.getElementById('blogContent').value.trim(),
    image: document.getElementById('blogImage').value.trim() || 'https://picsum.photos/800/400?random=' + Math.floor(Math.random() * 100),
    status: document.getElementById('blogStatus').value
  };

  if (id) {
    var idx = posts.findIndex(function(p) { return p.id === id; });
    if (idx !== -1) {
      postData.id = id;
      postData.createdAt = posts[idx].createdAt;
      postData.updatedAt = new Date().toISOString();
      posts[idx] = postData;
    }
    showToast('Post updated', 'success');
  } else {
    postData.id = generateId();
    postData.createdAt = new Date().toISOString();
    postData.updatedAt = new Date().toISOString();
    posts.push(postData);
    showToast('Post created', 'success');
  }

  setData('blogPosts', posts);
  hideBlogForm();
  loadBlogList();
}

function deleteBlogPost(id) {
  showConfirm('Delete Post', 'Are you sure?').then(function(ok) {
    if (ok) {
      setData('blogPosts', getData('blogPosts').filter(function(p) { return p.id !== id; }));
      loadBlogList();
      showToast('Post deleted', 'success');
    }
  });
}

function loadBlogList() {
  var tbody = document.getElementById('blogTableBody');
  if (!tbody) return;
  var posts = getData('blogPosts');

  if (posts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-blog"></i><p>No blog posts found</p></td></tr>';
    return;
  }

  tbody.innerHTML = posts.map(function(p) {
    return '<tr>' +
      '<td><strong>' + sanitize(p.title) + '</strong></td>' +
      '<td>' + sanitize(p.author) + '</td>' +
      '<td><span class="badge badge-info">' + sanitize(p.category) + '</span></td>' +
      '<td>' + formatDate(p.createdAt) + '</td>' +
      '<td><span class="badge ' + (p.status === 'published' ? 'badge-success' : 'badge-warning') + '">' + sanitize(p.status) + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="showBlogForm(\'' + p.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteBlogPost(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

function filterBlogPosts() {
  var search = (document.getElementById('blogSearch').value || '').toLowerCase();
  var posts = getData('blogPosts');
  var filtered = posts.filter(function(p) {
    return !search || p.title.toLowerCase().includes(search) || (p.author || '').toLowerCase().includes(search);
  });
  var tbody = document.getElementById('blogTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No posts match</p></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function(p) {
    return '<tr>' +
      '<td><strong>' + sanitize(p.title) + '</strong></td>' +
      '<td>' + sanitize(p.author) + '</td>' +
      '<td><span class="badge badge-info">' + sanitize(p.category) + '</span></td>' +
      '<td>' + formatDate(p.createdAt) + '</td>' +
      '<td><span class="badge ' + (p.status === 'published' ? 'badge-success' : 'badge-warning') + '">' + sanitize(p.status) + '</span></td>' +
      '<td><div class="action-buttons"><button class="btn-icon edit" onclick="showBlogForm(\'' + p.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteBlogPost(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
    '</tr>';
  }).join('');
}

// ============ SETTINGS ============
function loadSettings() {
  var settings = getData('settings')[0] || {};
  var el = function(id) { return document.getElementById(id); };
  if (el('siteName')) el('siteName').value = settings.siteName || 'Richer';
  if (el('siteTagline')) el('siteTagline').value = settings.tagline || '';
  if (el('siteEmail')) el('siteEmail').value = settings.email || 'info@richer.com';
  if (el('sitePhone')) el('sitePhone').value = settings.phone || '+91-1234567890';
  if (el('siteAddress')) el('siteAddress').value = settings.address || 'New Delhi, India';
  if (el('siteFooterDesc')) el('siteFooterDesc').value = settings.footerDesc || '';
  if (el('socialInstagram')) el('socialInstagram').value = settings.instagram || '';
  if (el('socialYoutube')) el('socialYoutube').value = settings.youtube || '';
  if (el('socialFacebook')) el('socialFacebook').value = settings.facebook || '';
  if (el('socialTwitter')) el('socialTwitter').value = settings.twitter || '';
  if (el('maintenanceMode')) el('maintenanceMode').checked = settings.maintenance || false;
  if (el('allowRegistration')) el('allowRegistration').checked = settings.allowRegistration !== false;
}

function saveSiteSettings(e) {
  e.preventDefault();
  var settings = {
    siteName: document.getElementById('siteName').value.trim(),
    tagline: document.getElementById('siteTagline').value.trim(),
    email: document.getElementById('siteEmail').value.trim(),
    phone: document.getElementById('sitePhone').value.trim(),
    address: document.getElementById('siteAddress').value.trim(),
    footerDesc: document.getElementById('siteFooterDesc').value.trim(),
    instagram: document.getElementById('socialInstagram').value.trim(),
    youtube: document.getElementById('socialYoutube').value.trim(),
    facebook: document.getElementById('socialFacebook').value.trim(),
    twitter: document.getElementById('socialTwitter').value.trim(),
    maintenance: document.getElementById('maintenanceMode').checked,
    allowRegistration: document.getElementById('allowRegistration').checked
  };
  setData('settings', [settings]);
  showToast('Settings saved', 'success');
}

function changeAdminPassword(e) {
  e.preventDefault();
  var admin = JSON.parse(localStorage.getItem('richer_admin'));
  var current = document.getElementById('currentPassword').value;
  var newPass = document.getElementById('newPassword').value;

  if (admin.password !== current) {
    showToast('Current password is incorrect', 'error');
    return;
  }
  if (newPass.length < 6) {
    showToast('New password must be at least 6 characters', 'error');
    return;
  }

  admin.password = newPass;
  localStorage.setItem('richer_admin', JSON.stringify(admin));
  document.getElementById('passwordForm').reset();
  showToast('Password updated successfully', 'success');
}

function toggleMaintenance() {
  var isOn = document.getElementById('maintenanceMode').checked;
  var settings = getData('settings')[0] || {};
  settings.maintenance = isOn;
  setData('settings', [settings]);
  showToast(isOn ? 'Maintenance mode enabled' : 'Maintenance mode disabled', 'success');
}

function toggleRegistration() {
  var isOn = document.getElementById('allowRegistration').checked;
  var settings = getData('settings')[0] || {};
  settings.allowRegistration = isOn;
  setData('settings', [settings]);
  showToast(isOn ? 'Registration enabled' : 'Registration disabled', 'success');
}

function resetAllData() {
  showConfirm('Reset All Data', 'This will permanently delete all courses, users, orders, coupons, blog posts, and settings. This cannot be undone.').then(function(ok) {
    if (ok) {
      ['courses', 'users', 'orders', 'coupons', 'blogPosts', 'settings'].forEach(function(k) {
        localStorage.removeItem('richer_' + k);
      });
      showToast('All data has been reset', 'success');
      setTimeout(function() { window.location.reload(); }, 1000);
    }
  });
}

// ============ DASHBOARD ============
function loadDashboard() {
  var courses = getData('courses');
  var users = getData('users');
  var orders = getData('orders');

  // Stats
  var totalCoursesEl = document.getElementById('totalCourses');
  var totalUsersEl = document.getElementById('totalUsers');
  var totalOrdersEl = document.getElementById('totalOrders');
  var totalRevenueEl = document.getElementById('totalRevenue');

  if (totalCoursesEl) totalCoursesEl.textContent = courses.length;
  if (totalUsersEl) totalUsersEl.textContent = users.length;
  if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
  if (totalRevenueEl) {
    var revenue = orders.reduce(function(sum, o) { return sum + (o.status === 'completed' ? (o.amount || 0) : 0); }, 0);
    totalRevenueEl.textContent = '₹' + revenue.toLocaleString('en-IN');
  }

  // Recent Courses
  var recentCoursesEl = document.getElementById('recentCourses');
  if (recentCoursesEl && courses.length > 0) {
    var recent = courses.slice(-5).reverse();
    recentCoursesEl.innerHTML = recent.map(function(c) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">' +
        '<img src="' + sanitize(c.image) + '" style="width:40px;height:40px;border-radius:8px;object-fit:cover" onerror="this.src=\'https://picsum.photos/40/40\'">' +
        '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sanitize(c.title) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-light)">' + sanitize(c.instructor) + ' &bull; ₹' + c.price + '</div></div>' +
        '<span class="badge ' + (c.status === 'published' ? 'badge-success' : 'badge-warning') + '">' + sanitize(c.status) + '</span>' +
      '</div>';
    }).join('');
  }

  // Recent Orders
  var recentOrdersEl = document.getElementById('recentOrders');
  if (recentOrdersEl && orders.length > 0) {
    var recentOrders = orders.slice(-5).reverse();
    recentOrdersEl.innerHTML = recentOrders.map(function(o) {
      var statusClass = o.status === 'completed' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : 'badge-danger';
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">' +
        '<div style="flex:1"><div style="font-weight:600;font-size:0.85rem">' + sanitize(o.customerName || 'Guest') + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-light)">' + sanitize(o.courseName || '-') + '</div></div>' +
        '<div style="text-align:right"><div style="font-weight:600;font-size:0.85rem">₹' + (o.amount || 0) + '</div>' +
        '<span class="badge ' + statusClass + '">' + sanitize(o.status) + '</span></div>' +
      '</div>';
    }).join('');
  }
}
