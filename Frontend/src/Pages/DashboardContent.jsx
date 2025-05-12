import React from 'react';
import { Coffee, Users, Clock, TrendingUp } from 'lucide-react';

const DashboardContent = () => {
  // Example data - replace with real data from your backend
  const stats = [
    {
      title: 'Total Orders',
      value: '156',
      change: '+12%',
      icon: Coffee,
      color: 'bg-amber-500',
    },
    {
      title: 'Active Staff',
      value: '8',
      change: '+2',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Average Wait Time',
      value: '15m',
      change: '-2m',
      icon: Clock,
      color: 'bg-green-500',
    },
    {
      title: 'Revenue Today',
      value: '$1,234',
      change: '+8%',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-xs sm:text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Stats Grid - improved responsive layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <span
                className={`text-xs sm:text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-2">from last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity - improved for mobile */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h2>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 hover:bg-gray-50 rounded-lg">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0"> {/* Added min-width to prevent text overflow */}
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">New order #1234</p>
                <p className="text-xs sm:text-sm text-gray-500">2 items • $24.50</p>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">2m ago</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - improved for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button className="p-3 sm:p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-left">
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mb-1 sm:mb-2" />
              <p className="text-sm sm:text-base font-medium text-gray-900 truncate">New Order</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Create a new order</p>
            </button>
            <button className="p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mb-1 sm:mb-2" />
              <p className="text-sm sm:text-base font-medium text-gray-900 truncate">Staff Schedule</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">View staff schedule</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Today's Special</h2>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-amber-100 flex items-center justify-center">
              <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-medium text-gray-900">Caramel Macchiato</p>
              <p className="text-xs sm:text-sm text-gray-500">20% off today only</p>
              <p className="text-base sm:text-lg font-semibold text-amber-600 mt-1">$4.99</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;