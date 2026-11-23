import DashboardShell from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const mapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  return <DashboardShell initialMapsApiKey={mapsApiKey} />;
}
