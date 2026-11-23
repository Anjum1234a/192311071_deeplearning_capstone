/**
 * CLINIDENT - Visual Interactive Odontogram Module
 * Adult 32 Teeth (FDI Two-Digit Standard)
 */

class OdontogramModule {
  constructor() {
    this.selectedToothNumber = 16;
    this.currentPatientId = 1;
  }

  init(patientId = 1) {
    this.currentPatientId = patientId;
    this.renderArch('odontogramUpperArch', [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]);
    this.renderArch('odontogramLowerArch', [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]);
    this.selectTooth(this.selectedToothNumber);
    this.updateSummaryCounters();
  }

  renderArch(containerId, teethList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chart = window.clinidentStore.getDentalChart(this.currentPatientId);
    const teethMap = {};
    chart.forEach(t => teethMap[t.tooth_number] = t);

    container.innerHTML = teethList.map(num => {
      const tooth = teethMap[num] || { condition_state: 'healthy', surfaces: 'O' };
      const cond = tooth.condition_state || 'healthy';
      const isSelected = num === this.selectedToothNumber ? 'selected' : '';

      return `
        <div class="tooth-item tooth-cond-${cond} ${isSelected}" data-tooth="${num}" onclick="window.odontogram.selectTooth(${num})">
          <span class="tooth-num">#${num}</span>
          <div class="tooth-icon">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.5 2 6 5 6 9c0 4 2 8 3 11 0 .6.4 1 1 1h4c.6 0 1-.4 1-1 1-3 3-7 3-11 0-4-2.5-7-6-7z"/>
            </svg>
          </div>
          <span class="text-[8px] uppercase font-bold text-slate-500">${this.getConditionShort(cond)}</span>
        </div>
      `;
    }).join('');
  }

  getConditionShort(cond) {
    switch (cond) {
      case 'caries': return 'Car';
      case 'filled': return 'Fil';
      case 'crown': return 'Crn';
      case 'missing': return 'Mis';
      case 'rct': return 'RCT';
      default: return 'OK';
    }
  }

  selectTooth(toothNumber) {
    this.selectedToothNumber = toothNumber;

    // Highlight selected tooth box
    document.querySelectorAll('.tooth-item').forEach(el => {
      el.classList.remove('selected');
      if (parseInt(el.getAttribute('data-tooth'), 10) === toothNumber) {
        el.classList.add('selected');
      }
    });

    const chart = window.clinidentStore.getDentalChart(this.currentPatientId);
    const tooth = chart.find(t => t.tooth_number == toothNumber) || {
      tooth_number: toothNumber,
      condition_state: 'healthy',
      surfaces: 'O',
      pocket_depth_mm: 2,
      mobility_grade: 0,
      endodontic_status: 'Vital',
      notes: ''
    };

    // Update Inspector Form
    const nameEl = document.getElementById('inspectToothName');
    const badgeEl = document.getElementById('inspectToothBadge');
    const pocketSlider = document.getElementById('toothPocketDepth');
    const pocketVal = document.getElementById('pocketDepthDisplay');
    const mobilitySelect = document.getElementById('toothMobility');
    const endoSelect = document.getElementById('toothEndoStatus');
    const notesInput = document.getElementById('toothNotesInput');

    if (nameEl) nameEl.textContent = `Tooth #${toothNumber} (${this.getAnatomicalName(toothNumber)})`;
    if (badgeEl) {
      badgeEl.textContent = (tooth.condition_state || 'healthy').toUpperCase();
      badgeEl.className = `text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${this.getBadgeClass(tooth.condition_state)}`;
    }
    if (pocketSlider) pocketSlider.value = tooth.pocket_depth_mm || 2;
    if (pocketVal) pocketVal.textContent = `${tooth.pocket_depth_mm || 2} mm`;
    if (mobilitySelect) mobilitySelect.value = tooth.mobility_grade || 0;
    if (endoSelect) endoSelect.value = tooth.endodontic_status || 'Vital';
    if (notesInput) notesInput.value = tooth.notes || '';

    // Surface checkboxes
    const surfaces = tooth.surfaces || 'O';
    ['M', 'O', 'D', 'B', 'L'].forEach(s => {
      const chk = document.getElementById(`surf_${s}`);
      if (chk) chk.checked = surfaces.includes(s);
    });

    // Update active condition button styling
    document.querySelectorAll('.btn-tooth-cond').forEach(btn => {
      const cond = btn.getAttribute('data-cond');
      if (cond === tooth.condition_state) {
        btn.classList.add('ring-2', 'ring-blue-600', 'font-extrabold');
      } else {
        btn.classList.remove('ring-2', 'ring-blue-600', 'font-extrabold');
      }
    });
  }

  async setCondition(conditionState) {
    const toothNumber = this.selectedToothNumber;
    await window.clinidentStore.updateTooth(this.currentPatientId, toothNumber, {
      condition_state: conditionState
    });

    // Refresh UI
    this.renderArch('odontogramUpperArch', [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]);
    this.renderArch('odontogramLowerArch', [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]);
    this.selectTooth(toothNumber);
    this.updateSummaryCounters();
    window.app.showToast(`Tooth #${toothNumber} set to ${conditionState.toUpperCase()}`);
  }

  async saveToothDetails() {
    const toothNumber = this.selectedToothNumber;
    const surfaces = ['M', 'O', 'D', 'B', 'L']
      .filter(s => document.getElementById(`surf_${s}`)?.checked)
      .join('') || 'O';

    const pocketDepth = parseInt(document.getElementById('toothPocketDepth')?.value || 2, 10);
    const mobility = parseInt(document.getElementById('toothMobility')?.value || 0, 10);
    const endoStatus = document.getElementById('toothEndoStatus')?.value || 'Vital';
    const notes = document.getElementById('toothNotesInput')?.value || '';

    await window.clinidentStore.updateTooth(this.currentPatientId, toothNumber, {
      surfaces,
      pocket_depth_mm: pocketDepth,
      mobility_grade: mobility,
      endodontic_status: endoStatus,
      notes
    });

    window.app.showToast(`Details saved for Tooth #${toothNumber}`);
  }

  updateSummaryCounters() {
    const chart = window.clinidentStore.getDentalChart(this.currentPatientId);
    let counts = { healthy: 0, caries: 0, filled: 0, crown: 0, missing: 0, rct: 0 };
    chart.forEach(t => {
      const c = t.condition_state || 'healthy';
      if (counts[c] !== undefined) counts[c]++;
      else counts.healthy++;
    });

    document.getElementById('countHealthy')?.replaceChildren(document.createTextNode(counts.healthy));
    document.getElementById('countCaries')?.replaceChildren(document.createTextNode(counts.caries));
    document.getElementById('countFilled')?.replaceChildren(document.createTextNode(counts.filled));
    document.getElementById('countCrown')?.replaceChildren(document.createTextNode(counts.crown));
    document.getElementById('countMissing')?.replaceChildren(document.createTextNode(counts.missing));
    document.getElementById('countRCT')?.replaceChildren(document.createTextNode(counts.rct));
  }

  getAnatomicalName(fdi) {
    const quadrant = Math.floor(fdi / 10);
    const tooth = fdi % 10;
    const quadNames = { 1: "Maxillary Right", 2: "Maxillary Left", 3: "Mandibular Left", 4: "Mandibular Right" };
    const toothNames = {
      1: "Central Incisor", 2: "Lateral Incisor", 3: "Canine",
      4: "First Premolar", 5: "Second Premolar", 6: "First Molar",
      7: "Second Molar", 8: "Third Molar (Wisdom)"
    };
    return `${quadNames[quadrant] || ''} ${toothNames[tooth] || ''}`;
  }

  getBadgeClass(cond) {
    switch (cond) {
      case 'caries': return 'bg-rose-100 text-rose-700';
      case 'filled': return 'bg-blue-100 text-blue-700';
      case 'crown': return 'bg-amber-100 text-amber-700';
      case 'missing': return 'bg-slate-200 text-slate-700';
      case 'rct': return 'bg-purple-100 text-purple-700';
      default: return 'bg-teal-100 text-teal-700';
    }
  }
}

window.odontogram = new OdontogramModule();
