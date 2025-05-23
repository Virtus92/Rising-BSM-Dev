/**
 * Automation Feature Module
 * 
 * Public exports for the automation feature
 */

// Core services and clients
export * from './lib';

// API models
export * from './api/models';

// Components
export { AutomationDashboard } from './components/AutomationDashboard';
export { WebhookForm } from './components/WebhookForm';
export { ScheduleForm } from './components/ScheduleForm';
export { AutomationList } from './components/AutomationList';
export { ExecutionHistory } from './components/ExecutionHistory';

// Hooks
export * from './hooks';
