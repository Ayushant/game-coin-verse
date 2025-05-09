
import React from 'react';
import { Card } from '@/components/ui/card';

interface NativeAdComponentProps {
  className?: string;
}

const NativeAdComponent: React.FC<NativeAdComponentProps> = ({ className = '' }) => {
  return (
    <Card className={`p-4 mb-4 ${className}`}>
      <div className="min-h-[250px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Native Advertisement Placeholder</p>
      </div>
    </Card>
  );
};

export default NativeAdComponent;
