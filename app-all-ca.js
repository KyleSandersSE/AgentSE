// Global variables
let map;
let markersLayer;
let allProjects = [];
let filteredProjects = [];
let selectedIndustries = new Set();
let allIndustries = [];

// Industry-specific automation keywords
const industryKeywords = {
    'Power': ['SCADA', 'DCS', 'PLC', 'grid automation', 'grid control', 'substation', 'substation automation', 'substation control', 'power distribution', 'transformer', 'switchgear', 'VFD', 'motor control'],
    'Chemical Processing (CPI)': ['DCS', 'PLC', 'batch control', 'process automation', 'process control', 'reactor control', 'distillation', 'HMI', 'SCADA', 'analyzer', 'control system'],
    'Food & Beverage': ['PLC', 'SCADA', 'packaging automation', 'robotics', 'robotic', 'conveyor', 'bottling', 'HMI', 'control system', 'servo', 'automation', 'automated'],
    'Industrial Manufacturing': ['PLC', 'robotics', 'robotic', 'MES', 'automation', 'automated', 'control system', 'conveyor', 'assembly line', 'pick and place', 'servo', 'VFD', 'motor control'],
    'Metals & Minerals': ['PLC', 'furnace control', 'process automation', 'process control', 'kiln control', 'mill automation', 'DCS', 'SCADA', 'control system'],
    'Oil & Gas Pipelines': ['SCADA', 'RTU', 'pipeline control', 'flow control', 'compressor automation', 'valve automation', 'leak detection', 'PLC', 'control system'],
    'Petroleum Refining (HPI)': ['DCS', 'process control', 'process automation', 'refinery automation', 'distillation', 'reactor control', 'SCADA', 'PLC', 'analyzer', 'control system'],
    'Pharmaceutical & Biotech': ['PLC', 'cleanroom automation', 'batch control', 'batch system', 'process automation', 'BMS', 'HMI', 'SCADA', 'validation', 'control system', 'bioreactor'],
    'Pulp, Paper & Wood': ['PLC', 'process control', 'process automation', 'paper machine', 'DCS', 'control system', 'automation', 'SCADA'],
    'Terminals': ['SCADA', 'loading automation', 'terminal automation', 'control system', 'PLC', 'tank farm', 'automation'],
    'Alternative Fuel': ['SCADA', 'process control', 'process automation', 'control system', 'PLC', 'automation', 'DCS'],
    'Production (Oil & Gas)': ['SCADA', 'well control', 'production automation', 'separator control', 'pump control', 'RTU', 'PLC', 'control system', 'automation']
};

// Industry colors for map markers
const industryColors = {
    'Power': '#FF6B6B',
    'Chemical Processing (CPI)': '#4ECDC4',
    'Food & Beverage': '#95E1D3',
    'Industrial Manufacturing': '#F38181',
    'Metals & Minerals': '#AA96DA',
    'Oil & Gas Pipelines': '#FCBAD3',
    'Petroleum Refining (HPI)': '#FFFFD2',
    'Pharmaceutical & Biotech': '#A8E6CF',
    'Pulp, Paper & Wood': '#FFD3B6',
    'Terminals': '#FFAAA5',
    'Alternative Fuel': '#FF8B94',
    'Production (Oil & Gas)': '#6C5CE7'
};

// BDM tracking data (stored in localStorage)
let bdmData = {};

// Debounce timer for filters
let filterDebounceTimer = null;

// Load BDM data from localStorage
function loadBDMData() {
    const stored = localStorage.getItem('allCAIndustriesBDMData');
    if (stored) {
        bdmData = JSON.parse(stored);
    }
}

// Save BDM data to localStorage
function saveBDMData() {
    localStorage.setItem('allCAIndustriesBDMData', JSON.stringify(bdmData));
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
    console.log('Initializing All California Industries Projects Map...');
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
    
    // Initialize marker cluster group with optimized settings
    markersLayer = L.markerClusterGroup({
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        chunkedLoading: true,
        chunkInterval: 200,
        chunkDelay: 50
    });
    
    map.addLayer(markersLayer);
    
    console.log('Map initialized successfully');
}

// Load and parse CSV data
function loadCSVData() {
    console.log('Loading CSV data...');
    
    // Use XMLHttpRequest which works better with file:// protocol
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'CleanedCAData.csv', true);
    
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
                    populateIndustryFilter();
                    populateFilters();
                    renderMarkers();
                    updateStatistics();
                    updateIndustryBreakdown();
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
            alert('Could not load CleanedCAData.csv. Make sure the file is in the same folder as index-all-ca.html.');
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
        alert('Please select the CleanedCAData.csv file first');
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
                populateIndustryFilter();
                populateFilters();
                renderMarkers();
                updateStatistics();
                updateIndustryBreakdown();
                hideLoading();
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
                alert('Error parsing CSV file. Please make sure you selected the correct CleanedCAData.csv file.');
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
        
        // Get industry
        const industry = (cleanProject.IND_DESC || '').trim();
        
        // Check for automation keywords in SCOPE (industry-specific)
        const scope = (cleanProject.SCOPE || '').toLowerCase();
        let hasAutomation = false;
        
        // Check industry-specific keywords
        if (industry && industryKeywords[industry]) {
            hasAutomation = industryKeywords[industry].some(keyword => 
                scope.includes(keyword.toLowerCase())
            );
        }
        
        // Also check general automation keywords
        const generalKeywords = ['PLC', 'SCADA', 'automation', 'automated', 'robotics', 'HMI', 'DCS', 'control system'];
        if (!hasAutomation) {
            hasAutomation = generalKeywords.some(keyword => 
                scope.includes(keyword.toLowerCase())
            );
        }
        
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
        if (scope.includes('rtu')) automationTags.push('RTU');
        if (scope.includes('mes')) automationTags.push('MES');
        if (scope.includes('batch')) automationTags.push('Batch Control');
        
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
            industry,
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
    
    // Get unique industries
    allIndustries = [...new Set(allProjects.map(p => p.industry))].filter(i => i).sort();
    
    // Select all industries by default
    selectedIndustries = new Set(allIndustries);
    
    filteredProjects = [...allProjects];
    
    console.log(`Processed ${allProjects.length} projects`);
    console.log(`Industries found: ${allIndustries.length}`);
    console.log(`Automation opportunities: ${allProjects.filter(p => p.hasAutomation).length}`);
}

// Populate industry filter
function populateIndustryFilter() {
    const industryList = document.getElementById('industryList');
    industryList.innerHTML = '';
    
    // Count projects per industry
    const industryCounts = {};
    allProjects.forEach(project => {
        const ind = project.industry;
        industryCounts[ind] = (industryCounts[ind] || 0) + 1;
    });
    
    allIndustries.forEach(industry => {
        const count = industryCounts[industry] || 0;
        const color = industryColors[industry] || '#999';
        
        const checkbox = document.createElement('label');
        checkbox.className = 'industry-checkbox';
        checkbox.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            background: #f9f9f9;
            border-radius: 5px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
        `;
        
        checkbox.innerHTML = `
            <input type="checkbox" value="${industry}" checked style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
            <span style="width: 15px; height: 15px; border-radius: 50%; background: ${color}; margin-right: 8px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></span>
            <span style="flex: 1; font-size: 0.85rem;">${industry}</span>
            <span style="font-size: 0.75rem; color: #666; font-weight: bold;">${count}</span>
        `;
        
        checkbox.addEventListener('mouseenter', function() {
            checkbox.style.background = '#e8f5e9';
            checkbox.style.borderColor = '#3DCD58';
        });
        
        checkbox.addEventListener('mouseleave', function() {
            checkbox.style.background = '#f9f9f9';
            checkbox.style.borderColor = 'transparent';
        });
        
        checkbox.querySelector('input').addEventListener('change', debouncedApplyFilters);
        
        industryList.appendChild(checkbox);
    });
    
    // Populate industry legend
    populateIndustryLegend();
}

// Populate industry legend
function populateIndustryLegend() {
    const legendContainer = document.getElementById('industryLegend');
    legendContainer.innerHTML = '<h4 style="font-size: 0.9rem; margin-bottom: 8px; color: #009846;">Industry Colors:</h4>';
    
    allIndustries.forEach(industry => {
        const color = industryColors[industry] || '#999';
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.style.marginBottom = '5px';
        legendItem.innerHTML = `
            <span style="width: 15px; height: 15px; border-radius: 50%; background: ${color}; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); display: inline-block;"></span>
            <span style="font-size: 0.8rem;">${industry}</span>
        `;
        legendContainer.appendChild(legendItem);
    });
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

// Render markers on map with performance optimization
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
    
    // Batch marker creation for performance
    const markers = [];
    
    projectsToRender.forEach(project => {
        const lat = parseFloat(project.LATITUDE);
        const lng = parseFloat(project.LONGITUDE);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Determine marker color based on industry or automation
        let iconColor;
        if (project.hasAutomation) {
            iconColor = '#3DCD58'; // Green for automation
        } else {
            iconColor = industryColors[project.industry] || '#005EB8';
        }
        
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
        
        markers.push(marker);
    });
    
    // Add all markers to cluster layer in one batch
    markersLayer.addLayers(markers);
    
    console.log(`Rendered ${projectsToRender.length} markers`);
}

// Create popup content for marker
function createPopupContent(project) {
    const automationBadge = project.hasAutomation ? 
        '<span class="popup-automation-badge">⚙️ Automation Opportunity</span>' : '';
    
    // Industry badge
    const industryColor = industryColors[project.industry] || '#999';
    const industryBadge = `<span style="background: ${industryColor}; color: white; padding: 3px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: bold; display: inline-block; margin-top: 5px;">${project.industry}</span>`;
    
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
            ${industryBadge}
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
    
    // Industry badge
    const industryColor = industryColors[project.industry] || '#999';
    const industryBadge = `<span style="background: ${industryColor}; color: white; padding: 5px 15px; border-radius: 12px; font-size: 0.9rem; font-weight: bold; display: inline-block; margin-top: 10px;">${project.industry}</span>`;
    
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
            <span class="detail-label">Industry</span>
            ${industryBadge}
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

// Apply filters with debouncing
function debouncedApplyFilters() {
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(applyFilters, 300);
}

// Apply filters
function applyFilters() {
    // Get selected industries
    const industryCheckboxes = document.querySelectorAll('#industryList input[type="checkbox"]');
    selectedIndustries.clear();
    industryCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedIndustries.add(checkbox.value);
        }
    });
    
    const automationOnly = document.getElementById('automationToggle').checked;
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const probabilityFilter = document.getElementById('probabilityFilter').value;
    const minValue = parseFloat(document.getElementById('minValueSlider').value);
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredProjects = allProjects.filter(project => {
        // Industry filter
        if (!selectedIndustries.has(project.industry)) return false;
        
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
    updateIndustryBreakdown();
    
    console.log(`Filtered to ${filteredProjects.length} projects from ${selectedIndustries.size} industries`);
}

// Update statistics display
function updateStatistics() {
    const totalProjects = filteredProjects.length;
    const automationCount = filteredProjects.filter(p => p.hasAutomation).length;
    const totalValue = filteredProjects.reduce((sum, p) => sum + p.value, 0);
    
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('automationProjects').textContent = automationCount;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    document.getElementById('selectedIndustries').textContent = selectedIndustries.size;
}

// Update industry breakdown
function updateIndustryBreakdown() {
    const breakdownContent = document.getElementById('industryBreakdownContent');
    
    const industryStats = {};
    filteredProjects.forEach(project => {
        const ind = project.industry;
        if (!industryStats[ind]) {
            industryStats[ind] = {
                count: 0,
                value: 0,
                automation: 0
            };
        }
        industryStats[ind].count++;
        industryStats[ind].value += project.value;
        if (project.hasAutomation) industryStats[ind].automation++;
    });
    
    let html = '';
    Object.keys(industryStats).sort().forEach(industry => {
        const stats = industryStats[industry];
        const color = industryColors[industry] || '#999';
        const avgValue = stats.count > 0 ? stats.value / stats.count : 0;
        
        html += `
            <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 8px; border-left: 4px solid ${color};">
                <div style="font-weight: bold; margin-bottom: 5px; color: #009846;">${industry}</div>
                <div style="font-size: 0.8rem; color: #666; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <div>📊 Projects: <strong>${stats.count}</strong></div>
                    <div>⚙️ Automation: <strong>${stats.automation}</strong></div>
                    <div>💰 Total Value: <strong>${formatCurrency(stats.value)}</strong></div>
                    <div>📈 Avg Value: <strong>${formatCurrency(avgValue)}</strong></div>
                </div>
            </div>
        `;
    });
    
    breakdownContent.innerHTML = html || '<p style="color: #999; font-size: 0.85rem;">No data to display</p>';
}

// Export filtered results to CSV
function exportFilteredResults() {
    if (filteredProjects.length === 0) {
        alert('No projects to export. Please adjust your filters.');
        return;
    }
    
    // Prepare CSV data
    const headers = [
        'Project Name', 'Owner', 'Industry', 'Value', 'Probability', 'Prioritization Score',
        'Project Type', 'Status', 'Current Phase', 'Completion Date', 'City', 'State',
        'Automation Opportunity', 'Automation Tags', 'Scope',
        'BDM Contacted', 'BDM Status', 'BDM Priority', 'BDM Follow-up Date', 'BDM Notes'
    ];
    
    const rows = filteredProjects.map(project => {
        const projectId = project.PLANT_ID || project.PROJ_NAME;
        const bdm = getBDMData(projectId);
        
        return [
            project.PROJ_NAME || '',
            project.OWNER_NAME || '',
            project.industry || '',
            project.value || 0,
            project.PROJ_PROB || '',
            project.prioritizationScore || 0,
            project.PROJECT_TYPE || '',
            project.P_STATUS_D || '',
            project.ACT_DESC || '',
            project.COMPLETION || '',
            project.PLANT_CITY || '',
            project.PLANT_ST || '',
            project.hasAutomation ? 'Yes' : 'No',
            project.automationTags ? project.automationTags.join('; ') : '',
            (project.SCOPE || '').replace(/"/g, '""'),
            bdm.contacted ? 'Yes' : 'No',
            bdm.status || '',
            bdm.priority || 0,
            bdm.followUpDate || '',
            (bdm.notes || '').replace(/"/g, '""')
        ];
    });
    
    // Convert to CSV
    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => {
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                return `"${cell}"`;
            }
            return cell;
        }).join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `CA_Projects_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Exported ${filteredProjects.length} projects to CSV`);
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
    document.getElementById('automationToggle').addEventListener('change', debouncedApplyFilters);
    
    // Select all industries
    document.getElementById('selectAllIndustries').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#industryList input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        debouncedApplyFilters();
    });
    
    // Deselect all industries
    document.getElementById('deselectAllIndustries').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#industryList input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        debouncedApplyFilters();
    });
    
    // Toggle industry breakdown
    document.getElementById('toggleIndustryBreakdown').addEventListener('click', function() {
        const breakdown = document.getElementById('industryBreakdown');
        const isVisible = breakdown.style.display !== 'none';
        breakdown.style.display = isVisible ? 'none' : 'block';
        this.textContent = isVisible ? 'Show Industry Breakdown' : 'Hide Industry Breakdown';
    });
    
    // Export button
    document.getElementById('exportFiltered').addEventListener('click', exportFilteredResults);
    
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

