
import { Panel } from '../Panel';
import { jobService, type Job } from '@/services/job-monitor';

export class JobBoardPanel extends Panel {
    private jobs: Job[] = [];

    constructor() {
        super({
            id: 'job-board',
            title: 'Job Monitor',
            showCount: true,

        });

        jobService.subscribe((jobs) => {
            this.jobs = jobs;
            this.render();
            this.setCount(jobs.filter(j => j.status === 'new').length);
        });
    }

    private render() {
        if (this.jobs.length === 0) {
            this.setContent('<div class="p-4 text-dim">No jobs tracked yet.</div>');
            return;
        }

        const rows = this.jobs.map(job => `
      <div class="job-card status-${job.status}" onclick="window.selectJob('${job.id}')">
        <div class="job-header">
          <span class="job-title">${this.escape(job.title)}</span>
          <span class="job-time">${this.timeAgo(job.postedAt)}</span>
        </div>
        <div class="job-meta">
          <span class="job-company">${this.escape(job.company)}</span>
          <span class="job-location">${this.escape(job.location)}</span>
        </div>
        <div class="job-footer">
          <span class="job-status ${job.status}">${job.status.toUpperCase()}</span>
          ${job.matchScore ? `<span class="job-score">Match: ${(job.matchScore * 100).toFixed(0)}%</span>` : ''}
          <span class="job-risk" title="Career Risk Factor">Risk: ${(job.riskScore * 10).toFixed(1)}</span>
        </div>
      </div>
    `).join('');

        this.setContent(`
      <div class="job-board">
        ${rows}
      </div>
      <style>
        .job-board { display: flex; flex-direction: column; gap: 8px; padding: 8px; max-height: 100%; overflow-y: auto; }
        .job-card { 
          background: var(--surface); 
          border: 1px solid var(--border); 
          border-radius: 4px; 
          padding: 8px; 
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .job-card:hover { border-color: var(--accent); }
        .job-card.status-new { border-left: 3px solid var(--blue); }
        .job-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .job-title { font-weight: bold; color: var(--text); }
        .job-time { font-size: 10px; color: var(--text-dim); }
        .job-meta { display: flex; gap: 8px; font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }
        .job-footer { display: flex; justify-content: space-between; align-items: center; font-size: 10px; }
        .job-status { padding: 2px 4px; border-radius: 2px; background: var(--bg); }
        .job-status.new { color: var(--blue); background: rgba(59, 130, 246, 0.1); }
        .job-score { color: var(--green); font-weight: bold; }
        .job-risk { color: var(--orange); }
      </style>
    `);
    }

    private escape(s: string) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private timeAgo(ts: number) {
        const min = Math.floor((Date.now() - ts) / 60000);
        if (min < 60) return `${min}m ago`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    }
}

// Global expose for click handler
(window as any).selectJob = (id: string) => {
    const event = new CustomEvent('job-selected', { detail: { id } });
    window.dispatchEvent(event);
};
