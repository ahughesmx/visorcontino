// Initialize Lucide icons safely
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
} else {
    console.warn('Lucide icons library not loaded');
}

// DEBUG: Verify script is loading
console.log('=== APP.JS LOADED ===');

const API_BASE = '/api';

// DOM Elements
const leadsBody = document.getElementById('leads-body');
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statRate = document.getElementById('stat-rate');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const refreshBtn = document.getElementById('refresh-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const closeModal = document.getElementById('close-modal');
const navDashboard = document.getElementById('nav-dashboard');
const navAnalytics = document.getElementById('nav-analytics');
const navSettings = document.getElementById('nav-settings');
const navLogout = document.getElementById('nav-logout');
const userDisplayName = document.getElementById('user-display-name');
const userDisplayRole = document.getElementById('user-display-role');
const userAvatarInitials = document.getElementById('user-avatar-initials');
const analyticsSection = document.getElementById('analytics-section');
const settingsSection = document.getElementById('settings-section');
const chartContainer = document.getElementById('chart-container');
const statsGrid = document.querySelector('.stats-grid');
const limitFilter = document.getElementById('limit-filter');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const paginationInfo = document.getElementById('pagination-info');
const pageNumbersContainer = document.getElementById('page-numbers');
const tableHeaders = document.querySelectorAll('th.sortable');

let currentPage = 1;
let currentLimit = 20;
let totalRecords = 0;
let currentSortBy = 'creado_en';
let currentSortOrder = 'DESC';

let currentUser = null;
let currentUsersList = []; // Store fetched users for lookup
let availableAgents = []; // Global for agents dropdown

async function fetchActiveAgents() {
    try {
        const res = await fetch(`${API_BASE}/users/agents`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            availableAgents = data.map(u => u.username);
        }
    } catch (err) {
        console.error('Error fetching agents:', err);
    }
}

// Functions
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (!data.authenticated) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = data.user;
        updateUserUI();
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = 'login.html';
    }
}

function updateUserUI() {
    if (currentUser) {
        userDisplayName.textContent = currentUser.fullName || currentUser.username;
        userDisplayRole.textContent = currentUser.role === 'admin' ? 'Administrador' : 'Agente';

        // Users tab removed

        // Get initials
        const nameParts = (currentUser.fullName || currentUser.username).split(' ');
        const initials = nameParts.length > 1
            ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
            : nameParts[0].substring(0, 2).toUpperCase();
        userAvatarInitials.textContent = initials;

        if (currentUser.role === 'agent') {
            navSettings.style.display = 'none';
        } else {
            navSettings.style.display = 'flex';
        }
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}
async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        statTotal.textContent = data.total;
        statPending.textContent = data.pending;
        statRate.textContent = `${data.responseRate}%`;

        // Render Advanced Charts if in Analytics view
        if (navAnalytics.classList.contains('active')) {
            renderAgentChart(data.byAgent);
            renderStatusChart(data.byStatus);
            renderTypeChart(data.byType);
            renderOriginChart(data.byOrigin);
        }
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

// Chart Rendering Functions

function renderAgentChart(data) {
    const container = document.getElementById('chart-agents');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray">No hay datos de agentes.</p>';
        return;
    }
    const max = Math.max(...data.map(d => parseInt(d.count)));

    container.innerHTML = data.map(d => {
        const width = (parseInt(d.count) / max) * 100;
        return `
        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.9rem;">
            <div style="width: 100px; text-align:right; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.agente_asignado}</div>
            <div style="flex:1; background: #1e293b; border-radius:4px; height:24px; position:relative; overflow:hidden;">
                <div style="width:${width}%; background:var(--accent); height:100%; border-radius:4px;"></div>
            </div>
            <div style="width: 30px; font-weight:bold; color:var(--text-primary);">${d.count}</div>
        </div>
        `;
    }).join('');
}

function renderStatusChart(data) {
    const container = document.getElementById('chart-status');
    const order = ['Pendiente', 'Proceso', 'Completada'];
    const map = {};
    data.forEach(d => map[d.status] = parseInt(d.count));

    const max = Math.max(...Object.values(map));

    container.innerHTML = order.map(status => {
        const count = map[status] || 0;
        const width = max > 0 ? (count / max) * 100 : 0;
        let color = 'var(--text-secondary)';
        if (status === 'Pendiente') color = 'var(--border)';
        if (status === 'Proceso') color = 'var(--warning)';
        if (status === 'Completada') color = 'var(--success)';

        return `
        <div style="margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; font-size:0.9rem;">
                <span>${status}</span>
                <span style="font-weight:bold;">${count}</span>
            </div>
            <div style="width:100%; background:#1e293b; border-radius:4px; height:8px;">
                <div style="width:${width}%; background:${color}; height:100%; border-radius:4px; transition: width 0.5s ease;"></div>
            </div>
        </div>
        `;
    }).join('');
}

function renderTypeChart(data) {
    // Pie Chart Logic using Conic Gradient
    const container = document.getElementById('chart-types');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray">No hay datos de tipos.</p>';
        return;
    }

    const total = data.reduce((sum, d) => sum + parseInt(d.count), 0);
    let currentDeg = 0;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const gradientParts = data.map((d, i) => {
        const percent = (parseInt(d.count) / total) * 360;
        const color = colors[i % colors.length];
        const segment = `${color} ${currentDeg}deg ${currentDeg + percent}deg`;
        currentDeg += percent;
        return segment;
    });

    // Legend
    const legend = data.map((d, i) => `
        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; margin-bottom:0.25rem;">
            <div style="width:12px; height:12px; background:${colors[i % colors.length]}; border-radius:2px;"></div>
            <span>${d.tipo_solicitud} (${d.count})</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="width:150px; height:150px; border-radius:50%; background: conic-gradient(${gradientParts.join(', ')}); position:relative; box-shadow: 0 0 20px rgba(0,0,0,0.2);">
            <div style="position:absolute; inset:25px; background:var(--card-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column;">
                <span style="font-size:1.5rem; font-weight:bold;">${total}</span>
                <span style="font-size:0.7rem; color:var(--text-secondary);">Total</span>
            </div>
        </div>
        <div style="display:flex; flex-direction:column; justify-content:center;">
            ${legend}
        </div>
    `;
}

function renderOriginChart(data) {
    const container = document.getElementById('chart-origins');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray">No hay datos de origen.</p>';
        return;
    }

    // Process Data: Group items with count > 1, others into "Otros"
    const groupedData = [];
    const othersList = []; // Store the detailed list of others
    let othersCount = 0;

    data.forEach(d => {
        const count = parseInt(d.count);
        const origin = d.lead_origen ? d.lead_origen.trim() : 'Sin origen';

        // Skip empty strings if any found in DB as effectively "Sin origen" or just ignore
        if (!origin) return;

        if (count > 1) {
            groupedData.push({ label: origin, count: count });
        } else {
            othersCount += count;
            othersList.push(origin);
        }
    });

    if (othersCount > 0) {
        groupedData.push({
            label: 'Otros (Unicos)',
            count: othersCount,
            isOthers: true,
            othersList: othersList // Attach list for click handler
        });
    }

    // Sort by count desc
    groupedData.sort((a, b) => b.count - a.count);

    if (groupedData.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray">No hay datos suficientes.</p>';
        return;
    }

    const max = Math.max(...groupedData.map(d => d.count));

    container.innerHTML = groupedData.map((d, i) => {
        const width = max > 0 ? (d.count / max) * 100 : 0;
        // Generate a color for repeated items, gray for others
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        const color = d.isOthers ? '#64748b' : colors[i % colors.length];

        // Add click handler only for "Others"
        const onClickAttr = d.isOthers ? `onclick="openOthersModal(this.dataset.list)"` : '';
        const cursorStyle = d.isOthers ? 'cursor: pointer; transition: opacity 0.2s;' : '';
        const dataList = d.isOthers ? `data-list='${JSON.stringify(d.othersList).replace(/'/g, "&#39;")}'` : '';
        const hoverClass = d.isOthers ? 'class="hover-opacity"' : '';

        return `
        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; ${cursorStyle}" ${onClickAttr} ${dataList} ${hoverClass}>
            <div style="width: 150px; text-align:right; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${d.label}">${d.label}</div>
            <div style="flex:1; background: #1e293b; border-radius:4px; height:24px; position:relative; overflow:hidden;">
                <div style="width:${width}%; background:${color}; height:100%; border-radius:4px;"></div>
            </div>
            <div style="width: 30px; font-weight:bold; color:var(--text-primary);">${d.count}</div>
        </div>
        `;
    }).join('');
}

// Others Modal Logic
const othersModalOverlay = document.getElementById('others-modal-overlay');
const closeOthersModalBtn = document.getElementById('close-others-modal');
const othersListContainer = document.getElementById('others-list');

if (closeOthersModalBtn) {
    closeOthersModalBtn.onclick = () => othersModalOverlay.style.display = 'none';
}

// Make openOthersModal available globally for inline onclick
window.openOthersModal = function (listJson) {
    try {
        const list = JSON.parse(listJson);
        othersListContainer.innerHTML = '';

        if (list.length === 0) {
            othersListContainer.innerHTML = '<p class="text-sm text-gray">No hay orígenes únicos.</p>';
        } else {
            list.forEach(origin => {
                const item = document.createElement('div');
                item.style.padding = '0.5rem';
                item.style.borderBottom = '1px solid var(--border)';
                item.style.fontSize = '0.9rem';
                item.textContent = origin;
                othersListContainer.appendChild(item);
            });
        }

        othersModalOverlay.style.display = 'flex';
    } catch (e) {
        console.error('Error parsing others list:', e);
    }
};

async function fetchLeads() {
    try {
        const search = searchInput.value;
        const type = typeFilter.value;
        const offset = (currentPage - 1) * currentLimit;

        const url = new URL(`${window.location.origin}${API_BASE}/leads`);
        if (search) url.searchParams.append('search', search);
        if (type) url.searchParams.append('type', type);
        url.searchParams.append('limit', currentLimit);
        url.searchParams.append('offset', offset);
        url.searchParams.append('sortBy', currentSortBy);
        url.searchParams.append('sortOrder', currentSortOrder);

        const res = await fetch(url);
        const result = await res.json();

        if (!res.ok) {
            console.error('API Error details:', result);
            alert(`Error del servidor: ${result.details || result.error}`);
            return;
        }

        totalRecords = result.total;
        renderLeads(result.data);
        updatePaginationUI();
        updateHeaderUI();
    } catch (err) {
        console.error('Error fetching leads:', err);
    }
}

function updatePaginationUI() {
    const totalPages = Math.ceil(totalRecords / currentLimit);
    const start = (currentPage - 1) * currentLimit + 1;
    const end = Math.min(currentPage * currentLimit, totalRecords);

    paginationInfo.textContent = `Mostrando ${totalRecords > 0 ? start : 0} a ${end} de ${totalRecords} registros`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    // Generate page numbers
    pageNumbersContainer.innerHTML = '';

    // Simple pagination logic: show current, 2 before, 2 after
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
        addPageButton(1);
        if (startPage > 2) {
            const span = document.createElement('span');
            span.textContent = '...';
            span.style.padding = '0.5rem';
            pageNumbersContainer.appendChild(span);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        addPageButton(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const span = document.createElement('span');
            span.textContent = '...';
            span.style.padding = '0.5rem';
            pageNumbersContainer.appendChild(span);
        }
        addPageButton(totalPages);
    }
}

function addPageButton(page) {
    const btn = document.createElement('button');
    btn.className = `page-num ${page === currentPage ? 'active' : ''}`;
    btn.textContent = page;
    btn.onclick = () => {
        currentPage = page;
        fetchLeads();
    };
    pageNumbersContainer.appendChild(btn);
}

function getBadgeClass(type) {
    if (type.includes('Compra')) return 'badge-compra';
    if (type.includes('Renta')) return 'badge-renta';
    if (type.includes('Falla') || type.includes('soporte')) return 'badge-falla';
    return '';
}

function formatType(type) {
    if (type.includes('entrega de tinta y tóner')) return 'Consumible por contrato';
    if (type.includes('soporte técnico')) return 'Soporte técnico';
    return type.replace('📋 *Resumen de Solicitud de ', '').replace('📋 *Resumen de ', '').replace('*', '').replace(':', '').trim();
}

function renderLeads(leads) {
    leadsBody.innerHTML = '';
    leads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.className = 'animate-in';
        tr.onclick = () => openDetailModal(lead.id_registro);

        const date = new Date(lead.creado_en).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = `status-${lead.status ? lead.status.toLowerCase().replace(' ', '-') : 'pendiente'}`;

        tr.innerHTML = `
            <td>
                <span class="priority-dot priority-${lead.prioridad || 2}" title="Prioridad ${lead.prioridad || 2}"></span>
                #${lead.id_registro}
            </td>
            <td>
                <span class="badge ${getBadgeClass(lead.tipo_solicitud)}">${formatType(lead.tipo_solicitud)}</span>
                <br>
                <span class="status-badge ${statusClass}">${lead.status || 'Pendiente'}</span>
            </td>
            <td>${lead.nombre_contacto || 'N/A'}</td>
            <td>${lead.razon_social || 'Personal'}</td>
            <td>${date}</td>
            <td>
                <button class="nav-item" style="padding: 0.3rem 0.6rem; margin:0;" onclick="event.stopPropagation(); openDetailModal(${lead.id_registro})">
                    <i data-lucide="eye"></i>
                </button>
            </td>
        `;
        leadsBody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function openDetailModal(id) {
    try {
        const res = await fetch(`${API_BASE}/leads/${id}`);
        const lead = await res.json();

        modalBody.innerHTML = `
            <h2 style="margin-bottom: 0.5rem;">Detalle de Solicitud #${lead.id_registro}</h2>
            <div class="badge ${getBadgeClass(lead.tipo_solicitud)}" style="display:inline-block; margin-bottom: 2rem;">
                ${formatType(lead.tipo_solicitud)}
            </div>

            <div class="detail-grid">
                <div class="detail-item">
                    <label>Contacto</label>
                    <p style="font-weight:600">${lead.nombre_contacto || 'N/A'}</p>
                    <p style="color: var(--text-muted)">${lead.telefono || ''}</p>
                    <p style="color: var(--text-muted)">${lead.correo || ''}</p>
                </div>
                ${lead.lead_origen ? `
                <div class="detail-item">
                    <label>Origen del Lead</label>
                    <p style="font-weight:500">${lead.lead_origen}</p>
                </div>` : ''}
                <div class="detail-item">
                    <label>Empresa / Razón Social</label>
                    <p>${lead.razon_social || 'N/A'}</p>
                    <p style="color: var(--text-muted)">${lead.ciudad || ''}</p>
                </div>

                <div class="detail-item" style="grid-column: span 2; border-top: 1px solid var(--border); padding-top: 1rem;">
                    <label>Gestión de Solicitud</label>
                    <div style="display:flex; gap:1rem; align-items:center; flex-wrap: wrap;">
                        <select id="edit-status" class="filter-select">
                            <option value="Pendiente" ${lead.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Proceso" ${lead.status === 'Proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="Completada" ${lead.status === 'Completada' ? 'selected' : ''}>Completada</option>
                        </select>
                        <select id="edit-priority" class="filter-select">
                            <option value="1" ${lead.prioridad == 1 ? 'selected' : ''}>🔴 Alta</option>
                            <option value="2" ${lead.prioridad == 2 ? 'selected' : ''}>🟡 Media</option>
                            <option value="3" ${lead.prioridad == 3 ? 'selected' : ''}>🟢 Baja</option>
                        </select>
                        <select id="edit-agent" class="filter-select">
                            <option value="">Sin asignar</option>
                            ${availableAgents.map(name => {
            return `<option value="${name}" ${lead.agente_asignado === name ? 'selected' : ''}>${name}</option>`;
        }).join('')}
                        </select>
                        <button class="btn-update" onclick="updateLead(${lead.id_registro})">Guardar Cambios</button>
                    </div>
                </div>

                <div class="detail-item" style="grid-column: span 2;">
                    <label>Resumen de Interacción</label>
                    <div style="background: #0f172a; padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap; font-size: 0.875rem;">
                        ${lead.resumen}
                    </div>
                </div>
                ${lead.info_img ? `
                <div class="detail-item" style="grid-column: span 2;">
                    <label>Evidencia Visual</label>
                    <div class="image-gallery">
                        <img src="${lead.info_img}" class="evidence-img" alt="Evidencia">
                        ${lead.info_img2 ? `<img src="${lead.info_img2}" class="evidence-img">` : ''}
                        ${lead.info_img3 ? `<img src="${lead.info_img3}" class="evidence-img">` : ''}
                    </div>
                </div>` : ''}
            </div>
        `;

        modalOverlay.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        console.error('Error opening detail:', err);
    }
}

async function updateLead(id) {
    const status = document.getElementById('edit-status').value;
    const prioridad = document.getElementById('edit-priority').value;
    const agente_asignado = document.getElementById('edit-agent').value;

    try {
        const res = await fetch(`${API_BASE}/leads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, prioridad, agente_asignado })
        });

        if (res.ok) {
            alert('Lead actualizado correctamente');
            modalOverlay.style.display = 'none';
            fetchLeads();
            fetchStats();
        }
    } catch (err) {
        console.error('Error updating lead:', err);
    }
}

// Event Listeners
searchInput.addEventListener('input', () => {
    currentPage = 1;
    clearTimeout(window.searchTimer);
    window.searchTimer = setTimeout(fetchLeads, 400);
});

typeFilter.addEventListener('change', () => {
    currentPage = 1;
    fetchLeads();
});

limitFilter.addEventListener('change', () => {
    currentLimit = parseInt(limitFilter.value);
    currentPage = 1;
    fetchLeads();
});

prevPageBtn.onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        fetchLeads();
    }
};

nextPageBtn.onclick = () => {
    const totalPages = Math.ceil(totalRecords / currentLimit);
    if (currentPage < totalPages) {
        currentPage++;
        fetchLeads();
    }
};

refreshBtn.addEventListener('click', () => {
    fetchStats();
    fetchLeads();
});

// Sorting Handlers
function updateHeaderUI() {
    tableHeaders.forEach(th => {
        th.classList.remove('active-sort', 'sort-asc', 'sort-desc');
        const field = th.dataset.sort;
        if (field === currentSortBy) {
            th.classList.add('active-sort');
            th.classList.add(currentSortOrder === 'ASC' ? 'sort-asc' : 'sort-desc');
        }
    });
}

tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (currentSortBy === field) {
            currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
        } else {
            currentSortBy = field;
            currentSortOrder = 'ASC';
        }
        currentPage = 1;
        fetchLeads();
    });
});

closeModal.onclick = () => modalOverlay.style.display = 'none';
window.onclick = (e) => { if (e.target == modalOverlay) modalOverlay.style.display = 'none'; };

async function fetchAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/analytics/trends`);
        const data = await res.json();

        if (!res.ok) {
            console.error('Analytics API Error:', data);
            alert(`Error de analítica: ${data.details || data.error}`);
            return;
        }

        renderChart(data);
    } catch (err) {
        console.error('Error fetching analytics:', err);
    }
}

function renderChart(data) {
    chartContainer.innerHTML = '';
    if (data.length === 0) {
        chartContainer.innerHTML = '<p>No hay datos suficientes para mostrar la tendencia.</p>';
        return;
    }

    const max = Math.max(...data.map(d => parseInt(d.count)));

    data.forEach(d => {
        const height = (parseInt(d.count) / max) * 100;
        const day = new Date(d.date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short' });

        const barWrapper = document.createElement('div');
        barWrapper.style.flex = '1';
        barWrapper.style.display = 'flex';
        barWrapper.style.flexDirection = 'column';
        barWrapper.style.alignItems = 'center';
        barWrapper.style.height = '100%';
        barWrapper.style.justifyContent = 'flex-end';
        barWrapper.style.gap = '0.5rem';

        barWrapper.innerHTML = `
            <span style="font-size: 0.75rem; color: var(--accent)">${d.count}</span>
            <div style="width: 100%; height: ${height}%; background: var(--primary); border-radius: 4px 4px 0 0; min-height: 4px;"></div>
            <span style="font-size: 0.7rem; color: var(--text-muted)">${day}</span>
        `;
        chartContainer.appendChild(barWrapper);
    });
}

// Navigation Logic
navDashboard.onclick = () => {
    navDashboard.classList.add('active');
    navAnalytics.classList.remove('active');
    navSettings.classList.remove('active');
    navSettings.classList.remove('active');
    document.getElementById('analytics-grid').style.display = 'none';
    settingsSection.style.display = 'none';
    statsGrid.style.display = 'grid';
    document.querySelector('.leads-container').style.display = 'block';
    document.getElementById('pagination-footer').style.display = 'flex';
    document.querySelector('.filters-bar').style.display = 'flex';
};

navAnalytics.onclick = () => {
    navAnalytics.classList.add('active');
    navDashboard.classList.remove('active');
    navSettings.classList.remove('active');
    navDashboard.classList.remove('active');
    navSettings.classList.remove('active');
    document.getElementById('analytics-grid').style.display = 'flex';
    settingsSection.style.display = 'none';
    statsGrid.style.display = 'none';
    document.querySelector('.leads-container').style.display = 'none';
    document.getElementById('pagination-footer').style.display = 'none';
    document.querySelector('.filters-bar').style.display = 'none';
    document.querySelector('.filters-bar').style.display = 'none';
    fetchAnalytics();
    fetchStats(); // Fetch extended stats for other charts
};

navSettings.onclick = () => {
    navSettings.classList.add('active');
    navDashboard.classList.remove('active');
    navAnalytics.classList.remove('active');
    navAnalytics.classList.remove('active');
    settingsSection.style.display = 'block';
    document.getElementById('analytics-grid').style.display = 'none';
    statsGrid.style.display = 'none';
    document.querySelector('.leads-container').style.display = 'none';
    document.getElementById('pagination-footer').style.display = 'none';
    document.querySelector('.filters-bar').style.display = 'none';
};

navLogout.onclick = handleLogout;

// Save Settings Logic
const saveSettingsBtn = document.getElementById('save-settings-btn');
const settingsAgents = document.getElementById('settings-agents');
const settingsRefresh = document.getElementById('settings-refresh');

saveSettingsBtn.onclick = () => {
    localStorage.setItem('visorRefresh', settingsRefresh.value);

    // Visual feedback
    const originalText = saveSettingsBtn.textContent;
    saveSettingsBtn.textContent = '¡Guardado!';
    saveSettingsBtn.style.background = 'var(--success)';

    setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
        saveSettingsBtn.style.background = 'var(--primary)';
    }, 2000);
};

if (localStorage.getItem('visorRefresh')) {
    settingsRefresh.value = localStorage.getItem('visorRefresh');
}

// User management functionality removed

// Initial Load
checkAuth();
fetchStats();
fetchLeads();
fetchActiveAgents();


/* =========================================
   USER MANAGEMENT LOGIC
   ========================================= */

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const userModalOverlay = document.getElementById('user-modal-overlay');
const closeUserModalBtn = document.getElementById('close-user-modal');
const btnAddUser = document.getElementById('btn-add-user');
const userForm = document.getElementById('user-form');

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Update active state
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Fetch users if updated
        if (tabName === 'users') {
            fetchUsers();
        }
    });
});

// User Modal Open/Close
if (btnAddUser) {
    btnAddUser.onclick = () => {
        console.log('Open User Modal clicked');
        openUserModal();
    };
} else {
    console.error('btnAddUser element not found');
}
if (closeUserModalBtn) closeUserModalBtn.onclick = () => userModalOverlay.style.display = 'none';

// Helper to find user by ID for the edit button (avoids JSON escaping issues in HTML)
window.openUserModalById = function (userId) {
    console.log('openUserModalById called with:', userId);
    // We need to find the user from the current rendered list.
    const user = currentUsersList.find(u => u.id === userId);
    if (user) {
        openUserModal(user);
    } else {
        console.error('User not found in local list:', userId);
        // Fallback or fetch? For now log error.
    }
}

window.openUserModal = function (user = null) {
    console.log('openUserModal called. User:', user);
    try {
        const title = document.getElementById('user-modal-title');
        const idInput = document.getElementById('user-id');
        const usernameInput = document.getElementById('user-username');
        const fullnameInput = document.getElementById('user-fullname');
        const phoneInput = document.getElementById('user-phone');
        const roleInput = document.getElementById('user-role');
        const statusInput = document.getElementById('user-status');
        const passwordInput = document.getElementById('user-password');
        const passwordHint = document.getElementById('password-hint');


        // Get modal elements fresh (don't rely on cached references)
        const modalOverlay = document.getElementById('user-modal-overlay');
        const form = document.getElementById('user-form');

        if (form) form.reset();

        // Force display with important
        modalOverlay.style.setProperty('display', 'flex', 'important');
        console.log('Modal display set to flex (forced)');
        // alert('Abriendo modal...'); // Debug check

        if (user) {
            title.textContent = 'Editar Usuario';
            idInput.value = user.id;
            usernameInput.value = user.username;
            usernameInput.disabled = false; // Allow editing username
            fullnameInput.value = user.full_name;
            phoneInput.value = user.phone || '';
            roleInput.value = user.role;
            statusInput.value = user.status || 'active';
            passwordHint.textContent = 'Dejar en blanco para mantener la actual';
        } else {
            title.textContent = 'Nuevo Usuario';
            idInput.value = '';
            usernameInput.disabled = false;
            statusInput.value = 'active';
            passwordHint.textContent = 'Requerido para nuevos usuarios';
        }
    } catch (e) {
        console.error('Error opening user modal:', e);
    }
};

// Fetch Users
async function fetchUsers() {
    try {
        const res = await fetch(`${API_BASE}/users`, { credentials: 'include' });
        if (!res.ok) throw new Error('Error fetching users');
        currentUsersList = await res.json();
        renderUsers(currentUsersList);
    } catch (err) {
        console.error(err);
        const usersTableBody = document.getElementById('users-body');
        if (usersTableBody) {
            usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error cargando usuarios</td></tr>';
        }
    }
}

// Render Users
function renderUsers(users) {
    const usersTableBody = document.getElementById('users-body');
    if (!usersTableBody) {
        console.error('users-body element not found');
        return;
    }
    usersTableBody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        const date = new Date(user.created_at).toLocaleDateString('es-MX');

        tr.innerHTML = `
            <td><span style="font-weight: 500; color: var(--accent);">${user.username}</span></td>
            <td>${user.full_name || '-'}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-renta' : (user.role === 'supervisor' ? 'badge-compra' : 'badge-falla')}">${user.role}</span></td>
            <td>${user.phone || '-'}</td>
            <td>
                <span class="status-badge ${user.status === 'active' ? 'status-completada' : 'status-pendiente'}">
                    ${user.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="btn-icon" onclick="openUserModalById(${user.id})" title="Editar">
                    <i data-lucide="edit-2"></i>
                </button>
                ${user.id !== currentUser.id ? `
                <button class="btn-icon delete" onclick="deleteUser(${user.id})" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                </button>` : ''}
            </td>
        `;
        usersTableBody.appendChild(tr);
        usersTableBody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Handle Form Submit
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('user-id').value;
    const username = document.getElementById('user-username').value;
    const full_name = document.getElementById('user-fullname').value;
    const phone = document.getElementById('user-phone').value;
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;
    const password = document.getElementById('user-password').value;

    const endpoint = id ? `${API_BASE}/users/${id}` : `${API_BASE}/users`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, full_name, phone, role, status, password })
        });

        const data = await res.json();

        if (res.ok) {
            userModalOverlay.style.display = 'none';
            fetchUsers();
            alert(id ? 'Usuario actualizado' : 'Usuario creado');
        } else {
            alert(data.error || 'Error al guardar usuario');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión');
    }
});

// Delete User
async function deleteUser(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            fetchUsers();
        } else {
            const data = await res.json();
            alert(data.error || 'Error al eliminar usuario');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión');
    }
}


/* =========================================
   REAL-TIME UPDATES (SOCKET.IO)
   ========================================= */
const socket = io();

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('lead_updated', (data) => {
    console.log('Lead updated:', data);
    fetchLeads(); // Refresh table
    fetchStats(); // Refresh stats

    // Visual Notification
    const toast = document.createElement('div');
    toast.className = 'animate-in';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = 'var(--primary)';
    toast.style.color = 'white';
    toast.style.padding = '1rem';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '1000';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.textContent = `Solicitud actualizada: ${data.razon_social || '#' + data.id_registro}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
});

socket.on('new_lead', (data) => {
    console.log('New Lead detected:', data);
    fetchLeads(); // Refresh table
    fetchStats(); // Refresh stats

    // Visual Notification for New Lead
    const toast = document.createElement('div');
    toast.className = 'animate-in';
    toast.style.position = 'fixed';
    toast.style.bottom = '80px'; // Stack above update toast
    toast.style.right = '20px';
    toast.style.background = '#22c55e'; // Green for new
    toast.style.color = 'white';
    toast.style.padding = '1rem';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '1000';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.textContent = `¡Nueva Solicitud! ${data.nombre_contacto || '#' + data.id_registro}`;
    document.body.appendChild(toast);

    // Play sound notification? (Optional, maybe later)
    setTimeout(() => toast.remove(), 5000);
});
