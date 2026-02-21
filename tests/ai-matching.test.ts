
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiMatchingService } from '../src/services/ai-matching';
import type { Job, Company, Connection } from '../src/services/job-types';

describe('AIMatchingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Cosine Similarity', () => {
        it('should return 1 for identical vectors', () => {
            const vector = [1, 2, 3, 4, 5];
            const similarity = (aiMatchingService as any).cosineSimilarity(vector, vector);
            expect(similarity).toBeCloseTo(1, 5);
        });

        it('should return 0 for orthogonal vectors', () => {
            const vectorA = [1, 0, 0];
            const vectorB = [0, 1, 0];
            const similarity = (aiMatchingService as any).cosineSimilarity(vectorA, vectorB);
            expect(similarity).toBeCloseTo(0, 5);
        });

        it('should return 0 for empty vectors', () => {
            const similarity = (aiMatchingService as any).cosineSimilarity([], []);
            expect(similarity).toBe(0);
        });

        it('should return 0 for undefined vectors', () => {
            const similarity = (aiMatchingService as any).cosineSimilarity(null as any, null as any);
            expect(similarity).toBe(0);
        });
    });

    describe('Model Status', () => {
        it('should return model status', () => {
            const status = aiMatchingService.getModelStatus();
            expect(status).toHaveProperty('loaded');
            expect(status).toHaveProperty('modelName');
            expect(status.modelName).toContain('all-MiniLM');
        });
    });

    describe('Job Match Analysis', () => {
        const mockJob: Job = {
            id: 'test-job-1',
            title: 'Senior Frontend Engineer',
            company: 'TechCorp',
            location: 'San Francisco, CA',
            workType: 'hybrid',
            description: 'We are looking for a Senior Frontend Engineer with experience in React, TypeScript, and modern web technologies.',
            requirements: [
                '5+ years of frontend development experience',
                'Expert in React and TypeScript',
                'Experience with state management',
                'Strong communication skills'
            ],
            niceToHave: ['Next.js', 'GraphQL', 'Node.js'],
            salaryMin: 150000,
            salaryMax: 200000,
            salaryCurrency: 'USD',
            postedAt: Date.now(),
            source: 'linkedin',
            sourceUrl: 'https://linkedin.com/jobs/123',
            status: 'new',
            notes: [],
            interviews: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        it('should calculate match result for well-qualified candidate', async () => {
            vi.stubGlobal('localStorage', {
                getItem: () => null,
                setItem: () => {},
            });

            const profileServiceModule = await import('../src/services/profile');
            const mockProfile = {
                name: 'John Doe',
                headline: 'Senior Software Engineer',
                location: 'San Francisco',
                about: 'Experienced developer',
                skills: ['React', 'TypeScript', 'JavaScript', 'Node.js'],
                linkedinUrl: '',
                isConfigured: true,
                experience: [
                    { role: 'Senior Frontend Engineer', company: 'PreviousCorp', duration: '2020-Present' }
                ]
            };

            vi.spyOn(profileServiceModule.profileService, 'getProfile').mockReturnValue(mockProfile as any);

            const result = await aiMatchingService.analyzeJobMatch(mockJob, '');

            expect(result).toBeDefined();
            expect(result.jobId).toBe(mockJob.id);
            expect(result.overallScore).toBeGreaterThan(0);
            expect(result.overallScore).toBeLessThanOrEqual(1);
            expect(result.skillMatch).toBeGreaterThan(0);
            expect(result.missingSkills).toBeDefined();
            expect(Array.isArray(result.missingSkills)).toBe(true);
            expect(result.suggestedKeywords).toBeDefined();
        });

        it('should identify missing skills', async () => {
            vi.stubGlobal('localStorage', {
                getItem: () => null,
                setItem: () => {},
            });

            const profileServiceModule = await import('../src/services/profile');
            const mockProfile = {
                name: 'Jane Dev',
                headline: 'Developer',
                location: 'NYC',
                about: 'Junior developer',
                skills: ['JavaScript'],
                linkedinUrl: '',
                isConfigured: true,
                experience: []
            };

            vi.spyOn(profileServiceModule.profileService, 'getProfile').mockReturnValue(mockProfile as any);

            const result = await aiMatchingService.analyzeJobMatch(mockJob, '');

            expect(result.missingSkills.length).toBeGreaterThan(0);
            expect(result.skillMatch).toBeLessThan(0.5);
        });
    });

    describe('Company Analysis', () => {
        const mockCompany: Company = {
            id: 'techcorp',
            name: 'TechCorp',
            domain: 'techcorp.com',
            industry: 'Technology',
            size: '1000-5000',
            headquarters: 'San Francisco, CA',
            website: 'https://techcorp.com',
            glassdoorRating: 4.5,
            glassdoorReviews: 2500,
            linkedinFollowers: 50000,
            culture: ['Innovation-focused', 'Fast-paced', 'Remote-friendly'],
            benefits: ['Health Insurance', '401k', 'Stock Options', 'Unlimited PTO']
        };

        it('should analyze company fit for matching candidate', async () => {
            const profile = {
                skills: ['React', 'TypeScript', 'Technology', 'Innovation'],
                experience: [
                    { role: 'Senior Engineer', company: 'TechCorp' },
                    { role: 'Staff Engineer', company: 'Startup' }
                ]
            };

            const result = await aiMatchingService.analyzeCompanyFit(mockCompany, profile);

            expect(result).toBeDefined();
            expect(result.companyId).toBe(mockCompany.id);
            expect(result.alignment).toBeGreaterThan(0);
            expect(result.alignment).toBeLessThanOrEqual(1);
            expect(result.pros).toBeDefined();
            expect(result.interviewLikelihood).toBeGreaterThan(0);
        });

        it('should identify company pros', async () => {
            const profile = {
                skills: ['Java'],
                experience: []
            };

            const result = await aiMatchingService.analyzeCompanyFit(mockCompany, profile);

            expect(result.pros.some(p => p.includes('Glassdoor'))).toBe(true);
            expect(result.pros.some(p => p.includes('Health'))).toBe(true);
        });
    });

    describe('Referral Suggestions', () => {
        const mockCompany: Company = {
            id: 'techcorp',
            name: 'TechCorp',
            domain: 'techcorp.com'
        };

        it('should find 1st degree connections at company', async () => {
            const connections: Connection[] = [
                {
                    id: '1',
                    name: 'John Doe',
                    company: 'TechCorp',
                    title: 'Engineering Manager',
                    connectionDegree: '1st',
                    notes: '',
                    canRefer: true
                },
                {
                    id: '2',
                    name: 'Jane Smith',
                    company: 'OtherCorp',
                    title: 'Developer',
                    connectionDegree: '2nd',
                    notes: '',
                    canRefer: false
                }
            ];

            const suggestions = await aiMatchingService.findReferralConnections(mockCompany, connections);

            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0].connectionName).toBe('John Doe');
            expect(suggestions[0].canRefer).toBe(true);
        });

        it('should prioritize connections at target company', async () => {
            const connections: Connection[] = [
                {
                    id: '1',
                    name: 'Colleague',
                    company: 'OtherCompany',
                    connectionDegree: '1st',
                    notes: '',
                    canRefer: true
                },
                {
                    id: '2',
                    name: 'Friend at Company',
                    company: 'TechCorp',
                    connectionDegree: '2nd',
                    notes: '',
                    canRefer: true
                }
            ];

            const suggestions = await aiMatchingService.findReferralConnections(mockCompany, connections);

            expect(suggestions[0].relevance).toBeGreaterThanOrEqual(suggestions[1].relevance);
        });
    });

    describe('Cover Letter Tailoring', () => {
        const mockJob: Job = {
            id: 'job-123',
            title: 'Senior Software Engineer',
            company: 'InnovateTech',
            location: 'Seattle, WA',
            workType: 'hybrid',
            description: 'Build cutting-edge products using modern technologies.',
            requirements: ['5+ years exp', 'Python', 'AWS'],
            postedAt: Date.now(),
            source: 'linkedin',
            sourceUrl: '',
            status: 'new',
            notes: [],
            interviews: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const mockProfile = {
            name: 'Alex Developer',
            skills: ['Python', 'JavaScript', 'React'],
            experience: [
                { role: 'Senior Developer', company: 'TechStartup' }
            ]
        };

        it('should generate tailored cover letter', async () => {
            const coverLetter = await aiMatchingService.generateCoverLetterTailoring(mockJob, mockProfile);

            expect(coverLetter).toBeDefined();
            expect(coverLetter).toContain('Senior Software Engineer');
            expect(coverLetter).toContain('InnovateTech');
            expect(coverLetter).toContain('Alex Developer');
        });

        it('should include relevant skills in cover letter', async () => {
            const coverLetter = await aiMatchingService.generateCoverLetterTailoring(mockJob, mockProfile);

            const hasSkills = mockProfile.skills.some(skill => 
                coverLetter.toLowerCase().includes(skill.toLowerCase())
            );
            expect(hasSkills).toBe(true);
        });
    });
});
