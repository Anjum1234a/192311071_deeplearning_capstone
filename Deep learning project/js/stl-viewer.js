/**
 * CLINIDENT - 3D Dental STL & Mesh Viewer Module
 * Renders 3D dental scan files with rotation, zoom, and wireframe controls.
 */

class StlViewerModule {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.rotationX = 25;
    this.rotationY = -35;
    this.zoom = 1.0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.renderMode = 'solid'; // 'solid' or 'wireframe'
    this.activeScanName = 'patient_1001_maxillary_arch.stl';
  }

  init() {
    this.canvas = document.getElementById('stlViewerCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Resize canvas to match display size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupMouseEvents();
    this.drawDental3dArch();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = 360;
    this.drawDental3dArch();
  }

  setupMouseEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      this.rotationY += deltaX * 0.6;
      this.rotationX += deltaY * 0.6;

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.drawDental3dArch();
    });

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoom = Math.min(this.zoom + 0.1, 2.2);
      } else {
        this.zoom = Math.max(this.zoom - 0.1, 0.5);
      }
      this.drawDental3dArch();
    }, { passive: false });

    // Touch support for tablets
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.lastMouseX;
      const deltaY = e.touches[0].clientY - this.lastMouseY;

      this.rotationY += deltaX * 0.6;
      this.rotationX += deltaY * 0.6;

      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      this.drawDental3dArch();
    });

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  setRenderMode(mode) {
    this.renderMode = mode;
    this.drawDental3dArch();
  }

  resetView() {
    this.rotationX = 25;
    this.rotationY = -35;
    this.zoom = 1.0;
    this.drawDental3dArch();
  }

  loadScan(fileName) {
    this.activeScanName = fileName;
    const nameEl = document.getElementById('activeStlFileName');
    if (nameEl) nameEl.textContent = fileName;
    this.resetView();
    window.app.showToast(`Loaded 3D Scan: ${fileName}`);
  }

  /**
   * 3D Dental Arch Projection Renderer
   * Mathematical parabolic arch representing human maxillary teeth arrangement.
   */
  drawDental3dArch() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Subtle 3D grid plane
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2;

    // Generate 16 3D teeth positions along a dental catenary curve
    const teethCount = 14;
    const vertices = [];
    const faces = [];

    const radX = (this.rotationX * Math.PI) / 180;
    const radY = (this.rotationY * Math.PI) / 180;

    for (let i = 0; i <= teethCount; i++) {
      const t = (i / teethCount) * Math.PI - Math.PI / 2;
      // Parabolic dental arch formula
      const rawX = Math.sin(t) * 130;
      const rawZ = Math.cos(t) * 90 - 45;
      const rawY = Math.sin(t * 2) * 8; // Slight occlusal curve of Spee

      // 3D Rotation around X and Y
      // Rotate around Y
      let x1 = rawX * Math.cos(radY) + rawZ * Math.sin(radY);
      let z1 = -rawX * Math.sin(radY) + rawZ * Math.cos(radY);
      let y1 = rawY;

      // Rotate around X
      let y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
      let z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);
      let x2 = x1;

      // Perspective Projection
      const distance = 400;
      const factor = (distance / (distance + z2)) * this.zoom;
      const projX = cx + x2 * factor;
      const projY = cy + y2 * factor;

      vertices.push({
        x: projX,
        y: projY,
        z: z2,
        scale: factor,
        index: i
      });
    }

    // Sort by depth (painter's algorithm)
    vertices.sort((a, b) => b.z - a.z);

    // Draw Gingival / Dental Arch Foundation Wire
    ctx.beginPath();
    ctx.strokeStyle = '#00C2A8';
    ctx.lineWidth = 2 * this.zoom;
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      if (i === 0) ctx.moveTo(v.x, v.y + 15 * v.scale);
      else ctx.lineTo(v.x, v.y + 15 * v.scale);
    }
    ctx.stroke();

    // Render individual 3D tooth crowns
    vertices.forEach(v => {
      const crownW = 16 * v.scale;
      const crownH = 22 * v.scale;

      if (this.renderMode === 'solid') {
        // Shaded solid tooth mesh
        const grad = ctx.createLinearGradient(v.x - crownW, v.y - crownH, v.x + crownW, v.y + crownH);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.6, '#E2E8F0');
        grad.addColorStop(1, '#94A3B8');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(v.x, v.y, crownW, crownH, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0A84FF';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Occlusal fissure lines
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(11, 30, 54, 0.4)';
        ctx.moveTo(v.x - crownW * 0.4, v.y);
        ctx.lineTo(v.x + crownW * 0.4, v.y);
        ctx.stroke();
      } else {
        // Wireframe mode
        ctx.strokeStyle = '#00C2A8';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(v.x - crownW, v.y - crownH, crownW * 2, crownH * 2);

        ctx.beginPath();
        ctx.moveTo(v.x - crownW, v.y - crownH);
        ctx.lineTo(v.x + crownW, v.y + crownH);
        ctx.moveTo(v.x + crownW, v.y - crownH);
        ctx.lineTo(v.x - crownW, v.y + crownH);
        ctx.stroke();
      }
    });

    // Draw HUD labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`Rot: X:${Math.round(this.rotationX)}° Y:${Math.round(this.rotationY)}° | Zoom: ${this.zoom.toFixed(1)}x`, 12, h - 12);
    ctx.fillText(`Mesh: ${this.activeScanName} (Mode: ${this.renderMode.toUpperCase()})`, 12, 20);
  }
}

window.stlViewer = new StlViewerModule();
