import sys
import re
import os
from PyInstaller.utils.win32.versioninfo import VSVersionInfo, VarFileInfo, StringTable, FixedFileInfo, StringFileInfo, StringStruct, VarStruct
# Default version in case extraction fails
version = "unknown"

try:
    # Open TWRankings.py to read the version using utf-8 encoding
    with open('TWRankings.py', 'r', encoding='utf-8') as f:
        content = f.read()
        # Search for a line that assigns a version
        match = re.search(r"version\s*=\s*['\"]([^'\"]+)['\"]", content)
        if match:
            version = match.group(1)  # Extract version string
except Exception as e:
    print(f"Error reading version from TWRankings.py: {e}")

# Print the version for debugging purposes
print(f"Version extracted: {version}")

# Set executable name with the extracted version
exe_name = f"TWRankings-{version}"
exe_name_debug = f"{exe_name}-Debug"

# Debug print to check the exe_name
print(f"Exe name set to: {exe_name}")

# Ensure exe_name is not None or empty
if not exe_name or exe_name == "unknown":
    raise ValueError(f"exe_name cannot be None or empty, it is: {exe_name}")

block_cipher = None

#
# Get the directory where Python is installed
python_dir = os.path.dirname(sys.executable)

# Define the path to python312.dll
dll_path = os.path.join(python_dir, 'python312.dll')

# Check if python312.dll exists before adding it to binaries
binaries = [(dll_path, '.')] if os.path.exists(dll_path) else []

# Get the directory of the .spec file or script file
spec_dir = os.path.dirname(os.path.abspath(sys.argv[0]))

# Create the version information using VSVersionInfo
version_info = VSVersionInfo(
    # Define the version info using VarFileInfo and StringTable
    VarFileInfo([StringTable(
        '040904B0',  # Language ID for US English
        {
            'CompanyName': 'Nuno Ferreira',
            'FileDescription': 'TWRankings Fetcher',
            'FileVersion': version,
            'ProductName': 'TWRankings',
            'ProductVersion': version,
            'Copyright': '© 2025 Nuno Ferreira',
            'InternalName': 'TWRankings',
            'OriginalFilename': 'TWRankings.exe'
        }
    )])
)

version_info = VSVersionInfo(
  ffi=FixedFileInfo(
    filevers=(1, 0, 0, 0),
    prodvers=(1, 0, 0, 0),
    mask=0x3f,
    flags=0x0,
    OS=0x4,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
  ),
  kids=[
    StringFileInfo(
      [
        StringTable(
          u'040904B0',
          [
            StringStruct(u'CompanyName', u'Nuno Ferreira'),
            StringStruct(u'FileDescription', u'TW Rankings Fetcher'),
            StringStruct(u'FileVersion', version),
            StringStruct(u'InternalName', u'TWRankingse'),
            StringStruct(u'LegalCopyright', u'Nuno Ferreira'),
            StringStruct(u'ProductName', u'TWRankings'),
            StringStruct(u'ProductVersion', version),
            StringStruct(u'ApplicationName', exe_name)
          ]
        )
      ]
    ),
    VarFileInfo([VarStruct(u'Translation', [1033, 1200])])
  ]
)
a = Analysis(
    ['TWRankings.py'],  # Your main script
    pathex=[spec_dir],  # Dynamically set the path to the .spec file directory
    binaries=binaries,  # This adds the dll to the bundled binaries
    datas=[],
    hiddenimports=['PIL', 'selenium', 'chromedriver_binary'],  # Ensure hidden imports are correctly listed
    win_private_assemblies=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# Create EXE object, passing the versioned exe_name
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name=exe_name,
    version=version_info,
    debug=False,
    strip=False,
    upx=False,
    console=True,
    icon=None,
    clean=True,
    onefile=True  # Ensure one-file mode
)
