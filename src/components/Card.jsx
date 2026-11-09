import React from 'react';

export const Card = ({ title, subtitle, icon: Icon, action, children, className = '', headerClassName = '' }) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle || action) && (
        <div className={`card-header ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="card-title">
                {Icon && <Icon size={18} className="text-primary" />}
                {title}
              </h3>
            )}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
