import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { NotConfigured } from '@/components/NotConfigured';
import { beneficiaryLabel, getProfile, getSettings } from '@/lib/data';
import { pageUser } from '@/lib/page';
import { Capture } from './Capture';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Scan' };

export default async function ScanPage() {
  const user = await pageUser('/app');
  if (!user) return <><AppHeader current="/app" /><NotConfigured /></>;
  const [settings, { updatedAt }] = await Promise.all([getSettings(user.id), getProfile(user.id)]);
  const noModel = settings.aiProvider === 'server' && !process.env.SERVER_AI_PROVIDER;
  return (
    <>
      <AppHeader current="/app" />
      <main className="wrap app-main">
        {!updatedAt && (
          <div className="banner">
            <span><strong>Two minutes, much better verdicts.</strong> Tell WTF This what you like, so it know what you really use.</span>
            <Link className="btn sm" href="/app/profile">Fill in profile</Link>
          </div>
        )}
        {noModel && (
          <div className="banner soft">
            <span><strong>Add an AI key first.</strong> This server has no shared model, so bring your own (Anthropic, OpenAI, Google or Ollama).</span>
            <Link className="btn sm" href="/app/settings">Settings</Link>
          </div>
        )}
        <Capture currency={settings.currency} beneficiary={beneficiaryLabel(settings)} />
      </main>
    </>
  );
}
