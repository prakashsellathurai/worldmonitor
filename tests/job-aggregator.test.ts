
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { jobAggregator } from '../src/services/job-aggregator';
import type { Job, JobStatus, Connection, Alert } from '../src/services/job-types';

describe('JobAggregatorService', () => {
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value.toString();
            }),
            clear: vi.fn(() => {
                store = {};
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
        };
    })();

    beforeEach(() => {
        vi.stubGlobal('localStorage', localStorageMock);
        localStorageMock.clear();
        vi.clearAllMocks();
        // Reset job aggregator state
        jobAggregator.resetForTest();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Job Management', () => {
        it('should add a new job', () => {
            const jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'interviews'> = {
                title: 'Software Engineer',
                company: 'TechCorp',
                location: 'San Francisco, CA',
                workType: 'hybrid',
                description: 'Build amazing software',
                requirements: ['5+ years experience', 'TypeScript'],
                salaryMin: 150000,
                salaryMax: 200000,
                salaryCurrency: 'USD',
                postedAt: Date.now(),
                source: 'linkedin',
                sourceUrl: 'https://linkedin.com/jobs/123',
                status: 'new'
            };

            const job = jobAggregator.addJob(jobData);

            expect(job).toBeDefined();
            expect(job.id).toBeDefined();
            expect(job.title).toBe('Software Engineer');
            expect(job.company).toBe('TechCorp');
            expect(job.status).toBe('new');
        });

        it('should retrieve all jobs', () => {
            jobAggregator.addJob({
                title: 'Job 1',
                company: 'Company A',
                location: 'Remote',
                workType: 'remote',
                description: 'Test job',
                requirements: [],
                postedAt: Date.now(),
                source: 'linkedin',
                sourceUrl: '',
                status: 'new'
            });

            jobAggregator.addJob({
                title: 'Job 2',
                company: 'Company B',
                location: 'NYC',
                workType: 'onsite',
                description: 'Test job 2',
                requirements: [],
                postedAt: Date.now(),
                source: 'indeed',
                sourceUrl: '',
                status: 'new'
            });

            const jobs = jobAggregator.getJobs();
            expect(jobs).toHaveLength(2);
        });

        it('should get job by id', () => {
            const addedJob = jobAggregator.addJob({
                title: 'Unique Job',
                company: 'Test Co',
                location: 'Remote',
                workType: 'remote',
                description: 'Test',
                requirements: [],
                postedAt: Date.now(),
                source: 'linkedin',
                sourceUrl: '',
                status: 'new'
            });

            const retrievedJob = jobAggregator.getJob(addedJob.id);
            expect(retrievedJob).toBeDefined();
            expect(retrievedJob?.title).toBe('Unique Job');
        });

        it('should update job status', () => {
            const job = jobAggregator.addJob({
                title: 'Test Job',
                company: 'Test Co',
                location: 'Remote',
                workType: 'remote',
                description: 'Test',
                requirements: [],
                postedAt: Date.now(),
                source: 'linkedin',
                sourceUrl: '',
                status: 'new'
            });

            jobAggregator.updateJobStatus(job.id, 'applied');

            const updatedJob = jobAggregator.getJob(job.id);
            expect(updatedJob?.status).toBe('applied');
            expect(updatedJob?.appliedAt).toBeDefined();
        });

        it('should delete a job', () => {
            const job = jobAggregator.addJob({
                title: 'To Delete',
                company: 'Test Co',
                location: 'Remote',
                workType: 'remote',
                description: 'Test',
                requirements: [],
                postedAt: Date.now(),
                source: 'linkedin',
                sourceUrl: '',
                status: 'new'
            });

            jobAggregator.deleteJob(job.id);

            const deletedJob = jobAggregator.getJob(job.id);
            expect(deletedJob).toBeUndefined();
        });
    });

    describe('Job Search', () => {
        beforeEach(() => {
            jobAggregator.addJob({
                title: 'Senior Frontend Engineer',
                company: 'TechCorp',
                location: 'San Francisco, CA',
                workType: 'hybrid',
                description: 'React and TypeScript experience required',
                requirements: ['React', 'TypeScript'],
                salaryMin: 150000,
                salaryMax: 200000,
                salaryCurrency: 'USD',
                postedAt: Date.now(),
                source: 'linkedin',
                sourceUrl: '',
                status: 'new'
            });

            jobAggregator.addJob({
                title: 'Backend Engineer',
                company: 'DataCorp',
                location: 'New York, NY',
                workType: 'onsite',
                description: 'Python and PostgreSQL experience required',
                requirements: ['Python', 'PostgreSQL'],
                salaryMin: 130000,
                salaryMax: 170000,
                salaryCurrency: 'USD',
                postedAt: Date.now(),
                source: 'indeed',
                sourceUrl: '',
                status: 'new'
            });
        });

        it('should search jobs by keywords', async () => {
            const results = await jobAggregator.searchJobs({ keywords: 'React' });
            expect(results).toHaveLength(1);
            expect(results[0].title).toContain('Frontend');
        });

        it('should search jobs by location', async () => {
            const results = await jobAggregator.searchJobs({ location: 'New York' });
            expect(results).toHaveLength(1);
            expect(results[0].company).toBe('DataCorp');
        });

        it('should filter by work type', async () => {
            const results = await jobAggregator.searchJobs({ workType: 'remote' });
            expect(results.every(j => j.workType === 'remote')).toBe(true);
        });

        it('should filter by salary minimum', async () => {
            const results = await jobAggregator.searchJobs({ salaryMin: 140000 });
            expect(results.every(j => (j.salaryMin || 0) >= 140000)).toBe(true);
        });
    });

    describe('Connections Management', () => {
        it('should add a connection', () => {
            const connection: Omit<Connection, 'id'> = {
                name: 'John Doe',
                headline: 'Engineering Manager',
                company: 'TechCorp',
                title: 'Manager',
                linkedinUrl: 'https://linkedin.com/in/johndoe',
                connectionDegree: '2nd',
                notes: 'Met at conference',
                canRefer: true
            };

            const result = jobAggregator.addConnection(connection);

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.name).toBe('John Doe');
            expect(result.canRefer).toBe(true);
        });

        it('should retrieve all connections', () => {
            jobAggregator.addConnection({
                name: 'User 1',
                connectionDegree: '1st',
                notes: '',
                canRefer: false
            });

            jobAggregator.addConnection({
                name: 'User 2',
                connectionDegree: '2nd',
                notes: '',
                canRefer: true
            });

            const connections = jobAggregator.getConnections();
            expect(connections).toHaveLength(2);
        });

        it('should update connection', () => {
            const conn = jobAggregator.addConnection({
                name: 'Original Name',
                connectionDegree: '2nd',
                notes: '',
                canRefer: false
            });

            jobAggregator.updateConnection(conn.id, { canRefer: true, notes: 'Can refer!' });

            const updated = jobAggregator.getConnections().find(c => c.id === conn.id);
            expect(updated?.canRefer).toBe(true);
            expect(updated?.notes).toBe('Can refer!');
        });
    });

    describe('Alerts Management', () => {
        it('should create an alert', () => {
            const alertData: Omit<Alert, 'id' | 'createdAt' | 'triggeredCount'> = {
                keywords: ['React', 'TypeScript'],
                locations: ['San Francisco', 'Remote'],
                workTypes: ['remote', 'hybrid'],
                salaryMin: 100000,
                notifyEmail: true,
                notifyPush: false,
                active: true
            };

            const alert = jobAggregator.createAlert(alertData);

            expect(alert).toBeDefined();
            expect(alert.id).toBeDefined();
            expect(alert.keywords).toContain('React');
            expect(alert.active).toBe(true);
        });

        it('should toggle alert active status', () => {
            const alert = jobAggregator.createAlert({
                keywords: ['Python'],
                active: true,
                notifyEmail: true,
                notifyPush: false
            });

            jobAggregator.updateAlert(alert.id, { active: false });

            const updated = jobAggregator.getAlerts().find(a => a.id === alert.id);
            expect(updated?.active).toBe(false);
        });

        it('should delete an alert', () => {
            const alert = jobAggregator.createAlert({
                keywords: ['Test'],
                active: true,
                notifyEmail: true,
                notifyPush: false
            });

            jobAggregator.deleteAlert(alert.id);

            const alerts = jobAggregator.getAlerts();
            expect(alerts.find(a => a.id === alert.id)).toBeUndefined();
        });
    });

    describe('Market Data', () => {
        it('should return market stats', async () => {
            const stats = await jobAggregator.getMarketStats('Software Engineer', 'San Francisco');

            expect(stats).toBeDefined();
            expect(stats.totalJobs).toBeGreaterThan(0);
            expect(stats.topSkills).toBeDefined();
            expect(Array.isArray(stats.topSkills)).toBe(true);
        });

        it('should return salary data', async () => {
            const salaries = await jobAggregator.getSalaryData('Software Engineer', 'US');

            expect(salaries).toBeDefined();
            expect(salaries.length).toBeGreaterThan(0);
            expect(salaries[0]).toHaveProperty('min');
            expect(salaries[0]).toHaveProperty('max');
            expect(salaries[0]).toHaveProperty('median');
        });
    });

    describe('Job Status Pipeline', () => {
        it('should count jobs by status', () => {
            const statuses: JobStatus[] = ['new', 'applied', 'applied', 'rejected'];

            statuses.forEach((status, index) => {
                jobAggregator.addJob({
                    title: `Job ${index}`,
                    company: 'Co',
                    location: 'Loc',
                    workType: 'remote',
                    description: 'Desc',
                    requirements: [],
                    postedAt: Date.now(),
                    source: 'linkedin',
                    sourceUrl: '',
                    status
                });
            });

            const jobs = jobAggregator.getJobs();
            const newCount = jobs.filter(j => j.status === 'new').length;
            const appliedCount = jobs.filter(j => j.status === 'applied').length;

            expect(newCount).toBe(1);
            expect(appliedCount).toBe(2);
        });
    });
});
