/**
 * SpeechMagic Text-to-Speech Generator
 * Main application JavaScript
 */

class SpeechMagicApp {
    constructor() {
        // Initialize Supabase client
        this.supabase = window.supabase.createClient(
            'REPLACE_WITH_YOUR_SUPABASE_URL', // Replace with your Supabase URL
            'REPLACE_WITH_YOUR_ANON_KEY' // Replace with your Supabase anon key
        );

        // Application state
        this.currentUser = null;
        this.isGenerating = false;
        this.currentGeneration = null;

        // DOM elements
        this.elements = {
            // Pages
            landingPage: document.getElementById('landing-page'),
            mainApp: document.getElementById('main-app'),
            
            // Auth modal
            authModal: document.getElementById('auth-modal'),
            authForm: document.getElementById('auth-form'),
            authTitle: document.getElementById('auth-title'),
            authSubtitle: document.getElementById('auth-subtitle'),
            authSubmit: document.getElementById('auth-submit'),
            authToggle: document.getElementById('auth-toggle'),
            authSwitchText: document.getElementById('auth-switch-text'),
            authError: document.getElementById('auth-error'),
            authLoading: document.getElementById('auth-loading'),
            
            // Buttons
            signupBtn: document.getElementById('signup-btn'),
            signinBtn: document.getElementById('signin-btn'),
            getStartedBtn: document.getElementById('get-started-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            closeModal: document.getElementById('close-modal'),
            
            // TTS Interface
            textInput: document.getElementById('text-input'),
            charCounter: document.getElementById('char-counter'),
            generateBtn: document.getElementById('generate-btn'),
            
            // States
            loadingSection: document.getElementById('loading-section'),
            successSection: document.getElementById('success-section'),
            progressFill: document.getElementById('progress-fill'),
            cancelBtn: document.getElementById('cancel-btn'),
            
            // Audio
            generatedAudio: document.getElementById('generated-audio'),
            playBtn: document.getElementById('play-btn'),
            downloadBtn: document.getElementById('download-btn'),
            generateNewBtn: document.getElementById('generate-new-btn'),
            
            // User info
            userEmail: document.getElementById('user-email'),
            
            // History
            historyList: document.getElementById('history-list'),
            
            // Toasts
            errorToast: document.getElementById('error-toast'),
            successToast: document.getElementById('success-toast'),
            errorMessage: document.getElementById('error-message'),
            successMessage: document.getElementById('success-message'),
            closeError: document.getElementById('close-error'),
            closeSuccess: document.getElementById('close-success')
        };

        this.init();
    }

    async init() {
        console.log('🎵 SpeechMagic App Initializing...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check for existing session
        await this.checkAuthState();
        
        console.log('✅ App initialized');
    }

    setupEventListeners() {
        // Auth buttons
        this.elements.signupBtn?.addEventListener('click', () => this.showAuthModal('signup'));
        this.elements.signinBtn?.addEventListener('click', () => this.showAuthModal('signin'));
        this.elements.getStartedBtn?.addEventListener('click', () => this.showAuthModal('signup'));
        this.elements.logoutBtn?.addEventListener('click', () => this.signOut());
        
        // Modal controls
        this.elements.closeModal?.addEventListener('click', () => this.hideAuthModal());
        this.elements.authModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.authModal) this.hideAuthModal();
        });
        
        // Auth form
        this.elements.authForm?.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        this.elements.authToggle?.addEventListener('click', () => this.toggleAuthMode());
        
        // Text input
        this.elements.textInput?.addEventListener('input', () => this.updateCharCounter());
        
        // TTS controls
        this.elements.generateBtn?.addEventListener('click', () => this.generateAudio());
        this.elements.cancelBtn?.addEventListener('click', () => this.cancelGeneration());
        this.elements.generateNewBtn?.addEventListener('click', () => this.resetInterface());
        
        // Audio controls
        this.elements.playBtn?.addEventListener('click', () => this.playAudio());
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadAudio());
        
        // Toast controls
        this.elements.closeError?.addEventListener('click', () => this.hideErrorToast());
        this.elements.closeSuccess?.addEventListener('click', () => this.hideSuccessToast());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAuthModal();
                this.hideErrorToast();
                this.hideSuccessToast();
            }
        });
    }

    async checkAuthState() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session?.user) {
                this.currentUser = session.user;
                this.showMainApp();
                await this.loadUserHistory();
            } else {
                this.showLandingPage();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showLandingPage();
        }
    }

    showAuthModal(mode = 'signup') {
        this.authMode = mode;
        
        if (mode === 'signup') {
            this.elements.authTitle.textContent = 'Join SpeechMagic';
            this.elements.authSubtitle.textContent = 'Start creating amazing audio today';
            this.elements.authSubmit.textContent = 'Create Account';
            this.elements.authSwitchText.textContent = 'Already have an account?';
            this.elements.authToggle.textContent = 'Sign in';
        } else {
            this.elements.authTitle.textContent = 'Welcome Back';
            this.elements.authSubtitle.textContent = 'Sign in to continue creating';
            this.elements.authSubmit.textContent = 'Sign In';
            this.elements.authSwitchText.textContent = "Don't have an account?";
            this.elements.authToggle.textContent = 'Sign up';
        }
        
        this.elements.authModal.style.display = 'flex';
        this.elements.authError.style.display = 'none';
        this.elements.authLoading.style.display = 'none';
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('email')?.focus();
        }, 100);
    }

    hideAuthModal() {
        this.elements.authModal.style.display = 'none';
        this.elements.authForm.reset();
        this.elements.authError.style.display = 'none';
        this.elements.authLoading.style.display = 'none';
    }

    toggleAuthMode() {
        const newMode = this.authMode === 'signup' ? 'signin' : 'signup';
        this.showAuthModal(newMode);
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.elements.authForm);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!email || !password) {
            this.showAuthError('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthError('Password must be at least 6 characters');
            return;
        }
        
        this.elements.authLoading.style.display = 'block';
        this.elements.authError.style.display = 'none';
        this.elements.authSubmit.disabled = true;
        
        try {
            let result;
            
            if (this.authMode === 'signup') {
                result = await this.supabase.auth.signUp({ email, password });
            } else {
                result = await this.supabase.auth.signInWithPassword({ email, password });
            }
            
            if (result.error) {
                this.showAuthError(result.error.message);
                return;
            }
            
            if (result.data?.user) {
                this.currentUser = result.data.user;
                this.hideAuthModal();
                this.showMainApp();
                this.showSuccessToast(this.authMode === 'signup' ? 'Account created successfully!' : 'Welcome back!');
                await this.loadUserHistory();
            }
            
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthError('Authentication failed. Please try again.');
        } finally {
            this.elements.authLoading.style.display = 'none';
            this.elements.authSubmit.disabled = false;
        }
    }

    async signOut() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.showLandingPage();
            this.showSuccessToast('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            this.showErrorToast('Error signing out');
        }
    }

    showAuthError(message) {
        this.elements.authError.textContent = message;
        this.elements.authError.style.display = 'block';
    }

    showLandingPage() {
        this.elements.landingPage.style.display = 'block';
        this.elements.mainApp.style.display = 'none';
    }

    showMainApp() {
        this.elements.landingPage.style.display = 'none';
        this.elements.mainApp.style.display = 'block';
        
        if (this.currentUser) {
            this.elements.userEmail.textContent = this.currentUser.email;
        }
        
        this.resetInterface();
        this.updateCharCounter();
    }

    resetInterface() {
        this.elements.loadingSection.style.display = 'none';
        this.elements.successSection.style.display = 'none';
        this.elements.generateBtn.style.display = 'block';
        this.isGenerating = false;
        this.currentGeneration = null;
    }

    updateCharCounter() {
        const text = this.elements.textInput.value || '';
        const count = text.length;
        this.elements.charCounter.textContent = `${count} characters`;
        
        if (count > 4000) {
            this.elements.charCounter.style.color = 'var(--error-red)';
        } else {
            this.elements.charCounter.style.color = 'var(--text-gray)';
        }
    }

    async generateAudio() {
        const text = this.elements.textInput.value?.trim();
        
        if (!text) {
            this.showErrorToast('Please enter some text to convert');
            return;
        }
        
        if (text.length > 4000) {
            this.showErrorToast('Text must be 4000 characters or less');
            return;
        }
        
        if (this.isGenerating) {
            return;
        }
        
        this.isGenerating = true;
        this.elements.generateBtn.style.display = 'none';
        this.elements.loadingSection.style.display = 'block';
        
        // Simulate progress
        this.simulateProgress();
        
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (!session) {
                throw new Error('Please sign in again');
            }
            
            const response = await fetch('/api/tts/generate-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    text: text,
                    voice: 'nova',
                    speed: 1.0
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error?.message || 'Generation failed');
            }
            
            this.currentGeneration = result.data;
            this.showSuccess();
            await this.loadUserHistory();
            
        } catch (error) {
            console.error('Generation error:', error);
            this.showErrorToast(error.message || 'Failed to generate audio');
            this.resetInterface();
        }
    }

    simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            if (!this.isGenerating) {
                clearInterval(interval);
                return;
            }
            
            progress += Math.random() * 10;
            if (progress > 95) progress = 95;
            
            this.elements.progressFill.style.width = `${progress}%`;
        }, 500);
        
        // Complete progress when generation finishes
        setTimeout(() => {
            clearInterval(interval);
            if (this.isGenerating) {
                this.elements.progressFill.style.width = '100%';
            }
        }, 8000);
    }

    cancelGeneration() {
        this.isGenerating = false;
        this.resetInterface();
        this.showErrorToast('Generation cancelled');
    }

    showSuccess() {
        this.isGenerating = false;
        this.elements.loadingSection.style.display = 'none';
        this.elements.successSection.style.display = 'block';
        
        if (this.currentGeneration) {
            this.elements.generatedAudio.src = this.currentGeneration.audioUrl;
            this.elements.downloadBtn.onclick = () => this.downloadAudio();
        }
    }

    playAudio() {
        if (this.elements.generatedAudio.src) {
            this.elements.generatedAudio.play();
        }
    }

    downloadAudio() {
        if (this.currentGeneration) {
            const link = document.createElement('a');
            link.href = this.currentGeneration.audioUrl;
            link.download = this.currentGeneration.filename || 'speech.mp3';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showSuccessToast('Audio downloaded!');
        }
    }

    async loadUserHistory() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (!session) return;
            
            const response = await fetch('/api/tts/generations?limit=5', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.renderHistory(result.data.generations);
            }
            
        } catch (error) {
            console.error('History load error:', error);
        }
    }

    renderHistory(generations) {
        const historyList = this.elements.historyList;
        historyList.innerHTML = '';
        
        if (!generations || generations.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: var(--space-md);">No previous generations</p>';
            return;
        }
        
        generations.forEach(gen => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const timeAgo = this.getTimeAgo(new Date(gen.created_at));
            
            item.innerHTML = `
                <div class="history-content">
                    <div class="history-text">"${gen.text_preview}"</div>
                    <div class="history-meta">${timeAgo}</div>
                </div>
                <div class="history-actions">
                    <button onclick="app.playHistoryAudio('${gen.file_url}')" class="btn btn-secondary btn-small">♪</button>
                    <button onclick="app.downloadHistoryAudio('${gen.file_url}', '${gen.filename}')" class="btn btn-secondary btn-small">↓</button>
                </div>
            `;
            
            historyList.appendChild(item);
        });
    }

    playHistoryAudio(url) {
        const audio = new Audio(url);
        audio.play().catch(error => {
            console.error('Play error:', error);
            this.showErrorToast('Failed to play audio');
        });
    }

    downloadHistoryAudio(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'speech.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    showErrorToast(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorToast.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hideErrorToast(), 5000);
    }

    showSuccessToast(message) {
        this.elements.successMessage.textContent = message;
        this.elements.successToast.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => this.hideSuccessToast(), 3000);
    }

    hideErrorToast() {
        this.elements.errorToast.style.display = 'none';
    }

    hideSuccessToast() {
        this.elements.successToast.style.display = 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SpeechMagicApp();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.showErrorToast('An unexpected error occurred');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.app) {
        window.app.showErrorToast('An unexpected error occurred');
    }
});
