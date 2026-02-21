
import {
  ATSPanel
} from '@/components/jobs/ATSPanel';
import {
  RiskPanel
} from '@/components/jobs/RiskPanel';
import {
  UpdateProfilePanel
} from '@/components/jobs/UpdateProfilePanel';
import { jobAggregator } from '@/services/job-aggregator';

export interface CountryBriefSignals {
  protests: number;
  militaryFlights: number;
  militaryVessels: number;
  outages: number;
  earthquakes: number;
  displacementOutflow: number;
  climateStress: number;
  conflictEvents: number;
  isTier1: boolean;
}

export class App {
  private container: HTMLElement;
  private atsPanel: ATSPanel;
  private riskPanel: RiskPanel;
  private profilePanel: UpdateProfilePanel;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container ${containerId} not found`);
    this.container = el;

    // Initialize Panels
    this.atsPanel = new ATSPanel();
    this.riskPanel = new RiskPanel();
    this.profilePanel = new UpdateProfilePanel();
  }

  public async init(): Promise<void> {
    // Start job aggregation polling
    jobAggregator.startPolling();

    // Render Layout
    this.renderLayout();
  }

  private renderLayout() {
    // Clear skeleton
    this.container.innerHTML = '';

    // Create Main Layout Structure
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-left">
        <span class="logo">JOB MONITOR <span class="beta-badge">INTELLIGENCE</span></span>
      </div>
      <div class="header-right">
        <span id="headerClock" class="clock"></span>
      </div>
    `;

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Dashboard Grid
    const grid = document.createElement('div');
    grid.className = 'panels-grid';

    // Append Panels to Grid
    // ATS Panel (main job tracking)
    grid.appendChild(this.atsPanel.getElement());
    grid.appendChild(this.riskPanel.getElement());
    grid.appendChild(this.profilePanel.getElement());

    mainContent.appendChild(grid);
    this.container.appendChild(header);
    this.container.appendChild(mainContent);

    // Start Clock
    this.startClock();
  }

  private startClock() {
    const el = document.getElementById('headerClock');
    if (el) {
      setInterval(() => {
        el.textContent = new Date().toLocaleTimeString();
      }, 1000);
    }
  }
}
