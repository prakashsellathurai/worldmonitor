
import { Job, JobSource, JobStatus, JobSearchQuery, Company, Connection, Alert, SalaryData, JobMarketStats } from './job-types';

const STORAGE_KEYS = {
    JOBS: 'wm-jobs',
    COMPANIES: 'wm-companies',
    CONNECTIONS: 'wm-connections',
    ALERTS: 'wm-alerts',
    APPLICATIONS: 'wm-applications',
    SALARY_CACHE: 'wm-salary-cache',
    MARKET_STATS: 'wm-market-stats'
};

class JobAggregatorService {
    private jobs: Job[] = [];
    private companies: Map<string, Company> = new Map();
    private connections: Connection[] = [];
    private alerts: Alert[] = [];

    private listeners: Map<string, Function> = new Map();
    private isPolling = false;
    private pollInterval: number = 15 * 60 * 1000;

    constructor() {
        this.loadData();
    }

    public resetForTest() {
        this.jobs = [];
        this.companies = new Map();
        this.connections = [];
        this.alerts = [];
        localStorage.removeItem(STORAGE_KEYS.JOBS);
        localStorage.removeItem(STORAGE_KEYS.COMPANIES);
        localStorage.removeItem(STORAGE_KEYS.CONNECTIONS);
        localStorage.removeItem(STORAGE_KEYS.ALERTS);
    }

    private loadData() {
        const jobsJson = localStorage.getItem(STORAGE_KEYS.JOBS);
        if (jobsJson) this.jobs = JSON.parse(jobsJson);

        const companiesJson = localStorage.getItem(STORAGE_KEYS.COMPANIES);
        if (companiesJson) {
            const arr: Company[] = JSON.parse(companiesJson);
            arr.forEach(c => this.companies.set(c.id, c));
        }

        const connectionsJson = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
        if (connectionsJson) this.connections = JSON.parse(connectionsJson);

        const alertsJson = localStorage.getItem(STORAGE_KEYS.ALERTS);
        if (alertsJson) this.alerts = JSON.parse(alertsJson);
    }

    private saveData() {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(this.jobs));
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([...this.companies.values()]));
        localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(this.connections));
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
    }

    subscribe(event: string, callback: Function) {
        this.listeners.set(event, callback);
    }

    private emit(event: string, data?: any) {
        const cb = this.listeners.get(event);
        if (cb) cb(data);
    }

    getJobs(): Job[] {
        return this.jobs;
    }

    getJob(id: string): Job | undefined {
        return this.jobs.find(j => j.id === id);
    }

    getJobsByStatus(status: JobStatus): Job[] {
        return this.jobs.filter(j => j.status === status);
    }

    async searchJobs(query: JobSearchQuery): Promise<Job[]> {
        let results = [...this.jobs];

        if (query.keywords) {
            const kw = query.keywords.toLowerCase();
            results = results.filter(j =>
                j.title.toLowerCase().includes(kw) ||
                j.company.toLowerCase().includes(kw) ||
                j.description.toLowerCase().includes(kw)
            );
        }

        if (query.location) {
            const loc = query.location.toLowerCase();
            results = results.filter(j => j.location.toLowerCase().includes(loc));
        }

        if (query.workType) {
            results = results.filter(j => j.workType === query.workType);
        }

        if (query.source) {
            results = results.filter(j => j.source === query.source);
        }

        if (query.salaryMin) {
            results = results.filter(j => (j.salaryMin || 0) >= query.salaryMin!);
        }

        const start = ((query.page || 1) - 1) * (query.limit || 20);
        return results.slice(start, start + (query.limit || 20));
    }

    async fetchFromSource(source: JobSource, query?: JobSearchQuery): Promise<Job[]> {
        switch (source) {
            case 'linkedin':
                return this.fetchLinkedInJobs(query);
            case 'indeed':
                return this.fetchIndeedJobs(query);
            case 'remoteok':
                return this.fetchRemoteOkJobs(query);
            case 'glassdoor':
                return this.fetchGlassdoorJobs(query);
            default:
                return [];
        }
    }

    private async fetchLinkedInJobs(_query?: JobSearchQuery): Promise<Job[]> {
        const mockJobs: Job[] = [
            {
                id: this.generateId(),
                title: 'Senior Frontend Engineer',
                company: 'TechCorp',
                location: 'San Francisco, CA',
                workType: 'hybrid',
                description: 'Build scalable frontend applications using React, TypeScript, and modern web technologies.',
                requirements: ['5+ years React', 'TypeScript', 'System Design', 'Performance Optimization'],
                niceToHave: ['Next.js', 'GraphQL', 'WebGL'],
                salaryMin: 150000,
                salaryMax: 200000,
                salaryCurrency: 'USD',
                postedAt: Date.now() - 3600000,
                source: 'linkedin',
                sourceUrl: 'https://linkedin.com/jobs/view/123',
                status: 'new',
                riskScore: 0.2,
                notes: [],
                interviews: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: this.generateId(),
                title: 'Staff Software Engineer',
                company: 'AI Labs',
                location: 'Remote',
                workType: 'remote',
                description: 'Lead the development of next-generation AI-powered products.',
                requirements: ['8+ years software engineering', 'Python', 'ML/AI experience', 'Leadership'],
                niceToHave: ['TensorFlow', 'PyTorch', 'LLM experience'],
                salaryMin: 200000,
                salaryMax: 280000,
                salaryCurrency: 'USD',
                postedAt: Date.now() - 7200000,
                source: 'linkedin',
                sourceUrl: 'https://linkedin.com/jobs/view/124',
                status: 'new',
                riskScore: 0.1,
                notes: [],
                interviews: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];

        this.addJobs(mockJobs);
        return mockJobs;
    }

    private async fetchIndeedJobs(_query?: JobSearchQuery): Promise<Job[]> {
        const mockJobs: Job[] = [
            {
                id: this.generateId(),
                title: 'Full Stack Developer',
                company: 'StartupXYZ',
                location: 'New York, NY',
                workType: 'onsite',
                description: 'Join our team to build innovative products using Node.js and React.',
                requirements: ['3+ years full stack', 'Node.js', 'React', 'PostgreSQL'],
                salaryMin: 100000,
                salaryMax: 140000,
                salaryCurrency: 'USD',
                postedAt: Date.now() - 1800000,
                source: 'indeed',
                sourceUrl: 'https://indeed.com/jobs/123',
                status: 'new',
                notes: [],
                interviews: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];

        this.addJobs(mockJobs);
        return mockJobs;
    }

    private async fetchRemoteOkJobs(_query?: JobSearchQuery): Promise<Job[]> {
        const mockJobs: Job[] = [
            {
                id: this.generateId(),
                title: 'Senior Backend Engineer',
                company: 'RemoteFirst Inc',
                location: 'Remote',
                workType: 'remote',
                description: 'Build distributed systems at scale. 100% remote position.',
                requirements: ['5+ years backend', 'Go or Rust', 'Kubernetes', 'AWS'],
                niceToHave: ['Open source contributions', 'Startup experience'],
                salaryMin: 140000,
                salaryMax: 180000,
                salaryCurrency: 'USD',
                postedAt: Date.now() - 900000,
                source: 'remoteok',
                sourceUrl: 'https://remoteok.com/jobs/123',
                status: 'new',
                notes: [],
                interviews: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: this.generateId(),
                title: 'DevOps Engineer',
                company: 'CloudNative Co',
                location: 'Remote',
                workType: 'remote',
                description: 'Manage cloud infrastructure and CI/CD pipelines.',
                requirements: ['4+ years DevOps', 'Terraform', 'Docker', 'K8s', 'CI/CD'],
                salaryMin: 120000,
                salaryMax: 160000,
                salaryCurrency: 'USD',
                postedAt: Date.now() - 3600000,
                source: 'remoteok',
                sourceUrl: 'https://remoteok.com/jobs/124',
                status: 'new',
                notes: [],
                interviews: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];

        this.addJobs(mockJobs);
        return mockJobs;
    }

    private async fetchGlassdoorJobs(_query?: JobSearchQuery): Promise<Job[]> {
        return [];
    }

    addJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'interviews'>) {
        const newJob: Job = {
            ...job,
            id: this.generateId(),
            notes: [],
            interviews: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.jobs.unshift(newJob);
        this.saveData();
        this.emit('jobs-updated', this.jobs);
        this.checkAlerts(newJob);
        return newJob;
    }

    addJobs(jobs: Job[]) {
        this.jobs = [...jobs, ...this.jobs];
        this.saveData();
        this.emit('jobs-updated', this.jobs);
    }

    updateJob(id: string, updates: Partial<Job>) {
        const idx = this.jobs.findIndex(j => j.id === id);
        if (idx >= 0) {
            this.jobs[idx] = { ...this.jobs[idx], ...updates, updatedAt: Date.now() } as Job;
            this.saveData();
            this.emit('jobs-updated', this.jobs);
        }
    }

    updateJobStatus(id: string, status: JobStatus, note?: string) {
        const job = this.jobs.find(j => j.id === id);
        if (job) {
            job.status = status;
            job.updatedAt = Date.now();
            if (status === 'applied' && !job.appliedAt) {
                job.appliedAt = Date.now();
            }
            if (note) {
                job.notes.push(`[${new Date().toISOString()}] ${note}`);
            }
            this.saveData();
            this.emit('jobs-updated', this.jobs);
        }
    }

    deleteJob(id: string) {
        this.jobs = this.jobs.filter(j => j.id !== id);
        this.saveData();
        this.emit('jobs-updated', this.jobs);
    }

    async refreshAllSources() {
        this.emit('refresh-start');
        try {
            await Promise.all([
                this.fetchFromSource('linkedin'),
                this.fetchFromSource('indeed'),
                this.fetchFromSource('remoteok')
            ]);
        } catch (e) {
            console.error('Error refreshing jobs', e);
        }
        this.emit('refresh-complete');
    }

    startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;
        setInterval(() => this.refreshAllSources(), this.pollInterval);
        this.refreshAllSources();
    }

    stopPolling() {
        this.isPolling = false;
    }

    getCompanies(): Company[] {
        return [...this.companies.values()];
    }

    getCompany(id: string): Company | undefined {
        return this.companies.get(id);
    }

    async fetchCompanyInfo(domain: string): Promise<Company | null> {
        if (this.companies.has(domain)) {
            return this.companies.get(domain)!;
        }

        const domainParts = domain.split('.');
        const domainName = domainParts[0] || 'Company';
        const mockCompany: Company = {
            id: domain,
            name: domainName.charAt(0).toUpperCase() + domainName.slice(1),
            domain,
            industry: 'Technology',
            size: '100-500',
            headquarters: 'San Francisco, CA',
            website: `https://${domain}`,
            glassdoorRating: 4.0 + Math.random(),
            glassdoorReviews: Math.floor(Math.random() * 5000),
            linkedinFollowers: Math.floor(Math.random() * 100000),
            culture: ['Fast-paced', 'Innovation-focused', 'Remote-friendly'],
            benefits: ['Health Insurance', '401k', 'Stock Options', 'Unlimited PTO']
        };

        this.companies.set(domain, mockCompany);
        this.saveData();
        return mockCompany;
    }

    getConnections(): Connection[] {
        return this.connections;
    }

    addConnection(connection: Omit<Connection, 'id'>) {
        const newConn: Connection = {
            ...connection,
            id: this.generateId()
        };
        this.connections.push(newConn);
        this.saveData();
        this.emit('connections-updated', this.connections);
        return newConn;
    }

    updateConnection(id: string, updates: Partial<Connection>) {
        const idx = this.connections.findIndex(c => c.id === id);
        if (idx >= 0) {
            this.connections[idx] = { ...this.connections[idx], ...updates } as Connection;
            this.saveData();
            this.emit('connections-updated', this.connections);
        }
    }

    getAlerts(): Alert[] {
        return this.alerts;
    }

    createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'triggeredCount'>) {
        const newAlert: Alert = {
            ...alert,
            id: this.generateId(),
            createdAt: Date.now(),
            triggeredCount: 0
        };
        this.alerts.push(newAlert);
        this.saveData();
        this.emit('alerts-updated', this.alerts);
        return newAlert;
    }

    updateAlert(id: string, updates: Partial<Alert>) {
        const idx = this.alerts.findIndex(a => a.id === id);
        if (idx >= 0) {
            this.alerts[idx] = { ...this.alerts[idx], ...updates } as Alert;
            this.saveData();
            this.emit('alerts-updated', this.alerts);
        }
    }

    deleteAlert(id: string) {
        this.alerts = this.alerts.filter(a => a.id !== id);
        this.saveData();
        this.emit('alerts-updated', this.alerts);
    }

    private checkAlerts(job: Job) {
        this.alerts.filter(a => a.active).forEach(alert => {
            const matchesKeywords = alert.keywords.some(kw =>
                job.title.toLowerCase().includes(kw.toLowerCase()) ||
                job.company.toLowerCase().includes(kw.toLowerCase()) ||
                job.description.toLowerCase().includes(kw.toLowerCase())
            );

            const matchesLocation = !alert.locations?.length ||
                alert.locations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()));

            const matchesWorkType = !alert.workTypes?.length ||
                alert.workTypes.includes(job.workType);

            const matchesSalary = !alert.salaryMin ||
                (job.salaryMin || 0) >= alert.salaryMin;

            if (matchesKeywords && matchesLocation && matchesWorkType && matchesSalary) {
                alert.lastTriggered = Date.now();
                alert.triggeredCount++;
                this.emit('alert-triggered', { alert, job });
            }
        });
    }

    async getMarketStats(_title?: string, _location?: string): Promise<JobMarketStats> {
        const mockStats: JobMarketStats = {
            totalJobs: 15420,
            remoteRatio: 0.42,
            avgSalary: 145000,
            topSkills: ['React', 'TypeScript', 'Python', 'AWS', 'Node.js'],
            hotLocations: ['Remote', 'San Francisco', 'New York', 'Austin', 'Seattle'],
            demandTrend: 'up',
            competitionLevel: 'high'
        };
        return mockStats;
    }

    async getSalaryData(title: string, location?: string): Promise<SalaryData[]> {
        const titles = title || 'Software Engineer';
        const loc = location || 'US';
        const mockSalaries: SalaryData[] = [
            { title: titles, location: loc, experienceLevel: 'entry', min: 80000, max: 110000, median: 95000, currency: 'USD', count: 150, source: 'Glassdoor', updatedAt: Date.now() },
            { title: titles, location: loc, experienceLevel: 'mid', min: 110000, max: 150000, median: 130000, currency: 'USD', count: 320, source: 'Glassdoor', updatedAt: Date.now() },
            { title: titles, location: loc, experienceLevel: 'senior', min: 150000, max: 200000, median: 175000, currency: 'USD', count: 280, source: 'Glassdoor', updatedAt: Date.now() },
            { title: titles, location: loc, experienceLevel: 'lead', min: 180000, max: 250000, median: 215000, currency: 'USD', count: 120, source: 'Glassdoor', updatedAt: Date.now() },
            { title: titles, location: loc, experienceLevel: 'principal', min: 220000, max: 320000, median: 270000, currency: 'USD', count: 50, source: 'Glassdoor', updatedAt: Date.now() }
        ];
        return mockSalaries;
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const jobAggregator = new JobAggregatorService();
