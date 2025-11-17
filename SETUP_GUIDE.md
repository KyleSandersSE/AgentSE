# California Projects Map - Setup Guide

## Quick Start Guide for New Users

This guide will help you get the California Projects Map application running on your computer in just a few minutes.

---

## Step 1: Get the Files from GitHub

### Option A: Using Git (Recommended)

1. **Open PowerShell or Command Prompt**
   - Press `Windows Key + X` and select "Windows PowerShell" or "Terminal"

2. **Navigate to where you want the project** (e.g., Desktop or Documents)
   ```powershell
   cd Desktop
   ```

3. **Clone the repository**
   ```powershell
   git clone https://github.com/KyleSandersSE/AgentSE.git
   ```

4. **Navigate into the project folder**
   ```powershell
   cd AgentSE
   ```

### Option B: Download ZIP File

1. **Go to the GitHub repository**
   - Visit: https://github.com/KyleSandersSE/AgentSE
   - Click the green "Code" button
   - Select "Download ZIP"

2. **Extract the ZIP file**
   - Right-click the downloaded ZIP file
   - Select "Extract All..."
   - Choose a location (e.g., Desktop)
   - Click "Extract"

3. **Open the extracted folder**
   - You should see a folder named `AgentSE-main`
   - Rename it to `AgentSE` (optional, for consistency)

---

## Step 2: Prepare Your Data File

1. **Get your CSV data file**
   - You should have a CSV file with your project data (e.g., `CleanedCAData.csv` or `AayushData.csv`)
   - Make sure this file is in the same folder as `index-all-ca.html`

2. **Verify the file location**
   - The CSV file should be in the same folder as:
     - `index-all-ca.html`
     - `app-all-ca.js`
     - `styles.css`

---

## Step 3: Open the Application

### Method 1: Direct Open (Easiest)

1. **Navigate to the project folder**
   ```powershell
   cd C:\path\to\AgentSE
   ```
   (Replace with your actual path)

2. **Open in Chrome**
   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" (Resolve-Path "index-all-ca.html").Path
   ```

   **OR** simply double-click `index-all-ca.html` if Chrome is your default browser

3. **If data doesn't load automatically:**
   - You'll see a "Choose File" button appear
   - Click it and select your CSV file (e.g., `CleanedCAData.csv`)
   - Click "Load Data"

### Method 2: Using a Local Web Server (More Reliable)

If you have Python installed:

1. **Open PowerShell in the project folder**
   ```powershell
   cd C:\path\to\AgentSE
   ```

2. **Start a local server**
   ```powershell
   python -m http.server 8000
   ```
   (If Python 3, use: `python3 -m http.server 8000`)

3. **Open your browser**
   - Go to: `http://localhost:8000/index-all-ca.html`

4. **To stop the server:**
   - Press `Ctrl + C` in the PowerShell window

---

## Step 4: Using the Application

### Map View (Default)

- **View projects**: Projects appear as colored markers on the map
- **Click markers**: Click any marker to see project details
- **Filter projects**: Use the sidebar filters to narrow down projects
- **Search**: Type in the search box to find specific projects

### Kanban Board View

1. **Switch to Kanban Board**
   - Click the "📋 Kanban Board" tab at the top

2. **View your leads**
   - Leads are organized into 4 columns:
     - **Leads**: New projects you haven't contacted
     - **Qualified/Contacted**: Projects you've reached out to
     - **Follow-up Next Steps**: Projects needing follow-up
     - **Won**: Successful projects

3. **Move leads between stages**
   - **Drag and drop**: Click and drag a card to move it to a different column
   - **Or**: Click a project on the map, then change the "Kanban Stage" dropdown

4. **Navigate to project**
   - Click any card in the Kanban board to jump to that project on the map

### Tracking Interactions

1. **Click a project marker** on the map
2. **Scroll down** to the "BDM Tracking" section
3. **Add an interaction:**
   - Fill in the "Add New Interaction" form:
     - Date
     - Type (Call, Email, VM, Meeting, Other)
     - SE Rep (your name)
     - Details (what happened)
     - Next Steps
     - Follow-up Date
   - Press Enter or click "Add Interaction"
4. **View interaction history:**
   - All your interactions appear in the table above the form
   - Shows date, type, rep, details, next steps, and follow-up date

### Saving Your Work

**Auto-Save (Automatic):**
- All your BDM tracking data automatically saves to your browser
- Your changes persist even after closing the browser
- No action needed!

**Manual Backup (Optional):**
1. Click "💾 Export BDM Data (JSON)" in the sidebar
2. Save the downloaded file in your project folder
3. This creates a backup you can share or restore later

**Restore from Backup:**
1. Click "📂 Load BDM Data from File"
2. Select your exported JSON file
3. Your data will be restored

### Exporting to CSV for CRM

1. **Apply any filters** you want (industry, state, automation, etc.)
2. **Click "📥 Export Filtered Results"**
3. **Open the downloaded CSV** in Excel or your CRM system
4. The CSV includes:
   - All project details
   - Kanban stage
   - All interaction history (one row per interaction)
   - Follow-up dates

---

## Step 5: Daily Workflow

### Starting Your Day

1. Open `index-all-ca.html` in Chrome
2. If prompted, select your CSV data file
3. Your saved BDM data loads automatically from browser storage

### Working with Leads

1. **View Kanban Board** to see your pipeline
2. **Filter by industry/state** to focus on specific segments
3. **Click a card** to see project details
4. **Add interactions** as you contact leads
5. **Drag cards** to move leads through your pipeline

### Ending Your Day

- **No need to save** - everything auto-saves!
- **Optional**: Export BDM data as backup before closing

---

## Troubleshooting

### Problem: "Data not loading" or "0 projects shown"

**Solution:**
- Click "Choose File" when it appears
- Select your CSV file manually
- Click "Load Data"

### Problem: "Map tiles not loading"

**Solution:**
- Check your internet connection
- Map tiles require internet access

### Problem: "Changes not saving"

**Solution:**
- Make sure you're not in private/incognito mode
- Browser localStorage is required for saving
- Try a different browser (Chrome recommended)

### Problem: "Can't drag cards in Kanban board"

**Solution:**
- Make sure you're clicking and holding the card
- Drag it to a different column
- Release the mouse button

### Problem: "CSV export is empty"

**Solution:**
- Make sure you have projects visible (check filters)
- Try clearing all filters first
- Then apply the filters you want

---

## File Structure

Your project folder should contain:

```
AgentSE/
├── index-all-ca.html          # Main application file
├── app-all-ca.js              # Application logic
├── styles.css                 # Styling
├── CleanedCAData.csv          # Your project data (or your CSV file)
├── BDM_Data_YYYY-MM-DD.json   # Your exported BDM data (optional)
└── README.md                  # Documentation
```

---

## Key Features Summary

✅ **Interactive Map**: Visualize all projects on a map  
✅ **Kanban Board**: Organize leads in a visual pipeline  
✅ **Drag & Drop**: Move leads between stages easily  
✅ **Interaction Tracking**: Log all your outreach activities  
✅ **State Filtering**: Filter projects by state  
✅ **Industry Filtering**: Focus on specific industries  
✅ **Automation Detection**: Identify automation opportunities  
✅ **Auto-Save**: All changes save automatically  
✅ **Export to CSV**: Download data for CRM upload  
✅ **Export/Import BDM Data**: Backup and restore your tracking data  

---

## Need Help?

- Check the browser console (F12) for error messages
- Make sure all files are in the same folder
- Verify your CSV file has the correct column structure
- Try using a local web server if direct file opening doesn't work

---

## Quick Reference Commands

**Open in Chrome (PowerShell):**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" (Resolve-Path "index-all-ca.html").Path
```

**Start Python Server:**
```powershell
python -m http.server 8000
```
Then visit: `http://localhost:8000/index-all-ca.html`

**Clone Repository:**
```powershell
git clone https://github.com/KyleSandersSE/AgentSE.git
```

---

**Last Updated:** November 2025  
**Repository:** https://github.com/KyleSandersSE/AgentSE

