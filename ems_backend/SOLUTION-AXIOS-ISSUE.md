# 🔧 Solution for Axios Module Issue

## 🚨 Problem Identified

The Linux executable is failing with this error:
```
Error: Cannot find module '/snapshot/ems_backend/node_modules/axtos/dist/node/axtos.cjs'
```

This is a common issue with pkg and the axios module.

## ✅ Solutions Available

### **Solution 1: Try Fixed Build (Recommended)**

Run the fixed build script:
```bash
./build-fixed.bat
```

This creates:
- `ems-backend-windows-fixed.exe`
- `ems-backend-linux-fixed`

### **Solution 2: Manual Installation Package (Guaranteed to Work)**

Run the manual package creator:
```bash
./create-manual-package.bat
```

This creates a `MANUAL-INSTALL` folder with:
- Source code files
- Start scripts that install dependencies automatically
- Works on any system with Node.js installed

### **Solution 3: Direct Node.js Installation**

If the above solutions don't work:

1. **Install Node.js** on the target system:
   - Windows: Download from https://nodejs.org/
   - Linux: `sudo apt install nodejs npm`

2. **Copy these files** to target system:
   - `server.js`
   - `config.js`
   - `package.json`
   - `database_setup.sql`

3. **Run manually**:
   ```bash
   npm install
   node server.js
   ```

## 📋 Quick Fix Steps

### **For Immediate Use:**

1. **Try the fixed build first:**
   ```bash
   ./build-fixed.bat
   ```

2. **If that doesn't work, use manual package:**
   ```bash
   ./create-manual-package.bat
   ```

3. **Copy the appropriate package to pendrive**

### **For Linux Systems:**

**Option A: Fixed Executable**
```bash
./ems-backend-linux-fixed
```

**Option B: Manual Installation**
```bash
# Install Node.js first
sudo apt install nodejs npm

# Then run
./start-linux.sh
```

**Option C: Direct Run**
```bash
npm install
node server.js
```

## 🔍 Why This Happens

The pkg tool sometimes has issues with:
- ES6 modules (axios uses these)
- Dynamic imports
- Complex dependency trees
- Platform-specific code

## 🎯 Recommended Approach

1. **Try `build-fixed.bat`** first (uses `--public` flag)
2. **If that fails, use `create-manual-package.bat`**
3. **Manual package is guaranteed to work** on any system with Node.js

## 📦 Package Comparison

| Method | Size | Dependencies | Reliability |
|--------|------|--------------|-------------|
| Fixed Executable | ~70MB | None | Good |
| Manual Package | ~5MB | Node.js | Excellent |
| Direct Source | ~5MB | Node.js | Excellent |

## 🚀 Quick Test

To test if the fixed build works:

1. Run: `./build-fixed.bat`
2. Test Windows: `./ems-backend-windows-fixed.exe`
3. Test Linux: `./ems-backend-linux-fixed`

If both work, use the fixed executables.
If not, use the manual installation package. 