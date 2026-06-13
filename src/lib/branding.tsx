import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import logoAsset from "@/assets/logo.png";

export const DEFAULT_LOGO = logoAsset;

export interface Branding {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

const DEFAULTS: Branding = {
  companyName: "Munasabati",
  logoUrl: logoAsset,
  primaryColor: "#C9A24B",      // Royal Gold — primary buttons & accents
  secondaryColor: "#1C1430",    // Midnight Purple — sidebar & topbar
  accentColor: "#2E2049",       // Deep Plum — secondary surfaces
  backgroundColor: "#1C1430",   // Midnight Purple — application background
};

interface Ctx {
  branding: Branding;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (b: Partial<Branding>) => Promise<void>;
}

const BrandingCtx = createContext<Ctx>({
  branding: DEFAULTS,
  loading: false,
  refresh: async () => {},
  save: async () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<Branding>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    if (!user) {
      setBranding(DEFAULTS);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("company_name, logo_url, primary_color, secondary_color, accent_color, background_color")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      // Treat legacy palette values as unset so the new theme takes over
      const LEGACY = new Set([
        "#111827", "#2563EB", "#F9FAFB",
        "#561C24", "#6D2932", "#C7B7A3", "#E8D8C4",
        "#D4AF37", "#1E1B2E", "#2D2A4A", "#F5F3EE",
      ]);
      const clean = (v: string | null | undefined, fallback: string) =>
        !v || LEGACY.has(v.toUpperCase()) ? fallback : v;
      setBranding({
        companyName: data.company_name?.trim() || DEFAULTS.companyName,
        logoUrl: data.logo_url || DEFAULTS.logoUrl,
        primaryColor: clean(data.primary_color, DEFAULTS.primaryColor),
        secondaryColor: clean(data.secondary_color, DEFAULTS.secondaryColor),
        accentColor: clean(data.accent_color, DEFAULTS.accentColor),
        backgroundColor: clean(data.background_color, DEFAULTS.backgroundColor),
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBranding(); }, [fetchBranding]);

  // The product theme is controlled centrally in styles.css; account branding
  // remains available for logos, names, and the public booking experience.
  useEffect(() => {
    document.title = `${branding.companyName} — مناسبتي`;
  }, [branding]);

  const save = useCallback(async (patch: Partial<Branding>) => {
    if (!user) throw new Error("غير مسجل الدخول");
    const next = { ...branding, ...patch };
    const { error } = await supabase.from("profiles").update({
      company_name: next.companyName,
      logo_url: next.logoUrl,
      primary_color: next.primaryColor,
      secondary_color: next.secondaryColor,
      accent_color: next.accentColor,
      background_color: next.backgroundColor,
    }).eq("id", user.id);
    if (error) throw error;
    setBranding(next);
  }, [branding, user]);

  return (
    <BrandingCtx.Provider value={{ branding, loading, refresh: fetchBranding, save }}>
      {children}
    </BrandingCtx.Provider>
  );
}

export const useBranding = () => useContext(BrandingCtx);
