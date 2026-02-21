
export type JobStatus = 'new' | 'viewed' | 'applied' | 'phone_screen' | 'technical' | 'onsite' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';
export type WorkType = 'remote' | 'hybrid' | 'onsite' | 'unknown';
export type JobSource = 'linkedin' | 'indeed' | 'remoteok' | 'glassdoor' | 'greenhouse' | 'lever' | 'company_website' | 'manual';

export interface Job {
    id: string;
    externalId?: string;
    title: string;
    company: string;
    companyId?: string;
    location: string;
    workType: WorkType;
    description: string;
    requirements: string[];
    niceToHave?: string[];
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    postedAt: number;
    expiresAt?: number;
    source: JobSource;
    sourceUrl: string;
    applyUrl?: string;
    logoUrl?: string;
    status: JobStatus;
    matchScore?: number;
    riskScore?: number;
    appliedAt?: number;
    notes: string[];
    interviews: Interview[];
    createdAt: number;
    updatedAt: number;
}

export interface Interview {
    id: string;
    jobId: string;
    type: 'phone_screen' | 'technical' | 'behavioral' | 'culture' | 'coding' | 'system_design' | 'final' | 'other';
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    scheduledAt?: number;
    completedAt?: number;
    duration?: number;
    interviewers: string[];
    notes: string;
    feedback?: string;
    rating?: number;
}

export interface Company {
    id: string;
    name: string;
    domain?: string;
    logoUrl?: string;
    description?: string;
    industry?: string;
    size?: string;
    founded?: number;
    headquarters?: string;
    website?: string;
    glassdoorRating?: number;
    glassdoorReviews?: number;
    linkedinFollowers?: number;
    funding?: string;
    ceo?: string;
    competitors?: string[];
    recentNews?: CompanyNews[];
    culture?: string[];
    benefits?: string[];
}

export interface CompanyNews {
    title: string;
    url: string;
    date: number;
    source: string;
}

export interface Application {
    id: string;
    jobId: string;
    status: JobStatus;
    appliedAt: number;
    updatedAt: number;
    resumeVersion?: string;
    coverLetter?: string;
    referral?: string;
    notes: string;
    followUpDate?: number;
    responseReceived?: boolean;
    responseDate?: number;
}

export interface Connection {
    id: string;
    name: string;
    headline?: string;
    company?: string;
    title?: string;
    linkedinUrl?: string;
    connectionDegree: '1st' | '2nd' | '3rd';
    connectedAt?: number;
    notes: string;
    canRefer: boolean;
}

export interface Alert {
    id: string;
    keywords: string[];
    locations?: string[];
    workTypes?: WorkType[];
    salaryMin?: number;
    sources?: JobSource[];
    notifyEmail: boolean;
    notifyPush: boolean;
    active: boolean;
    createdAt: number;
    lastTriggered?: number;
    triggeredCount: number;
}

export interface SalaryData {
    title: string;
    company?: string;
    location?: string;
    experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
    min: number;
    max: number;
    median: number;
    currency: string;
    count: number;
    source: string;
    updatedAt: number;
}

export interface JobMarketStats {
    totalJobs: number;
    remoteRatio: number;
    avgSalary: number;
    topSkills: string[];
    hotLocations: string[];
    demandTrend: 'up' | 'down' | 'stable';
    competitionLevel: 'low' | 'medium' | 'high';
}

export interface UserPreferences {
    targetRoles: string[];
    targetLocations: string[];
    targetSalaryMin: number;
    remoteOnly: boolean;
    skills: string[];
    experienceYears: number;
    noticePeriod: number;
}

export interface Resume {
    id: string;
    name: string;
    content: string;
    skills: string[];
    experience: ExperienceEntry[];
    education: EducationEntry[];
    lastUpdated: number;
    isDefault: boolean;
}

export interface ExperienceEntry {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
}

export interface EducationEntry {
    school: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
}

export interface JobSearchQuery {
    keywords?: string;
    location?: string;
    workType?: WorkType;
    salaryMin?: number;
    experienceLevel?: string;
    company?: string;
    source?: JobSource;
    page?: number;
    limit?: number;
}
