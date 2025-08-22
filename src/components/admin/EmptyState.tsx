"use client";

import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  type: 'no-data' | 'error' | 'loading' | 'success';
  title: string;
  message: string;
  icon?: any;
}

export default function EmptyState({ type, title, message, icon }: EmptyStateProps) {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'no-data':
        return InformationCircleIcon;
      case 'error':
        return ExclamationTriangleIcon;
      case 'success':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'no-data':
        return '#6b7280';
      case 'error':
        return '#ef4444';
      case 'success':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const Icon = getIcon();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      textAlign: 'center',
      minHeight: '300px'
    }}>
      <div style={{
        width: '4rem',
        height: '4rem',
        borderRadius: '50%',
        background: `${getIconColor()}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <Icon style={{ 
          width: '2rem', 
          height: '2rem', 
          color: getIconColor() 
        }} />
      </div>
      
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#1e293b',
        margin: '0 0 0.5rem 0'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '1rem',
        color: '#64748b',
        margin: 0,
        maxWidth: '400px',
        lineHeight: 1.5
      }}>
        {message}
      </p>
    </div>
  );
}
