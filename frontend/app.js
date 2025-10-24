document.addEventListener('DOMContentLoaded', () => {

    // URL API Backend
    const API_URL = 'http://127.0.0.1:8000';

    // === Elemen DOM (Publik) ===
    const eventsList = document.getElementById('events-list');
    const eventSelect = document.getElementById('event_id');
    const registrationForm = document.getElementById('registration-form');
    const formMessage = document.getElementById('form-message');

    // === Elemen DOM (Modal) ===
    const modal = document.getElementById('event-detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.querySelector('.modal-close-button');

    // !! SOLUSI: Sembunyikan modal secara paksa saat JS dimuat !!
    // Ini akan mengatasi masalah "langsung muncul"
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('Elemen modal tidak ditemukan! Cek ID HTML Anda.');
    }

    /**
     * Mengambil data event dari API dan menampilkannya
     */
    async function fetchEvents() {
        try {
            const response = await fetch(`${API_URL}/events`);
            if (!response.ok) {
                throw new Error('Gagal mengambil data event');
            }
            const events = await response.json();
            
            eventsList.innerHTML = '';
            eventSelect.innerHTML = '<option value="">-- Pilih Event --</option>';
            
            if (events.length === 0) {
                eventsList.innerHTML = '<p>Belum ada event yang tersedia.</p>';
                return;
            }

            events.forEach(event => {
                const remainingQuota = event.quota - event.participants.length;
                const quotaColor = remainingQuota > 0 ? 'green' : 'red';
                const quotaFull = remainingQuota <= 0;

                // 1. Tampilkan di daftar event (Event Card)
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                    <h3>${event.title}</h3>
                    <p><strong>Tanggal:</strong> ${event.date}</p>
                    <p><strong>Lokasi:</strong> ${event.location}</p>
                    <p class="quota" style="color:${quotaColor};">
                        <strong>Kuota:</strong> ${event.participants.length} / ${event.quota} 
                        (Sisa: ${remainingQuota})
                    </p>
                    <button class="btn-details">View Details</button>
                `;
                
                // Tambahkan event listener ke tombol detail
                const detailsButton = eventCard.querySelector('.btn-details');
                detailsButton.addEventListener('click', () => {
                    showEventDetails(event);
                });

                eventsList.appendChild(eventCard);

                // 2. Tambahkan ke pilihan <select> di form (jika kuota masih ada)
                if (!quotaFull) {
                    const option = document.createElement('option');
                    option.value = event.id;
                    option.textContent = `${event.title} (Sisa kuota: ${remainingQuota})`;
                    eventSelect.appendChild(option);
                }
            });

        } catch (error) {
            eventsList.innerHTML = `<p class="error">${error.message}. Pastikan backend berjalan.</p>`;
            console.error('Error fetching events:', error);
        }
    }

    /**
     * Menangani submit form pendaftaran
     */
    async function handleRegistration(e) {
        e.preventDefault(); 
        // ... (Fungsi ini tidak perlu diubah, biarkan sama) ...
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const event_id = document.getElementById('event_id').value;

        if (!name || !email || !event_id) {
            showMessage('Semua field wajib diisi!', 'error');
            return;
        }

        const registrationData = {
            name: name,
            email: email,
            event_id: parseInt(event_id)
        };

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Pendaftaran gagal');
            }

            showMessage(`Registrasi sukses! ${name} terdaftar.`, 'success');
            registrationForm.reset(); 
            fetchEvents(); 

        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error during registration:', error);
        }
    }
    
    /**
     * Menampilkan pesan di bawah form
     */
    function showMessage(message, type) {
        // ... (Fungsi ini tidak perlu diubah, biarkan sama) ...
        formMessage.textContent = message;
        formMessage.className = `message ${type}`; 
    }

    // --- *** FUNGSI MODAL (VERSI DOM STYLE) *** ---

    /**
     * Menampilkan modal dengan detail event dan daftar peserta
     * @param {object} event - Objek event yang diklik
     */
    function showEventDetails(event) {
        // 1. Isi judul modal
        modalTitle.textContent = event.title;

        // 2. Buat konten untuk body modal
        let bodyContent = `
            <p><strong>Tanggal:</strong> ${event.date}</p>
            <p><strong>Lokasi:</strong> ${event.location}</p>
            <p><strong>Kuota:</strong> ${event.participants.length} / ${event.quota}</p>
            <hr>
            <h4>Daftar Peserta (${event.participants.length}):</h4>
        `;

        if (event.participants.length === 0) {
            bodyContent += "<p>Belum ada peserta yang mendaftar.</p>";
        } else {
            let participantListHTML = '<ol id="modal-participants-list">';
            event.participants.forEach(participant => {
                participantListHTML += `<li>${participant.name} (${participant.email})</li>`;
            });
            participantListHTML += '</ol>';
            bodyContent += participantListHTML;
        }

        // 3. Masukkan konten ke modal
        modalBody.innerHTML = bodyContent;
        
        // 4. !! PERUBAHAN DI SINI: Tampilkan modal !!
        // Kita pakai 'flex' agar modal tetap di tengah (sesuai CSS .modal-overlay)
        modal.style.display = 'flex';
    }

    /**
     * Menutup modal
     */
    function closeModal() {
        // !! PERUBAHAN DI SINI: Sembunyikan modal !!
        modal.style.display = 'none';
        
        // Kosongkan konten agar bersih saat dibuka lagi
        modalTitle.textContent = '';
        modalBody.innerHTML = '';
    }

    // --- Event Listeners ---
    registrationForm.addEventListener('submit', handleRegistration);
    
    // Listener untuk menutup modal
    closeModalButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Tutup modal jika klik di area overlay (latar belakang)
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Panggil fungsi untuk memuat event saat halaman dibuka
    fetchEvents();
});