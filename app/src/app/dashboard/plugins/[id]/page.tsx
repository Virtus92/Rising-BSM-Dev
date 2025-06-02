import { PluginDetail } from '@/features/plugins';

interface PluginDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PluginDetailPage({ params }: PluginDetailPageProps) {
  const { id } = await params;
  
  // Convert string ID to number for the component
  const pluginId = parseInt(id, 10);
  
  if (isNaN(pluginId)) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Invalid plugin ID
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The plugin ID must be a valid number.
        </p>
      </div>
    );
  }
  
  return <PluginDetail pluginId={pluginId} />;
}