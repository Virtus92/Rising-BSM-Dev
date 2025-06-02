import { PluginInstallationComponent } from '@/features/plugins';

interface PluginInstallPageProps {
  params: Promise<{ id: string }>;
}

export default async function PluginInstallPage({ params }: PluginInstallPageProps) {
  const { id } = await params;
  
  return <PluginInstallationComponent pluginId={id} />;
}