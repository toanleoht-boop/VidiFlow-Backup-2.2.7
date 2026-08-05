import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertTriangle, Monitor, ExternalLink } from 'lucide-react';
import { ChromeProfile, ChromeProfilesConfig } from '../../types';
import { STORAGE_KEYS } from '../../constants/storageKeys';

const RESTORED_PROFILES = [
  ["tuankoyht", 9222], ["Leovotii1234", 9224], ["ytbchannel4ht", 9225],
  ["toanleoht", 9226], ["xomensaw", 9227], ["toanle99ht", 9228],
  ["hungle2004ht", 9229], ["leevotii4321", 9230], ["toanlemkt.112", 9231],
].map(([name, port]) => ({ id: `restored-${port}`, name, port: Number(port), concurrency: 1, active: true }));

const readSharedTabs = () => {
  try {
    return Math.max(1, Number(JSON.parse(localStorage.getItem("automation_full_config_v1") || "{}").tabsPerChrome) || 1);
  } catch {
    return 1;
  }
};

export function ChromeProfileManager() {
  const [localConfig, setLocalConfig] = useState<ChromeProfilesConfig>({ profiles: [], enabled: false });
  const [sharedTabsPerChrome, setSharedTabsPerChrome] = useState(readSharedTabs);

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHROME_PROFILES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profiles.length <= 1) {
          // Initialize with default 9222 profile if empty
          const defaultProfile = {
            id: Date.now().toString(),
            name: "Chrome Mặc Định (Đã Đăng Nhập)",
            port: 9222,
            concurrency: 1,
            active: true
          };
          parsed.profiles = RESTORED_PROFILES;
          parsed.enabled = true;
          localStorage.setItem(STORAGE_KEYS.CHROME_PROFILES, JSON.stringify(parsed));
        }
        setLocalConfig(parsed);
      } else {
        const defaultProfile = {
          id: Date.now().toString(),
          name: "Chrome Mặc Định (Đã Đăng Nhập)",
          port: 9222,
          concurrency: 1,
          active: true
        };
        const initConfig = { profiles: RESTORED_PROFILES, enabled: true };
        setLocalConfig(initConfig);
        localStorage.setItem(STORAGE_KEYS.CHROME_PROFILES, JSON.stringify(initConfig));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const syncTabs = () => setSharedTabsPerChrome(readSharedTabs());
    window.addEventListener("automationConfigUpdated", syncTabs);
    window.addEventListener("storage", syncTabs);
    return () => {
      window.removeEventListener("automationConfigUpdated", syncTabs);
      window.removeEventListener("storage", syncTabs);
    };
  }, []);

  const saveConfig = (newConfig: ChromeProfilesConfig) => {
    setLocalConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.CHROME_PROFILES, JSON.stringify(newConfig));
    window.dispatchEvent(new Event('chromeProfilesUpdated'));
  };

  const addProfile = () => {
    const maxPort = localConfig.profiles.reduce((max, p) => Math.max(max, p.port), 9221);
    const newProfile: ChromeProfile = {
      id: Date.now().toString(),
      name: `Chrome ${localConfig.profiles.length + 1}`,
      port: maxPort + 1,
      concurrency: 1,
      active: true
    };
    saveConfig({ ...localConfig, profiles: [...localConfig.profiles, newProfile] });
    showToast(`Đã thêm profile mới (Port ${maxPort + 1})`, 'success');
  };

  const updateProfile = (id: string, updates: Partial<ChromeProfile>) => {
    saveConfig({
      ...localConfig,
      profiles: localConfig.profiles.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const removeProfile = (id: string) => {
    saveConfig({
      ...localConfig,
      profiles: localConfig.profiles.filter(p => p.id !== id)
    });
    showToast('Đã xóa profile', 'success');
  };

  const selectAllProfiles = (active: boolean) => {
    saveConfig({
      ...localConfig,
      profiles: localConfig.profiles.map(p => ({ ...p, active }))
    });
    showToast(active ? 'Đã chọn tất cả' : 'Đã bỏ chọn tất cả', 'success');
  };

  const toggleEnabled = (enabled: boolean) => {
    saveConfig({ ...localConfig, enabled });
    showToast(enabled ? 'Đã bật xoay vòng Chrome' : 'Đã tắt xoay vòng Chrome', 'success');
  };

  const activeProfiles = localConfig.profiles.filter(p => p.active);
  const totalConcurrency = activeProfiles.length * sharedTabsPerChrome;

  const openChrome = async (port: number) => {
    try {
      showToast(`Đang khởi động Chrome port ${port}...`, 'success');
      const response = await fetch("/api/pipeline/open-chrome", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port, headless: false })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast("Lỗi: " + (data.message || data.error || "Không rõ nguyên nhân"), 'error');
      }
    } catch (e) {
      showToast("Lỗi kết nối khi gọi API mở Chrome", 'error');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs mt-6 relative">
      
      {/* Toast Notification Overlay */}
      {toast && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2 transition-all transform duration-300 translate-y-0 opacity-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Quản Lý Chrome Profiles</h2>
            <p className="text-xs text-slate-500">Thiết lập đa luồng Chrome để sinh mẻ ảnh hàng loạt, chống chặn (spam).</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <label className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            checked={localConfig.enabled}
            onChange={(e) => toggleEnabled(e.target.checked)}
          />
          <div>
            <div className="text-sm font-bold text-slate-800">Kích hoạt phân phối qua nhiều Chrome</div>
            <div className="text-xs text-slate-500 mt-0.5">Tự động chia đều prompt cho các luồng bên dưới thay vì chạy 1 Chrome</div>
          </div>
        </label>

        {localConfig.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">Tổng cộng: {localConfig.profiles.length} Profiles ({activeProfiles.length} đang bật)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectAllProfiles(true)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 shadow-xs active:scale-95"
                >
                  Chọn Tất Cả
                </button>
                <button
                  onClick={() => selectAllProfiles(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 shadow-xs active:scale-95"
                >
                  Bỏ Chọn Tất Cả
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {localConfig.profiles.map((profile) => (
                <div key={profile.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${profile.active ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <input
                    type="checkbox"
                    title="Bật/Tắt profile này"
                    checked={profile.active}
                    onChange={(e) => updateProfile(profile.id, { active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 shrink-0 mt-6"
                  />
                  <div className="flex-1 min-w-[120px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Tên hiển thị</span>
                    <input
                      type="text"
                      placeholder="Tên (VD: Chrome 1)"
                      value={profile.name}
                      onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Tài khoản</span>
                    <select
                      value={profile.accountTier || 'Basic'}
                      onChange={(e) => updateProfile(profile.id, { accountTier: e.target.value as any })}
                      className={`w-full rounded-lg px-2 py-1.5 text-sm font-bold outline-none border transition-colors ${
                        profile.accountTier === 'Ultra' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        profile.accountTier === 'Pro' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Pro">Pro</option>
                      <option value="Ultra">Ultra</option>
                    </select>
                  </div>
                  <div className="w-20">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Cổng (Port)</span>
                    <input
                      type="number"
                      title="Remote Debugging Port"
                      value={profile.port}
                      onChange={(e) => updateProfile(profile.id, { port: parseInt(e.target.value) || 9222 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                    />
                  </div>
                  <div className="w-24">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Tabs từ Bước 2</span>
                    <input
                      type="number"
                      min="1" max="10"
                      title="Giá trị được đồng bộ từ Bước 2: Ảnh / Video"
                      value={sharedTabsPerChrome}
                      readOnly
                      className="w-full cursor-not-allowed bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-700 outline-none text-center"
                    />
                  </div>
                  <div className="pt-5 pl-1 flex items-center gap-1.5">
                    <button
                      onClick={() => openChrome(profile.port)}
                      className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 shadow-xs flex items-center gap-1"
                      title="Mở Chrome với Port này"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Mở Chrome</span>
                    </button>
                    <button
                      onClick={() => removeProfile(profile.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addProfile}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold transition-colors mt-2"
            >
              <Plus className="w-4 h-4" /> Thêm Chrome Profile Mới
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start mt-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed space-y-1">
                <p><strong>Hướng dẫn chạy lệnh trên Windows:</strong></p>
                <p>Mở ứng dụng Command Prompt hoặc PowerShell và chạy lệnh tương ứng với Port bạn vừa cấu hình ở trên (tắt hoàn toàn Chrome trước đó nếu cần):</p>
                <code className="block mt-2 bg-amber-100 p-2 rounded text-[11px] font-mono font-bold select-all overflow-x-auto">
                  {localConfig.profiles.map(p => `start chrome.exe --remote-debugging-port=${p.port} --user-data-dir="C:\\chrome-profile-${p.port}"`).join('\n')}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
