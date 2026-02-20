
import { Panel } from '../Panel';
import { jobService, type Job } from '@/services/job-monitor';

export class ResumeAnalysisPanel extends Panel {
    private selectedJob: Job | null = null;
    private tailoringSuggestion: string = "Select a job to see tailored resume suggestions.";

    constructor() {
        super({
            id: 'resume-analysis',
            title: 'Resume Intelligence',
            showCount: false,
        });

        window.addEventListener('job-selected', (e: any) => {
            const jobId = e.detail.id;
            // Fetch job from store (hacky direct access for now, better via service)
            const job = (jobService as any).jobs.find((j: any) => j.id === jobId);
            if (job) {
                this.selectedJob = job;
                this.generateSuggestion(job);
                this.render();
            }
        });

        this.render();
    }

    private async generateSuggestion(job: Job) {
        this.tailoringSuggestion = "Analyzing job description with AI...";
        this.render();

        // Simulate AI delay
        setTimeout(() => {
            const keywords = ['React', 'TypeScript', 'Node.js', 'Leadership'];
            const found = keywords.filter(k => job.description.includes(k) || Math.random() > 0.5);

            this.tailoringSuggestion = `
        <div class="ai-suggestion">
          <strong>AI Analysis:</strong>
          <p>The job highlights <em>${found.join(', ')}</em>. Ensure your resume emphasizes these skills.</p>
          <div class="score-card">
            <div class="score-item">Match: ${(Math.random() * 100).toFixed(0)}%</div>
            <div class="score-item">Gap: ${['Cloud', 'Kubernetes', 'Go'][Math.floor(Math.random() * 3)]}</div>
          </div>
          <button class="btn-tailor" onclick="alert('Tailoring resume...')">Auto-Tailor Resume</button>
        </div>
      `;
            this.render();
        }, 1500);
    }

    private render() {
        if (!this.selectedJob) {
            this.setContent('<div class="placeholder">Select a job from the board to analyze matches.</div>');
            return;
        }

        this.setContent(`
      <div class="analysis-panel">
        <div class="job-preview">
          <h3>${this.selectedJob.title} @ ${this.selectedJob.company}</h3>
          <p class="desc">${this.selectedJob.description}</p>
        </div>
        <div class="resume-feedback">
          ${this.tailoringSuggestion}
        </div>
      </div>
      <style>
        .analysis-panel { padding: 12px; height: 100%; display: flex; flex-direction: column; gap: 12px; }
        .job-preview { border-bottom: 1px solid var(--border); padding-bottom: 12px; }
        .job-preview h3 { font-size: 14px; margin-bottom: 4px; color: var(--accent); }
        .desc { font-size: 11px; color: var(--text-secondary); max-height: 100px; overflow-y: auto; }
        .resume-feedback { flex: 1; background: var(--surface-active); padding: 10px; border-radius: 4px; border: 1px dashed var(--border-strong); }
        .ai-suggestion strong { color: var(--blue); display: block; margin-bottom: 4px; }
        .score-card { display: flex; gap: 12px; margin: 8px 0; }
        .score-item { background: var(--bg); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .btn-tailor { width: 100%; padding: 6px; background: var(--blue); color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; }
        .btn-tailor:hover { opacity: 0.9; }
        .placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-dim); text-align: center; padding: 20px; }
      </style>
    `);
    }
}
