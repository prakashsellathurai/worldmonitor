
import { Panel } from '../Panel';

export class RiskPanel extends Panel {
  constructor() {
    super({
      id: 'career-risk',
      title: 'Career Risk Assessment',
      showCount: false,
    });
    this.render();
  }

  private render() {
    // Mock data
    const lastJobDate = new Date();
    lastJobDate.setMonth(lastJobDate.getMonth() - 2); // 2 months ago
    const daysSince = Math.floor((Date.now() - lastJobDate.getTime()) / (1000 * 60 * 60 * 24));

    const marketRisk: string = "Medium"; // Derived from job market volatility
    const riskFactor = 0.45; // 0-1

    this.setContent(`
      <div class="risk-dashboard">
        <div class="risk-metric">
          <span class="label">Days Since Last Role</span>
          <span class="value ${daysSince > 60 ? 'critical' : 'normal'}">${daysSince}</span>
        </div>
        <div class="risk-metric">
          <span class="label">Market Stability</span>
          <span class="value ${marketRisk === 'High' ? 'critical' : 'normal'}">${marketRisk}</span>
        </div>
        <div class="risk-chart">
          <div class="bar-container">
            <div class="bar-fill" style="width: ${riskFactor * 100}%"></div>
          </div>
          <span class="risk-score">Overall Risk: ${(riskFactor * 100).toFixed(0)}%</span>
        </div>
      </div>
      <style>
        .risk-dashboard { padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .risk-metric { display: flex; flex-direction: column; align-items: center; background: var(--surface-hover); padding: 12px; border-radius: 4px; }
        .label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; }
        .value { font-size: 24px; font-weight: bold; margin-top: 4px; }
        .value.critical { color: var(--red); }
        .value.normal { color: var(--green); }
        .risk-chart { grid-column: span 2; margin-top: 8px; }
        .bar-container { height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
        .bar-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--yellow), var(--red)); }
        .risk-score { font-size: 10px; color: var(--text-secondary); float: right; }
      </style>
    `);
  }
}
