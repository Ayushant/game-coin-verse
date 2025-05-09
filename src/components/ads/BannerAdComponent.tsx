
import React from 'react';
import { Card } from '@/components/ui/card';

interface BannerAdComponentProps {
  className?: string;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  className = '',
}) => {
  return (
    <Card className={`p-2 overflow-hidden ${className}`}>
      <div className="min-h-[90px] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-400 text-xs">Advertisement Placeholder</p>
      </div>
    </Card>
  );
};

export default BannerAdComponent;
