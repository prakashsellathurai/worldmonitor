
import {
  JobBoardPanel
} from '@/components/jobs/JobBoardPanel';
import {
  ResumeAnalysisPanel
} from '@/components/jobs/ResumeAnalysisPanel';
import {
  RiskPanel
} from '@/components/jobs/RiskPanel';
import {
  PreparationPanel
} from '@/components/jobs/PreparationPanel';
import {
  UpdateProfilePanel
} from '@/components/jobs/UpdateProfilePanel';
import { jobService } from '@/services/job-monitor';

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
  private riskPanel: RiskPanel;
  private jobBoardPanel: JobBoardPanel;
  private resumePanel: ResumeAnalysisPanel;
  private prepPanel: PreparationPanel;
  private profilePanel: UpdateProfilePanel;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container ${containerId} not found`);
    this.container = el;

    // Initialize Panels
    this.riskPanel = new RiskPanel();
    this.jobBoardPanel = new JobBoardPanel();
    this.resumePanel = new ResumeAnalysisPanel();
    this.prepPanel = new PreparationPanel();
    this.profilePanel = new UpdateProfilePanel();
  }

  public async init(): Promise<void> {
    // Start services
    jobService.startPolling(); // Starts the 10m polling simulation

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
    // Risk Panel (Full Width if possible, or just first)
    grid.appendChild(this.riskPanel.getElement());
    grid.appendChild(this.jobBoardPanel.getElement());
    grid.appendChild(this.resumePanel.getElement());
    grid.appendChild(this.prepPanel.getElement());
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
