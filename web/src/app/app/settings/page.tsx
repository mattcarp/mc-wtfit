import { AppHeader } from '@/components/AppHeader';
import { NotConfigured } from '@/components/NotConfigured';
import { DEFAULT_BENEFICIARY, getSettings } from '@/lib/data';
import { pageUser } from '@/lib/page';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await pageUser('/app/settings');
  if (!user) return <><AppHeader current="/app/settings" /><NotConfigured /></>;
  const { aiKey, ...s } = await getSettings(user.id);
  const shared = process.env.SERVER_AI_PROVIDER ? { provider: process.env.SERVER_AI_PROVIDER, model: process.env.SERVER_AI_MODEL || 'default', limit: Number(process.env.SERVER_AI_DAILY_LIMIT || 10) } : null;
  return (
    <>
      <AppHeader current="/app/settings" />
      <main className="wrap app-main">
        <h1 className="display page-title">Knobs.</h1>
        <SettingsForm initial={s} keyHint={aiKey ? `${aiKey.slice(0, 4)}…${aiKey.slice(-4)}` : null} shared={shared} defaultBeneficiary={DEFAULT_BENEFICIARY} email={user.email} />
      </main>
    </>
  );
}
