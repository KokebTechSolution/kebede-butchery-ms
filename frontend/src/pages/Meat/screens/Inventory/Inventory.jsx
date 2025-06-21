import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useInventory } from '../../hooks/useInventory';

const getStatusColor = (status) => {
  switch (status) {
    case 'enough':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'low':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'out':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'enough':
      return 'In Stock';
    case 'low':
      return 'Running Low';
    case 'critical':
      return 'Critically Low';
    case 'out':
      return 'Out of Stock';
    default:
      return 'Unknown';
  }
};

export const Inventory = () => {
  const { inventory, getLowStockItems } = useInventory();
  const lowStockItems = getLowStockItems();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111416] mb-2">Inventory Management</h1>
        <p className="text-[#6b7582]">Monitor your food inventory levels</p>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-3">
              {lowStockItems.length} item(s) need attention:
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <span
                  key={item.id}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Food Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e8ea]">
                  <th className="text-left py-3 px-4 font-semibold text-[#111416]">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#111416]">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#111416]">Remaining Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#111416]">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className="border-b border-[#f2f2f4] hover:bg-[#f8f9fa]">
                    <td className="py-4 px-4 font-medium text-[#111416]">{item.name}</td>
                    <td className="py-4 px-4 text-[#6b7582] capitalize">{item.type}</td>
                    <td className="py-4 px-4 text-[#111416]">
                      {item.remainingQuantity} {item.unit}
                      <span className="text-[#6b7582] text-sm ml-1">
                        / {item.maxQuantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};