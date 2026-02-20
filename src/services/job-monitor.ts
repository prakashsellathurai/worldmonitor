
import { pipeline } from '@xenova/transformers';

export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    postedAt: number; // timestamp
    source: string;
    status: 'new' | 'viewed' | 'applied' | 'interview' | 'offer' | 'rejected';
    riskScore: number; // calculated career risk if not applied? or maybe relevance score
    matchScore?: number; // resume match
}

export interface Resume {
    id: string;
    name: string;
    content: string; // text content for analysis
    lastUpdated: number;
}

export class JobService {
    private jobs: Job[] = [];
    private listeners: ((jobs: Job[]) => void)[] = [];
    private pollingInterval: number = 10 * 60 * 1000; // 10 minutes
    private intervalId: any = null;
    private extractor: any = null;

    constructor() {
        this.loadJobs();
        this.startPolling();
        this.initAI();
    }

    private async initAI() {
        // Lazy load the model for resume matching
        try {
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log('AI Model Loaded');
        } catch (e) {
            console.error('Failed to load AI model', e);
        }
    }

    public subscribe(listener: (jobs: Job[]) => void) {
        this.listeners.push(listener);
        listener(this.jobs);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.jobs));
        this.saveJobs();
    }

    private loadJobs() {
        const stored = localStorage.getItem('wm-jobs');
        if (stored) {
            this.jobs = JSON.parse(stored);
        } else {
            // Mock initial data
            this.jobs = [
                {
                    id: '1',
                    title: 'Senior Frontend Engineer',
                    company: 'TechCorp',
                    location: 'Remote',
                    description: 'React, TypeScript, Node.js expert needed.',
                    postedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
                    source: 'LinkedIn',
                    status: 'new',
                    riskScore: 0.1
                }
            ];
        }
    }

    private saveJobs() {
        localStorage.setItem('wm-jobs', JSON.stringify(this.jobs));
    }

    public startPolling() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.pollNewJobs(), this.pollingInterval);
        // Initial poll
        setTimeout(() => this.pollNewJobs(), 1000);
    }

    private async pollNewJobs() {
        console.log('Polling for new jobs...');
        // In a real app, this would fetch from an API or scrape
        // Here we simulate finding a new job occasionally
        if (Math.random() > 0.5) {
            const newJob: Job = {
                id: Date.now().toString(),
                title: (['Product Manager', 'Full Stack Dev', 'Data Scientist'][Math.floor(Math.random() * 3)] || 'Engineer'),
                company: (['Google', 'Amazon', 'StartupX'][Math.floor(Math.random() * 3)] || 'Unknown'),
                location: (['New York', 'San Francisco', 'Remote'][Math.floor(Math.random() * 3)] || 'Remote'),
                description: 'Exciting opportunity to change the world with AI.',
                postedAt: Date.now(),
                source: 'Company Site',
                status: 'new',
                riskScore: Math.random()
            };
            this.jobs.unshift(newJob);
            this.notify();

            // Auto-analyze match if AI is ready
            if (this.extractor) {
                // Trigger generic analysis
                this.analyzeJobMatch(newJob.id, "Generic Resume Content Placeholder");
            }
        }
    }

    public async analyzeJobMatch(jobId: string, _resumeText: string): Promise<number> {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job || !this.extractor) return 0;

        // Simple cosine similarity simulation using the model would happen here
        // For now, return a mock score based on text length or random
        // In real implementation:
        // const jobEmb = await this.extractor(job.description, { pooling: 'mean', normalize: true });
        // const resEmb = await this.extractor(resumeText, { pooling: 'mean', normalize: true });
        // calculate cosine similarity

        const score = Math.random(); // Placeholder
        job.matchScore = score;
        this.notify();
        return score;
    }

    public updateStatus(jobId: string, status: Job['status']) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            job.status = status;
            this.notify();
        }
    }
}

export const jobService = new JobService();
