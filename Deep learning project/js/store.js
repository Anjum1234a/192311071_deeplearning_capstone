/**
 * CLINIDENT - Data Store & Backend Synchronization Layer
 * Communicates with PHP REST APIs, with automatic client storage caching.
 */

class ClinidentStore {
  constructor() {
    this.apiBase = 'api';
    this.isOnlineApi = false;
    this.doctor = null;
    this.patients = [];
    this.appointments = [];
    this.dentalCharts = {}; // patient_id -> teeth array
    this.clinicalNotes = [];
    this.prescriptions = [];
    this.dentalImages = [];
    this.aiAnalyses = [];
    this.activePatientId = 1; // Default to Patient 1 (James Anderson)
  }

  async init() {
    // 1. Check local session
    const savedDoctor = localStorage.getItem('clinident_doctor_session');
    if (savedDoctor) {
      try {
        this.doctor = JSON.parse(savedDoctor);
      } catch (e) {
        this.doctor = this.getDefaultDoctor();
      }
    } else {
      this.doctor = this.getDefaultDoctor();
    }

    // 2. Initialize default sample datasets if empty
    this.initDefaultSeedData();

    // 3. Probe PHP backend
    try {
      const resp = await fetch(`${this.apiBase}/auth.php?action=check`, { method: 'GET' });
      if (resp.ok) {
        const result = await resp.json();
        if (result.success) {
          this.isOnlineApi = true;
          console.log('CLINIDENT: Connected to PHP REST backend successfully.');
          await this.syncWithBackend();
        }
      }
    } catch (e) {
      console.info('CLINIDENT: Running in local client mode (XAMPP backend offline or static server). Full CRUD enabled.');
    }
  }

  getDefaultDoctor() {
    return {
      id: 1,
      name: 'Dr. Sarah Mitchell, BDS, MDS',
      email: 'doctor@clinident.com',
      specialization: 'Consultant Dental Surgeon & Implantologist',
      clinic_name: 'CLINIDENT Advanced Dental Care',
      clinic_address: 'Suite 402, Metro Healthcare Towers, MG Road, Bengaluru, 560001',
      phone: '+91 98765 43210'
    };
  }

  initDefaultSeedData() {
    // Patients
    const savedPatients = localStorage.getItem('clinident_patients');
    if (!savedPatients) {
      this.patients = [
        {
          id: 1,
          doctor_id: 1,
          patient_code: 'CD-1001',
          full_name: 'James Anderson',
          gender: 'Male',
          dob: '1988-06-14',
          age: 36,
          phone: '+91 98450 11223',
          email: 'james.anderson@example.com',
          blood_group: 'A+',
          address: '12 Elm Street, Indiranagar, Bengaluru',
          emergency_contact_name: 'Emily Anderson (Spouse)',
          emergency_contact_phone: '+91 98450 99887',
          medical_history: 'Mild Hypertension (Under Medication: Telmisartan 20mg)',
          dental_history: 'Composite restoration on #14, routine scaling 1 year ago',
          allergies: 'Penicillin (Skin Rash)',
          consent_signed: 1,
          status: 'Active',
          created_at: '2026-01-10 10:00:00'
        },
        {
          id: 2,
          doctor_id: 1,
          patient_code: 'CD-1002',
          full_name: 'Priya Sharma',
          gender: 'Female',
          dob: '1995-11-23',
          age: 29,
          phone: '+91 98761 22334',
          email: 'priya.sharma@example.com',
          blood_group: 'B+',
          address: '404 Green Valley, Koramangala, Bengaluru',
          emergency_contact_name: 'Rajesh Sharma (Father)',
          emergency_contact_phone: '+91 98761 88776',
          medical_history: 'No known systemic illnesses',
          dental_history: 'Orthodontic braces treatment completed in 2018',
          allergies: 'No known drug allergies',
          consent_signed: 1,
          status: 'Active',
          created_at: '2026-02-14 11:30:00'
        },
        {
          id: 3,
          doctor_id: 1,
          patient_code: 'CD-1003',
          full_name: 'Robert Chen',
          gender: 'Male',
          dob: '1976-03-08',
          age: 48,
          phone: '+91 97400 33445',
          email: 'robert.chen@example.com',
          blood_group: 'O+',
          address: '78 Palm Avenue, Whitefield, Bengaluru',
          emergency_contact_name: 'Linda Chen (Wife)',
          emergency_contact_phone: '+91 97400 66554',
          medical_history: 'Type 2 Diabetes (HbA1c 6.8% under control)',
          dental_history: 'Root Canal on #36 with PFM Crown in 2021',
          allergies: 'Latex Gloves (Mild erythema)',
          consent_signed: 1,
          status: 'Active',
          created_at: '2026-03-01 14:00:00'
        },
        {
          id: 4,
          doctor_id: 1,
          patient_code: 'CD-1004',
          full_name: 'Ananya Deshmukh',
          gender: 'Female',
          dob: '2001-09-17',
          age: 23,
          phone: '+91 99160 44556',
          email: 'ananya.d@example.com',
          blood_group: 'AB+',
          address: '22 Lakeview Road, HSR Layout, Bengaluru',
          emergency_contact_name: 'Meera Deshmukh (Mother)',
          emergency_contact_phone: '+91 99160 55667',
          medical_history: 'Asthmatic (Carries Salbutamol inhaler)',
          dental_history: 'Mild gingivitis, wisdom tooth eruption pain on #48',
          allergies: 'No known drug allergies',
          consent_signed: 1,
          status: 'Active',
          created_at: '2026-04-12 16:00:00'
        }
      ];
      this.saveLocal('clinident_patients', this.patients);
    } else {
      this.patients = JSON.parse(savedPatients);
    }

    // Appointments
    const savedAppts = localStorage.getItem('clinident_appointments');
    const todayStr = new Date().toISOString().split('T')[0];
    if (!savedAppts) {
      this.appointments = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          patient_name: 'James Anderson',
          patient_code: 'CD-1001',
          patient_phone: '+91 98450 11223',
          appointment_date: todayStr,
          appointment_time: '10:00',
          duration_minutes: 45,
          reason_for_visit: 'Severe pain on upper right molar with cold sensitivity',
          treatment_type: 'Root Canal Therapy',
          status: 'Scheduled',
          notes: 'Tooth #16 deep carious lesion. Patient informed of RCT stages.'
        },
        {
          id: 2,
          doctor_id: 1,
          patient_id: 2,
          patient_name: 'Priya Sharma',
          patient_code: 'CD-1002',
          patient_phone: '+91 98761 22334',
          appointment_date: todayStr,
          appointment_time: '11:30',
          duration_minutes: 30,
          reason_for_visit: 'Routine 6-month checkup and ultrasonic scaling',
          treatment_type: 'Oral Prophylaxis',
          status: 'Completed',
          notes: 'Scaling done. Minimal calculus, good plaque control.'
        },
        {
          id: 3,
          doctor_id: 1,
          patient_id: 3,
          patient_name: 'Robert Chen',
          patient_code: 'CD-1003',
          patient_phone: '+91 97400 33445',
          appointment_date: todayStr,
          appointment_time: '14:30',
          duration_minutes: 60,
          reason_for_visit: 'Crown prep & bite impression for lower molar',
          treatment_type: 'Crown Preparation',
          status: 'Scheduled',
          notes: 'Prep for zirconia crown on tooth #46.'
        },
        {
          id: 4,
          doctor_id: 1,
          patient_id: 4,
          patient_name: 'Ananya Deshmukh',
          patient_code: 'CD-1004',
          patient_phone: '+91 99160 44556',
          appointment_date: todayStr,
          appointment_time: '16:00',
          duration_minutes: 30,
          reason_for_visit: 'Impacted wisdom tooth consultation and OPG review',
          treatment_type: 'Oral Surgery Consult',
          status: 'Waiting List',
          notes: 'OPG shows horizontal impaction of tooth #48.'
        }
      ];
      this.saveLocal('clinident_appointments', this.appointments);
    } else {
      this.appointments = JSON.parse(savedAppts);
    }

    // Baseline Odontogram for Patient 1
    const savedCharts = localStorage.getItem('clinident_charts');
    if (!savedCharts) {
      this.dentalCharts[1] = this.generateBaselineOdontogram(1);
      this.saveLocal('clinident_charts', this.dentalCharts);
    } else {
      this.dentalCharts = JSON.parse(savedCharts);
    }

    // Clinical Notes
    const savedNotes = localStorage.getItem('clinident_clinical_notes');
    if (!savedNotes) {
      this.clinicalNotes = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          note_date: todayStr + ' 10:45:00',
          procedure_title: 'Endodontic Access & Biomechanical Preparation #16',
          subjective: 'Patient reports spontaneous, throbbing pain on upper right molar for the past 3 days, exacerbated by hot drinks.',
          objective: 'Intraoral exam reveals deep MOD caries on tooth #16. Tenderness to vertical percussion (+). Cold test produced lingering sharp pain >15 seconds. Periapical radiograph indicates radiolucency in coronal pulp chamber.',
          assessment: 'Symptomatic Irreversible Pulpitis with Symptomatic Apical Periodontitis on tooth #16.',
          plan: 'Local anesthesia administered. Rubber dam isolation placed. Access opening created; pulp extirpated. Working length determined (MB: 20mm, DB: 19.5mm, P: 21mm). Irrigated with 3% NaOCl and saline. Closed with Ca(OH)2 paste & Cavit temp restoration. Recalled in 48 hours for obturation.',
          anesthesia_used: '2% Lignocaine with 1:80000 Adrenaline (1.8ml PSA & Greater Palatine block)',
          voice_transcription: 'Voice recorded: access opened smoothly, three canals located mesiobuccal distobuccal and palatal, calcium hydroxide dressing placed.'
        }
      ];
      this.saveLocal('clinident_clinical_notes', this.clinicalNotes);
    } else {
      this.clinicalNotes = JSON.parse(savedNotes);
    }

    // Prescriptions
    const savedRx = localStorage.getItem('clinident_prescriptions');
    if (!savedRx) {
      this.prescriptions = [
        {
          id: 1,
          doctor_id: 1,
          patient_id: 1,
          patient_name: 'James Anderson',
          patient_code: 'CD-1001',
          rx_number: 'RX-2026-001',
          rx_date: todayStr,
          diagnosis: 'Acute Pulpitis #16 post access opening',
          medications: [
            { drug_name: 'Amoxicillin Capsules', dosage: '500 mg', frequency: '1-0-1 (Twice Daily)', duration: '5 Days', instructions: 'After meals' },
            { drug_name: 'Ibuprofen + Paracetamol', dosage: '400mg + 325mg', frequency: '1-1-1 (Thrice Daily)', duration: '3 Days', instructions: 'After food, for pain relief' },
            { drug_name: 'Chlorhexidine 0.2% Mouthwash', dosage: '10 ml', frequency: 'Twice Daily', duration: '7 Days', instructions: 'Rinse for 60 seconds after brushing' }
          ],
          doctor_advice: 'Avoid chewing hard foods on the upper right side until permanent crown is placed. Maintain gentle warm salt water rinses.'
        }
      ];
      this.saveLocal('clinident_prescriptions', this.prescriptions);
    } else {
      this.prescriptions = JSON.parse(savedRx);
    }

    // Dental Images & 3D Scans
    const savedImages = localStorage.getItem('clinident_images');
    if (!savedImages) {
      this.dentalImages = [
        {
          id: 1,
          patient_id: 1,
          image_type: 'IOPA',
          file_path: 'assets/sample_iopa_16.png',
          file_name: 'patient_1001_iopa_tooth16.png',
          file_size_kb: 420,
          tooth_number: 16,
          stage: 'Pre-Treatment',
          notes: 'Pre-operative IOPA showing coronal radiolucency on distal margin of tooth 16.',
          uploaded_at: todayStr + ' 09:30:00'
        },
        {
          id: 2,
          patient_id: 1,
          image_type: 'OPG',
          file_path: 'assets/sample_opg.png',
          file_name: 'patient_1001_panoramic_opg.png',
          file_size_kb: 1250,
          tooth_number: null,
          stage: 'Pre-Treatment',
          notes: 'Full mouth panoramic radiograph.',
          uploaded_at: todayStr + ' 09:35:00'
        },
        {
          id: 3,
          patient_id: 1,
          image_type: 'STL',
          file_path: 'uploads/stl/upper_arch_scan.stl',
          file_name: 'patient_1001_maxillary_arch.stl',
          file_size_kb: 3450,
          tooth_number: null,
          stage: 'Pre-Treatment',
          notes: '3D Optical Intraoral Scanner Mesh (Maxillary Arch).',
          uploaded_at: todayStr + ' 09:40:00'
        }
      ];
      this.saveLocal('clinident_images', this.dentalImages);
    } else {
      this.dentalImages = JSON.parse(savedImages);
    }

    // AI Analyses Records
    const savedAi = localStorage.getItem('clinident_ai_analyses');
    if (!savedAi) {
      this.aiAnalyses = [
        {
          id: 1,
          image_id: 1,
          patient_id: 1,
          analysis_type: 'Caries & Radiolucency Assessment',
          caries_count: 1,
          spacing_crowding_status: 'Normal Arch Alignment (Minor incisor overlap < 1mm)',
          missing_teeth_detected: 'Third Molar #38 Absent (Probable prior extraction)',
          progress_score: 88.5,
          confidence_score: 93.4,
          findings: [
            { label: 'Interproximal Caries', confidence: 93.4, tooth: 16, surface: 'Distal Enamel/Dentin', box: { x: 48, y: 36, width: 18, height: 22 } },
            { label: 'Periapical Radiolucency', confidence: 86.8, tooth: 16, surface: 'Mesiobuccal Root Apex', box: { x: 44, y: 72, width: 16, height: 18 } }
          ],
          decision_support_disclaimer: 'CLINIDENT AI provides assistive decision-support indications only. Clinical confirmation must be performed by the treating dental surgeon.',
          status: 'Demo Decision-Support Active',
          analyzed_at: todayStr + ' 10:15:00'
        }
      ];
      this.saveLocal('clinident_ai_analyses', this.aiAnalyses);
    } else {
      this.aiAnalyses = JSON.parse(savedAi);
    }
  }

  generateBaselineOdontogram(patientId) {
    const fdi = [
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
    ];
    return fdi.map(num => {
      let cond = 'healthy';
      let surf = 'O';
      let notes = '';
      if (num === 16) { cond = 'caries'; surf = 'MOD'; notes = 'Deep caries approaching pulp'; }
      if (num === 14) { cond = 'filled'; surf = 'DO'; notes = 'Composite filling (2022)'; }
      if (num === 26) { cond = 'crown'; surf = 'Full'; notes = 'PFM crown'; }
      if (num === 38) { cond = 'missing'; surf = 'None'; notes = 'Extracted in 2019'; }
      if (num === 46) { cond = 'caries'; surf = 'O'; notes = 'Pit and fissure decay'; }

      return {
        patient_id: patientId,
        tooth_number: num,
        condition_state: cond,
        surfaces: surf,
        pocket_depth_mm: cond === 'caries' ? 4 : 2,
        mobility_grade: 0,
        endodontic_status: num === 16 ? 'Symptomatic Pulpitis' : 'Vital',
        notes: notes
      };
    });
  }

  saveLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async syncWithBackend() {
    try {
      const pResp = await fetch(`${this.apiBase}/patients.php`);
      if (pResp.ok) {
        const pData = await pResp.json();
        if (pData.success && pData.data.length > 0) {
          this.patients = pData.data;
          this.saveLocal('clinident_patients', this.patients);
        }
      }

      const aResp = await fetch(`${this.apiBase}/appointments.php`);
      if (aResp.ok) {
        const aData = await aResp.json();
        if (aData.success && aData.data.length > 0) {
          this.appointments = aData.data;
          this.saveLocal('clinident_appointments', this.appointments);
        }
      }

      const sResp = await fetch(`${this.apiBase}/settings.php`);
      if (sResp.ok) {
        const sData = await sResp.json();
        if (sData.success && sData.data) {
          this.doctor = { ...this.doctor, ...sData.data };
          this.saveLocal('clinident_doctor_session', this.doctor);
        }
      }

      const imgResp = await fetch(`${this.apiBase}/imaging.php?patient_id=${this.activePatientId}`);
      if (imgResp.ok) {
        const imgData = await imgResp.json();
        if (imgData.success && imgData.data.length > 0) {
          this.dentalImages = imgData.data;
          this.saveLocal('clinident_images', this.dentalImages);
        }
      }
    } catch (e) {
      console.warn('Sync with MySQL failed, using local cache:', e);
    }
  }

  // -----------------------------------------------------------
  // Patient CRUD
  // -----------------------------------------------------------
  async addPatient(patientData) {
    // Generate code
    const count = this.patients.length + 1001;
    const newCode = 'CD-' + count;
    const newPatient = {
      id: Date.now(),
      doctor_id: 1,
      patient_code: newCode,
      ...patientData,
      status: 'Active',
      consent_signed: 1,
      created_at: new Date().toISOString()
    };

    if (this.isOnlineApi) {
      try {
        const resp = await fetch(`${this.apiBase}/patients.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData)
        });
        const res = await resp.json();
        if (res.success && res.data) {
          newPatient.id = res.data.id;
          newPatient.patient_code = res.data.patient_code;
        }
      } catch (e) {
        console.warn('Backend add failed, stored locally:', e);
      }
    }

    this.patients.unshift(newPatient);
    this.saveLocal('clinident_patients', this.patients);
    return newPatient;
  }

  async updatePatient(id, updatedFields) {
    const idx = this.patients.findIndex(p => p.id == id);
    if (idx !== -1) {
      this.patients[idx] = { ...this.patients[idx], ...updatedFields };
      this.saveLocal('clinident_patients', this.patients);

      if (this.isOnlineApi) {
        try {
          await fetch(`${this.apiBase}/patients.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updatedFields })
          });
        } catch (e) {}
      }
      return this.patients[idx];
    }
    return null;
  }

  async deletePatient(id) {
    this.patients = this.patients.filter(p => p.id != id);
    this.saveLocal('clinident_patients', this.patients);

    // Filter appointments
    this.appointments = this.appointments.filter(a => a.patient_id != id);
    this.saveLocal('clinident_appointments', this.appointments);

    if (this.isOnlineApi) {
      try {
        await fetch(`${this.apiBase}/patients.php?id=${id}`, { method: 'DELETE' });
      } catch (e) {}
    }
    return true;
  }

  getPatientById(id) {
    return this.patients.find(p => p.id == id) || this.patients[0];
  }

  // -----------------------------------------------------------
  // Appointments CRUD
  // -----------------------------------------------------------
  async addAppointment(apptData) {
    const patient = this.getPatientById(apptData.patient_id);
    const newAppt = {
      id: Date.now(),
      doctor_id: 1,
      patient_name: patient ? patient.full_name : 'Patient',
      patient_code: patient ? patient.patient_code : 'CD-000',
      patient_phone: patient ? patient.phone : '',
      status: 'Scheduled',
      ...apptData,
      created_at: new Date().toISOString()
    };

    if (this.isOnlineApi) {
      try {
        const resp = await fetch(`${this.apiBase}/appointments.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apptData)
        });
        const res = await resp.json();
        if (res.success && res.data) {
          newAppt.id = res.data.id;
        }
      } catch (e) {}
    }

    this.appointments.unshift(newAppt);
    this.saveLocal('clinident_appointments', this.appointments);
    return newAppt;
  }

  async updateAppointmentStatus(id, newStatus) {
    const appt = this.appointments.find(a => a.id == id);
    if (appt) {
      appt.status = newStatus;
      this.saveLocal('clinident_appointments', this.appointments);

      if (this.isOnlineApi) {
        try {
          await fetch(`${this.apiBase}/appointments.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
          });
        } catch (e) {}
      }
      return appt;
    }
    return null;
  }

  async deleteAppointment(id) {
    this.appointments = this.appointments.filter(a => a.id != id);
    this.saveLocal('clinident_appointments', this.appointments);

    if (this.isOnlineApi) {
      try {
        await fetch(`${this.apiBase}/appointments.php?id=${id}`, { method: 'DELETE' });
      } catch (e) {}
    }
    return true;
  }

  // -----------------------------------------------------------
  // Odontogram (Dental Chart)
  // -----------------------------------------------------------
  getDentalChart(patientId) {
    if (!this.dentalCharts[patientId]) {
      this.dentalCharts[patientId] = this.generateBaselineOdontogram(patientId);
      this.saveLocal('clinident_charts', this.dentalCharts);
    }
    return this.dentalCharts[patientId];
  }

  async updateTooth(patientId, toothNumber, updateData) {
    const chart = this.getDentalChart(patientId);
    const tooth = chart.find(t => t.tooth_number == toothNumber);
    if (tooth) {
      Object.assign(tooth, updateData);
      this.saveLocal('clinident_charts', this.dentalCharts);

      if (this.isOnlineApi) {
        try {
          await fetch(`${this.apiBase}/dental_chart.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patientId, tooth_number: toothNumber, ...updateData })
          });
        } catch (e) {}
      }
      return tooth;
    }
    return null;
  }

  // -----------------------------------------------------------
  // Clinical Notes & Prescriptions
  // -----------------------------------------------------------
  async addClinicalNote(noteData) {
    const newNote = {
      id: Date.now(),
      doctor_id: 1,
      note_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...noteData
    };

    if (this.isOnlineApi) {
      try {
        const resp = await fetch(`${this.apiBase}/clinical_notes.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData)
        });
        const res = await resp.json();
        if (res.success && res.data) {
          newNote.id = res.data.id;
        }
      } catch (e) {}
    }

    this.clinicalNotes.unshift(newNote);
    this.saveLocal('clinident_clinical_notes', this.clinicalNotes);
    return newNote;
  }

  async addPrescription(rxData) {
    const patient = this.getPatientById(rxData.patient_id);
    const count = this.prescriptions.length + 101;
    const newRx = {
      id: Date.now(),
      doctor_id: 1,
      patient_name: patient ? patient.full_name : 'Patient',
      patient_code: patient ? patient.patient_code : 'CD-000',
      rx_number: 'RX-' + new Date().getFullYear() + '-' + count,
      rx_date: new Date().toISOString().split('T')[0],
      ...rxData
    };

    if (this.isOnlineApi) {
      try {
        const resp = await fetch(`${this.apiBase}/prescriptions.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rxData)
        });
        const res = await resp.json();
        if (res.success && res.data) {
          newRx.id = res.data.id;
          newRx.rx_number = res.data.rx_number;
        }
      } catch (e) {}
    }

    this.prescriptions.unshift(newRx);
    this.saveLocal('clinident_prescriptions', this.prescriptions);
    return newRx;
  }

  // -----------------------------------------------------------
  // Imaging & AI Analysis
  // -----------------------------------------------------------
  async addDentalImage(imageData) {
    const newImg = {
      id: Date.now(),
      uploaded_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...imageData
    };

    if (this.isOnlineApi) {
      try {
        const formData = new FormData();
        for (const k in imageData) {
          if (imageData[k] !== undefined && imageData[k] !== null) {
            formData.append(k, imageData[k]);
          }
        }
        const resp = await fetch(`${this.apiBase}/imaging.php`, {
          method: 'POST',
          body: formData
        });
        const res = await resp.json();
        if (res.success && res.data) {
          newImg.id = res.data.id;
          if (res.data.file_path) newImg.file_path = res.data.file_path;
        }
      } catch (e) {
        console.warn('API imaging upload failed, cached locally:', e);
      }
    }

    this.dentalImages.unshift(newImg);
    this.saveLocal('clinident_images', this.dentalImages);
    return newImg;
  }

  async runAiAnalysis(imageId, patientId) {
    const img = this.dentalImages.find(i => i.id == imageId);
    if (img && (img.image_type === 'STL' || (img.file_name && img.file_name.endsWith('.stl')))) {
      throw new Error('AI analysis is only supported for 2D radiographs (JPG, JPEG, PNG). STL dental scans must be viewed in the 3D Scan Viewer section.');
    }

    let aiRecord = {
      id: Date.now(),
      image_id: imageId,
      patient_id: patientId,
      analysis_type: 'Caries & Alignment Assessment',
      caries_count: 1,
      spacing_crowding_status: 'Normal Arch Alignment (Minor incisor overlap < 1mm)',
      missing_teeth_detected: 'Third Molar #38 Absent (Probable prior extraction)',
      progress_score: 91.5,
      confidence_score: 94.2,
      findings: [
        { label: 'Interproximal Caries', confidence: 94.2, tooth: 16, surface: 'Distal Enamel/Dentin', box: { x: 48, y: 36, width: 18, height: 22 } },
        { label: 'Periapical Radiolucency', confidence: 87.5, tooth: 16, surface: 'Mesiobuccal Root Apex', box: { x: 44, y: 72, width: 16, height: 18 } }
      ],
      decision_support_disclaimer: 'CLINIDENT AI provides assistive decision-support indications only. Clinical confirmation must be performed by the treating dental surgeon.',
      status: 'Demo Decision-Support Active',
      analyzed_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    if (this.isOnlineApi) {
      try {
        const resp = await fetch(`${this.apiBase}/ai_analysis.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_id: imageId,
            patient_id: patientId,
            image_type: img ? img.image_type : 'IOPA',
            file_path: img ? img.file_path : ''
          })
        });
        const res = await resp.json();
        if (res.success && res.data) {
          const apiRec = res.data;
          aiRecord = {
            ...aiRecord,
            id: apiRec.id || aiRecord.id,
            caries_count: apiRec.caries_count ?? aiRecord.caries_count,
            spacing_crowding_status: apiRec.spacing_crowding_status || aiRecord.spacing_crowding_status,
            missing_teeth_detected: apiRec.missing_teeth_detected || aiRecord.missing_teeth_detected,
            progress_score: apiRec.progress_score || aiRecord.progress_score,
            confidence_score: apiRec.confidence_score || aiRecord.confidence_score,
            findings: apiRec.findings || aiRecord.findings,
            status: apiRec.status || aiRecord.status
          };
        }
      } catch (e) {
        console.warn('AI analysis API error, fallback active:', e);
      }
    }

    this.aiAnalyses.unshift(aiRecord);
    this.saveLocal('clinident_ai_analyses', this.aiAnalyses);
    return aiRecord;
  }
}

// Global Store Instance
window.clinidentStore = new ClinidentStore();
