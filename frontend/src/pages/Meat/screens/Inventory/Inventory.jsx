import React from 'react';
import { useTranslation } from 'react-i18next';
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

const getStatusText = (status, t) => {
  switch (status) {
    case 'enough':
      return t('in_stock');
    case 'low':
      return t('running_low');
    case 'critical':
      return t('critically_low');
    case 'out':
      return t('out_of_stock');
    default:
      return t('unknown');
  }
};

export const Inventory = () => {
  const { t } = useTranslation();
  const { inventory, getLowStockItems } = useInventory();
  const lowStockItems = getLowStockItems();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111416] mb-2">{t('inventory_management')}</h1>
        <p className="text-[#6b7582]">{t('monitor_food_inventory')}</p>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-800 text-lg">
                  {t('running_low')} ({lowStockItems.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {t('quantity')}: {item.quantity} {item.unit}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status, t)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_items')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('in_stock')} {t('items')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('running_low')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inventory.filter(item => item.status === 'low').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('items')} {t('running_low')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('critically_low')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventory.filter(item => item.status === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('items')} {t('critically_low')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('out_of_stock')}</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {inventory.filter(item => item.status === 'out').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('items')} {t('out_of_stock')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    {t('quantity')}: {item.quantity} {item.unit}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status, t)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};