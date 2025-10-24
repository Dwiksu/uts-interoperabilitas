document.addEventListener('DOMContentLoaded', () => {

    // URL API Backend
    const API_URL = 'http://127.0.0.1:8000';

    // Variabel untuk menyimpan token
    let jwtToken = null;

    // --- Elemen DOM ---
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    
    const adminName = document.getElementById('admin-name');
    const logoutButton = document.getElementById('logout-button');

    const eventForm = document.getElementById('event-form');
    const formTitle = document.getElementById('form-title');
    const submitButton = document.getElementById('submit-event-button');
    const cancelUpdateButton = document.getElementById('cancel-update-button');
    const eventIdInput = document.getElementById('event-id');
    const adminMessage = document.getElementById('admin-message');

    const existingEventsList = document.getElementById('existing-events-list');

    // --- Fungsi Bantuan (Helpers) ---

    /** Mendapatkan header otentikasi untuk request API */
    function getAuthHeaders() {
        // Coba ambil token dari variabel, jika tidak ada, ambil dari sessionStorage
        if (!jwtToken) {
            jwtToken = sessionStorage.getItem('adminToken');
        }
        
        if (!jwtToken) {
            console.error('No JWT Token available');
            handleLogout(); // Paksa logout jika tidak ada token
            return {};
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        };
    }

    /** Menampilkan pesan (error/sukses) */
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
    }

    // --- 1. Logika Login / Logout ---

    /** Menangani submit form login */
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', document.getElementById('password').value);
        formData.append('grant_type', 'password');

        try {
            const response = await fetch(`${API_URL}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Login failed');
            }

            // Sukses!
            jwtToken = data.access_token;

            // !! PERUBAHAN DI SINI: Simpan token dan username di sessionStorage
            sessionStorage.setItem('adminToken', jwtToken);
            sessionStorage.setItem('adminUser', username);

            // Tampilkan panel admin
            showAdminPanel(username);

        } catch (error) {
            showMessage(loginMessage, error.message, 'error');
            console.error('Login error:', error);
        }
    }

    /** Menampilkan panel admin (setelah login / reload) */
    function showAdminPanel(username) {
        adminName.textContent = username;
        loginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        // Muat data event
        fetchAndDisplayEvents();
    }


    /** Menangani logout */
    function handleLogout() {
        jwtToken = null;
        
        // !! PERUBAHAN DI SINI: Hapus token dari sessionStorage
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');

        // Tampilkan halaman login
        loginForm.reset();
        loginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        showMessage(loginMessage, 'You have been logged out.', 'success');
    }

    // --- 2. Logika CRUD Event (Admin) ---

    /** Memuat dan menampilkan semua event di panel admin */
    async function fetchAndDisplayEvents() {
        try {
            // GET /events adalah endpoint publik, tidak perlu token
            const response = await fetch(`${API_URL}/events`);
            if (!response.ok) throw new Error('Failed to fetch events');
            
            const events = await response.json();
            existingEventsList.innerHTML = ''; // Kosongkan list

            if (events.length === 0) {
                existingEventsList.innerHTML = '<p>No events found.</p>';
                return;
            }

            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Quota</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
            const tbody = table.querySelector('tbody');
            
            events.forEach(event => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${event.id}</td>
                    <td>${event.title}</td>
                    <td>${event.date}</td>
                    <td>${event.location}</td>
                    <td>${event.participants.length} / ${event.quota}</td>
                    <td>
                        <button class="btn-update">Update</button>
                        <button class="btn-delete">Delete</button>
                    </td>
                `;

                tr.querySelector('.btn-update').addEventListener('click', () => {
                    populateFormForUpdate(event);
                });

                tr.querySelector('.btn-delete').addEventListener('click', () => {
                    handleDeleteEvent(event.id);
                });

                tbody.appendChild(tr);
            });
            existingEventsList.appendChild(table);

        } catch (error) {
            existingEventsList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    /** Mengisi form untuk mode Update */
    function populateFormForUpdate(event) {
        formTitle.textContent = `Update Event (ID: ${event.id})`;
        submitButton.textContent = 'Save Changes';
        cancelUpdateButton.classList.remove('hidden');

        eventIdInput.value = event.id;
        document.getElementById('title').value = event.title;
        document.getElementById('date').value = event.date;
        document.getElementById('location').value = event.location;
        document.getElementById('quota').value = event.quota;
        
        window.scrollTo(0, adminPanel.offsetTop);
    }

    /** Mereset form kembali ke mode Create */
    function resetEventForm() {
        formTitle.textContent = 'Create New Event';
        submitButton.textContent = 'Create Event';
        cancelUpdateButton.classList.add('hidden');
        eventForm.reset();
        eventIdInput.value = '';
    }

    /** Menangani submit form (bisa Create atau Update) */
    async function handleEventFormSubmit(e) {
        e.preventDefault();
        
        const eventId = eventIdInput.value;
        const isUpdating = eventId !== '';

        const eventData = {
            title: document.getElementById('title').value,
            date: document.getElementById('date').value,
            location: document.getElementById('location').value,
            quota: parseInt(document.getElementById('quota').value),
        };

        const url = isUpdating ? `${API_URL}/events/${eventId}` : `${API_URL}/events`;
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(), // Fungsi ini sekarang sudah mengambil token dari session
                body: JSON.stringify(eventData)
            });

            const result = await response.json();

            if (!response.ok) {
                // Jika token expired (401), paksa logout
                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(result.detail || (isUpdating ? 'Update failed' : 'Create failed'));
            }

            const successMessage = isUpdating ? 'Event updated successfully!' : 'Event created successfully!';
            showMessage(adminMessage, successMessage, 'success');
            
            resetEventForm();
            fetchAndDisplayEvents();

        } catch (error) {
            showMessage(adminMessage, error.message, 'error');
            // Jika error karena sesi expired, logout
            if (error.message.includes('Session expired')) {
                handleLogout();
            }
        }
    }

    /** Menangani hapus event */
    async function handleDeleteEvent(eventId) {
        if (!confirm(`Are you sure you want to delete event ID ${eventId}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: getAuthHeaders() // Ambil header (termasuk token)
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(result.detail || 'Delete failed');
            }

            showMessage(adminMessage, `Event ID ${eventId} deleted successfully.`, 'success');
            fetchAndDisplayEvents();

        } catch (error) {
            showMessage(adminMessage, error.message, 'error');
            if (error.message.includes('Session expired')) {
                handleLogout();
            }
        }
    }

    // --- Inisialisasi ---
    
    /** !! FUNGSI BARU: Cek login saat halaman dimuat !! */
    function checkLoginStatus() {
        const storedToken = sessionStorage.getItem('adminToken');
        const storedUser = sessionStorage.getItem('adminUser');

        if (storedToken && storedUser) {
            console.log('User already logged in.');
            jwtToken = storedToken; // Set token global
            showAdminPanel(storedUser); // Tampilkan panel admin
        } else {
            console.log('No active session found. Showing login form.');
            // Jika tidak ada token, pastikan panel login terlihat
            loginSection.classList.remove('hidden');
            adminPanel.classList.add('hidden');
        }
    }

    // --- Tambahkan Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    eventForm.addEventListener('submit', handleEventFormSubmit);
    cancelUpdateButton.addEventListener('click', resetEventForm);

    // Panggil fungsi cek login saat halaman pertama kali dimuat
    checkLoginStatus();
});