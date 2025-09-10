'use client';

import { useState, useEffect } from 'react';
import { extensionSyncService, ExtensionStatus } from '@/lib/extension-service';

export function ExtensionStatusDiagnostic() {
  const [status, setStatus] = useState<ExtensionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const extensionStatus = await extensionSyncService.getConnectionStatus();
        setStatus(extensionStatus);
      } catch (error) {
        console.error('Failed to check extension status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <p>Checking extension status...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <p className="text-red-700">Failed to check extension status</p>
      </div>
    );
  }

  const getStatusColor = () => {
    if (status.isConnected) return 'bg-green-50 border-green-200';
    if (!status.browserSupported) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusIcon = () => {
    if (status.isConnected) return '✅';
    if (!status.browserSupported) return '❌';
    return '⚠️';
  };

  return (
    <div className={`p-4 border rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <h3 className="font-semibold">
          Extension Status: {status.isConnected ? 'Connected' : 'Not Connected'}
        </h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Browser:</strong> {status.browserName} 
          {status.browserSupported ? ' (Supported)' : ' (Not Supported)'}
        </div>
        
        <div>
          <strong>Extension Runtime:</strong> {status.hasExtensionRuntime ? 'Available' : 'Not Available'}
        </div>
        
        {status.errorMessage && (
          <div className="text-red-700">
            <strong>Error:</strong> {status.errorMessage}
          </div>
        )}
        
        {status.suggestedAction && (
          <div className="text-blue-700">
            <strong>Suggested Action:</strong> {status.suggestedAction}
          </div>
        )}
        
        {status.isConnected && (
          <div className="text-green-700 font-medium">
            🎉 Extension is working properly!
          </div>
        )}
      </div>
    </div>
  );
}