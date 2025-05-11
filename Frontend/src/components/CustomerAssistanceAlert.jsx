import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Bell } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const CustomerAssistanceAlert = () => {
  const [alerts, setAlerts] = useState([]);
  const [processedAlertIds, setProcessedAlertIds] = useState(new Set());
  const { socket, connected } = useSocket();

  // Play alert sound
  const playAlertSound = () => {
    try {
      const alertSound = new Audio('/alert.mp3');
      alertSound.play().catch(e => console.error('Error playing sound:', e));
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  };

  useEffect(() => {
    if (!socket || !connected) return;

    console.log('CustomerAssistanceAlert: Setting up listener');
    
    // Explicitly join the kitchen room to ensure we receive alerts
    socket.emit('joinKitchen');

    // Listen for customer assistance alerts
    const handleCustomerAssistanceAlert = (alertData) => {
      console.log('CustomerAssistanceAlert: Received alert', alertData);
      
      // Check if we've already processed this alert (using alertId or creating a composite key)
      const alertId = alertData.alertId || `${alertData.orderId}_${alertData.timestamp}`;
      
      // Skip if we've already processed this alert
      if (processedAlertIds.has(alertId)) {
        console.log('CustomerAssistanceAlert: Skipping duplicate alert', alertId);
        return;
      }
      
      // Mark this alert as processed
      setProcessedAlertIds(prev => {
        const newSet = new Set(prev);
        newSet.add(alertId);
        return newSet;
      });
      
      // Add the alert to our state
      setAlerts(prev => [alertData, ...prev]);
      
      // Play alert sound
      playAlertSound();
      
      // Show toast notification
      toast.info(
        <div className="flex items-center gap-2">
          <Bell className="text-red-500" size={20} />
          <div>
            <p className="font-bold">{alertData.customerName} needs assistance</p>
            <p className="text-sm">Table: {alertData.tableNumber}</p>
          </div>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          draggable: true,
          closeButton: true
        }
      );
    };

    socket.on('customerAssistanceAlert', handleCustomerAssistanceAlert);

    return () => {
      socket.off('customerAssistanceAlert', handleCustomerAssistanceAlert);
    };
  }, [socket, connected, processedAlertIds]);

  // If there are no alerts, don't render anything
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Bell className="text-red-500 mr-2" size={20} />
            Customer Assistance
          </h3>
          <button 
            onClick={() => setAlerts([])}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {alerts.map((alert, index) => (
            <div 
              key={`${alert.orderId}-${index}`}
              className="border-b border-gray-100 py-2 last:border-0"
            >
              <div className="flex justify-between">
                <p className="font-medium">{alert.customerName}</p>
                <p className="text-sm text-gray-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <p className="text-sm">Table: {alert.tableNumber}</p>
              <p className="text-sm text-gray-600">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerAssistanceAlert;
