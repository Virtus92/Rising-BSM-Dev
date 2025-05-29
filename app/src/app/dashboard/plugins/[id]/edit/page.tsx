import { PluginForm } from '@/features/plugins';

interface PluginEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PluginEditPage({ params }: PluginEditPageProps) {
  const { id } = await params;
  
  return <PluginForm pluginId={id} mode="edit" />;
}