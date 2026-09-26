import { AppHeader } from '@/components/AppHeader';
import { NotConfigured } from '@/components/NotConfigured';
import { getProfile, publicProfile } from '@/lib/data';
import { pageUser } from '@/lib/page';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await pageUser('/app/profile');
  if (!user) return <><AppHeader current="/app/profile" /><NotConfigured /></>;
  const { profile, sensitiveConsentAt } = await getProfile(user.id);
  return (
    <>
      <AppHeader current="/app/profile" />
      <main className="wrap app-main">
        <h1 className="display page-title">You. Tell.</h1>
        <p className="prose muted" style={{ marginTop: 0 }}>Everything here is optional, encrypted before it touches the database, and used for one thing only: deciding whether you actually need the stuff you photograph. Share as much or as little as you like. You can export or delete it any time in Settings.</p>
        <ProfileForm initial={publicProfile(profile)} consented={!!sensitiveConsentAt} />
      </main>
    </>
  );
}
