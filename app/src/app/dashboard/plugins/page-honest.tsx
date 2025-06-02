import { PluginManager } from '@/features/plugins';

export default function PluginsPage() {
  // Using PluginManager instead of PluginMarketplace for honest UI
  return <PluginManager />;
}
