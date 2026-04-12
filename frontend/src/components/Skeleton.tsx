import { motion } from 'motion/react'

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  className?: string
}

/**
 * Skeleton component for loading states
 * Follows FinCouple design system with subtle animations
 */
export function Skeleton({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}: SkeletonProps) {
  const baseClasses = 'bg-white/5 relative overflow-hidden'
  
  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    rounded: 'rounded-2xl',
  }

  const style: React.CSSProperties = {}
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5, 
          ease: 'easeInOut',
          delay: Math.random() * 0.5 
        }}
      />
    </div>
  )
}

/**
 * Profile header skeleton - matches the profile card layout
 */
export function ProfileSkeleton() {
  return (
    <div className="p-6 bg-surface rounded-[32px] border border-white/5 space-y-6">
      <div className="text-center space-y-4">
        {/* Avatar */}
        <div className="relative w-20 h-20 mx-auto">
          <Skeleton variant="circular" width={80} height={80} />
        </div>
        
        {/* Name */}
        <Skeleton variant="text" width={200} height={32} className="mx-auto" />
        
        {/* Email */}
        <Skeleton variant="text" width={180} height={20} className="mx-auto" />
        
        {/* Couple status */}
        <Skeleton variant="text" width={140} height={16} className="mx-auto mt-2" />
      </div>
    </div>
  )
}

/**
 * Preferences section skeleton
 */
export function PreferencesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width={120} height={12} className="px-2" />
      <div className="p-6 bg-surface rounded-[32px] border border-white/5 space-y-6">
        {/* Theme label */}
        <div className="space-y-3">
          <Skeleton variant="text" width={60} height={14} />
          <div className="flex gap-2">
            <Skeleton variant="rounded" className="flex-1" height={48} />
            <Skeleton variant="rounded" className="flex-1" height={48} />
          </div>
        </div>
        
        {/* Language label */}
        <div className="space-y-3">
          <Skeleton variant="text" width={70} height={14} />
          <Skeleton variant="rounded" width="100%" height={56} />
        </div>
        
        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <Skeleton variant="text" width={100} height={16} />
            <Skeleton variant="text" width={140} height={12} />
          </div>
          <Skeleton variant="circular" width={56} height={32} />
        </div>
        
        {/* Save button */}
        <Skeleton variant="rounded" width="100%" height={56} />
      </div>
    </div>
  )
}

/**
 * Security section skeleton
 */
export function SecuritySectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width={100} height={12} className="px-2" />
      <div className="space-y-2">
        <Skeleton variant="rounded" width="100%" height={64} />
        <Skeleton variant="rounded" width="100%" height={64} />
      </div>
    </div>
  )
}

/**
 * Data section skeleton
 */
export function DataSectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width={60} height={12} className="px-2" />
      <Skeleton variant="rounded" width="100%" height={64} />
    </div>
  )
}

/**
 * Danger zone skeleton
 */
export function DangerZoneSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width={120} height={12} className="px-2" />
      <Skeleton variant="rounded" width="100%" height={64} />
      <Skeleton variant="rounded" width="100%" height={64} />
    </div>
  )
}

/**
 * Complete settings screen skeleton
 */
export function SettingsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-32 px-6 space-y-8"
    >
      <ProfileSkeleton />
      <PreferencesSkeleton />
      <SecuritySectionSkeleton />
      <DataSectionSkeleton />
      <DangerZoneSkeleton />
    </motion.div>
  )
}
