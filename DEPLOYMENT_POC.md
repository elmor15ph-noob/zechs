# O2C Global Solution Orchestrator — Executable POC

## Quick Start (No Installation Required)

### **For Secured Workstations (No Admin, No Installation)**

1. **Download:** `O2COrchestrator.exe` (46 MB)
   - Location: `dist/O2COrchestrator/O2COrchestrator.exe`

2. **Run:** Double-click `O2COrchestrator.exe`
   - No admin rights needed
   - No installation
   - No dependencies required
   - Window opens in 3-5 seconds

3. **Use:** O2C application appears in native window
   - Create orders
   - View GL postings
   - Export Solution Builder XML

4. **Close:** Close the window (or click X)
   - Application stops
   - No cleanup needed

---

## System Requirements

| Requirement | Details |
|-------------|---------|
| OS | Windows 7+ (32-bit or 64-bit) |
| Memory | 256 MB RAM minimum (512 MB recommended) |
| Disk Space | 150 MB free (for executable + temp data) |
| Admin Rights | NOT required |
| Network | Works offline (no internet needed) |
| Python | NOT required (embedded) |
| Node.js | NOT required (embedded) |

---

## File Structure

```
O2COrchestrator.exe (46 MB)
├─ Embedded Python 3.11 runtime
├─ FastAPI backend (O2C orchestrator)
├─ React frontend (UI)
├─ PyWebView (native window)
└─ SQLite database (in AppData)
```

---

## Data Storage

**Default Location:** `C:\Users\{username}\AppData\Local\O2C\`

```
C:\Users\{username}\AppData\Local\O2C\
├─ data.db (SQLite database - order data)
├─ logs/ (application logs)
└─ config.json (settings)
```

**Portable Mode:** Copy entire `O2COrchestrator/` folder to USB stick
- Application data will be stored in the same folder (for portability)
- No AppData folder needed

---

## Usage

### **Create an Order**
1. Click "Create Sales Order" (Step 0)
2. Optionally select a scenario template (T&M, Fixed Price, Retainer)
3. Click "Create Order from Template" or "Create Order"

### **Progress Through Steps**
1. Step 1: Confirm order
2. Step 2: Invoice generation
3. Step 3: Revenue recognition
4. Step 4: AR aging & dunning
5. Step 5: GL posting
6. Step 6: Export Solution Builder XML

### **Export Configuration**
1. Complete all 6 steps
2. Click "Export as Solution Builder XML"
3. File downloads: `O2C-SolutionBuilder-{OrderNumber}.xml`

---

## Troubleshooting

### **Port Already in Use**
**Issue:** "Error: Port 8000 already in use"

**Solution:**
- Close other applications using port 8000
- Or: Manually change the port in `launcher.py` (if running from source)
- Default: Tries ports 8000-8999 (should find free port)

### **Window Won't Open**
**Issue:** Application starts but no window appears

**Solution:**
1. Check Windows Defender/Antivirus (may block)
2. Try running from `C:\` root (not network drive)
3. Check Event Viewer for error logs

### **Application Crashes**
**Issue:** Executable exits unexpectedly

**Solution:**
1. Check: `C:\Users\{username}\AppData\Local\O2C\logs/`
2. Share error log with support
3. Try re-downloading fresh executable

### **Data Not Persisting**
**Issue:** Orders disappear when closing app

**Solution:**
1. Check database location: `AppData\Local\O2C\data.db`
2. Ensure folder is writable (not on read-only drive)
3. Try portable mode on USB stick

---

## Distribution

### **For Internal SimCorp Sharing**

**Folder structure:**
```
O2COrchestrator_POC/
├─ O2COrchestrator.exe (46 MB)
├─ README.txt (Quick start guide)
├─ DEPLOYMENT_POC.md (This file)
└─ LICENSE.txt (if applicable)
```

**Upload to:** Shared drive, Teams, or file share
- Size: ~46 MB (single file)
- No signature required (for POC)
- Can be run from network share (slower but works)

**Recommended:** Copy to local drive before running
```
1. Copy O2COrchestrator.exe to C:\Users\{user}\Downloads\
2. Run from there (faster)
```

---

## Production Hardening (Future)

### **For Production Deployment:**

1. **Code Sign Executable**
   - Sign .exe with company certificate
   - Windows SmartScreen will trust it

2. **Create Installer (MSI)**
   - WiX Toolset or InnoSetup
   - Handles: Shortcuts, registry, uninstall

3. **Add Auto-Update**
   - Check for updates on startup
   - Download new version automatically

4. **Database Encryption**
   - Encrypt AppData\Local\O2C\data.db
   - Protect sensitive order data

5. **Monitoring & Logging**
   - Send logs to central server
   - Monitor application health

---

## Version Info

| Component | Version |
|-----------|---------|
| O2C POC | 1.0.0 |
| Python | 3.11 |
| FastAPI | 0.104 |
| React | 18.x |
| Build Date | 2026-04-25 |

---

## Support

For issues or feedback:
1. Check logs: `AppData\Local\O2C\logs/`
2. Export order data (for backup)
3. Uninstall: Just delete `O2COrchestrator.exe`
4. No cleanup needed (portable app)

---

## Security Notes

### **Included In Executable:**
- ✅ Python runtime (trusted)
- ✅ FastAPI framework (open-source)
- ✅ React frontend (compiled)
- ✅ PyWebView (native WebView)

### **NOT Included:**
- ❌ Malware (scanned by VirusTotal)
- ❌ Spyware (no telemetry)
- ❌ Network calls (all local)

### **Data Privacy:**
- All data stored locally
- No cloud uploads
- No telemetry
- No tracking

---

## Next Steps

1. **Test:** Download and run on target workstations
2. **Feedback:** Gather SimCorp team input
3. **Iterate:** Add complex scenarios if needed
4. **Sign:** Code sign for production (if approved)
5. **Deploy:** Distribute via secure channel

---

**Ready to deploy!** 🚀

Questions? Check logs: `C:\Users\{username}\AppData\Local\O2C\logs/`
