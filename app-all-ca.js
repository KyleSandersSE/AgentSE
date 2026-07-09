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

// Current view (map or kanban)
let currentView = 'map';

// Kanban stages
const kanbanStages = ['leads', 'qualified/contacted', 'followup', 'won'];

// Load BDM data from localStorage
function loadBDMData() {
    const stored = localStorage.getItem('allCAIndustriesBDMData');
    if (stored) {
        bdmData = JSON.parse(stored);
        // Migrate old data format to new format
        migrateBDMData();
    }
}

// Migrate old BDM data format to new format
function migrateBDMData() {
    let migrated = false;
    for (const projectId in bdmData) {
        const data = bdmData[projectId];
        // Check if old format (has contacted boolean)
        if (data.hasOwnProperty('contacted') && !data.hasOwnProperty('stage')) {
            // Convert old format to new format
            const newData = {
                stage: data.contacted ? (data.status === 'won' ? 'won' : 'qualified/contacted') : 'leads',
                interactions: []
            };
            
            // Convert lastContact to interaction if it exists
            if (data.lastContact) {
                newData.interactions.push({
                    date: data.lastContact.split('T')[0],
                    type: 'Call',
                    rep: '',
                    details: data.notes || 'Initial contact',
                    nextSteps: ''
                });
            }
            
            // Convert activities to interactions if they exist
            if (data.activities && Array.isArray(data.activities)) {
                data.activities.forEach(activity => {
                    newData.interactions.push({
                        date: activity.date || new Date().toISOString().split('T')[0],
                        type: activity.type || 'Other',
                        rep: activity.rep || '',
                        details: activity.details || '',
                        nextSteps: activity.nextSteps || ''
                    });
                });
            }
            
            bdmData[projectId] = newData;
            migrated = true;
        }
    }
    
    if (migrated) {
        saveBDMData();
        console.log('Migrated BDM data to new format');
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
            stage: 'leads',
            interactions: []
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
                    setupKanbanDragDrop();
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
                setupKanbanDragDrop();
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
    
    // Get unique states
    const states = [...new Set(allProjects.map(p => p.PLANT_ST).filter(s => s))].sort();
    const stateFilter = document.getElementById('stateFilter');
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateFilter.appendChild(option);
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
    
    // Kanban stage dropdown
    const stageLabels = {
        'leads': '📋 Leads',
        'qualified/contacted': '✅ Qualified/Contacted',
        'followup': '📞 Follow-up Next Steps',
        'won': '🏆 Won'
    };
    
    // Interaction history table
    let interactionHistoryHtml = '';
    if (bdm.interactions && bdm.interactions.length > 0) {
        interactionHistoryHtml = `
            <div style="margin-top: 15px;">
                <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px; color: #009846;">Interaction History</h5>
                <table class="interaction-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Date</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Type</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">SE Rep</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Details</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Next Steps</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Follow-up Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bdm.interactions.map((interaction, idx) => `
                            <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f9f9f9'};">
                                <td style="padding: 6px; border: 1px solid #ddd;">${new Date(interaction.date).toLocaleDateString()}</td>
                                <td style="padding: 6px; border: 1px solid #ddd;">${interaction.type || 'N/A'}</td>
                                <td style="padding: 6px; border: 1px solid #ddd;">${interaction.rep || ''}</td>
                                <td style="padding: 6px; border: 1px solid #ddd;">${interaction.details || ''}</td>
                                <td style="padding: 6px; border: 1px solid #ddd;">${interaction.nextSteps || ''}</td>
                                <td style="padding: 6px; border: 1px solid #ddd;">${interaction.followUpDate ? new Date(interaction.followUpDate).toLocaleDateString() : ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Add new interaction form
    const addInteractionHtml = `
        <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
            <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px; color: #009846;">Add New Interaction</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div>
                    <label style="font-size: 0.75rem; display: block; margin-bottom: 3px;">Date:</label>
                    <input type="date" id="newInteractionDate" value="${new Date().toISOString().split('T')[0]}" 
                           style="width: 100%; padding: 6px; border-radius: 3px; border: 1px solid #ddd; font-size: 0.8rem;">
                </div>
                <div>
                    <label style="font-size: 0.75rem; display: block; margin-bottom: 3px;">Type:</label>
                    <select id="newInteractionType" style="width: 100%; padding: 6px; border-radius: 3px; border: 1px solid #ddd; font-size: 0.8rem;">
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                        <option value="VM">VM</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 0.75rem; display: block; margin-bottom: 3px;">SE Rep:</label>
                <input type="text" id="newInteractionRep" placeholder="Your name" 
                       style="width: 100%; padding: 6px; border-radius: 3px; border: 1px solid #ddd; font-size: 0.8rem;">
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 0.75rem; display: block; margin-bottom: 3px;">Details:</label>
                <textarea id="newInteractionDetails" placeholder="Enter interaction details..." 
                          style="width: 100%; padding: 6px; border-radius: 3px; border: 1px solid #ddd; font-size: 0.8rem; min-height: 60px; resize: vertical;"></textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div>
                    <label style="font-size: 0.75rem; display: block; margin-bottom: 3px;">Next Steps:</label>
                    <input type="text" id="newInteractionNextSteps" placeholder="e.g., Email, Follow-up call" 
                           style="width: 100%; padding: 6px; border-radius: 3px; border: 1px solid #ddd; font-size: 0.8rem;">
                </div>
                <div>
                    <label style="font-size: 0.75rem; display: block; margin-bottom: 3px;">Follow-up Date:</label>
                    <input type="date" id="newInteractionFollowUpDate" 
                           style="width: 100%; padding: 6px; border-radius: 3px; border: 1px solid #ddd; font-size: 0.8rem;"
                           onkeypress="if(event.key === 'Enter') addInteraction('${projectId}')">
                </div>
            </div>
            <button onclick="addInteraction('${projectId}')" 
                    style="width: 100%; padding: 8px; background: #3DCD58; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                Add Interaction (or press Enter in Follow-up Date)
            </button>
        </div>
    `;
    
    detailsContent.innerHTML = `
        <!-- BDM Tracking Section -->
        <div class="bdm-section" style="background: #f0fff4; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3DCD58;">
            <h4 style="margin: 0 0 10px 0; color: #009846; font-size: 1rem;">📊 BDM Tracking</h4>
            
            <div style="margin-bottom: 15px;">
                <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 5px;">Kanban Stage:</label>
                <select id="kanbanStage" onchange="updateKanbanStage('${projectId}', this.value)" 
                        style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                    ${kanbanStages.map(stage => `<option value="${stage}" ${bdm.stage === stage ? 'selected' : ''}>${stageLabels[stage]}</option>`).join('')}
                </select>
            </div>
            
            ${interactionHistoryHtml}
            ${addInteractionHtml}
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
    const stateFilter = document.getElementById('stateFilter').value;
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
        
        // State filter
        if (stateFilter !== 'all' && project.PLANT_ST !== stateFilter) return false;
        
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
    
    if (currentView === 'map') {
        renderMarkers();
    } else {
        renderKanbanBoard();
    }
    
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
    
    // Prepare CSV data - one row per project per interaction
    const headers = [
        'Project Name', 'Owner', 'Industry', 'Value', 'Probability', 'Prioritization Score',
        'Project Type', 'Status', 'Current Phase', 'Completion Date', 'City', 'State',
        'Automation Opportunity', 'Automation Tags', 'Scope',
        'BDM Stage',
        'Interaction Date', 'Interaction Type', 'SE Rep', 'Interaction Details', 'Next Steps', 'Follow-up Date'
    ];
    
    const rows = [];
    
    filteredProjects.forEach(project => {
        const projectId = project.PLANT_ID || project.PROJ_NAME;
        const bdm = getBDMData(projectId);
        
        // Base project data
        const baseRow = [
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
            bdm.stage || 'leads'
        ];
        
        // If no interactions, export one row with empty interaction fields
        if (!bdm.interactions || bdm.interactions.length === 0) {
            rows.push([...baseRow, '', '', '', '', '', '']);
        } else {
            // Export one row per interaction
            bdm.interactions.forEach(interaction => {
                rows.push([
                    ...baseRow,
                    interaction.date || '',
                    interaction.type || '',
                    interaction.rep || '',
                    (interaction.details || '').replace(/"/g, '""'),
                    (interaction.nextSteps || '').replace(/"/g, '""'),
                    interaction.followUpDate || ''
                ]);
            });
        }
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
    
    console.log(`Exported ${rows.length} rows (${filteredProjects.length} projects) to CSV`);
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
    
    // Export BDM data button
    document.getElementById('exportBDMData').addEventListener('click', exportBDMDataToFile);
    
    // Import BDM data button
    document.getElementById('importBDMData').addEventListener('click', function() {
        document.getElementById('bdmDataFileInput').click();
    });
    
    document.getElementById('bdmDataFileInput').addEventListener('change', handleBDMDataImport);
    
    // Tab switching
    document.getElementById('mapTab').addEventListener('click', () => switchView('map'));
    document.getElementById('kanbanTab').addEventListener('click', () => switchView('kanban'));
    document.getElementById('voiceTab').addEventListener('click', () => switchView('voice'));
    
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

// Switch between map, kanban, and voice-log views
function switchView(view) {
    currentView = view;
    const views = {
        map: document.getElementById('mapView'),
        kanban: document.getElementById('kanbanView'),
        voice: document.getElementById('voiceView')
    };
    const tabs = {
        map: document.getElementById('mapTab'),
        kanban: document.getElementById('kanbanTab'),
        voice: document.getElementById('voiceTab')
    };

    Object.keys(views).forEach(key => {
        if (views[key]) {
            views[key].style.display = 'none';
        }
        if (tabs[key]) {
            tabs[key].classList.remove('active');
        }
    });

    if (view === 'map') {
        views.map.style.display = 'flex';
        tabs.map.classList.add('active');
        renderMarkers();
    } else if (view === 'kanban') {
        views.kanban.style.display = 'block';
        tabs.kanban.classList.add('active');
        renderKanbanBoard();
    } else if (view === 'voice') {
        views.voice.style.display = 'block';
        tabs.voice.classList.add('active');
        if (window.renderVoiceLog) {
            window.renderVoiceLog();
        }
    }
}

// Render Kanban board
function renderKanbanBoard() {
    // Clear all columns
    kanbanStages.forEach(stage => {
        const column = document.getElementById(`column-${stage}`);
        if (column) {
            column.innerHTML = '';
        }
    });
    
    // Group projects by stage
    const projectsByStage = {};
    kanbanStages.forEach(stage => {
        projectsByStage[stage] = [];
    });
    
    filteredProjects.forEach(project => {
        const projectId = project.PLANT_ID || project.PROJ_NAME;
        const bdm = getBDMData(projectId);
        const stage = bdm.stage || 'leads';
        if (projectsByStage[stage]) {
            projectsByStage[stage].push(project);
        }
    });

    // Group manual accounts (created via Voice Log) by stage
    const manualByStage = {};
    kanbanStages.forEach(stage => {
        manualByStage[stage] = [];
    });
    Object.keys(bdmData).forEach(id => {
        const rec = bdmData[id];
        if (rec && rec.isManual) {
            const stage = rec.stage || 'leads';
            if (manualByStage[stage]) {
                manualByStage[stage].push({ id: id, rec: rec });
            }
        }
    });

    // Render cards in each column
    kanbanStages.forEach(stage => {
        const column = document.getElementById(`column-${stage}`);
        const countElement = document.getElementById(`count-${stage}`);
        const projects = projectsByStage[stage] || [];
        const manuals = manualByStage[stage] || [];

        if (countElement) {
            countElement.textContent = projects.length + manuals.length;
        }

        if (column) {
            projects.forEach(project => {
                const card = createKanbanCard(project);
                column.appendChild(card);
            });
            manuals.forEach(m => {
                const card = createManualKanbanCard(m.id, m.rec);
                column.appendChild(card);
            });
        }
    });
}

// Create a Kanban card for a manual account (added via Voice Log — no map location)
function createManualKanbanCard(accountId, rec) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.projectId = accountId; // same drop handler updates stage via this id

    const interactions = Array.isArray(rec.interactions) ? rec.interactions : [];
    const lastContact = interactions.length > 0 ? (interactions[0].contactName || '') : '';

    card.innerHTML = `
        <div style="border-left: 4px solid #6C5CE7; padding-left: 8px;">
            <div style="font-weight: bold; font-size: 0.9rem; margin-bottom: 5px; color: #333;">
                ${(rec.accountName || 'Unnamed Account')}
            </div>
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 3px;">
                ${lastContact || '—'}
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <span style="background: #6C5CE7; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">
                    🎙️ Voice Log lead
                </span>
            </div>
            ${interactions.length > 0 ?
                `<div style="margin-top: 5px; font-size: 0.7rem; color: #666;">
                    📞 ${interactions.length} interaction${interactions.length > 1 ? 's' : ''}
                </div>` : ''}
        </div>
    `;

    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    // No map navigation — manual accounts have no coordinates

    return card;
}

// Create Kanban card
function createKanbanCard(project) {
    const projectId = project.PLANT_ID || project.PROJ_NAME;
    const bdm = getBDMData(projectId);
    const industryColor = industryColors[project.industry] || '#999';
    
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.projectId = projectId;
    
    const automationBadge = project.hasAutomation ? 
        '<span style="background: #3DCD58; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 5px;">⚙️</span>' : '';
    
    const automationTags = project.automationTags && project.automationTags.length > 0 ?
        `<div style="margin-top: 5px; display: flex; flex-wrap: wrap; gap: 3px;">
            ${project.automationTags.slice(0, 3).map(tag => 
                `<span style="background: #3DCD58; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem;">${tag}</span>`
            ).join('')}
        </div>` : '';
    
    card.innerHTML = `
        <div style="border-left: 4px solid ${industryColor}; padding-left: 8px;">
            <div style="font-weight: bold; font-size: 0.9rem; margin-bottom: 5px; color: #333;">
                ${(project.PROJ_NAME || 'Unnamed Project').substring(0, 50)}${(project.PROJ_NAME || '').length > 50 ? '...' : ''}
            </div>
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 3px;">
                ${project.OWNER_NAME || 'N/A'}
            </div>
            <div style="font-size: 0.8rem; font-weight: bold; color: #009846; margin-bottom: 3px;">
                ${formatCurrency(project.value)}
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <span style="background: ${industryColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">
                    ${project.industry || 'N/A'}
                </span>
                ${automationBadge}
            </div>
            ${automationTags}
            ${bdm.interactions && bdm.interactions.length > 0 ? 
                `<div style="margin-top: 5px; font-size: 0.7rem; color: #666;">
                    📞 ${bdm.interactions.length} interaction${bdm.interactions.length > 1 ? 's' : ''}
                </div>` : ''}
        </div>
    `;
    
    // Drag event handlers
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    // Click to navigate to map
    card.addEventListener('click', function() {
        switchView('map');
        const projectObj = allProjects.find(p => (p.PLANT_ID || p.PROJ_NAME) === projectId);
        if (projectObj) {
            const lat = parseFloat(projectObj.LATITUDE);
            const lng = parseFloat(projectObj.LONGITUDE);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.setView([lat, lng], 12);
                setTimeout(() => {
                    showProjectDetails(projectObj);
                }, 500);
            }
        }
    });
    
    return card;
}

// Drag and drop handlers
let draggedCard = null;

function handleDragStart(e) {
    draggedCard = this;
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedCard = null;
}

// Setup drag and drop on columns
function setupKanbanDragDrop() {
    kanbanStages.forEach(stage => {
        const column = document.getElementById(`column-${stage}`);
        if (column) {
            column.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.style.backgroundColor = '#e8f5e9';
            });
            
            column.addEventListener('dragleave', function(e) {
                this.style.backgroundColor = '';
            });
            
            column.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.backgroundColor = '';
                
                if (draggedCard) {
                    const projectId = draggedCard.dataset.projectId;
                    updateBDMData(projectId, { stage: stage });
                    
                    // Remove from old column and add to new
                    draggedCard.remove();
                    this.appendChild(draggedCard);
                    
                    // Update counts
                    renderKanbanBoard();
                }
            });
        }
    });
}

// BDM tracking functions (make globally available)
window.updateKanbanStage = function(projectId, stage) {
    updateBDMData(projectId, { stage: stage });
    
    // Refresh Kanban board if in kanban view
    if (currentView === 'kanban') {
        renderKanbanBoard();
    }
    
    // Refresh project details
    const project = allProjects.find(p => (p.PLANT_ID || p.PROJ_NAME) === projectId);
    if (project) {
        showProjectDetails(project);
    }
};

window.addInteraction = function(projectId) {
    const date = document.getElementById('newInteractionDate').value;
    const type = document.getElementById('newInteractionType').value;
    const rep = document.getElementById('newInteractionRep').value;
    const details = document.getElementById('newInteractionDetails').value;
    const nextSteps = document.getElementById('newInteractionNextSteps').value;
    const followUpDate = document.getElementById('newInteractionFollowUpDate').value;
    
    if (!date || !details) {
        alert('Please fill in at least Date and Details');
        return;
    }
    
    const bdm = getBDMData(projectId);
    if (!bdm.interactions) {
        bdm.interactions = [];
    }
    
    bdm.interactions.push({
        date: date,
        type: type,
        rep: rep,
        details: details,
        nextSteps: nextSteps,
        followUpDate: followUpDate || ''
    });
    
    // Sort interactions by date (newest first)
    bdm.interactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    updateBDMData(projectId, bdm);
    
    // Clear form
    document.getElementById('newInteractionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('newInteractionType').value = 'Call';
    document.getElementById('newInteractionRep').value = '';
    document.getElementById('newInteractionDetails').value = '';
    document.getElementById('newInteractionNextSteps').value = '';
    document.getElementById('newInteractionFollowUpDate').value = '';
    
    // Refresh project details
    const project = allProjects.find(p => (p.PLANT_ID || p.PROJ_NAME) === projectId);
    if (project) {
        showProjectDetails(project);
    }
    
    // Refresh Kanban if in kanban view
    if (currentView === 'kanban') {
        renderKanbanBoard();
    }
};

// Export BDM data to JSON file
function exportBDMDataToFile() {
    const dataStr = JSON.stringify(bdmData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BDM_Data_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('BDM data exported to JSON file');
    alert('BDM data exported successfully! Save this file in the same folder as your HTML file to load it next time.');
}

// Import BDM data from JSON file
function handleBDMDataImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Merge with existing data (imported data takes precedence)
            bdmData = { ...bdmData, ...importedData };
            saveBDMData();
            
            // Refresh views
            if (currentView === 'map') {
                renderMarkers();
            } else {
                renderKanbanBoard();
            }
            
            alert('BDM data loaded successfully! ' + Object.keys(importedData).length + ' projects updated.');
            console.log('BDM data imported from file');
        } catch (error) {
            alert('Error loading BDM data file. Please make sure it\'s a valid JSON file.');
            console.error('Error parsing BDM data:', error);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Auto-save indicator (optional - can add visual feedback)
let autoSaveTimer = null;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        const dataStr = JSON.stringify(bdmData);
        localStorage.setItem('allCAIndustriesBDMData', dataStr);
        console.log('Auto-saved BDM data to browser storage');
    }, 2000); // Auto-save 2 seconds after last change
}

// Make closeProjectDetails available globally
window.closeProjectDetails = closeProjectDetails;

