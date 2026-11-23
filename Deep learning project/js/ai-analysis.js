/**
 * CLINIDENT - AI-Assisted Radiograph Analysis & Image Comparison Module
 * Decision-Support Analytics (Not a confirmed medical diagnosis)
 */

class AiAnalysisModule {
  constructor() {
    this.currentPatientId = 1;
    this.selectedImageId = 1;
    this.activeAiResult = null;
    this.isScanning = false;
  }

  init(patientId = 1) {
    this.currentPatientId = patientId;
    this.initSliderComparison();
    this.loadPatientImagesForAi();
    this.renderHistory();
  }

  loadPatientImagesForAi() {
    const images = window.clinidentStore.dentalImages.filter(img => 
      img.patient_id == this.currentPatientId && img.image_type !== 'STL'
    );
    const selectEl = document.getElementById('aiImageSelector');
    if (!selectEl) return;

    if (images.length === 0) {
      selectEl.innerHTML = `<option value="">No 2D Radiographs available for this patient</option>`;
      return;
    }

    selectEl.innerHTML = images.map(img => `
      <option value="${img.id}">${img.image_type} - ${img.file_name} (${img.stage})</option>
    `).join('');

    this.selectedImageId = images[0].id;
    this.updatePreviewImage();
  }

  updatePreviewImage() {
    const selectEl = document.getElementById('aiImageSelector');
    if (selectEl) {
      this.selectedImageId = parseInt(selectEl.value, 10);
    }

    const previewContainer = document.getElementById('aiRadiographViewport');
    if (!previewContainer) return;

    // Reset bounding boxes
    document.querySelectorAll('.ai-detection-box').forEach(b => b.remove());

    const result = window.clinidentStore.aiAnalyses.find(a => a.image_id == this.selectedImageId);
    if (result) {
      this.renderAiFindings(result);
    } else {
      document.getElementById('aiSummaryStatus')?.replaceChildren(document.createTextNode('Ready for Analysis'));
    }
  }

  async runAnalysis() {
    if (this.isScanning) return;

    const selectEl = document.getElementById('aiImageSelector');
    const imgId = selectEl ? parseInt(selectEl.value, 10) : this.selectedImageId;

    if (!imgId) {
      window.app.showToast('Please select a 2D radiograph image (JPG/PNG).');
      return;
    }

    this.isScanning = true;
    const btn = document.getElementById('btnTriggerAiAnalysis');
    const laser = document.getElementById('aiRadiographLaser');
    const statusText = document.getElementById('aiSummaryStatus');

    if (btn) btn.disabled = true;
    if (laser) laser.classList.remove('hidden');
    if (statusText) statusText.textContent = 'Processing neural network inference...';

    // Clear existing boxes
    document.querySelectorAll('.ai-detection-box').forEach(b => b.remove());

    setTimeout(async () => {
      try {
        const result = await window.clinidentStore.runAiAnalysis(imgId, this.currentPatientId);
        this.renderAiFindings(result);
        this.renderHistory();
        window.app.showToast('AI Decision-Support Analysis complete. 2 regions flagged.');
      } catch (err) {
        window.app.showToast(err.message || 'Analysis error');
      } finally {
        this.isScanning = false;
        if (btn) btn.disabled = false;
        if (laser) laser.classList.add('hidden');
      }
    }, 1600);
  }

  renderAiFindings(result) {
    this.activeAiResult = result;
    const viewport = document.getElementById('aiRadiographViewport');
    if (!viewport) return;

    // Clear previous
    document.querySelectorAll('.ai-detection-box').forEach(b => b.remove());

    // Inject Bounding Boxes
    if (result.findings && result.findings.length > 0) {
      result.findings.forEach(f => {
        const box = document.createElement('div');
        box.className = 'ai-detection-box';
        box.style.left = `${f.box.x}%`;
        box.style.top = `${f.box.y}%`;
        box.style.width = `${f.box.width}%`;
        box.style.height = `${f.box.height}%`;

        box.innerHTML = `
          <div class="ai-box-tag">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <span>${f.label}: ${f.confidence}%</span>
          </div>
        `;
        viewport.appendChild(box);
      });
    }

    // Update Indicators
    document.getElementById('aiConfidenceScore')?.replaceChildren(document.createTextNode(`${result.confidence_score}%`));
    document.getElementById('aiProgressScore')?.replaceChildren(document.createTextNode(`${result.progress_score}%`));
    document.getElementById('aiCariesCount')?.replaceChildren(document.createTextNode(result.caries_count));
    document.getElementById('aiAlignmentStatus')?.replaceChildren(document.createTextNode(result.spacing_crowding_status));
    document.getElementById('aiMissingTeethStatus')?.replaceChildren(document.createTextNode(result.missing_teeth_detected));
    document.getElementById('aiSummaryStatus')?.replaceChildren(document.createTextNode(`Evaluation: ${result.status}`));

    // Findings List
    const findingsList = document.getElementById('aiDetailedFindingsList');
    if (findingsList) {
      findingsList.innerHTML = result.findings.map(f => `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <h5 class="font-bold text-xs text-slate-800">${f.label} (Tooth #${f.tooth})</h5>
            <p class="text-[11px] text-slate-500">${f.surface} • ${f.severity}</p>
          </div>
          <span class="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">${f.confidence}% Confidence</span>
        </div>
      `).join('');
    }
  }

  renderHistory() {
    const container = document.getElementById('aiHistoryContainer');
    if (!container) return;

    const list = window.clinidentStore.aiAnalyses.filter(a => a.patient_id == this.currentPatientId);
    if (list.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 italic">No past AI evaluations for this patient.</p>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-navyDark">${item.analysis_type}</span>
          <span class="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">${item.confidence_score}% Conf</span>
        </div>
        <p class="text-[11px] text-slate-500">${item.analyzed_at} • Flagged Caries: ${item.caries_count}</p>
        <p class="text-[10px] text-slate-400 italic">${item.decision_support_disclaimer || 'Decision-support reference only.'}</p>
      </div>
    `).join('');
  }

  /**
   * Before and After Comparison Drag Slider
   */
  initSliderComparison() {
    const container = document.getElementById('compSliderWrapper');
    const beforeImage = document.getElementById('compImgBefore');
    const handle = document.getElementById('compSliderHandle');

    if (!container || !beforeImage || !handle) return;

    let isDragging = false;

    const moveSlider = (clientX) => {
      const rect = container.getBoundingClientRect();
      let offsetX = clientX - rect.left;
      if (offsetX < 0) offsetX = 0;
      if (offsetX > rect.width) offsetX = rect.width;

      const percentage = (offsetX / rect.width) * 100;
      beforeImage.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    };

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      moveSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      moveSlider(e.clientX);
    });

    container.addEventListener('touchstart', (e) => {
      isDragging = true;
      if (e.touches[0]) moveSlider(e.touches[0].clientX);
    });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || !e.touches[0]) return;
      moveSlider(e.touches[0].clientX);
    });
  }
}

window.aiAnalysis = new AiAnalysisModule();
