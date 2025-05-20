'use client';

import React from 'react';

/**
 * Simple error boundary as a placeholder
 */
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  render() {
    return this.props.children;
  }
}

export { ErrorBoundary };

