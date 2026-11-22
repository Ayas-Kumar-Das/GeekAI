export default function Card({ title, icon: Icon, value, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {(title || Icon || value !== undefined) && (
        <div className="flex items-start justify-between mb-2">
          <div>
            {title && <h3 className="text-sm font-medium text-gray-500">{title}</h3>}
            {value !== undefined && (
              <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
            )}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
