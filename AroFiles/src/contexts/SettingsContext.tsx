import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
  bkash_number: string;
  robux_rate_bdt: string;
  robux_rate_usd: string;
  discord_url: string;
  whatsapp_number: string;
  trusted_count: string;
  announcement_enabled: string;
  announcement_text: string;
  nagad_enabled: string;
  nagad_number: string;
  wallet_usdt_bep20: string;
  wallet_usdt_erc20: string;
  wallet_usdt_trc20: string;
  wallet_btc: string;
  wallet_ltc: string;
  wallet_eth: string;
  ingame_games_json: string;
  limited_subcats_json: string;
  card_floats_json: string;
}

export const SETTING_DEFAULTS: SiteSettings = {
  bkash_number: '01XXXXXXXXX',
  robux_rate_bdt: '850',
  robux_rate_usd: '6.89',
  discord_url: 'https://discord.gg/c5wrvVcKem',
  whatsapp_number: '8801410340055',
  trusted_count: '300+',
  announcement_enabled: 'false',
  announcement_text: '',
  nagad_enabled: 'false',
  nagad_number: '01XXXXXXXXX',
  wallet_usdt_bep20: '0x8c99c1ab0e9a6a99b0b2815fa4832d8e3d2af58f',
  wallet_usdt_erc20: '0x8c99c1ab0e9a6a99b0b2815fa4832d8e3d2af58f',
  wallet_usdt_trc20: 'TMmDbHQyYgE71uwavadabUnJ23fqWVeZYq',
  wallet_btc: '13t5uBgUKPVvo6n5RvVjN1bJshCjgeVUi1',
  wallet_ltc: 'LSofNzGtMiTqHgKu7RPKQHTtX2BQvjndad',
  wallet_eth: '0x8c99c1ab0e9a6a99b0b2815fa4832d8e3d2af58f',
  ingame_games_json: JSON.stringify([
    { name: 'Fisch', icon: '' },
    { name: 'Murder Mystery 2', icon: '' },
    { name: 'Blade Ball', icon: '' },
    { name: 'Adopt Me', icon: '' },
    { name: 'Steal a Brainrot', icon: '' },
    { name: 'Blox Fruit', icon: '' },
    { name: 'Grow A Garden', icon: '' },
  ]),
  limited_subcats_json: JSON.stringify(['Hats', 'Faces', 'Hair', 'Neck', 'Shoulder', 'Back']),
  card_floats_json: JSON.stringify({ ROBUX: ['','','',''], LIMITEDS: ['','','',''], 'INGAME CURRENCIES': ['','','',''], ACCOUNTS: ['','','',''] }),
};

interface SettingsContextType {
  settings: SiteSettings;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: SETTING_DEFAULTS,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(SETTING_DEFAULTS);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('site_settings').select('key, value');
      if (data && data.length > 0) {
        const merged: any = { ...SETTING_DEFAULTS };
        data.forEach((row: any) => {
          if (row.key in SETTING_DEFAULTS) merged[row.key] = row.value ?? '';
        });
        setSettings(merged);
      }
    } catch {
      // table might not exist yet — silently use defaults
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
