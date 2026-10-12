const API_BASE = window.SUPER_ADMIN_API_BASE || 'http://localhost:4000/api';
const state = { overview: null, manufacturers: [], products: [], complaints: [], activity: [], productMode: '', productStatus: '', search: '', action: null, liveTimer: null, lastUpdate: null };
const $ = (selector) => document.querySelector(selector);

function getToken() { return localStorage.getItem('accessToken') || localStorage.getItem('vrealAccessToken') || ''; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function setStatus(message = '', error = false) { const node = $('#statusMessage'); node.textContent = message; node.classList.toggle('error', error); }
function formatDate(value) { return value ? new Date(value).toLocaleDateString() : 'Not available'; }
function badge(status) { const normalized = String(status || 'active').toLowerCase(); const cls = normalized.includes('disable') ? 'disabled' : normalized.includes('review') ? 'review' : normalized.includes('premium') ? 'premium' : 'active'; return `<span class="badge ${cls}">${escapeHtml(status || 'Active')}</span>`; }
function updateAdminContext() { const now = new Date(); const date = $('#adminDate'); const time = $('#adminTime'); if (date) date.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); if (time) time.textContent = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }); }
function detectAdminLocation() { const location = $('#adminLocation'); if (!location || !navigator.geolocation) return; location.textContent = 'Location unavailable'; navigator.geolocation.getCurrentPosition(() => { location.textContent = 'Location detected'; }, () => { location.textContent = 'Location permission denied'; }, { maximumAge: 300000, timeout: 8000 }); }

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) throw new Error(data.error || 'Your Super Admin session is not authorized.');
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request failed.');
  return data;
}

function showView(view) { document.querySelectorAll('.dashboard-section').forEach((section) => { const active = section.dataset.view === view; section.hidden = !active; section.classList.toggle('active', active); }); document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.section === view)); }
function summaryCard(key, label, value, icon, target, filter = '') { return `<button class="summary-card" data-section-link="${target}" data-summary-filter="${filter}" type="button"><i class="${icon}"></i><strong>${value}</strong><span>${label}</span></button>`; }

function renderOverview() {
  const data = state.overview || {};
  $('#summaryGrid').innerHTML = [
    summaryCard('manufacturers', 'Total manufacturers', data.manufacturers || 0, 'fa-solid fa-building', 'manufacturers'),
    summaryCard('products', 'Total products', data.products || 0, 'fa-solid fa-boxes-stacked', 'products'),
    summaryCard('premiumProducts', 'Premium products', data.premiumProducts || 0, 'fa-solid fa-gem', 'products', 'valued'),
    summaryCard('regularProducts', 'Regular products', data.regularProducts || 0, 'fa-solid fa-box', 'products', 'regular'),
    summaryCard('verifications', 'Verifications', data.verifications || 0, 'fa-solid fa-shield-halved', 'products'),
    summaryCard('productsUnderReview', 'Products under review', data.productsUnderReview || 0, 'fa-solid fa-triangle-exclamation', 'products'),
    summaryCard('reportsToday', 'Reports received today', data.reportsToday || 0, 'fa-solid fa-flag', 'complaints')
  ].join('');
  $('#overviewAttention').innerHTML = data.productsUnderReview ? `${data.productsUnderReview} product(s) currently have an informational review signal. <button class="text-button" data-section-link="complaints">Open complaints</button>` : 'No products currently meet the review signal threshold.';
  const queue = [...state.complaints].sort((a, b) => b.reportsToday - a.reportsToday).slice(0, 5);
  $('#reviewQueue').innerHTML = queue.length ? queue.map((item) => `<button class="signal-item" data-product-id="${item.productId}" type="button"><span><strong>${escapeHtml(item.productName)}</strong><small>${escapeHtml(item.manufacturerName)} · ${item.verifications} verifications</small></span><b>${item.reportsToday} reports</b></button>`).join('') : '<div class="empty-state">No products are currently in the review queue.</div>';
  const activity = state.activity.length ? state.activity : [...state.products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((item) => ({ productName: item.name, manufacturerName: item.manufacturer?.name || 'Unknown manufacturer', action: 'product_observed', reason: `${item.verificationCount} verification checks`, createdAt: item.createdAt, productId: item.id }));
  $('#recentActivity').innerHTML = activity.length ? activity.map((item) => item.productId ? `<button class="signal-item" data-product-id="${item.productId}" type="button"><span><strong>${escapeHtml(item.action.replaceAll('_', ' '))}</strong><small>${escapeHtml(item.productName || item.manufacturerName)} · ${escapeHtml(item.reason || '')}</small></span><b>${formatDate(item.createdAt)}</b></button>` : `<div class="signal-item signal-item--static"><span><strong>${escapeHtml(item.action.replaceAll('_', ' '))}</strong><small>${escapeHtml(item.productName || item.manufacturerName || 'Platform')}</small></span><b>${formatDate(item.createdAt)}</b></div>`).join('') : '<div class="empty-state">No admin activity is available yet.</div>';
}
function renderManufacturers() {
  const items = state.manufacturers;
  $('#manufacturersTable').innerHTML = items.length ? items.map((item) => `<tr data-manufacturer-id="${item.id}"><td><span class="table-title">${escapeHtml(item.name)}</span><span class="table-subtitle">ID ${item.id}</span></td><td>${escapeHtml(item.email)}</td><td>${item.totalProducts}</td><td>${item.premiumProducts} / ${item.regularProducts}</td><td>${badge(item.accountStatus)}</td><td>${formatDate(item.registrationDate)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-state">No manufacturers found.</td></tr>';
}
function renderProducts() {
  const items = state.products;
  $('#productsTable').innerHTML = items.length ? items.map((item) => `<tr data-product-id="${item.id}"><td><span class="table-title">${escapeHtml(item.name)}</span><span class="table-subtitle">${escapeHtml(item.sku || 'No SKU')}</span></td><td>${escapeHtml(item.manufacturer?.name || 'Unknown')}<span class="table-subtitle">${escapeHtml(item.manufacturer?.email || '')}</span></td><td>${item.verificationMode === 'valued' ? badge('Premium') : badge('Regular')}</td><td>${badge(item.status)}</td><td>${item.verificationCount}</td><td>${item.reportCount}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-state">No products found.</td></tr>';
}
function renderComplaints() {
  const items = state.complaints;
  $('#complaintsTable').innerHTML = items.length ? items.map((item) => `<tr data-product-id="${item.productId}"><td>${escapeHtml(item.productName)}<span class="table-subtitle">${item.productType === 'valued' ? 'Premium' : 'Regular'}</span></td><td>${escapeHtml(item.manufacturerName)}</td><td><strong>${item.reportsToday}</strong></td><td>${item.verifications}</td><td>${badge('Review signal')}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">No products have reached five reports today.</td></tr>';
}

function renderActionSelectors() {
  const productSelect = $('#actionProductSelect');
  const manufacturerSelect = $('#actionManufacturerSelect');
  if (productSelect) productSelect.innerHTML = '<option value="">Select product</option>' + state.products.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} · ${escapeHtml(item.manufacturer?.name || 'Unknown')}</option>`).join('');
  if (manufacturerSelect) manufacturerSelect.innerHTML = '<option value="">Select manufacturer</option>' + state.manufacturers.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} · ${escapeHtml(item.email)}</option>`).join('');
}

async function loadData() {
  setStatus('Refreshing operational data...');
  const query = encodeURIComponent(state.search.trim());
  const [overview, manufacturers, products, complaints, activity] = await Promise.all([
    api('/super-admin/overview'), api(`/super-admin/manufacturers?search=${query}`), api(`/super-admin/products?search=${query}&mode=${state.productMode}&status=${state.productStatus}`), api('/super-admin/complaints'), api('/super-admin/activity?limit=8')
  ]);
  state.overview = overview.overview; state.manufacturers = manufacturers.items || []; state.products = products.items || []; state.complaints = complaints.items || []; state.activity = activity.items || [];
  renderOverview(); renderManufacturers(); renderProducts(); renderComplaints(); renderActionSelectors(); state.lastUpdate = new Date(); const liveStatus = $('#liveUpdateStatus'); if (liveStatus) liveStatus.textContent = `Live updates · ${state.lastUpdate.toLocaleTimeString()}`; setStatus('');
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function actionStatus(message, error = false) {
  const node = $('#actionsStatus');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('error', error);
}

function selectedActionProduct() {
  return state.products.find((item) => String(item.id) === $('#actionProductSelect')?.value);
}

function selectedActionManufacturer() {
  return state.manufacturers.find((item) => String(item.id) === $('#actionManufacturerSelect')?.value);
}

function handleControl(control) {
  const product = selectedActionProduct();
  const manufacturer = selectedActionManufacturer();
  if (control.startsWith('product-') && !product) return actionStatus('Select a product first.', true);
  if (control.startsWith('manufacturer-') && !manufacturer) return actionStatus('Select a manufacturer first.', true);
  if (control === 'product-suspend') return openAction('product', product.id, 'status', 'disabled');
  if (control === 'manufacturer-suspend') return openAction('manufacturer', manufacturer.id, 'status', 'disabled');
  if (control === 'product-history') return openProduct(product.id);
  if (control === 'product-edit') return openProduct(product.id);
  if (control === 'product-delete') return openAction('product', product.id, 'delete');
  if (control === 'manufacturer-profile') return openManufacturer(manufacturer.id);
  if (control === 'product-reactivate') return openAction('product', product.id, 'status', 'active');
  if (control === 'manufacturer-approve') return openAction('manufacturer', manufacturer.id, 'status', 'active');
  if (control === 'manufacturer-subscription' || control === 'subscription-management' || control === 'security' || control === 'notifications') {
    return actionStatus(`${control.replaceAll('-', ' ')} is queued for controlled rollout. No automatic suspension was performed.`);
  }
  if (control === 'export-products') return downloadCsv('verify-products.csv', [['Product', 'Manufacturer', 'Type', 'Status', 'Verifications', 'Reports'], ...state.products.map((item) => [item.name, item.manufacturer?.name, item.verificationMode, item.status, item.verificationCount, item.reportCount])]);
  if (control === 'export-manufacturers') return downloadCsv('verify-manufacturers.csv', [['Manufacturer', 'Email', 'Products', 'Premium', 'Regular', 'Status'], ...state.manufacturers.map((item) => [item.name, item.email, item.totalProducts, item.premiumProducts, item.regularProducts, item.accountStatus])]);
}

function startLiveUpdates() {
  clearInterval(state.liveTimer);
  state.liveTimer = setInterval(() => loadData().catch((error) => setStatus(error.message, true)), 15000);
}

function detailLine(label, value) { return `<div class="detail-line"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`; }
async function openManufacturer(id) {
  const manufacturer = state.manufacturers.find((item) => item.id === Number(id));
  if (!manufacturer) return;
  const products = state.products.filter((item) => item.manufacturer?.id === manufacturer.id);
  const productList = products.length ? `<div class="detail-content">${products.map((product) => detailLine(product.name, `${product.verificationMode === 'valued' ? 'Premium' : 'Regular'} | ${product.verificationCount} verifications | ${product.reportCount} reports`)).join('')}</div>` : '<p>No products are currently available in the loaded result set.</p>';
  $('#detailContent').innerHTML = `<span class="eyebrow">Manufacturer account</span><h2>${escapeHtml(manufacturer.name)}</h2><p>${escapeHtml(manufacturer.email)}</p><div class="detail-content">${detailLine('Account status', manufacturer.accountStatus)}${detailLine('Registered', formatDate(manufacturer.registrationDate))}${detailLine('Total products', manufacturer.totalProducts)}${detailLine('Premium / Regular', `${manufacturer.premiumProducts} / ${manufacturer.regularProducts}`)}</div><h3>Products</h3>${productList}<div class="dialog-actions"><button class="button danger" data-action="manufacturer" data-id="${manufacturer.id}" type="button">Deactivate account</button></div>`;
  $('#detailDialog').showModal();
}
async function openProduct(id) {
  const response = await api(`/super-admin/investigations/${id}`); const item = response.item;
  $('#detailContent').innerHTML = `<span class="eyebrow">Investigation</span><h2>${escapeHtml(item.product.name)}</h2><p>${badge(item.product.status)} ${item.product.reportCount} report(s), ${item.product.verificationCount} verification(s)</p><div class="detail-tabs"><button class="detail-tab active" data-tab="product" type="button">Product info</button><button class="detail-tab" data-tab="manufacturer" type="button">Manufacturer info</button><button class="detail-tab" data-tab="actions" type="button">Actions</button></div><div class="detail-content" id="investigationTab">${productTab(item)}</div>`;
  $('#detailDialog').showModal();
  $('#detailContent').querySelectorAll('.detail-tab').forEach((button) => button.addEventListener('click', () => { $('#detailContent').querySelectorAll('.detail-tab').forEach((tab) => tab.classList.remove('active')); button.classList.add('active'); $('#investigationTab').innerHTML = button.dataset.tab === 'product' ? productTab(item) : button.dataset.tab === 'manufacturer' ? manufacturerTab(item) : actionsTab(item); }));
}
function productTab(item) { return detailLine('Category', item.product.category || 'Not set') + detailLine('Type', item.product.verificationMode === 'valued' ? 'Premium' : 'Regular') + detailLine('Reports today', item.product.reportsToday) + detailLine('Description', item.product.description || 'Not set'); }
function manufacturerTab(item) { return detailLine('Manufacturer', item.manufacturer.name) + detailLine('Contact', item.manufacturer.email) + detailLine('Account status', item.manufacturer.status); }
function actionsTab(item) { return `<p>Actions are manual and auditable. Consumer-facing status remains neutral: “Temporarily under review.”</p><div class="dialog-actions"><button class="button danger" data-action="product" data-id="${item.product.id}" type="button">Deactivate product</button><button class="button danger" data-action="manufacturer" data-id="${item.manufacturer.id}" type="button">Deactivate manufacturer</button></div>`; }
function openAction(type, id, operation = 'status', status = 'disabled') { state.action = { type, id, operation, status }; const isDelete = operation === 'delete'; const isActive = status === 'active'; $('#actionTitle').textContent = isDelete ? 'Delete product' : `${isActive ? 'Reactivate' : 'Suspend'} ${type}`; $('#actionDescription').textContent = isDelete ? 'This permanently removes the product and its associated records.' : isActive ? 'This restores the selected record to active status.' : 'This disables the selected record. Consumer-facing status remains neutral.'; $('#actionReason').value = ''; $('#actionDialog').showModal(); }
async function submitAction(event) { event.preventDefault(); if (event.submitter?.value === 'cancel') { $('#actionDialog').close(); return; } const { type, id, operation, status } = state.action || {}; const reason = $('#actionReason').value.trim(); if (!reason) return; const base = type === 'product' ? `/super-admin/products/${id}` : `/super-admin/manufacturers/${id}`; const path = operation === 'delete' ? `${base}/delete` : operation === 'status' ? `${base}/status` : `${base}/deactivate`; const body = operation === 'status' ? { reason, status } : { reason }; try { await api(path, { method: 'POST', body: JSON.stringify(body) }); $('#actionDialog').close(); $('#detailDialog').close(); setStatus('Action recorded. Dashboards are updating.', false); await loadData(); } catch (error) { setStatus(error.message, true); } }

async function startSession() {
  const token = getToken(); if (!token) return;
  try { const result = await api('/auth/me'); if (result.user.role !== 'super_admin') throw new Error('This area is restricted to Super Admin accounts.'); $('#sessionUser').textContent = result.user.email; $('#loginView').hidden = true; $('#dashboardView').hidden = false; await loadData(); startLiveUpdates(); } catch (error) { localStorage.removeItem('accessToken'); localStorage.removeItem('vrealAccessToken'); $('#loginMessage').textContent = error.message; }
}
$('#loginForm').addEventListener('submit', async (event) => { event.preventDefault(); $('#loginMessage').textContent = 'Signing in...'; try { const response = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('#loginEmail').value, password: $('#loginPassword').value }) }); const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.error || `Login failed (${response.status}).`); if (result.user?.role !== 'super_admin') throw new Error(`This account has the "${result.user?.role || 'unknown'}" role. A Super Admin account is required.`); localStorage.setItem('accessToken', result.tokens.accessToken); if (result.tokens.refreshToken) localStorage.setItem('refreshToken', result.tokens.refreshToken); await startSession(); } catch (error) { $('#loginMessage').textContent = error.message; } });
$('#logoutButton').addEventListener('click', () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); location.reload(); });
$('#refreshButton').addEventListener('click', () => loadData().catch((error) => setStatus(error.message, true)));
$('#globalSearch').addEventListener('input', (event) => { clearTimeout(window.__searchTimer); window.__searchTimer = setTimeout(() => loadData().catch((error) => setStatus(error.message, true)), 250); state.search = event.target.value; });
document.addEventListener('click', (event) => { const section = event.target.closest('[data-section-link]'); if (section) { showView(section.dataset.sectionLink); if (section.dataset.summaryFilter !== undefined) { state.productMode = section.dataset.summaryFilter; state.productStatus = ''; loadData().catch((error) => setStatus(error.message, true)); } } const nav = event.target.closest('.nav-item'); if (nav) { showView(nav.dataset.section); const focusTarget = nav.dataset.focus ? document.getElementById(nav.dataset.focus) : null; focusTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } const control = event.target.closest('[data-control]'); if (control) handleControl(control.dataset.control); const manufacturerRow = event.target.closest('[data-manufacturer-id]'); if (manufacturerRow) openManufacturer(manufacturerRow.dataset.manufacturerId); const productRow = event.target.closest('[data-product-id]'); if (productRow) openProduct(productRow.dataset.productId); const action = event.target.closest('[data-action]'); if (action) openAction(action.dataset.action, action.dataset.id); const filter = event.target.closest('.filter'); if (filter) { document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active')); filter.classList.add('active'); state.productMode = filter.dataset.mode || ''; state.productStatus = filter.dataset.status || ''; showView('products'); loadData().catch((error) => setStatus(error.message, true)); } if (event.target.matches('[data-close-dialog]')) event.target.closest('dialog')?.close(); });
$('#actionForm').addEventListener('submit', submitAction);
updateAdminContext();
setInterval(updateAdminContext, 1000);
detectAdminLocation();
document.addEventListener('click', (event) => { const copyButton = event.target.closest('[data-copy-target]'); if (!copyButton) return; const target = document.getElementById(copyButton.dataset.copyTarget); if (target) navigator.clipboard?.writeText(target.textContent).then(() => setStatus('Copied to clipboard.')).catch(() => setStatus('Unable to copy this value.', true)); });
startSession();
