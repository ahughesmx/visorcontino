/* ==========================================
   USER MANAGEMENT FUNCTIONALITY
   ========================================== */

// DOM Elements
const btnNewUser = document.getElementById('btn-new-user') || document.getElementById('btn-add-user');
const userModal = document.getElementById('user-modal');
const closeUserModal = document.getElementById('close-user-modal');
const userForm = document.getElementById('user-form');
const usersTableBody = document.getElementById('users-table-body') || document.getElementById('users-body');

const passwordModal = document.getElementById('password-modal');
const closePasswordModal = document.getElementById('close-password-modal');
const passwordForm = document.getElementById('password-form');

// Open User Modal (Create/Edit)
function openUserModal(user = null) {
    const title = document.getElementById('user-modal-title');
    const userId = document.getElementById('user-id');
    const username = document.getElementById('user-username');
    const fullname = document.getElementById('user-fullname');
    const phone = document.getElementById('user-phone');
    const role = document.getElementById('user-role');
    const status = document.getElementById('user-status');
    const password = document.getElementById('user-password');
    const passwordRequired = document.getElementById('password-required');
    const passwordHint = document.getElementById('password-hint');

    // Reset form
    userForm.reset();

    if (user) {
        // Edit mode
        title.textContent = 'Editar Usuario';
        userId.value = user.id;
        username.value = user.username;
        username.disabled = true; // Can't change username
        fullname.value = user.full_name || '';
        phone.value = user.phone || '';
        role.value = user.role;
        status.value = user.status;
        password.required = false;
        passwordRequired.style.display = 'none';
        passwordHint.textContent = 'Dejar en blanco para no cambiar';
    } else {
        // Create mode
        title.textContent = 'Nuevo Usuario';
        userId.value = '';
        username.disabled = false;
        password.required = true;
        passwordRequired.style.display = 'inline';
        passwordHint.textContent = 'Mínimo 8 caracteres';
    }

    userModal.style.display = 'flex';
}

// Close modals
if (closeUserModal) {
    closeUserModal.onclick = () => userModal.style.display = 'none';
}

if (closePasswordModal) {
    closePasswordModal.onclick = () => passwordModal.style.display = 'none';
}

// Open password modal
function openPasswordModal(userId, username) {
    document.getElementById('password-user-id').value = userId;
    document.getElementById('password-username').value = username;
    document.getElementById('password-display-username').textContent = username;
    passwordForm.reset();
    passwordModal.style.display = 'flex';
}

// Fetch and render users
async function fetchUsers() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const users = await res.json();
        renderUsers(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        if (usersTableBody) {
            usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#64748b;">Error cargando usuarios</td></tr>';
        }
    }
}

// Render users table
function renderUsers(users) {
    if (!usersTableBody) return;

    usersTableBody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';

        const roleColors = {
            admin: '#ef4444',
            supervisor: '#f59e0b',
            agent: '#10b981'
        };

        tr.innerHTML = `
            <td style="padding: 1rem; color: #60a5fa; font-weight: 500;">${user.username}</td>
            <td style="padding: 1rem;">${user.full_name || '-'}</td>
            <td style="padding: 1rem;">
                <span style="padding: 0.25rem 0.75rem; background: ${roleColors[user.role]}22; color: ${roleColors[user.role]}; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 500;">
                    ${user.role}
                </span>
            </td>
            <td style="padding: 1rem;">${user.phone || '-'}</td>
            <td style="padding: 1rem;">
                <span style="padding: 0.25rem 0.75rem; background: ${user.status === 'active' ? '#10b98122' : '#64748b22'}; color: ${user.status === 'active' ? '#10b981' : '#64748b'}; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 500;">
                    ${user.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td style="padding: 1rem; text-align: right;">
                <button onclick="openUserModal(${JSON.stringify(user).replace(/"/g, '&quot;')})" style="background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; margin-right: 0.5rem;" title="Editar">
                    <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
                </button>
                <button onclick="openPasswordModal(${user.id}, '${user.username}')" style="background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; margin-right: 0.5rem;" title="Cambiar Contraseña">
                    <i data-lucide="key" style="width: 16px; height: 16px;"></i>
                </button>
                <button onclick="deleteUser(${user.id})" style="background: transparent; border: 1px solid #dc2626; color: #dc2626; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer;" title="Eliminar">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;

        usersTableBody.appendChild(tr);
    });

    lucide.createIcons();
}

// User form submit
if (userForm) {
    userForm.onsubmit = async (e) => {
        e.preventDefault();

        const userId = document.getElementById('user-id').value;
        const username = document.getElementById('user-username').value;
        const full_name = document.getElementById('user-fullname').value;
        const phone = document.getElementById('user-phone').value;
        const role = document.getElementById('user-role').value;
        const status = document.getElementById('user-status').value;
        const password = document.getElementById('user-password').value;

        const payload = { username, full_name, phone, role, status };
        if (password) payload.password = password;

        const url = userId ? `/api/users/${userId}` : '/api/users';
        const method = userId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                userModal.style.display = 'none';
                fetchUsers();
                alert(userId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
            } else {
                alert(data.error || 'Error al guardar usuario');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión');
        }
    };
}

// Password form submit
if (passwordForm) {
    passwordForm.onsubmit = async (e) => {
        e.preventDefault();

        const userId = document.getElementById('password-user-id').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        try {
            const res = await fetch(`/api/users/${userId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                passwordModal.style.display = 'none';
                alert('Contraseña cambiada exitosamente');
            } else {
                alert(data.error || 'Error cambiando contraseña');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión');
        }
    };
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de que deseas desactivar este usuario?')) return;

    try {
        const res = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (res.ok) {
            fetchUsers();
            alert('Usuario desactivado exitosamente');
        } else {
            alert(data.error || 'Error eliminando usuario');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Error de conexión');
    }
}

// Attach button handlers
if (btnNewUser) {
    btnNewUser.onclick = () => openUserModal();
}

// Tab switching logic for users tab
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Update active state
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabElement = document.getElementById(`tab-${tabName}`);
        if (tabElement) {
            tabElement.classList.add('active');
        }

        // Fetch users when opening users tab
        if (tabName === 'users') {
            fetchUsers();
        }
    });
});

// Expose functions globally for onclick handlers
window.openUserModal = openUserModal;
window.openPasswordModal = openPasswordModal;
window.deleteUser = deleteUser;

console.log('User management module loaded');
