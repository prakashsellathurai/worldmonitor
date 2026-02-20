
import { Panel } from '../Panel';
import { profileService, type UserProfile } from '@/services/profile';
import { parseResume } from '@/services/resume-parser';

export class UpdateProfilePanel extends Panel {
    private profile: UserProfile | null = null;
    private inputUrl: string = '';
    private isParsing: boolean = false;

    constructor() {
        super({
            id: 'profile-panel',
            title: 'My Profile',
            showCount: false,
        });

        profileService.subscribe((profile) => {
            this.profile = profile;
            this.render();
        });
    }

    private async handleFileUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file) return;

        this.isParsing = true;
        this.render();

        try {
            const parsed = await parseResume(file);
            console.log('Parsed Resume:', parsed);

            profileService.updateProfile({
                name: parsed.name || this.profile?.name || 'Unknown Candidate',
                // Headline simulation from first few lines if not found
                headline: parsed.text.substring(0, 50).split('\n')[0] || 'Software Engineer',
                about: parsed.text.substring(0, 200) + '...',
                skills: parsed.skills || [],
                linkedinUrl: parsed.links?.find(l => l.includes('linkedin')) || '',
                isConfigured: true
            });

        } catch (e) {
            console.error('Resume parsing failed', e);
            alert('Failed to parse resume: ' + (e as Error).message);
        } finally {
            this.isParsing = false;
            this.render(); // Will re-render with updated profile
        }
    }

    private render() {
        if (!this.profile) {
            this.setContent('<div class="p-4 text-dim">Loading profile...</div>');
            return;
        }

        // If not configured, show onboarding
        if (!this.profile.isConfigured) {
            this.renderOnboarding();
            return;
        }

        // Configured View
        this.renderProfile();
    }

    private renderOnboarding() {
        this.setContent(`
            <div class="onboarding-container">
                <div class="welcome-msg">
                    <h3>Welcome to Job Monitor</h3>
                    <p>To get started, please set up your profile.</p>
                </div>
                
                <div class="options-grid">
                    <div class="option-card">
                        <h4>Import from LinkedIn</h4>
                        <div class="input-group">
                            <input type="text" id="linkedin-url-input" placeholder="e.g. linkedin.com/in/username" />
                            <button id="fetch-linkedin-btn">Fetch</button>
                        </div>
                    </div>
                    
                    <div class="divider">OR</div>
                    
                    <div class="option-card">
                        <h4>Upload Resume</h4>
                        <p class="sub-text">We'll extract your skills automatically.</p>
                        <label for="resume-upload" class="upload-btn">
                            ${this.isParsing ? 'Parsing...' : 'Select PDF / Text'}
                        </label>
                        <input type="file" id="resume-upload" accept=".pdf,.txt" style="display: none;" />
                    </div>
                </div>
            </div>
            <style>
                .onboarding-container { padding: 20px; text-align: center; }
                .welcome-msg h3 { font-size: 16px; margin-bottom: 8px; color: var(--accent); }
                .welcome-msg p { color: var(--text-secondary); margin-bottom: 24px; }
                
                .options-grid { display: flex; flex-direction: column; gap: 16px; max-width: 400px; margin: 0 auto; }
                .option-card { background: var(--surface-hover); padding: 16px; border-radius: 8px; border: 1px solid var(--border); }
                .option-card h4 { margin-bottom: 12px; font-size: 13px; }
                
                .input-group { display: flex; gap: 8px; }
                .input-group input { flex: 1; padding: 6px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text); }
                .input-group button { padding: 6px 12px; background: var(--blue); color: white; border: none; border-radius: 4px; cursor: pointer; }
                
                .divider { font-size: 11px; color: var(--text-dim); font-weight: bold; }
                
                .upload-btn { display: inline-block; padding: 8px 16px; background: var(--surface-active); border: 1px dashed var(--border-strong); border-radius: 4px; cursor: pointer; color: var(--text); transition: all 0.2s; }
                .upload-btn:hover { border-color: var(--accent); color: var(--accent); }
                .sub-text { font-size: 10px; color: var(--text-dim); margin-bottom: 8px; }
            </style>
        `);

        this.bindEvents();
    }

    private renderProfile() {
        this.setContent(`
            <div class="profile-view">
                <div class="profile-header">
                    <div class="header-top">
                        <h3 class="profile-name">${this.profile?.name}</h3>
                        <button id="reset-profile-btn" class="icon-btn" title="Reset Profile">
                            <span class="reset-icon">✕</span>
                        </button>
                    </div>
                    <p class="profile-headline">${this.profile?.headline}</p>
                    <p class="profile-meta">
                        ${this.profile?.location ? `<span>📍 ${this.profile.location}</span>` : ''}
                        ${this.profile?.linkedinUrl ? `<span>🔗 Linked</span>` : ''}
                    </p>
                </div>
                
                <div class="profile-section">
                    <strong>Skills</strong>
                    <div class="skills-list">
                        ${this.profile?.skills?.length ? this.profile.skills.map(s => `<span class="skill-tag">${s}</span>`).join('') : '<span class="text-dim">No skills detected</span>'}
                    </div>
                </div>

                ${this.profile?.about ? `
                <div class="profile-section">
                    <strong>About</strong>
                    <p class="about-text">${this.profile.about}</p>
                </div>
                ` : ''}
            </div>
            <style>
                .profile-view { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
                .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
                .profile-name { font-size: 18px; font-weight: bold; color: var(--accent); margin: 0; }
                .profile-headline { font-size: 12px; color: var(--text-secondary); margin: 4px 0; }
                .profile-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-dim); margin-top: 4px; }
                
                .profile-section strong { font-size: 11px; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 6px; letter-spacing: 0.5px; }
                .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
                .skill-tag { background: var(--bg); border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px; font-size: 11px; color: var(--text-dim); }
                .about-text { font-size: 12px; line-height: 1.5; color: var(--text-secondary); white-space: pre-wrap; }
                
                .icon-btn { background: transparent; border: none; cursor: pointer; color: var(--text-dim); padding: 4px; }
                .icon-btn:hover { color: var(--red); }
                .reset-icon { font-size: 14px; font-weight: bold; }
                .text-dim { color: var(--text-dim); font-style: italic; font-size: 11px; }
            </style>
        `);

        setTimeout(() => {
            const resetBtn = document.getElementById('reset-profile-btn');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    if (confirm('Are you sure you want to reset your profile?')) {
                        profileService.resetProfile();
                    }
                };
            }
        }, 0);
    }

    private bindEvents() {
        setTimeout(() => {
            const input = document.getElementById('linkedin-url-input') as HTMLInputElement;
            const btn = document.getElementById('fetch-linkedin-btn');
            const fileInput = document.getElementById('resume-upload') as HTMLInputElement;

            if (input) {
                input.oninput = (e) => this.inputUrl = (e.target as HTMLInputElement).value;
            }
            if (btn) {
                btn.onclick = () => {
                    if (this.inputUrl) {
                        profileService.fetchLinkedInProfile(this.inputUrl);
                    }
                };
            }
            if (fileInput) {
                fileInput.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    this.handleFileUpload(files);
                };
            }
        }, 0);
    }
}
