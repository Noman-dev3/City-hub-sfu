// Dashboard State Management
const state = {
    currentView: 'home',
    user: null,
    meetings: [],
    files: [],
    stats: {
        activeRooms: 0,
        participants: 0,
        meetings: 0,
        storage: '0 GB'
    }
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('City-Hub Dashboard initializing...');
    initRouter();
    loadUserData();
    setupEventListeners();
    updateActiveRoute();
    startStatsPolling();
});

// Router
function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Handle initial route
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    state.currentView = hash;

    // Update UI with smooth transition
    document.querySelectorAll('.view-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('fade-in');
    });

    const activeSection = document.getElementById(`${hash}-view`);
    if (activeSection) {
        activeSection.style.display = 'block';
        // Trigger reflow for animation
        void activeSection.offsetWidth;
        activeSection.classList.add('fade-in');
    }

    updateActiveRoute();
    loadViewData(hash);
}

function updateActiveRoute() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${state.currentView}`) {
            link.classList.add('active');
        }
    });
}

// Data Loading
async function loadUserData() {
    // Simulate user data - in production, fetch from API
    state.user = {
        name: 'Guest User',
        avatar: 'G'
    };
    updateUserProfile();
}

async function loadViewData(view) {
    switch (view) {
        case 'home':
            loadAnalytics();
            break;
        case 'meetings':
            loadMeetings();
            break;
        case 'files':
            loadFiles();
            break;
    }
}

// Analytics
async function loadAnalytics() {
    try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
            const stats = await response.json();
            updateStats(stats);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function updateStats(stats) {
    const activeRooms = stats.activeRooms || 0;
    const participants = stats.totalParticipants || 0;
    const meetings = stats.totalMeetings || 0;
    const storage = stats.storageUsed || '0 GB';

    animateValue('active-rooms-count', state.stats.activeRooms, activeRooms, 500);
    animateValue('participants-count', state.stats.participants, participants, 500);
    animateValue('meetings-count', state.stats.meetings, meetings, 500);

    document.getElementById('storage-count').textContent = storage;

    state.stats = { activeRooms, participants, meetings, storage };
}

function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// Start polling for stats updates
function startStatsPolling() {
    // Poll every 5 seconds for stats updates
    setInterval(() => {
        if (state.currentView === 'home') {
            loadAnalytics();
        }
    }, 5000);
}

// Meetings
function loadMeetings() {
    // Load recent meetings from localStorage
    const recentMeetings = JSON.parse(localStorage.getItem('cityHubRecentMeetings') || '[]');
    renderMeetingsList(recentMeetings.slice(0, 5)); // Show last 5
}

function renderMeetingsList(meetings) {
    const container = document.getElementById('recent-meetings-list');
    if (!container) return;

    if (meetings.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="text-align: center; padding: 1rem;">No recent meetings</p>';
        return;
    }

    container.innerHTML = meetings.map(meeting => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin-bottom: 0.75rem;">
            <div>
                <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem;">${meeting.name || meeting.id}</h4>
                <p class="text-secondary" style="margin: 0; font-size: 0.85rem;">${meeting.time || 'Recent'}</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="joinMeeting('${meeting.id}')">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `).join('');
}

function addRecentMeeting(roomId) {
    const recentMeetings = JSON.parse(localStorage.getItem('cityHubRecentMeetings') || '[]');

    // Remove if already exists
    const filtered = recentMeetings.filter(m => m.id !== roomId);

    // Add to beginning
    filtered.unshift({
        id: roomId,
        name: roomId,
        time: new Date().toLocaleString()
    });

    // Keep only last 10
    const updated = filtered.slice(0, 10);

    localStorage.setItem('cityHubRecentMeetings', JSON.stringify(updated));
}

// Files
function loadFiles() {
    // Mock files for demo
    const files = [
        { name: 'Meeting_Recording.webm', type: 'video', size: '45.2 MB' },
        { name: 'Project_Presentation.pdf', type: 'pdf', size: '2.4 MB' },
        { name: 'Team_Photo.png', type: 'image', size: '1.8 MB' },
        { name: 'Notes_Document.docx', type: 'doc', size: '820 KB' }
    ];

    renderFilesList(files);
}

function renderFilesList(files) {
    const container = document.getElementById('files-grid');
    if (!container) return;

    if (files.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No files yet</p>';
        return;
    }

    container.innerHTML = files.map(file => `
        <div class="card file-card">
            <div class="file-icon">
                <i class="fas fa-file-${getFileIcon(file.type)}"></i>
            </div>
            <div class="file-name">${file.name}</div>
            <div class="text-secondary" style="font-size: 0.85rem;">${file.size}</div>
            <div class="file-actions">
                <button class="btn btn-sm btn-primary"><i class="fas fa-download"></i></button>
            </div>
        </div>
    `).join('');
}

function getFileIcon(type) {
    const icons = {
        pdf: 'pdf',
        image: 'image',
        doc: 'word',
        video: 'video'
    };
    return icons[type] || 'alt';
}

// Event Listeners
function setupEventListeners() {
    // Create Meeting Form
    const createForm = document.getElementById('create-meeting-form');
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const roomName = document.getElementById('room-name-input').value;
            if (roomName) {
                addRecentMeeting(roomName);
                window.location.href = `/join/${roomName}`;
            }
        });
    }

    // Join Meeting Form
    const joinForm = document.getElementById('join-meeting-form');
    if (joinForm) {
        joinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const roomId = document.getElementById('room-id-input').value;
            if (roomId) {
                addRecentMeeting(roomId);
                window.location.href = `/join/${roomId}`;
            }
        });
    }

    // Generate Random Room Name
    const genBtn = document.getElementById('generate-room-btn');
    if (genBtn) {
        genBtn.addEventListener('click', () => {
            const randomName = 'room-' + Math.random().toString(36).substr(2, 9);
            document.getElementById('room-name-input').value = randomName;
        });
    }

    // File Drop Zone
    const dropZone = document.getElementById('file-drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            // Handle file upload here
            console.log('Files dropped:', e.dataTransfer.files);
        });

        dropZone.addEventListener('click', () => {
            // Trigger file input
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
                console.log('Files selected:', e.target.files);
            };
            input.click();
        });
    }
}

// Helper Functions
function joinMeeting(roomId) {
    addRecentMeeting(roomId);
    window.location.href = `/join/${roomId}`;
}

function updateUserProfile() {
    const avatar = document.querySelector('.user-avatar');
    const name = document.querySelector('.user-name');

    if (state.user) {
        if (avatar) avatar.textContent = state.user.avatar;
        if (name) name.textContent = state.user.name;
    }
}

// Show toast notification (utility function)
function showToast(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Could implement a toast notification UI here
}

console.log('City-Hub Dashboard loaded successfully!');
