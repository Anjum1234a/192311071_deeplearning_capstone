/**
 * CLINIDENT - Main Application Controller & UI Router
 * Single Doctor User Role Architecture
 */

class ClinidentApp {
  constructor() {
    this.currentView = 'dashboard';
    this.activePatientId = 1;
    this.isAuthenticated = true; // Auto-logged in as Doctor for seamless clinical workflow
  }

  async init() {
    await window.clinidentStore.init();

    this.setupNavigation();
    this.setupModals();
    this.setupPatientSelector();
    this.renderCurrentView();
    this.updateDoctorProfileHeader();

    // Initialize submodules
    window.odontogram.init(this.activePatientId);
    window.aiAnalysis.init(this.activePatientId);
    window.stlViewer.init();

    // Check auth status
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    const saved = localStorage.getItem('clinident_doctor_logged_in');
    if (saved === 'false') {
      this.isAuthenticated = false;
      this.showLoginModal(true);
    } else {
      this.isAuthenticated = true;
      this.showLoginModal(false);
    }
  }

  showLoginModal(show) {
    const modal = document.getElementById('doctorLoginModal');
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  handleDoctorLogin(email, password) {
    if (email === 'doctor@clinident.com' && (password === 'Doctor@123' || password === 'doctor123')) {
      this.isAuthenticated = true;
      localStorage.setItem('clinident_doctor_logged_in', 'true');
      this.showLoginModal(false);
      this.showToast('Welcome back, Dr. Sarah Mitchell!');
      this.renderCurrentView();
    } else {
      alert('Invalid doctor credentials. Please use demo credentials: doctor@clinident.com / Doctor@123');
    }
  }

  handleDoctorLogout() {
    this.isAuthenticated = false;
    localStorage.setItem('clinident_doctor_logged_in', 'false');
    this.showLoginModal(true);
    this.showToast('Doctor session ended.');
  }

  updateDoctorProfileHeader() {
    const doc = window.clinidentStore.doctor;
    document.querySelectorAll('.display-doctor-name').forEach(el => el.textContent = doc.name);
    document.querySelectorAll('.display-clinic-name').forEach(el => el.textContent = doc.clinic_name);
  }

  setupNavigation() {
    document.querySelectorAll('[data-nav-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.getAttribute('data-nav-view');
        this.navigateTo(view);
      });
    });
  }

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update sidebar active link
    document.querySelectorAll('.sidebar-link').forEach(link => {
      if (link.getAttribute('data-nav-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.add('hidden');
    });

    // Show target section
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.renderCurrentView();
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'patients':
        this.renderPatientsList();
        break;
      case 'appointments':
        this.renderAppointments();
        break;
      case 'charting':
        window.odontogram.init(this.activePatientId);
        break;
      case 'clinical-notes':
        this.renderClinicalNotes();
        break;
      case 'prescriptions':
        this.renderPrescriptions();
        break;
      case 'imaging':
        this.renderImagingGallery();
        window.stlViewer.init();
        break;
      case 'ai-analysis':
        window.aiAnalysis.init(this.activePatientId);
        break;
      case 'reports':
        this.renderReports();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  setupPatientSelector() {
    const selector = document.getElementById('globalPatientSelector');
    if (!selector) return;

    selector.innerHTML = window.clinidentStore.patients.map(p => `
      <option value="${p.id}" ${p.id == this.activePatientId ? 'selected' : ''}>
        ${p.full_name} (${p.patient_code})
      </option>
    `).join('');

    selector.addEventListener('change', (e) => {
      this.activePatientId = parseInt(e.target.value, 10);
      window.clinidentStore.activePatientId = this.activePatientId;
      const patient = window.clinidentStore.getPatientById(this.activePatientId);
      this.showToast(`Active Patient: ${patient.full_name}`);
      this.renderCurrentView();
    });
  }

  // -----------------------------------------------------------
  // 1. Dashboard View
  // -----------------------------------------------------------
  renderDashboard() {
    const store = window.clinidentStore;
    const todayStr = new Date().toISOString().split('T')[0];

    const todayAppts = store.appointments.filter(a => a.appointment_date === todayStr);
    const upcomingAppts = store.appointments.filter(a => a.status === 'Scheduled');
    const completedTreatments = store.appointments.filter(a => a.status === 'Completed');
    const pendingTreatments = store.appointments.filter(a => a.status !== 'Completed');

    // Counters
    document.getElementById('dashTotalPatients')?.replaceChildren(document.createTextNode(store.patients.length));
    document.getElementById('dashTodayAppts')?.replaceChildren(document.createTextNode(todayAppts.length));
    document.getElementById('dashUpcomingAppts')?.replaceChildren(document.createTextNode(upcomingAppts.length));
    document.getElementById('dashCompletedTreatments')?.replaceChildren(document.createTextNode(completedTreatments.length));
    document.getElementById('dashPendingTreatments')?.replaceChildren(document.createTextNode(pendingTreatments.length));

    // Today's Queue List
    const queueContainer = document.getElementById('dashTodayQueueContainer');
    if (queueContainer) {
      if (todayAppts.length === 0) {
        queueContainer.innerHTML = `<p class="text-xs text-slate-400 italic py-4">No appointments scheduled for today.</p>`;
      } else {
        queueContainer.innerHTML = todayAppts.map(a => `
          <div class="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between hover:border-blue-300 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                ${a.appointment_time.substring(0, 5)}
              </div>
              <div>
                <h4 class="font-bold text-sm text-slate-800">${a.patient_name} <span class="text-xs text-slate-400 font-mono">(${a.patient_code})</span></h4>
                <p class="text-xs text-slate-500">${a.treatment_type} • ${a.reason_for_visit}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${this.getApptStatusBadge(a.status)}">${a.status}</span>
              ${a.status !== 'Completed' ? `
                <button onclick="app.quickCompleteAppt(${a.id})" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors">
                  Complete
                </button>
              ` : ''}
            </div>
          </div>
        `).join('');
      }
    }

    // Recent Patient Activity
    const actContainer = document.getElementById('dashRecentActivityContainer');
    if (actContainer) {
      actContainer.innerHTML = store.patients.slice(0, 4).map(p => `
        <div class="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer" onclick="app.viewPatientProfile(${p.id})">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
              ${p.full_name.charAt(0)}
            </div>
            <div>
              <h5 class="text-xs font-bold text-slate-800">${p.full_name}</h5>
              <p class="text-[10px] text-slate-400">${p.phone} • Blood: ${p.blood_group}</p>
            </div>
          </div>
          <span class="text-[11px] text-blue-600 font-semibold hover:underline">Profile &rarr;</span>
        </div>
      `).join('');
    }
  }

  quickCompleteAppt(id) {
    window.clinidentStore.updateAppointmentStatus(id, 'Completed');
    this.renderDashboard();
    this.showToast('Appointment marked as Completed.');
  }

  // -----------------------------------------------------------
  // 2. Patient Management View
  // -----------------------------------------------------------
  renderPatientsList() {
    const container = document.getElementById('patientsTableBody');
    const searchInput = document.getElementById('patientSearchInput');
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let list = window.clinidentStore.patients;
    if (term) {
      list = list.filter(p => 
        p.full_name.toLowerCase().includes(term) || 
        p.phone.includes(term) || 
        p.patient_code.toLowerCase().includes(term) ||
        p.allergies.toLowerCase().includes(term)
      );
    }

    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 text-xs italic">No patients match the search query.</td></tr>`;
      return;
    }

    container.innerHTML = list.map(p => `
      <tr class="hover:bg-blue-50/40 transition-colors border-b border-slate-100">
        <td class="p-3 text-xs font-mono font-bold text-blue-600">${p.patient_code}</td>
        <td class="p-3">
          <div class="font-bold text-xs sm:text-sm text-slate-800">${p.full_name}</div>
          <div class="text-[11px] text-slate-500">${p.gender}, ${p.age} yrs • Blood: ${p.blood_group}</div>
        </td>
        <td class="p-3 text-xs text-slate-600">
          <div>${p.phone}</div>
          <div class="text-[10px] text-slate-400">${p.email || 'No email'}</div>
        </td>
        <td class="p-3 text-xs">
          ${p.allergies && p.allergies !== 'No known drug allergies' ? `
            <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200">
              ⚠️ ${p.allergies}
            </span>
          ` : `<span class="text-slate-400 text-[11px]">No alerts</span>`}
        </td>
        <td class="p-3 text-xs">
          <span class="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[10px] border border-teal-200">${p.status}</span>
        </td>
        <td class="p-3 text-xs text-right space-x-1.5">
          <button onclick="app.viewPatientProfile(${p.id})" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 text-xs transition-colors">
            View EHR
          </button>
          <button onclick="app.openEditPatientModal(${p.id})" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 text-xs transition-colors">
            Edit
          </button>
          <button onclick="app.deletePatient(${p.id})" class="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs transition-colors" title="Delete">
            ✕
          </button>
        </td>
      </tr>
    `).join('');
  }

  viewPatientProfile(id) {
    this.activePatientId = id;
    window.clinidentStore.activePatientId = id;
    const selector = document.getElementById('globalPatientSelector');
    if (selector) selector.value = id;

    const patient = window.clinidentStore.getPatientById(id);
    this.showPatientDetailsModal(patient);
  }

  showPatientDetailsModal(p) {
    const modal = document.getElementById('patientProfileModal');
    if (!modal) return;

    document.getElementById('profilePatientName')?.replaceChildren(document.createTextNode(p.full_name));
    document.getElementById('profilePatientCode')?.replaceChildren(document.createTextNode(p.patient_code));
    document.getElementById('profilePhone')?.replaceChildren(document.createTextNode(p.phone));
    document.getElementById('profileEmail')?.replaceChildren(document.createTextNode(p.email || 'N/A'));
    document.getElementById('profileAgeGender')?.replaceChildren(document.createTextNode(`${p.gender}, ${p.age} years (DOB: ${p.dob})`));
    document.getElementById('profileBlood')?.replaceChildren(document.createTextNode(p.blood_group || 'O+'));
    document.getElementById('profileAddress')?.replaceChildren(document.createTextNode(p.address || 'N/A'));
    document.getElementById('profileEmergency')?.replaceChildren(document.createTextNode(`${p.emergency_contact_name || 'N/A'} (${p.emergency_contact_phone || 'N/A'})`));
    document.getElementById('profileMedicalHist')?.replaceChildren(document.createTextNode(p.medical_history || 'None'));
    document.getElementById('profileDentalHist')?.replaceChildren(document.createTextNode(p.dental_history || 'None'));
    document.getElementById('profileAllergies')?.replaceChildren(document.createTextNode(p.allergies || 'None'));

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  async deletePatient(id) {
    if (confirm('Are you sure you want to delete this patient and their dental records?')) {
      await window.clinidentStore.deletePatient(id);
      this.renderPatientsList();
      this.setupPatientSelector();
      this.showToast('Patient record removed.');
    }
  }

  // -----------------------------------------------------------
  // 3. Appointments Management View
  // -----------------------------------------------------------
  renderAppointments() {
    const container = document.getElementById('appointmentsListContainer');
    if (!container) return;

    const list = window.clinidentStore.appointments;
    if (list.length === 0) {
      container.innerHTML = `<p class="p-8 text-center text-slate-400 text-xs italic">No appointments recorded.</p>`;
      return;
    }

    container.innerHTML = list.map(a => `
      <div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 flex flex-col items-center justify-center shrink-0">
            <span class="text-[10px] font-bold text-slate-400 uppercase">${a.appointment_date.substring(5, 7)}/${a.appointment_date.substring(8, 10)}</span>
            <span class="text-xs font-extrabold text-blue-600">${a.appointment_time.substring(0, 5)}</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-sm text-slate-800">${a.patient_name}</h4>
              <span class="text-xs text-slate-400 font-mono">(${a.patient_code})</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${this.getApptStatusBadge(a.status)}">${a.status}</span>
            </div>
            <p class="text-xs text-slate-600 mt-0.5"><strong>${a.treatment_type}:</strong> ${a.reason_for_visit}</p>
            ${a.notes ? `<p class="text-[11px] text-slate-400 italic mt-0.5">Notes: ${a.notes}</p>` : ''}
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto">
          <select onchange="app.changeApptStatus(${a.id}, this.value)" class="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold">
            <option value="Scheduled" ${a.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
            <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${a.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            <option value="Waiting List" ${a.status === 'Waiting List' ? 'selected' : ''}>Waiting List</option>
          </select>
          <button onclick="app.deleteAppointment(${a.id})" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50" title="Delete">
            ✕
          </button>
        </div>
      </div>
    `).join('');
  }

  async changeApptStatus(id, newStatus) {
    await window.clinidentStore.updateAppointmentStatus(id, newStatus);
    this.renderAppointments();
    this.showToast(`Appointment status updated to ${newStatus}`);
  }

  async deleteAppointment(id) {
    if (confirm('Delete this appointment?')) {
      await window.clinidentStore.deleteAppointment(id);
      this.renderAppointments();
      this.showToast('Appointment deleted.');
    }
  }

  // -----------------------------------------------------------
  // 4. Clinical Notes View
  // -----------------------------------------------------------
  renderClinicalNotes() {
    const container = document.getElementById('clinicalNotesContainer');
    if (!container) return;

    const list = window.clinidentStore.clinicalNotes.filter(n => n.patient_id == this.activePatientId);
    if (list.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200">No clinical notes recorded for this patient yet. Use the form above to add a SOAP note.</div>`;
      return;
    }

    container.innerHTML = list.map(n => `
      <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
          <div>
            <h4 class="font-bold text-sm sm:text-base text-navyDark">${n.procedure_title}</h4>
            <span class="text-xs text-slate-400">Date: ${n.note_date} • Anesthesia: <span class="font-semibold text-slate-700">${n.anesthesia_used || 'None'}</span></span>
          </div>
          <span class="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 self-start sm:self-auto">Verified Doctor Note</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span class="font-bold text-blue-700 block mb-1">Subjective (S)</span>
            <p class="text-slate-600">${n.subjective || 'N/A'}</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span class="font-bold text-teal-700 block mb-1">Objective (O)</span>
            <p class="text-slate-600">${n.objective || 'N/A'}</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span class="font-bold text-purple-700 block mb-1">Assessment (A)</span>
            <p class="text-slate-600 font-semibold">${n.assessment || 'N/A'}</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span class="font-bold text-amber-700 block mb-1">Plan (P)</span>
            <p class="text-slate-600">${n.plan || 'N/A'}</p>
          </div>
        </div>

        ${n.voice_transcription ? `
          <div class="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <span>🎙️ <strong>Voice Dictation Log:</strong></span>
            <span class="italic text-slate-600">"${n.voice_transcription}"</span>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // -----------------------------------------------------------
  // 5. Prescriptions View
  // -----------------------------------------------------------
  renderPrescriptions() {
    const container = document.getElementById('prescriptionsListContainer');
    if (!container) return;

    const list = window.clinidentStore.prescriptions.filter(rx => rx.patient_id == this.activePatientId);
    if (list.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200">No prescriptions generated for this patient yet.</div>`;
      return;
    }

    container.innerHTML = list.map(rx => `
      <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-blue-600 text-sm">${rx.rx_number}</span>
              <span class="text-xs text-slate-400">• Date: ${rx.rx_date}</span>
            </div>
            <h4 class="font-bold text-sm text-slate-800 mt-0.5">Diagnosis: ${rx.diagnosis}</h4>
          </div>
          <button onclick="app.printPrescription(${rx.id})" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm">
            <svg class="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span>Print Rx Slip</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th class="p-2.5">#</th>
                <th class="p-2.5">Medication Name</th>
                <th class="p-2.5">Dosage</th>
                <th class="p-2.5">Frequency</th>
                <th class="p-2.5">Duration</th>
                <th class="p-2.5">Instructions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${rx.medications.map((m, idx) => `
                <tr>
                  <td class="p-2.5 text-slate-400">${idx + 1}</td>
                  <td class="p-2.5 font-bold text-slate-800">${m.drug_name}</td>
                  <td class="p-2.5 text-blue-600">${m.dosage}</td>
                  <td class="p-2.5">${m.frequency}</td>
                  <td class="p-2.5">${m.duration}</td>
                  <td class="p-2.5 text-slate-500">${m.instructions}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${rx.doctor_advice ? `
          <div class="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
            <strong>Doctor's Advice:</strong> ${rx.doctor_advice}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  printPrescription(id) {
    const rx = window.clinidentStore.prescriptions.find(r => r.id == id);
    if (!rx) return;

    const patient = window.clinidentStore.getPatientById(rx.patient_id);
    const doctor = window.clinidentStore.doctor;

    const printArea = document.getElementById('prescriptionPrintContainer');
    if (!printArea) return;

    printArea.innerHTML = `
      <div class="max-w-2xl mx-auto p-8 bg-white border border-slate-300 rounded-2xl font-sans text-slate-800 space-y-6">
        <!-- Clinic Header -->
        <div class="flex items-center justify-between pb-4 border-b-2 border-blue-600">
          <div>
            <h2 class="font-extrabold text-2xl text-blue-600 tracking-tight">${doctor.clinic_name}</h2>
            <p class="text-xs text-slate-600 font-medium">${doctor.clinic_address}</p>
            <p class="text-xs text-slate-500">Phone: ${doctor.phone} • Email: ${doctor.email}</p>
          </div>
          <div class="text-right">
            <h3 class="font-bold text-sm text-slate-800">${doctor.name}</h3>
            <p class="text-xs text-slate-500">${doctor.specialization}</p>
            <span class="text-[10px] font-mono text-slate-400">Reg: DENT-84920</span>
          </div>
        </div>

        <!-- Patient Demographics -->
        <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
          <div>
            <p><strong>Patient Name:</strong> ${patient.full_name}</p>
            <p><strong>Patient Code:</strong> ${patient.patient_code}</p>
          </div>
          <div class="text-right">
            <p><strong>Date:</strong> ${rx.rx_date}</p>
            <p><strong>Rx Ref:</strong> ${rx.rx_number}</p>
          </div>
        </div>

        <div class="text-xs font-bold text-slate-700">
          <span>Diagnosis: </span><span class="text-blue-600 font-bold">${rx.diagnosis}</span>
        </div>

        <!-- Rx Symbol & Table -->
        <div class="space-y-2">
          <div class="text-2xl font-serif font-black text-blue-600">℞</div>
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-300 font-bold text-slate-700">
                <th class="py-2">Medication</th>
                <th class="py-2">Dosage</th>
                <th class="py-2">Frequency</th>
                <th class="py-2">Duration</th>
                <th class="py-2">Instructions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${rx.medications.map(m => `
                <tr>
                  <td class="py-2.5 font-bold">${m.drug_name}</td>
                  <td class="py-2.5">${m.dosage}</td>
                  <td class="py-2.5">${m.frequency}</td>
                  <td class="py-2.5">${m.duration}</td>
                  <td class="py-2.5 text-slate-500">${m.instructions}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${rx.doctor_advice ? `
          <div class="text-xs text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong>Special Advice:</strong> ${rx.doctor_advice}
          </div>
        ` : ''}

        <!-- Signature -->
        <div class="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
          <span class="text-slate-400">Valid for 30 days from date of issue</span>
          <div class="text-center">
            <div class="w-36 border-b border-slate-400 pb-1 mb-1 font-serif italic text-blue-600 text-sm">Dr. S. Mitchell</div>
            <span class="font-bold text-slate-600">Authorized Signature</span>
          </div>
        </div>
      </div>
    `;

    window.print();
  }

  // -----------------------------------------------------------
  // 6. Dental Imaging View
  // -----------------------------------------------------------
  renderImagingGallery() {
    const container = document.getElementById('imagingGalleryContainer');
    if (!container) return;

    const list = window.clinidentStore.dentalImages.filter(img => img.patient_id == this.activePatientId);
    if (list.length === 0) {
      container.innerHTML = `<p class="p-8 text-center text-slate-400 text-xs italic col-span-full">No dental images or 3D scans uploaded for this patient.</p>`;
      return;
    }

    container.innerHTML = list.map(img => `
      <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
        <div class="h-44 bg-slate-900 flex items-center justify-center relative overflow-hidden">
          ${img.image_type === 'STL' ? `
            <div class="text-center text-teal-400 p-4">
              <span class="text-4xl block mb-2">🧊</span>
              <span class="text-xs font-bold uppercase">3D STL Scan Mesh</span>
              <p class="text-[10px] text-slate-400 mt-1">${img.file_name}</p>
            </div>
          ` : `
            <svg class="w-full h-full opacity-60" viewBox="0 0 200 120" fill="none">
              <rect width="200" height="120" fill="#0f172a"/>
              <path d="M40 100 C40 50 60 20 80 20 C100 20 110 50 110 100 Z" fill="#94a3b8" opacity="0.9"/>
              <path d="M120 100 C120 60 140 30 160 30 C180 30 190 60 190 100 Z" fill="#cbd5e1" opacity="0.95"/>
            </svg>
          `}
          <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
            ${img.image_type}
          </span>
        </div>

        <div class="p-4 space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-xs text-slate-800 truncate" title="${img.file_name}">${img.file_name}</h4>
            <span class="text-[10px] text-slate-400 font-mono">${img.file_size_kb} KB</span>
          </div>
          <p class="text-[11px] text-slate-500">${img.stage} • ${img.notes || 'No notes'}</p>
          <div class="pt-2 flex items-center justify-between border-t border-slate-100">
            ${img.image_type === 'STL' ? `
              <button onclick="window.stlViewer.loadScan('${img.file_name}')" class="text-xs font-bold text-teal-600 hover:underline">
                View in 3D &rarr;
              </button>
            ` : `
              <button onclick="app.navigateTo('ai-analysis')" class="text-xs font-bold text-blue-600 hover:underline">
                Analyze with AI &rarr;
              </button>
            `}
            <span class="text-[10px] text-slate-400">${img.uploaded_at.substring(0, 10)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // -----------------------------------------------------------
  // 7. Reports & Analytics View
  // -----------------------------------------------------------
  renderReports() {
    const store = window.clinidentStore;
    document.getElementById('repTotalPatients')?.replaceChildren(document.createTextNode(store.patients.length));
    document.getElementById('repTotalAppts')?.replaceChildren(document.createTextNode(store.appointments.length));
    document.getElementById('repTotalRx')?.replaceChildren(document.createTextNode(store.prescriptions.length));
    document.getElementById('repTotalImages')?.replaceChildren(document.createTextNode(store.dentalImages.length));
  }

  // -----------------------------------------------------------
  // 8. Settings View
  // -----------------------------------------------------------
  renderSettings() {
    const doc = window.clinidentStore.doctor;
    const nameIn = document.getElementById('setDoctorName');
    const emailIn = document.getElementById('setDoctorEmail');
    const clinicIn = document.getElementById('setClinicName');
    const addrIn = document.getElementById('setClinicAddress');
    const phoneIn = document.getElementById('setPhone');

    if (nameIn) nameIn.value = doc.name;
    if (emailIn) emailIn.value = doc.email;
    if (clinicIn) clinicIn.value = doc.clinic_name;
    if (addrIn) addrIn.value = doc.clinic_address;
    if (phoneIn) phoneIn.value = doc.phone;
  }

  saveSettings() {
    const updated = {
      name: document.getElementById('setDoctorName').value,
      email: document.getElementById('setDoctorEmail').value,
      clinic_name: document.getElementById('setClinicName').value,
      clinic_address: document.getElementById('setClinicAddress').value,
      phone: document.getElementById('setPhone').value
    };

    window.clinidentStore.doctor = { ...window.clinidentStore.doctor, ...updated };
    window.clinidentStore.saveLocal('clinident_doctor_session', window.clinidentStore.doctor);
    this.updateDoctorProfileHeader();
    this.showToast('Doctor & Clinic settings saved successfully.');
  }

  // -----------------------------------------------------------
  // Modals & Forms Management
  // -----------------------------------------------------------
  setupModals() {
    // Add Patient Form
    document.getElementById('formAddPatient')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const patientData = {
        full_name: document.getElementById('newPatientName').value,
        gender: document.getElementById('newPatientGender').value,
        dob: document.getElementById('newPatientDob').value,
        age: parseInt(document.getElementById('newPatientAge').value, 10),
        phone: document.getElementById('newPatientPhone').value,
        email: document.getElementById('newPatientEmail').value,
        blood_group: document.getElementById('newPatientBlood').value,
        address: document.getElementById('newPatientAddress').value,
        emergency_contact_name: document.getElementById('newPatientEmName').value,
        emergency_contact_phone: document.getElementById('newPatientEmPhone').value,
        medical_history: document.getElementById('newPatientMedHist').value,
        dental_history: document.getElementById('newPatientDentHist').value,
        allergies: document.getElementById('newPatientAllergies').value || 'No known allergies'
      };

      await window.clinidentStore.addPatient(patientData);
      this.toggleModal('modalAddPatient', false);
      this.setupPatientSelector();
      this.renderPatientsList();
      this.showToast(`Patient ${patientData.full_name} registered successfully.`);
    });

    // Book Appointment Form
    document.getElementById('formBookAppointment')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const apptData = {
        patient_id: parseInt(document.getElementById('bookApptPatientId').value, 10),
        appointment_date: document.getElementById('bookApptDate').value,
        appointment_time: document.getElementById('bookApptTime').value,
        duration_minutes: parseInt(document.getElementById('bookApptDuration').value, 10),
        treatment_type: document.getElementById('bookApptTreatment').value,
        reason_for_visit: document.getElementById('bookApptReason').value,
        notes: document.getElementById('bookApptNotes').value
      };

      await window.clinidentStore.addAppointment(apptData);
      this.toggleModal('modalBookAppointment', false);
      this.renderAppointments();
      this.renderDashboard();
      this.showToast('Appointment scheduled successfully.');
    });

    // Clinical SOAP Note Form
    document.getElementById('formAddSoapNote')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const noteData = {
        patient_id: this.activePatientId,
        procedure_title: document.getElementById('soapTitle').value,
        subjective: document.getElementById('soapSubjective').value,
        objective: document.getElementById('soapObjective').value,
        assessment: document.getElementById('soapAssessment').value,
        plan: document.getElementById('soapPlan').value,
        anesthesia_used: document.getElementById('soapAnesthesia').value,
        voice_transcription: document.getElementById('soapVoiceText')?.value || ''
      };

      await window.clinidentStore.addClinicalNote(noteData);
      this.renderClinicalNotes();
      e.target.reset();
      this.showToast('Clinical SOAP Note recorded.');
    });

    // Add Prescription Form
    document.getElementById('formNewPrescription')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const medications = [];
      document.querySelectorAll('.med-row').forEach(row => {
        const drug = row.querySelector('.med-drug-name')?.value;
        if (drug) {
          medications.push({
            drug_name: drug,
            dosage: row.querySelector('.med-dosage')?.value || '500 mg',
            frequency: row.querySelector('.med-frequency')?.value || '1-0-1',
            duration: row.querySelector('.med-duration')?.value || '5 Days',
            instructions: row.querySelector('.med-instructions')?.value || 'After food'
          });
        }
      });

      if (medications.length === 0) {
        alert('Please add at least one medication.');
        return;
      }

      const rxData = {
        patient_id: this.activePatientId,
        diagnosis: document.getElementById('newRxDiagnosis').value,
        medications: medications,
        doctor_advice: document.getElementById('newRxAdvice').value
      };

      await window.clinidentStore.addPrescription(rxData);
      this.toggleModal('modalNewPrescription', false);
      this.renderPrescriptions();
      this.showToast('Prescription generated successfully.');
    });
  }

  toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  openAddPatientModal() {
    this.toggleModal('modalAddPatient', true);
  }

  openBookAppointmentModal() {
    const select = document.getElementById('bookApptPatientId');
    if (select) {
      select.innerHTML = window.clinidentStore.patients.map(p => `
        <option value="${p.id}" ${p.id == this.activePatientId ? 'selected' : ''}>
          ${p.full_name} (${p.patient_code})
        </option>
      `).join('');
    }
    this.toggleModal('modalBookAppointment', true);
  }

  openNewPrescriptionModal() {
    const p = window.clinidentStore.getPatientById(this.activePatientId);
    document.getElementById('newRxPatientNameDisplay')?.replaceChildren(document.createTextNode(p.full_name));
    this.toggleModal('modalNewPrescription', true);
  }

  addMedicationRow() {
    const container = document.getElementById('medicationRowsContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'med-row grid grid-cols-1 sm:grid-cols-5 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200';
    row.innerHTML = `
      <input type="text" placeholder="Drug Name (e.g. Amoxicillin)" class="med-drug-name p-2 rounded-lg border border-slate-300 text-xs font-bold" required>
      <input type="text" placeholder="Dosage (500mg)" class="med-dosage p-2 rounded-lg border border-slate-300 text-xs">
      <input type="text" placeholder="Freq (1-0-1)" class="med-frequency p-2 rounded-lg border border-slate-300 text-xs">
      <input type="text" placeholder="Duration (5 Days)" class="med-duration p-2 rounded-lg border border-slate-300 text-xs">
      <div class="flex items-center gap-1">
        <input type="text" placeholder="Instructions" class="med-instructions p-2 rounded-lg border border-slate-300 text-xs flex-1">
        <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-rose-500 font-bold p-1">✕</button>
      </div>
    `;
    container.appendChild(row);
  }

  getApptStatusBadge(status) {
    switch (status) {
      case 'Completed': return 'bg-teal-100 text-teal-800 border border-teal-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'Waiting List': return 'bg-amber-100 text-amber-800 border border-amber-200';
      default: return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700 z-50 flex items-center gap-2 animate-bounce';
    toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-400"></span> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }
}

// Global App Instance
window.app = new ClinidentApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
