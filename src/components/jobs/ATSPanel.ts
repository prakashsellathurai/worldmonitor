
import { Panel } from '../Panel';
import { jobAggregator } from '@/services/job-aggregator';
import { aiMatchingService } from '@/services/ai-matching';
import { Job, JobStatus, Alert } from '@/services/job-types';

export class ATSPanel extends Panel {
    private jobs: Job[] = [];
    private selectedJob: Job | null = null;
    private view: 'board' | 'detail' | 'analytics' | 'search' = 'board';
    private searchResults: Job[] = [];

    constructor() {
        super({
            id: 'ats-panel',
            title: 'Job Search Intelligence',
            showCount: true,
            className: 'ats-panel',
        });

        this.loadData();
        this.setupEventListeners();
        this.render();
    }

    private loadData() {
        this.jobs = jobAggregator.getJobs();
        this.setCount(this.jobs.filter(j => j.status === 'new').length);

        jobAggregator.subscribe('jobs-updated', (jobs: Job[]) => {
            this.jobs = jobs;
            this.setCount(jobs.filter(j => j.status === 'new').length);
            this.render();
        });

        jobAggregator.subscribe('alert-triggered', (data: { alert: Alert; job: Job }) => {
            this.showNotification('New job match: ' + data.job.title + ' at ' + data.job.company);
        });
    }

    private setupEventListeners() {
        window.addEventListener('job-selected', (e: any) => {
            const job = this.jobs.find(j => j.id === e.detail.id);
            if (job) {
                this.selectedJob = job;
                this.view = 'detail';
                this.render();
            }
        });

        window.addEventListener('job-search', (e: any) => {
            this.performSearch(e.detail.query);
        });
    }

    private showNotification(message: string) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Job Intelligence', { body: message });
        }
    }

    private async performSearch(query: string) {
        this.view = 'search';
        this.searchResults = await jobAggregator.searchJobs({ keywords: query });
        this.render();
    }

    private getStatusCounts(): Record<string, number> {
        const counts: Record<string, number> = {
            new: 0, viewed: 0, applied: 0, phone_screen: 0,
            technical: 0, onsite: 0, offer: 0, accepted: 0, rejected: 0, withdrawn: 0
        };
        this.jobs.forEach(j => {
            counts[j.status] = (counts[j.status] || 0) + 1;
        });
        return counts;
    }

    private render() {
        switch (this.view) {
            case 'detail':
                this.renderDetail();
                break;
            case 'search':
                this.renderSearch();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
            default:
                this.renderBoard();
        }
    }

    private formatSalary(min?: number, max?: number, currency?: string): string {
        if (!min) return '';
        const kMin = '$' + (min / 1000).toFixed(0) + 'k';
        const kMax = max ? '$' + (max / 1000).toFixed(0) + 'k' : '';
        return (kMin + (kMax ? ' - ' + kMax : '') + ' ' + (currency || 'USD'));
    }

    private renderBoard() {
        const counts = this.getStatusCounts();
        const pipelineStages: { status: JobStatus; label: string; color: string }[] = [
            { status: 'new', label: 'New', color: '#3b82f6' },
            { status: 'viewed', label: 'Viewed', color: '#eab308' },
            { status: 'applied', label: 'Applied', color: '#f97316' },
            { status: 'phone_screen', label: 'Phone', color: '#a855f7' },
            { status: 'technical', label: 'Technical', color: '#6366f1' },
            { status: 'onsite', label: 'Onsite', color: '#ec4899' },
            { status: 'offer', label: 'Offer', color: '#22c55e' },
            { status: 'rejected', label: 'Rejected', color: '#ef4444' },
        ];

        let pipelineHtml = '';
        pipelineStages.forEach(stage => {
            const jobsInStage = this.jobs.filter(j => j.status === stage.status);
            let jobsHtml = '';
            jobsInStage.slice(0, 10).forEach(job => {
                const matchScoreHtml = job.matchScore 
                    ? '<div class="job-score">' + Math.round(job.matchScore * 100) + '% Match</div>' 
                    : '';
                jobsHtml += '<div class="pipeline-job" data-job-id="' + job.id + '">' +
                    '<div class="job-title">' + this.escape(job.title) + '</div>' +
                    '<div class="job-company">' + this.escape(job.company) + '</div>' +
                    matchScoreHtml + '</div>';
            });
            
            pipelineHtml += '<div class="pipeline-stage">' +
                '<div class="stage-header" style="border-left-color: ' + stage.color + '">' +
                '<span class="stage-label">' + stage.label + '</span>' +
                '<span class="stage-count">' + jobsInStage.length + '</span></div>' +
                '<div class="stage-jobs">' + jobsHtml + '</div></div>';
        });

        const applied = counts['applied'] || 0;
        const offer = counts['offer'] || 0;
        const successRate = applied > 0 ? Math.round(offer / applied * 100) : 0;

        const statsHtml = '<div class="ats-stats">' +
            '<div class="stat-card"><div class="stat-value">' + this.jobs.length + 
            '</div><div class="stat-label">Total Jobs</div></div>' +
            '<div class="stat-card"><div class="stat-value">' + applied + 
            '</div><div class="stat-label">Applied</div></div>' +
            '<div class="stat-card"><div class="stat-value">' + offer + 
            '</div><div class="stat-label">Offers</div></div>' +
            '<div class="stat-card"><div class="stat-value">' + successRate + 
            '%</div><div class="stat-label">Success Rate</div></div></div>';

        this.setContent(
            '<div class="ats-container">' +
            '<div class="ats-toolbar">' +
            '<div class="toolbar-left">' +
            '<button class="toolbar-btn active" data-view="board"><span class="icon">📋</span> Pipeline</button>' +
            '<button class="toolbar-btn" data-view="analytics"><span class="icon">📊</span> Analytics</button>' +
            '<button class="toolbar-btn" data-view="search"><span class="icon">🔍</span> Search</button>' +
            '</div>' +
            '<div class="toolbar-right">' +
            '<button class="toolbar-btn primary" id="refresh-jobs-btn"><span class="icon">🔄</span> Refresh</button>' +
            '</div></div>' +
            statsHtml +
            '<div class="pipeline-container">' + pipelineHtml + '</div>' +
            '<style>' +
            '.ats-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }' +
            '.ats-toolbar { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid var(--border); background: var(--surface); }' +
            '.toolbar-left, .toolbar-right { display: flex; gap: 8px; }' +
            '.toolbar-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; color: var(--text); font-size: 12px; }' +
            '.toolbar-btn:hover { background: var(--surface-hover); }' +
            '.toolbar-btn.active { background: var(--accent); color: white; border-color: var(--accent); }' +
            '.toolbar-btn.primary { background: #3b82f6; color: white; border-color: #3b82f6; }' +
            '.ats-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; }' +
            '.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px; text-align: center; }' +
            '.stat-value { font-size: 24px; font-weight: bold; color: var(--accent); }' +
            '.stat-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; }' +
            '.pipeline-container { display: flex; gap: 8px; padding: 8px; overflow-x: auto; flex: 1; }' +
            '.pipeline-stage { min-width: 160px; flex: 1; background: var(--surface); border-radius: 6px; display: flex; flex-direction: column; }' +
            '.stage-header { display: flex; justify-content: space-between; padding: 10px; border-left: 3px solid #3b82f6; background: var(--surface-hover); border-radius: 6px 6px 0 0; }' +
            '.stage-label { font-weight: bold; font-size: 12px; }' +
            '.stage-count { background: var(--bg); padding: 2px 6px; border-radius: 10px; font-size: 10px; }' +
            '.stage-jobs { padding: 8px; overflow-y: auto; flex: 1; }' +
            '.pipeline-job { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 8px; margin-bottom: 6px; cursor: pointer; transition: border-color 0.2s; }' +
            '.pipeline-job:hover { border-color: var(--accent); }' +
            '.job-title { font-size: 11px; font-weight: bold; color: var(--text); margin-bottom: 2px; }' +
            '.job-company { font-size: 10px; color: var(--text-dim); }' +
            '.job-score { font-size: 10px; color: #22c55e; margin-top: 4px; }' +
            '</style>'
        );

        this.bindBoardEvents();
    }

    private bindBoardEvents() {
        const container = this.getContainer();
        if (!container) return;

        container.querySelectorAll('.pipeline-job').forEach(el => {
            el.addEventListener('click', () => {
                const jobId = el.getAttribute('data-job-id');
                if (jobId) {
                    window.dispatchEvent(new CustomEvent('job-selected', { detail: { id: jobId } }));
                }
            });
        });

        container.querySelectorAll('.toolbar-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view') as any;
                this.view = view;
                this.render();
            });
        });

        const refreshBtn = container.querySelector('#refresh-jobs-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                jobAggregator.refreshAllSources();
            });
        }
    }

    private getContainer(): HTMLElement | null {
        return document.getElementById('panel-' + this.panelId);
    }

    private async renderDetail() {
        if (!this.selectedJob) return;

        const job = this.selectedJob;
        
        let matchResult = null;
        try {
            matchResult = await aiMatchingService.analyzeJobMatch(job, '');
        } catch (e) {
            console.error('Error getting match result:', e);
        }

        const statusOptions: JobStatus[] = ['new', 'viewed', 'applied', 'phone_screen', 'technical', 'onsite', 'offer', 'accepted', 'rejected', 'withdrawn'];
        let statusHtml = '';
        statusOptions.forEach(s => {
            const selected = job.status === s ? 'selected' : '';
            statusHtml += '<option value="' + s + '" ' + selected + '>' + s.replace('_', ' ') + '</option>';
        });

        const salaryHtml = job.salaryMin 
            ? '<div class="salary-info"><span class="salary-label">Salary:</span><span class="salary-range">' + 
              this.formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) + '</span></div>'
            : '';

        let requirementsHtml = '';
        if (job.requirements && job.requirements.length) {
            requirementsHtml = '<div class="detail-section"><h4>Requirements</h4><ul>';
            job.requirements.forEach(r => {
                requirementsHtml += '<li>' + this.escape(r) + '</li>';
            });
            requirementsHtml += '</ul></div>';
        }

        let matchHtml = '';
        if (matchResult) {
            const scorePercent = Math.round(matchResult.overallScore * 100);
            const skillPercent = Math.round(matchResult.skillMatch * 100);
            const expPercent = Math.round(matchResult.experienceMatch * 100);
            
            let skillsTags = '';
            if (matchResult.missingSkills && matchResult.missingSkills.length) {
                matchResult.missingSkills.slice(0, 5).forEach(s => {
                    skillsTags += '<span class="skill-tag">' + this.escape(s) + '</span>';
                });
            }

            matchHtml = '<div class="match-analysis">' +
                '<h4>AI Match Analysis</h4>' +
                '<div class="match-score"><div class="score-circle" style="--score: ' + scorePercent + '"><span>' + scorePercent + '%</span></div></div>' +
                '<div class="match-details">' +
                '<div class="match-item"><span>Skills Match</span><span>' + skillPercent + '%</span></div>' +
                '<div class="match-item"><span>Experience</span><span>' + expPercent + '%</span></div></div>' +
                (skillsTags ? '<div class="missing-skills"><strong>Skills to Highlight:</strong>' + skillsTags + '</div>' : '') +
                '<p class="match-summary">' + matchResult.summary + '</p></div>';
        }

        this.setContent(
            '<div class="job-detail">' +
            '<div class="detail-header">' +
            '<button class="back-btn" data-view="board">← Back</button>' +
            '<h2>' + this.escape(job.title) + '</h2>' +
            '<div class="company-info">' +
            '<span class="company-name">' + this.escape(job.company) + '</span>' +
            '<span class="job-location">' + this.escape(job.location) + '</span>' +
            '<span class="job-worktype">' + job.workType + '</span></div></div>' +
            
            '<div class="detail-actions">' +
            '<div class="action-group"><label>Status:</label>' +
            '<select class="status-select" data-job-id="' + job.id + '">' + statusHtml + '</select></div>' +
            '<div class="action-buttons">' +
            '<button class="action-btn" id="apply-btn">Apply Now</button>' +
            '<button class="action-btn secondary" id="source-btn">Original Post</button></div></div>' +

            salaryHtml +

            '<div class="detail-section"><h4>Description</h4><p>' + this.escape(job.description) + '</p></div>' +
            requirementsHtml +
            matchHtml +
            '<div class="notes-section"><h4>Notes</h4><textarea class="notes-input" data-job-id="' + job.id + '" placeholder="Add notes...">' + 
            (job.notes ? job.notes.join('\n') : '') + '</textarea></div>' +
            
            '<style>' +
            '.job-detail { padding: 16px; overflow-y: auto; height: 100%; }' +
            '.detail-header { margin-bottom: 16px; }' +
            '.back-btn { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 12px; margin-bottom: 8px; }' +
            '.detail-header h2 { font-size: 18px; margin: 0 0 8px 0; color: var(--accent); }' +
            '.company-info { display: flex; gap: 12px; font-size: 12px; color: var(--text-secondary); }' +
            '.job-worktype { background: var(--bg); padding: 2px 6px; border-radius: 4px; }' +
            '.detail-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px; background: var(--surface); border-radius: 6px; }' +
            '.action-group { display: flex; align-items: center; gap: 8px; }' +
            '.action-group label { font-size: 12px; color: var(--text-dim); }' +
            '.status-select { padding: 6px; border-radius: 4px; background: var(--bg); color: var(--text); border: 1px solid var(--border); }' +
            '.action-buttons { display: flex; gap: 8px; }' +
            '.action-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }' +
            '.action-btn.secondary { background: var(--surface-hover); color: var(--text); }' +
            '.salary-info { background: rgba(34, 197, 94, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 16px; }' +
            '.salary-range { font-weight: bold; color: #22c55e; }' +
            '.detail-section { margin-bottom: 16px; }' +
            '.detail-section h4 { font-size: 12px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }' +
            '.detail-section ul { margin: 0; padding-left: 20px; font-size: 12px; color: var(--text-secondary); }' +
            '.match-analysis { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px; }' +
            '.match-score { display: flex; justify-content: center; margin-bottom: 12px; }' +
            '.score-circle { width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(#22c55e calc(var(--score) * 3.6deg), var(--border) 0); display: flex; align-items: center; justify-content: center; }' +
            '.score-circle span { width: 60px; height: 60px; border-radius: 50%; background: var(--surface); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }' +
            '.match-details { display: flex; justify-content: space-around; margin-bottom: 12px; }' +
            '.match-item { display: flex; flex-direction: column; align-items: center; }' +
            '.match-item span:first-child { font-size: 10px; color: var(--text-dim); }' +
            '.match-item span:last-child { font-size: 16px; font-weight: bold; }' +
            '.missing-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }' +
            '.skill-tag { background: var(--bg); padding: 4px 8px; border-radius: 4px; font-size: 10px; }' +
            '.match-summary { font-size: 12px; color: var(--text-secondary); font-style: italic; }' +
            '.notes-section h4 { font-size: 12px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }' +
            '.notes-input { width: 100%; min-height: 100px; padding: 8px; border-radius: 4px; background: var(--bg); color: var(--text); border: 1px solid var(--border); font-family: inherit; font-size: 12px; resize: vertical; }' +
            '</style>'
        );

        this.bindDetailEvents(job);
    }

    private bindDetailEvents(job: Job) {
        const container = this.getContainer();
        if (!container) return;

        const backBtn = container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.view = 'board';
                this.render();
            });
        }

        const statusSelect = container.querySelector('.status-select') as HTMLSelectElement;
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                jobAggregator.updateJobStatus(job.id, statusSelect.value as JobStatus);
            });
        }

        const applyBtn = container.querySelector('#apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                if (job.applyUrl) {
                    window.open(job.applyUrl, '_blank');
                } else if (job.sourceUrl) {
                    window.open(job.sourceUrl, '_blank');
                }
            });
        }

        const sourceBtn = container.querySelector('#source-btn');
        if (sourceBtn) {
            sourceBtn.addEventListener('click', () => {
                if (job.sourceUrl) {
                    window.open(job.sourceUrl, '_blank');
                }
            });
        }

        const notesInput = container.querySelector('.notes-input') as HTMLTextAreaElement;
        if (notesInput) {
            notesInput.addEventListener('change', () => {
                const notes = notesInput.value.split('\n').filter(n => n.trim());
                jobAggregator.updateJob(job.id, { notes });
            });
        }
    }

    private renderSearch() {
        const results = this.searchResults;
        let resultsHtml = '';
        
        if (results.length === 0) {
            resultsHtml = '<div class="no-results">No jobs found. Try different keywords.</div>';
        } else {
            results.forEach(job => {
                const salaryHtml = job.salaryMin 
                    ? '<div class="job-salary">' + this.formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) + '</div>' 
                    : '';
                resultsHtml += '<div class="search-job" data-job-id="' + job.id + '">' +
                    '<div class="job-header"><span class="job-title">' + this.escape(job.title) + 
                    '</span><span class="job-time">' + this.timeAgo(job.postedAt) + '</span></div>' +
                    '<div class="job-company">' + this.escape(job.company) + ' - ' + this.escape(job.location) + '</div>' +
                    salaryHtml + '</div>';
            });
        }

        this.setContent(
            '<div class="search-view">' +
            '<div class="search-header"><button class="back-btn" data-view="board">← Back</button>' +
            '<h3>Search Results (' + results.length + ')</h3></div>' +
            '<div class="search-results">' + resultsHtml + '</div>' +
            '<style>' +
            '.search-view { padding: 16px; height: 100%; overflow-y: auto; }' +
            '.search-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }' +
            '.back-btn { background: none; border: none; color: #3b82f6; cursor: pointer; }' +
            '.search-header h3 { margin: 0; font-size: 16px; }' +
            '.search-job { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 8px; cursor: pointer; }' +
            '.search-job:hover { border-color: var(--accent); }' +
            '.job-header { display: flex; justify-content: space-between; }' +
            '.job-title { font-weight: bold; }' +
            '.job-time { font-size: 10px; color: var(--text-dim); }' +
            '.job-company { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }' +
            '.job-salary { font-size: 12px; color: #22c55e; margin-top: 4px; }' +
            '.no-results { text-align: center; color: var(--text-dim); padding: 40px; }' +
            '</style>'
        );

        this.bindSearchEvents();
    }

    private bindSearchEvents() {
        const container = this.getContainer();
        if (!container) return;

        const backBtn = container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.view = 'board';
                this.render();
            });
        }

        container.querySelectorAll('.search-job').forEach(el => {
            el.addEventListener('click', () => {
                const jobId = el.getAttribute('data-job-id');
                if (jobId) {
                    window.dispatchEvent(new CustomEvent('job-selected', { detail: { id: jobId } }));
                }
            });
        });
    }

    private renderAnalytics() {
        const counts = this.getStatusCounts();
        const total = this.jobs.length;
        const applied = counts['applied'] || 0;
        
        const viewRate = total > 0 ? Math.round((counts['viewed'] || 0) / total * 100) : 0;
        const responseRate = applied > 0 ? Math.round((counts['phone_screen'] || 0) / applied * 100) : 0;
        const interviewRate = applied > 0 ? Math.round((counts['technical'] || 0) / applied * 100) : 0;

        this.setContent(
            '<div class="analytics-view">' +
            '<div class="analytics-header"><button class="back-btn" data-view="board">← Back</button>' +
            '<h3>Job Search Analytics</h3></div>' +
            
            '<div class="analytics-grid">' +
            '<div class="analytics-card">' +
            '<h4>Application Funnel</h4>' +
            '<div class="funnel">' +
            '<div class="funnel-stage"><span>Total Tracked</span><strong>' + total + '</strong></div>' +
            '<div class="funnel-stage"><span>Applied</span><strong>' + applied + '</strong></div>' +
            '<div class="funnel-stage"><span>Phone Screen</span><strong>' + (counts['phone_screen'] || 0) + '</strong></div>' +
            '<div class="funnel-stage"><span>Technical</span><strong>' + (counts['technical'] || 0) + '</strong></div>' +
            '<div class="funnel-stage"><span>Onsite</span><strong>' + (counts['onsite'] || 0) + '</strong></div>' +
            '<div class="funnel-stage highlight"><span>Offers</span><strong>' + (counts['offer'] || 0) + '</strong></div></div></div>' +
            
            '<div class="analytics-card">' +
            '<h4>Response Rates</h4>' +
            '<div class="rate-bars">' +
            '<div class="rate-item"><span>View Rate</span>' +
            '<div class="rate-bar"><div class="rate-fill" style="width: ' + viewRate + '%"></div></div>' +
            '<span>' + viewRate + '%</span></div>' +
            '<div class="rate-item"><span>Response Rate</span>' +
            '<div class="rate-bar"><div class="rate-fill" style="width: ' + responseRate + '%"></div></div>' +
            '<span>' + responseRate + '%</span></div>' +
            '<div class="rate-item"><span>Interview Rate</span>' +
            '<div class="rate-bar"><div class="rate-fill" style="width: ' + interviewRate + '%"></div></div>' +
            '<span>' + interviewRate + '%</span></div></div></div></div>' +
            
            '<style>' +
            '.analytics-view { padding: 16px; height: 100%; overflow-y: auto; }' +
            '.analytics-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }' +
            '.back-btn { background: none; border: none; color: #3b82f6; cursor: pointer; }' +
            '.analytics-grid { display: grid; gap: 16px; }' +
            '.analytics-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }' +
            '.analytics-card h4 { font-size: 12px; text-transform: uppercase; color: var(--text-dim); margin: 0 0 12px 0; }' +
            '.funnel { display: flex; flex-direction: column; gap: 8px; }' +
            '.funnel-stage { display: flex; justify-content: space-between; padding: 8px; background: var(--bg); border-radius: 4px; font-size: 12px; }' +
            '.funnel-stage.highlight { background: rgba(34, 197, 94, 0.1); color: #22c55e; }' +
            '.rate-bars { display: flex; flex-direction: column; gap: 12px; }' +
            '.rate-item { display: flex; align-items: center; gap: 8px; font-size: 11px; }' +
            '.rate-item span:first-child { width: 100px; }' +
            '.rate-item span:last-child { width: 40px; text-align: right; }' +
            '.rate-bar { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }' +
            '.rate-fill { height: 100%; background: #3b82f6; border-radius: 4px; }' +
            '</style>'
        );

        this.bindAnalyticsEvents();
    }

    private bindAnalyticsEvents() {
        const container = this.getContainer();
        if (!container) return;

        const backBtn = container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.view = 'board';
                this.render();
            });
        }
    }

    private escape(s: string): string {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private timeAgo(ts: number): string {
        const min = Math.floor((Date.now() - ts) / 60000);
        if (min < 60) return min + 'm ago';
        const h = Math.floor(min / 60);
        if (h < 24) return h + 'h ago';
        return Math.floor(h / 24) + 'd ago';
    }
}
