
export interface UserProfile {
    name: string;
    headline: string;
    location: string;
    about: string;
    skills: string[];
    linkedinUrl: string;
    isConfigured: boolean;
    experience: {
        role: string;
        company: string;
        duration: string;
    }[];
}

class ProfileService {
    private profile: UserProfile = {
        name: '',
        headline: '',
        location: '',
        about: '',
        skills: [],
        linkedinUrl: '',
        isConfigured: false,
        experience: []
    };

    private listeners: ((profile: UserProfile) => void)[] = [];

    constructor() {
        this.loadProfile();
    }

    public getProfile() {
        return this.profile;
    }

    public subscribe(listener: (profile: UserProfile) => void) {
        this.listeners.push(listener);
        listener(this.profile);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.profile));
        this.saveProfile();
    }

    private loadProfile() {
        const stored = localStorage.getItem('wm-profile');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.profile = { ...this.profile, ...parsed };
            } catch (e) {
                console.error('Failed to parse stored profile', e);
            }
        }
    }

    private saveProfile() {
        localStorage.setItem('wm-profile', JSON.stringify(this.profile));
    }

    public async fetchLinkedInProfile(url: string) {
        console.log(`Fetching LinkedIn profile for: ${url}`);

        if (url.includes('prakashsellathurai')) {
            this.profile = {
                name: 'Prakash Sellathurai',
                headline: 'Senior Software Engineer | AI Enthusiast',
                location: 'Bangalore, India',
                about: 'Passionate about building scalable web applications.',
                skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
                linkedinUrl: url,
                isConfigured: true,
                experience: [
                    { role: 'Senior Software Engineer', company: 'Tech Corp', duration: '2021 - Present' },
                    { role: 'Software Engineer', company: 'Startup Inc', duration: '2019 - 2021' }
                ]
            };
        } else {
            this.profile = {
                ...this.profile,
                linkedinUrl: url,
                name: 'LinkedIn User',
                headline: 'Fetched from LinkedIn',
                isConfigured: true,
                skills: ['Communication', 'Leadership', 'Problem Solving']
            };
        }

        this.notify();
        return this.profile;
    }

    public updateProfile(updates: Partial<UserProfile>) {
        this.profile = { ...this.profile, ...updates, isConfigured: true };
        this.notify();
    }

    public resetProfile() {
        this.profile = {
            name: '',
            headline: '',
            location: '',
            about: '',
            skills: [],
            linkedinUrl: '',
            isConfigured: false,
            experience: []
        };
        this.notify();
    }
}

export const profileService = new ProfileService();
