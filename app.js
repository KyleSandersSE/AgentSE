// Global variables
let map;
let markersLayer;
let allProjects = [];
let filteredProjects = [];
let automationKeywords = [
    'PLC', 'SCADA', 'automation', 'automated', 'robotics', 'robotic',
    'controls', 'control system', 'HMI', 'DCS', 'controller'
];

// BDM tracking data (stored in localStorage)
let bdmData = {};

// Load BDM data from localStorage
function loadBDMData() {
    const stored = localStorage.getItem('foodBevBDMData');
    if (stored) {
        bdmData = JSON.parse(stored);
    }
}

// Save BDM data to localStorage
function saveBDMData() {
    localStorage.setItem('foodBevBDMData', JSON.stringify(bdmData));
}

// Get BDM data for a project
function getBDMData(projectId) {
    if (!bdmData[projectId]) {
        bdmData[projectId] = {
            contacted: false,
            status: 'new',
            priority: 0,
            notes: '',
            followUpDate: '',
            lastContact: null,
            activities: []
        };
    }
    return bdmData[projectId];
}

// Update BDM data for a project
function updateBDMData(projectId, updates) {
    const data = getBDMData(projectId);
    Object.assign(data, updates);
    saveBDMData();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Food & Beverage Projects Map...');
    loadBDMData();
    initializeMap();
    loadCSVData();
    setupEventListeners();
    setupResizableSidebar();
});

// Initialize Leaflet map
function initializeMap() {
    // Center on California
    map = L.map('map').setView([36.7783, -119.4179], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Initialize marker cluster group
    markersLayer = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });
    
    map.addLayer(markersLayer);
    
    console.log('Map initialized successfully');
}

// Load and parse CSV data
function loadCSVData() {
    console.log('Loading CSV data...');
    
    // Use XMLHttpRequest which works better with file:// protocol
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'FoodBevCA.csv', true);
    
    xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) { // 0 for file:// protocol
            console.log('CSV file loaded, parsing...');
            Papa.parse(xhr.responseText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('CSV parsing complete. Rows:', results.data.length);
                    allProjects = results.data;
                    processProjects();
                    populateFilters();
                    renderMarkers();
                    updateStatistics();
                    hideLoading();
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    alert('Error parsing project data. Please check the console for details.');
                    hideLoading();
                }
            });
        } else {
            console.error('Error loading CSV. Status:', xhr.status);
            alert('Could not load FoodBevCA.csv. Make sure the file is in the same folder as index.html.');
            hideLoading();
        }
    };
    
    xhr.onerror = function() {
        console.error('XMLHttpRequest error - showing manual load option');
        showManualLoadOption();
    };
    
    // Set timeout to show manual load if auto-load takes too long
    setTimeout(function() {
        if (allProjects.length === 0) {
            console.log('Auto-load timeout - showing manual load option');
            showManualLoadOption();
        }
    }, 3000);
    
    xhr.send();
}

// Show manual file load option
function showManualLoadOption() {
    document.getElementById('manualLoadSection').style.display = 'block';
    document.getElementById('loadCsvBtn').addEventListener('click', handleManualFileLoad);
}

// Handle manual CSV file loading
function handleManualFileLoad() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select the FoodBevCA.csv file first');
        return;
    }
    
    console.log('Loading file manually:', file.name);
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const csvText = e.target.result;
        console.log('File loaded, parsing...');
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('CSV parsing complete. Rows:', results.data.length);
                allProjects = results.data;
                processProjects();
                populateFilters();
                renderMarkers();
                updateStatistics();
                hideLoading();
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
                alert('Error parsing CSV file. Please make sure you selected the correct FoodBevCA.csv file.');
            }
        });
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

// Process projects to add computed fields
function processProjects() {
    allProjects = allProjects.map(project => {
        // Trim all property keys to handle CSV with spaces in headers
        const cleanProject = {};
        Object.keys(project).forEach(key => {
            cleanProject[key.trim()] = project[key];
        });
        
        // Check for automation keywords in SCOPE
        const scope = (cleanProject.SCOPE || '').toLowerCase();
        const hasAutomation = automationKeywords.some(keyword => 
            scope.includes(keyword.toLowerCase())
        );
        
        // Extract specific automation tags found in the scope
        const automationTags = [];
        if (scope.includes('plc')) automationTags.push('PLC');
        if (scope.includes('scada')) automationTags.push('SCADA');
        if (scope.includes('hmi')) automationTags.push('HMI');
        if (scope.includes('dcs')) automationTags.push('DCS');
        if (scope.includes('robot')) automationTags.push('Robotics');
        if (scope.includes('automat')) automationTags.push('Automation');
        if (scope.includes('control system') || (scope.includes('controls') && scope.includes('process'))) {
            automationTags.push('Control Systems');
        }
        if (scope.includes('servo')) automationTags.push('Servo Drives');
        if (scope.includes('vfd') || scope.includes('variable frequency drive')) automationTags.push('VFD');
        if (scope.includes('motor control')) automationTags.push('Motor Controls');
        
        // Remove duplicates
        const uniqueTags = [...new Set(automationTags)];
        
        // Parse project value - handle spaces in column name
        const valueStr = cleanProject.LOCAL_TIV || cleanProject[' LOCAL_TIV '] || '$0';
        const value = parseFloat(valueStr.replace(/[^0-9.-]+/g, '')) || 0;
        
        // Parse probability
        const probStr = cleanProject.PROJ_PROB || '';
        let probability = 0;
        let probabilityLevel = 'unknown';
        
        if (probStr.includes('High') || probStr.includes('70-80%')) {
            probability = 75;
            probabilityLevel = 'high';
        } else if (probStr.includes('Medium')) {
            probability = 50;
            probabilityLevel = 'medium';
        } else if (probStr.includes('Low') || probStr.includes('0-69%')) {
            probability = 35;
            probabilityLevel = 'low';
        }
        
        // Calculate prioritization score (value * probability percentage)
        const prioritizationScore = value * (probability / 100);
        
        return {
            ...cleanProject,
            hasAutomation,
            automationTags: uniqueTags,
            value,
            probability,
            probabilityLevel,
            prioritizationScore
        };
    });
    
    // Filter out projects without valid coordinates
    allProjects = allProjects.filter(project => {
        const lat = parseFloat(project.LATITUDE);
        const lng = parseFloat(project.LONGITUDE);
        return !isNaN(lat) && !isNaN(lng);
    });
    
    filteredProjects = [...allProjects];
    
    console.log(`Processed ${allProjects.length} projects`);
    console.log(`Automation opportunities: ${allProjects.filter(p => p.hasAutomation).length}`);
}

// Populate filter dropdowns
function populateFilters() {
    // Get unique statuses
    const statuses = [...new Set(allProjects.map(p => p.P_STATUS_D).filter(s => s))];
    const statusFilter = document.getElementById('statusFilter');
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
    });
    
    // Get unique project types
    const types = [...new Set(allProjects.map(p => p.PROJECT_TYPE).filter(t => t))];
    const typeFilter = document.getElementById('typeFilter');
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });
    
    // Set max value for slider
    const maxValue = Math.max(...allProjects.map(p => p.value));
    const minValueSlider = document.getElementById('minValueSlider');
    minValueSlider.max = maxValue;
    
    console.log('Filters populated');
}

// Render markers on map
function renderMarkers() {
    // Clear existing markers
    markersLayer.clearLayers();
    
    // Sort if needed
    const sortBy = document.getElementById('sortBy').value;
    let projectsToRender = [...filteredProjects];
    
    if (sortBy === 'value') {
        projectsToRender.sort((a, b) => b.value - a.value);
    } else if (sortBy === 'probability') {
        projectsToRender.sort((a, b) => b.probability - a.probability);
    } else if (sortBy === 'prioritization') {
        projectsToRender.sort((a, b) => b.prioritizationScore - a.prioritizationScore);
    }
    
    // Add markers for each project
    projectsToRender.forEach(project => {
        const lat = parseFloat(project.LATITUDE);
        const lng = parseFloat(project.LONGITUDE);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Create marker with custom icon
        const iconColor = project.hasAutomation ? '#3DCD58' : '#005EB8';
        const iconHtml = project.hasAutomation ? '⚙️' : '📍';
        
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${iconColor};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ${project.hasAutomation ? 'box-shadow: 0 0 15px rgba(61, 205, 88, 0.8);' : ''}
            ">${iconHtml}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        const marker = L.marker([lat, lng], { icon: customIcon });
        
        // Create popup content
        const popupContent = createPopupContent(project);
        marker.bindPopup(popupContent);
        
        // Add click handler to show details in sidebar
        marker.on('click', function() {
            showProjectDetails(project);
        });
        
        markersLayer.addLayer(marker);
    });
    
    console.log(`Rendered ${projectsToRender.length} markers`);
}

// Create popup content for marker
function createPopupContent(project) {
    const automationBadge = project.hasAutomation ? 
        '<span class="popup-automation-badge">⚙️ Automation Opportunity</span>' : '';
    
    // Create tags display for popup
    let tagsHtml = '';
    if (project.automationTags && project.automationTags.length > 0) {
        tagsHtml = '<div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px;">';
        project.automationTags.slice(0, 3).forEach(tag => {
            tagsHtml += `<span style="background: #3DCD58; color: white; padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: bold;">${tag}</span>`;
        });
        if (project.automationTags.length > 3) {
            tagsHtml += `<span style="color: #3DCD58; font-size: 0.7rem; padding: 2px 8px;">+${project.automationTags.length - 3} more</span>`;
        }
        tagsHtml += '</div>';
    }
    
    return `
        <div class="popup-content">
            <h4>${project.PROJ_NAME || 'Unnamed Project'}</h4>
            <p><strong>Owner:</strong> ${project.OWNER_NAME || 'N/A'}</p>
            <p><strong>Value:</strong> ${formatCurrency(project.value)}</p>
            <p><strong>Type:</strong> ${project.PROJECT_TYPE || 'N/A'}</p>
            <p><strong>Location:</strong> ${project.PLANT_CITY}, ${project.PLANT_ST}</p>
            ${automationBadge}
            ${tagsHtml}
        </div>
    `;
}

// Show project details in sidebar
function showProjectDetails(project) {
    const detailsPanel = document.getElementById('projectDetails');
    const detailsContent = document.getElementById('projectDetailsContent');
    
    const automationBadge = project.hasAutomation ? 
        '<span class="detail-value automation-badge">⚙️ Automation Opportunity</span>' : '';
    
    // Create automation tags HTML
    let automationTagsHtml = '';
    if (project.automationTags && project.automationTags.length > 0) {
        automationTagsHtml = '<div class="automation-tags" style="margin-top: 10px;">';
        project.automationTags.forEach(tag => {
            automationTagsHtml += `<span class="automation-tag">${tag}</span>`;
        });
        automationTagsHtml += '</div>';
    }
    
    const probabilityClass = `probability-${project.probabilityLevel}`;
    
    // Get BDM data for this project
    const projectId = project.PLANT_ID || project.PROJ_NAME;
    const bdm = getBDMData(projectId);
    
    // Generate star rating
    let starsHtml = '<div class="star-rating" style="margin: 10px 0;">';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= bdm.priority;
        starsHtml += `<span class="star ${filled ? 'filled' : ''}" onclick="setProjectPriority('${projectId}', ${i})">★</span>`;
    }
    starsHtml += '</div>';
    
    // Status dropdown
    const statusOptions = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];
    const statusLabels = {
        'new': '🆕 New Lead',
        'contacted': '📞 Contacted',
        'proposal': '📄 Proposal Sent',
        'negotiation': '🤝 In Negotiation',
        'won': '✅ Won',
        'lost': '❌ Lost'
    };
    
    detailsContent.innerHTML = `
        <!-- BDM Tracking Section -->
        <div class="bdm-section" style="background: #f0fff4; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3DCD58;">
            <h4 style="margin: 0 0 10px 0; color: #009846; font-size: 1rem;">📊 BDM Tracking</h4>
            
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer; font-weight: 600;">
                    <input type="checkbox" id="contactedCheck" ${bdm.contacted ? 'checked' : ''} 
                           onchange="toggleContacted('${projectId}')" 
                           style="width: 18px; height: 18px; cursor: pointer; margin-right: 8px;">
                    Contacted
                </label>
                ${bdm.lastContact ? `<span style="font-size: 0.85rem; color: #666;">Last: ${new Date(bdm.lastContact).toLocaleDateString()}</span>` : ''}
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 5px;">Lead Status:</label>
                <select id="leadStatus" onchange="updateLeadStatus('${projectId}', this.value)" 
                        style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                    ${statusOptions.map(opt => `<option value="${opt}" ${bdm.status === opt ? 'selected' : ''}>${statusLabels[opt]}</option>`).join('')}
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 5px;">Priority Rating:</label>
                ${starsHtml}
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 5px;">Follow-up Date:</label>
                <input type="date" id="followUpDate" value="${bdm.followUpDate || ''}" 
                       onchange="updateFollowUpDate('${projectId}', this.value)"
                       style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
            </div>
            
            <div>
                <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 5px;">Notes:</label>
                <textarea id="projectNotes" 
                          onblur="updateProjectNotes('${projectId}', this.value)"
                          placeholder="Add your notes here..."
                          style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd; min-height: 80px; font-family: inherit; resize: vertical;">${bdm.notes || ''}</textarea>
            </div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Project Name</span>
            <div class="detail-value large">${project.PROJ_NAME || 'Unnamed Project'}</div>
            ${automationBadge}
            ${automationTagsHtml}
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Owner</span>
            <div class="detail-value">${project.OWNER_NAME || 'N/A'}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Project Value</span>
            <div class="detail-value large">${formatCurrency(project.value)}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Probability</span>
            <div class="detail-value ${probabilityClass}">${project.PROJ_PROB || 'N/A'}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Prioritization Score</span>
            <div class="detail-value">${formatCurrency(project.prioritizationScore)}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Project Type</span>
            <div class="detail-value">${project.PROJECT_TYPE || 'N/A'}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <div class="detail-value">${project.P_STATUS_D || 'N/A'}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Current Phase</span>
            <div class="detail-value">${project.ACT_DESC || 'N/A'}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Completion Date</span>
            <div class="detail-value">${project.COMPLETION || 'N/A'}</div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Address</span>
            <div class="detail-value">
                ${project.PLANT_ADDR || ''}<br>
                ${project.PLANT_CITY || ''}, ${project.PLANT_ST || ''} ${project.PLANT_ZIP || ''}
            </div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Scope</span>
            <div class="detail-scope">${project.SCOPE || 'No scope information available'}</div>
        </div>
        
        ${project.SCHEDULE ? `
        <div class="detail-row">
            <span class="detail-label">Schedule</span>
            <div class="detail-scope">${project.SCHEDULE}</div>
        </div>
        ` : ''}
        
        ${project.REPORT_LINK ? `
        <div class="detail-row">
            <a href="${project.REPORT_LINK}" target="_blank" class="detail-link">View Full Report →</a>
        </div>
        ` : ''}
        
        <button class="close-details" onclick="closeProjectDetails()">Close</button>
    `;
    
    detailsPanel.style.display = 'block';
    detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Close project details panel
function closeProjectDetails() {
    document.getElementById('projectDetails').style.display = 'none';
}

// Apply filters
function applyFilters() {
    const automationOnly = document.getElementById('automationToggle').checked;
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const probabilityFilter = document.getElementById('probabilityFilter').value;
    const minValue = parseFloat(document.getElementById('minValueSlider').value);
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredProjects = allProjects.filter(project => {
        // Automation filter
        if (automationOnly && !project.hasAutomation) return false;
        
        // Status filter
        if (statusFilter !== 'all' && project.P_STATUS_D !== statusFilter) return false;
        
        // Type filter
        if (typeFilter !== 'all' && project.PROJECT_TYPE !== typeFilter) return false;
        
        // Probability filter
        if (probabilityFilter !== 'all' && project.probabilityLevel !== probabilityFilter) return false;
        
        // Value filter
        if (project.value < minValue) return false;
        
        // Search filter
        if (searchTerm) {
            const projectName = (project.PROJ_NAME || '').toLowerCase();
            const ownerName = (project.OWNER_NAME || '').toLowerCase();
            if (!projectName.includes(searchTerm) && !ownerName.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    renderMarkers();
    updateStatistics();
    
    console.log(`Filtered to ${filteredProjects.length} projects`);
}

// Update statistics display
function updateStatistics() {
    const totalProjects = filteredProjects.length;
    const automationCount = filteredProjects.filter(p => p.hasAutomation).length;
    const totalValue = filteredProjects.reduce((sum, p) => sum + p.value, 0);
    
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('automationProjects').textContent = automationCount;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
}

// Format currency
function formatCurrency(value) {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
    } else {
        return `$${value.toFixed(0)}`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    // Search button
    document.getElementById('searchBtn').addEventListener('click', applyFilters);
    
    // Clear search button
    document.getElementById('clearSearchBtn').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        applyFilters();
    });
    
    // Search on Enter key
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Update slider label
    document.getElementById('minValueSlider').addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        document.getElementById('minValueLabel').textContent = formatCurrency(value);
    });
    
    // Auto-apply on automation toggle
    document.getElementById('automationToggle').addEventListener('change', applyFilters);
    
    console.log('Event listeners setup complete');
}

// Hide loading indicator
function hideLoading() {
    const loading = document.getElementById('mapLoading');
    loading.classList.add('hidden');
}

// Setup resizable sidebar
function setupResizableSidebar() {
    const sidebar = document.getElementById('sidebar');
    const resizeHandle = document.getElementById('resizeHandle');
    let isResizing = false;
    
    resizeHandle.addEventListener('mousedown', function(e) {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const newWidth = e.clientX;
        if (newWidth >= 250 && newWidth <= 800) {
            sidebar.style.width = newWidth + 'px';
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

// BDM tracking functions (make globally available)
window.toggleContacted = function(projectId) {
    const bdm = getBDMData(projectId);
    bdm.contacted = !bdm.contacted;
    if (bdm.contacted && !bdm.lastContact) {
        bdm.lastContact = new Date().toISOString();
    }
    updateBDMData(projectId, bdm);
    
    // Refresh the display
    const project = allProjects.find(p => (p.PLANT_ID || p.PROJ_NAME) === projectId);
    if (project) showProjectDetails(project);
};

window.updateLeadStatus = function(projectId, status) {
    updateBDMData(projectId, { status: status });
};

window.setProjectPriority = function(projectId, priority) {
    updateBDMData(projectId, { priority: priority });
    
    // Refresh stars
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < priority) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
};

window.updateFollowUpDate = function(projectId, date) {
    updateBDMData(projectId, { followUpDate: date });
};

window.updateProjectNotes = function(projectId, notes) {
    updateBDMData(projectId, { notes: notes });
};

// Make closeProjectDetails available globally
window.closeProjectDetails = closeProjectDetails;

