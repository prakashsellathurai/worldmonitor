
import { pipeline, env } from '@xenova/transformers';
import { Job, Connection, Company } from './job-types';
import { profileService } from './profile';

env.allowLocalModels = false;

export interface MatchResult {
    jobId: string;
    overallScore: number;
    skillMatch: number;
    experienceMatch: number;
    cultureMatch: number;
    missingSkills: string[];
    suggestedKeywords: string[];
    summary: string;
}

export interface CompanyAnalysis {
    companyId: string;
    alignment: number;
    pros: string[];
    cons: string[];
    redFlags: string[];
    interviewLikelihood: number;
    notes: string;
}

export interface ReferralSuggestion {
    connectionId: string;
    connectionName: string;
    company: string;
    relevance: number;
    message: string;
    canRefer: boolean;
}

class AIMatchingService {
    private extractor: any = null;
    private isInitialized = false;
    private modelUsable = this.canUseLocalModel();
    private modelName = 'Xenova/all-MiniLM-L6-v2';

    constructor() {}

    private canUseLocalModel(): boolean {
        const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
        const isTestRun = (import.meta as any)?.env?.MODE === 'test';
        return isBrowser && !isTestRun;
    }

    async initialize() {
        if (this.isInitialized || !this.modelUsable) return;
        
        try {
            console.log('Loading AI matching model...');
            this.extractor = await pipeline('feature-extraction', this.modelName);
            this.isInitialized = true;
            console.log('AI matching model loaded successfully');
        } catch (e) {
            console.error('Failed to load AI matching model:', e);
            this.modelUsable = false;
        }
    }

    async getJobEmbedding(text: string): Promise<number[]> {
        if (!this.extractor) await this.initialize();
        if (!this.extractor) return [];

        try {
            const result = await this.extractor(text, {
                pooling: 'mean',
                normalize: true
            });

            return Array.from(result.data);
        } catch (e) {
            console.error('Error computing embeddings:', e);
            // Some runtimes cannot execute onnx tensors reliably; disable and fall back.
            this.extractor = null;
            this.isInitialized = false;
            this.modelUsable = false;
            return [];
        }
    }

    cosineSimilarity(a: number[], b: number[]): number {
        if (!a || !b || a.length !== b.length || a.length === 0) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            const av = a[i] || 0;
            const bv = b[i] || 0;
            dotProduct += av * bv;
            normA += av * av;
            normB += bv * bv;
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async analyzeJobMatch(job: Job, _profileText: string): Promise<MatchResult> {
        await this.initialize();

        const profile = profileService.getProfile();
        const profileSkills = profile.skills || [];
        const jobRequirements = job.requirements || [];
        const jobNiceToHave = job.niceToHave || [];

        const skillMatch = this.calculateSkillMatch(profileSkills, jobRequirements);
        const experienceMatch = this.calculateExperienceMatch(profile.experience, jobRequirements);
        
        const combinedText = `${job.title} ${job.description} ${jobRequirements.join(' ')}`;
        const profileCombined = `${profile.about} ${profileSkills.join(' ')} ${profile.experience.map(e => `${e.role} ${e.company}`).join(' ')}`;

        let semanticScore = 0;
        if (this.extractor) {
            const [jobEmb, profEmb] = await Promise.all([
                this.getJobEmbedding(combinedText),
                this.getJobEmbedding(profileCombined)
            ]);
            semanticScore = this.cosineSimilarity(jobEmb, profEmb);
        }

        const missingSkills = this.findMissingSkills(profileSkills, jobRequirements, jobNiceToHave);
        const suggestedKeywords = this.generateSuggestedKeywords(missingSkills);

        const overallScore = (skillMatch * 0.4) + (experienceMatch * 0.3) + (semanticScore * 0.3);
        
        const summary = this.generateMatchSummary(job, skillMatch, missingSkills);

        return {
            jobId: job.id,
            overallScore: Math.min(1, overallScore),
            skillMatch,
            experienceMatch,
            cultureMatch: semanticScore,
            missingSkills,
            suggestedKeywords,
            summary
        };
    }

    private calculateSkillMatch(userSkills: string[], jobRequirements: string[]): number {
        if (jobRequirements.length === 0) return 0.8;

        const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
        
        let matchCount = 0;
        const skillKeywords = [
            'javascript', 'typescript', 'react', 'node', 'python', 'java', 'aws', 'docker',
            'kubernetes', 'sql', 'postgresql', 'mongodb', 'git', 'ci/cd', 'agile', 'scrum',
            'machine learning', 'ai', 'tensorflow', 'pytorch', 'data science', 'linux'
        ];

        for (const req of jobRequirements) {
            const reqLower = req.toLowerCase();
            
            const hasSkill = normalizedUserSkills.some(skill => 
                reqLower.includes(skill.toLowerCase()) || 
                skill.toLowerCase().includes(reqLower)
            );
            
            if (hasSkill) matchCount++;
            
            for (const keyword of skillKeywords) {
                if (reqLower.includes(keyword) && normalizedUserSkills.some(s => s.includes(keyword))) {
                    matchCount += 0.5;
                    break;
                }
            }
        }

        const maxPossible = jobRequirements.length + skillKeywords.length * 0.5;
        return Math.min(1, matchCount / maxPossible);
    }

    private calculateExperienceMatch(experience: { role: string; company: string }[], jobRequirements: string[]): number {
        if (!experience || experience.length === 0) return 0.5;

        const yearsMatch = jobRequirements.some(req => {
            const yearsMatch = req.match(/(\d+)\+\s*years?/i);
            if (yearsMatch && yearsMatch[1]) {
                const requiredYears = parseInt(yearsMatch[1], 10);
                const totalYears = experience.length * 2;
                return totalYears >= requiredYears;
            }
            return true;
        });

        return yearsMatch ? 0.8 : 0.4;
    }

    private findMissingSkills(userSkills: string[], requirements: string[], niceToHave: string[]): string[] {
        const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
        const allRequirements = [...requirements, ...niceToHave];
        
        return allRequirements.filter(req => {
            const reqLower = req.toLowerCase();
            return !normalizedUserSkills.some(skill => 
                reqLower.includes(skill.toLowerCase()) || 
                skill.toLowerCase().includes(reqLower)
            );
        });
    }

    private generateSuggestedKeywords(missingSkills: string[]): string[] {
        return missingSkills.slice(0, 5).map(skill => {
            const commonKeywords: Record<string, string> = {
                'react': 'React.js',
                'typescript': 'TypeScript',
                'node': 'Node.js',
                'aws': 'Amazon Web Services',
                'docker': 'Docker containers',
                'kubernetes': 'K8s',
                'machine learning': 'ML',
                'sql': 'SQL databases'
            };
            return commonKeywords[skill.toLowerCase()] || skill;
        });
    }

    private generateMatchSummary(job: Job, matchScore: number, missingSkills: string[]): string {
        const scorePercent = Math.round(matchScore * 100);
        
        if (scorePercent >= 80) {
            return `Excellent match! You're well-qualified for the ${job.title} role at ${job.company}.`;
        } else if (scorePercent >= 60) {
            const skillsList = missingSkills.slice(0, 3).join(', ');
            return `Good match. Consider highlighting: ${skillsList}.`;
        } else if (scorePercent >= 40) {
            return `Moderate match. The role requires skills you may need to develop.`;
        } else {
            return `This role may be a stretch. Consider similar positions or upskilling.`;
        }
    }

    async analyzeCompanyFit(company: Company, profile: { skills: string[]; experience: { role: string; company: string }[] }): Promise<CompanyAnalysis> {
        const companyKeywords = [
            company.industry?.toLowerCase() || '',
            company.culture?.join(' ').toLowerCase() || '',
            company.benefits?.join(' ').toLowerCase() || ''
        ].join(' ');

        const profileKeywords = [
            ...profile.skills,
            ...profile.experience.map(e => e.company)
        ].join(' ').toLowerCase();

        const alignment = this.simpleKeywordMatch(companyKeywords, profileKeywords);

        const pros: string[] = [];
        const cons: string[] = [];
        const redFlags: string[] = [];

        if (company.glassdoorRating && company.glassdoorRating >= 4.0) {
            pros.push(`Strong Glassdoor rating (${company.glassdoorRating.toFixed(1)})`);
        } else if (company.glassdoorRating && company.glassdoorRating < 3.0) {
            cons.push(`Lower Glassdoor rating (${company.glassdoorRating.toFixed(1)})`);
        }

        if (company.benefits?.includes('Health Insurance')) {
            pros.push('Health benefits');
        }

        if (company.size === '100-500' || company.size === '500-1000') {
            pros.push('Mid-size company - good growth potential');
        }

        const interviewLikelihood = alignment > 0.5 ? 0.7 : alignment > 0.3 ? 0.5 : 0.3;

        return {
            companyId: company.id,
            alignment,
            pros,
            cons,
            redFlags,
            interviewLikelihood,
            notes: this.generateCompanyNotes(alignment, pros, cons)
        };
    }

    private simpleKeywordMatch(text1: string, text2: string): number {
        const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
        
        let matches = 0;
        for (const word of words2) {
            if (words1.has(word)) matches++;
        }
        
        return Math.min(1, matches / Math.max(1, words2.size));
    }

    private generateCompanyNotes(alignment: number, pros: string[], cons: string[]): string {
        if (alignment > 0.7) {
            return `Strong alignment. ${pros.join('. ')}`;
        } else if (alignment > 0.4) {
            return `Moderate alignment. ${pros.join('. ')}${cons.length > 0 ? ' Consider: ' + cons.join(', ') : ''}`;
        }
        return 'Limited alignment based on your profile.';
    }

    async findReferralConnections(company: Company, connections: Connection[]): Promise<ReferralSuggestion[]> {
        const suggestions: ReferralSuggestion[] = [];
        const companyLower = company.name.toLowerCase();

        for (const conn of connections) {
            let relevance = 0;
            
            if (conn.company?.toLowerCase().includes(companyLower) || 
                companyLower.includes(conn.company?.toLowerCase() || '')) {
                relevance = 1.0;
            } else if (conn.connectionDegree === '1st') {
                relevance = 0.6;
            } else if (conn.connectionDegree === '2nd') {
                relevance = 0.3;
            }

            if (relevance > 0) {
                suggestions.push({
                    connectionId: conn.id,
                    connectionName: conn.name,
                    company: company.name,
                    relevance,
                    message: this.generateReferralMessage(conn, company.name),
                    canRefer: conn.canRefer
                });
            }
        }

        return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
    }

    private generateReferralMessage(conn: Connection, companyName: string): string {
        const name = conn.name || 'there';
        const templates = [
            `Hi ${name}, I noticed you're connected at ${companyName}. Would you be open to a quick chat about the company culture?`,
            `${name}, I'd love to learn more about your experience at ${companyName}. Mind if I ask a few questions?`,
            `Hey ${name}, saw you're at ${companyName}. Any chance you'd be comfortable referring me for a role there?`
        ];
        const idx = Math.floor(Math.random() * templates.length);
        return templates[idx] ?? templates[0] ?? 'Hi, I would love to connect.';
    }

    async generateCoverLetterTailoring(job: Job, profile: { name: string; skills: string[]; experience: { role: string; company: string }[] }): Promise<string> {
        const recentExp = profile.experience[0];
        
        return `Dear Hiring Manager,

I'm writing to express my strong interest in the ${job.title} position at ${job.company}. With my background as ${recentExp?.role || 'a software engineer'}${recentExp?.company ? ` at ${recentExp.company}` : ''}, and my expertise in ${profile.skills.slice(0, 4).join(', ')}, I believe I would be a valuable addition to your team.

What excites me most about ${job.company} is ${this.getCompanyExcitement(job)}. My experience has prepared me to contribute immediately to ${job.description.substring(0, 100)}...

I'm eager to bring my skills to your team and help drive continued success.

Best regards,
${profile.name}`;
    }

    private getCompanyExcitement(job: Job): string {
        const companyName = job.company || 'your company';
        const excitements = [
            `your innovative approach to technology`,
            `the opportunity to work on challenging problems`,
            `your company culture and values`,
            `the growth potential at ${companyName}`
        ];
        const idx = Math.floor(Math.random() * excitements.length);
        return excitements[idx] ?? excitements[0] ?? 'your innovative approach';
    }

    getModelStatus(): { loaded: boolean; modelName: string } {
        return {
            loaded: this.isInitialized,
            modelName: this.modelName
        };
    }
}

export const aiMatchingService = new AIMatchingService();
