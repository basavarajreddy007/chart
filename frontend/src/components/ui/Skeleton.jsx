import React from 'react';

export const Skeleton = ({
  className = '',
  variant = 'rect',
  width,
  height,
  style,
  ...props
}) => {
  const baseClass = 'shimmer bg-theme-border rounded-md';
  const variantClasses = {
    text: 'h-4 w-full my-1',
    rect: 'w-full h-12',
    circle: 'rounded-full aspect-square',
  };

  const customStyle = {
    ...style,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
};

export default Skeleton;
