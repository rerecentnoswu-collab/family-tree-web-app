import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'card' | 'avatar' | 'button';
  lines?: number;
  width?: string;
  height?: string;
}

export function Skeleton({ 
  className = '', 
  variant = 'default', 
  lines = 1,
  width = 'w-full',
  height = 'h-4'
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    default: `${baseClasses} ${height} ${width}`,
    text: `${baseClasses} h-4 w-3/4 mb-2`,
    card: `${baseClasses} h-32 w-full`,
    avatar: `${baseClasses} h-12 w-12 rounded-full`,
    button: `${baseClasses} h-10 w-20`
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className={variantClasses.text} />
        ))}
      </div>
    );
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`} />
  );
}

// Dashboard skeleton components
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Skeleton variant="text" className="mb-4" />
            <Skeleton variant="default" height="h-8" className="mb-2" />
            <Skeleton variant="text" width="w-2/3" />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Skeleton variant="text" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Skeleton variant="avatar" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" width="w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Family Tree skeleton
export function FamilyTreeSkeleton() {
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Controls Skeleton */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-3">
        <Skeleton variant="button" />
        <div className="flex gap-2">
          <Skeleton variant="button" width="w-8" />
          <Skeleton variant="button" width="w-8" />
          <Skeleton variant="button" width="w-8" />
        </div>
      </div>

      {/* Legend Skeleton */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <Skeleton variant="text" className="mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton variant="default" height="h-0.5" width="w-8" />
              <Skeleton variant="text" width="w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Panel Skeleton */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Skeleton variant="text" />
            <Skeleton variant="default" height="h-6" />
          </div>
          <div>
            <Skeleton variant="text" />
            <Skeleton variant="default" height="h-6" />
          </div>
        </div>
      </div>

      {/* Main Tree Area Skeleton */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <Skeleton variant="text" width="w-32" />
        </div>
      </div>
    </div>
  );
}

// Person Cards skeleton
export function PersonCardsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="mb-4" />
        <Skeleton variant="button" />
      </div>

      {/* Person Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton variant="avatar" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" width="w-3/4" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" />
              <Skeleton variant="text" width="w-2/3" />
              <Skeleton variant="text" width="w-1/2" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton variant="button" width="w-16" />
              <Skeleton variant="button" width="w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <Skeleton variant="text" className="mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <Skeleton variant="text" className="mb-2" />
            <Skeleton variant="default" height="h-10" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}
