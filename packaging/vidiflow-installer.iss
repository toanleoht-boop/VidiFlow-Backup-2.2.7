#ifndef AppVersion
#define AppVersion "1.0.0"
#endif
#ifndef SourceDir
#define SourceDir "..\release\VidiFlow-OneClick-Desktop-Windows\vidiflow_launcher.dist"
#endif
#ifndef OutputSuffix
#define OutputSuffix ""
#endif

[Setup]
AppId={{6F5D984A-6826-4FCF-A21B-5735BDFBA4E0}
AppName=VidiFlow OneClick Content Studio
AppVersion={#AppVersion}
AppPublisher=VidiFlow
DefaultDirName={localappdata}\VidiFlow OneClick Content Studio
DefaultGroupName=VidiFlow OneClick Content Studio
PrivilegesRequired=lowest
DisableProgramGroupPage=yes
OutputDir=..\release
OutputBaseFilename=VidiFlow-Setup-{#AppVersion}{#OutputSuffix}
Compression=lzma2/ultra64
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\VidiFlow OneClick.exe
WizardStyle=modern
LicenseFile={#SourceDir}\legal\EULA.txt

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\VidiFlow OneClick Content Studio"; Filename: "{app}\VidiFlow OneClick.exe"
Name: "{autodesktop}\VidiFlow OneClick Content Studio"; Filename: "{app}\VidiFlow OneClick.exe"

[Run]
Filename: "{app}\VidiFlow OneClick.exe"; Description: "Mở VidiFlow OneClick Content Studio"; Flags: nowait postinstall skipifsilent
