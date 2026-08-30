export type LicensePlan = "none" | "trial" | "starter" | "monthly" | "agency" | "lifetime";
export type AutomationMode = "manual" | "preset" | "full";

export const LICENSE_ENTITLEMENTS: Record<LicensePlan, Readonly<Record<AutomationMode, boolean>>> = {
  none: { manual: false, preset: false, full: false },
  trial: { manual: true, preset: true, full: true },
  starter: { manual: true, preset: true, full: false },
  monthly: { manual: true, preset: true, full: true },
  agency: { manual: true, preset: true, full: true },
  lifetime: { manual: true, preset: true, full: true },
};

export const canUseAutomationMode = (
  plan: LicensePlan,
  mode: AutomationMode,
) => LICENSE_ENTITLEMENTS[plan]?.[mode] === true;
