# Food & Beverage Projects Map - California

An interactive web application for visualizing and analyzing Food & Beverage industry projects across California with a focus on automation opportunities for business development.

## 🎯 Features

- **Interactive Map View**: Visualize 360+ projects across California on an interactive map
- **Automation Detection**: Automatically identifies projects with automation opportunities (PLCs, SCADA, robotics, controls)
- **Smart Filtering**: Filter by project type, status, probability, value, and automation opportunities
- **Business Intelligence**: 
  - Prioritization scoring based on project value × probability
  - Sort by value, probability, or prioritization score
  - Real-time statistics on total value and automation opportunities
- **Detailed Project Information**: 
  - Project scope and schedule
  - Owner and location information
  - Timeline and completion dates
  - Direct links to full project reports
- **Search Functionality**: Find projects by name or owner
- **Responsive Design**: Works on desktop and tablet devices

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A local web server (or just open the HTML file directly)

### Installation

1. **Clone or Download** this repository
2. **Ensure FoodBevCA.csv** is in the same directory as index.html
3. **Open index.html** in your web browser

### Running the Application

#### Option 1: Direct File Opening
Simply double-click `index.html` to open it in your default browser.

#### Option 2: Using a Local Web Server (Recommended)

**Python 3:**
```bash
python -m http.server 8000
```
Then open http://localhost:8000 in your browser.

**Node.js (with http-server):**
```bash
npx http-server
```

**VS Code Live Server:**
Right-click on `index.html` and select "Open with Live Server"

## 📊 Dataset

The application uses `FoodBevCA.csv` which contains 360+ Food & Beverage projects with the following information:

- Project names and descriptions
- Owner/company information
- Project values and investment amounts
- Location data (latitude/longitude, addresses)
- Project scopes and schedules
- Timeline information
- Probability of success
- Current project phase

## 🔍 How to Use

### Map Navigation
- **Pan**: Click and drag the map
- **Zoom**: Use mouse wheel or +/- buttons
- **Click Markers**: View project summary in popup
- **Marker Colors**:
  - 🟢 Green with gear icon (⚙️) = Automation Opportunity
  - 🔵 Blue with pin icon (📍) = Regular Project

### Filtering Projects

1. **Automation Toggle**: Show only projects with automation opportunities
2. **Search Bar**: Search by project name or company name
3. **Project Status**: Filter by operational status
4. **Project Type**: Filter by project category
5. **Probability**: Filter by success probability (High/Medium/Low)
6. **Min Value Slider**: Set minimum project value threshold
7. **Sort By**: Order projects by value, probability, or prioritization score

Click **"Apply Filters"** to update the map with your selections.

### Viewing Project Details

1. Click any marker on the map
2. The sidebar will display detailed information:
   - Project name and owner
   - Investment value
   - Probability rating
   - Prioritization score
   - Project type and status
   - Current phase
   - Completion timeline
   - Full address
   - Detailed scope description
   - Schedule information
   - Link to full report

### Business Development Strategy

**Identifying High-Priority Opportunities:**

1. **Filter for Automation**: Check "Show Only Automation Opportunities"
2. **Sort by Prioritization Score**: This combines value × probability for optimal targeting
3. **Focus on High Probability**: Filter for "High (70-80%)" probability projects
4. **Set Minimum Value**: Adjust slider to focus on larger projects

**Example Workflow:**
```
1. Toggle "Show Only Automation Opportunities" ✓
2. Set Min Project Value to $1M+
3. Filter Probability to "High"
4. Sort By "Prioritization Score"
5. Review top results on map
6. Click markers to view detailed scopes
7. Identify specific automation needs (PLCs, SCADA, controls)
8. Follow "View Full Report" links for complete details
```

## 🛠️ Technology Stack

- **HTML5/CSS3/JavaScript**: Core web technologies
- **Leaflet.js**: Open-source mapping library
- **Leaflet.markercluster**: Marker clustering for performance
- **PapaParse**: CSV parsing in browser
- **OpenStreetMap**: Map tiles (no API key required)

## 📈 Statistics Dashboard

The header displays real-time statistics:
- **Total Projects**: Number of visible projects after filtering
- **Automation Opportunities**: Count of projects with automation keywords
- **Total Value**: Combined investment value of visible projects

## 🎨 Automation Keywords Detected

The application automatically scans project scopes for:
- PLC (Programmable Logic Controllers)
- SCADA (Supervisory Control and Data Acquisition)
- Automation / Automated Systems
- Robotics / Robotic Systems
- Controls / Control Systems
- HMI (Human-Machine Interface)
- DCS (Distributed Control System)
- Controllers

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔧 Customization

### Adding More Automation Keywords

Edit `app.js` and modify the `automationKeywords` array:

```javascript
let automationKeywords = [
    'PLC', 'SCADA', 'automation', 'automated', 'robotics', 'robotic',
    'controls', 'control system', 'HMI', 'DCS', 'controller',
    // Add your keywords here
];
```

### Changing Map Center/Zoom

Edit `app.js` in the `initializeMap()` function:

```javascript
map = L.map('map').setView([36.7783, -119.4179], 6);
// [latitude, longitude], zoom_level
```

### Styling Customization

Edit `styles.css` to customize colors, fonts, and layout.

## 📝 File Structure

```
/
├── index.html          # Main application HTML
├── app.js              # Application logic and data processing
├── styles.css          # Styling and layout
├── FoodBevCA.csv       # Project data (360+ rows)
└── README.md           # This file
```

## 🐛 Troubleshooting

**Map not loading:**
- Check browser console for errors (F12)
- Ensure you have an internet connection (for map tiles and CDN libraries)
- Try using a local web server instead of opening the file directly

**Projects not appearing:**
- Verify `FoodBevCA.csv` is in the correct location
- Check that the CSV file is not empty or corrupted
- Clear browser cache and reload

**Markers clustered:**
- Zoom in on the map to see individual markers
- Clusters automatically expand when you zoom closer

## 📄 License

This project is for internal business development use.

## 🤝 Support

For issues or questions, please check the browser console (F12) for error messages.

---

**Built for Schneider Electric - Food & Beverage Business Development**

*Last Updated: November 2025*
