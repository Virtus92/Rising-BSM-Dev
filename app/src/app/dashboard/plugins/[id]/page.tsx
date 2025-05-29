import { PluginDetail } from '@/features/plugins';

interface PluginDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PluginDetailPage({ params }: PluginDetailPageProps) {
  const { id } = await params;
  
  return <PluginDetail pluginId={id} />;
}