import { useState } from 'react';

const initialInventory = [
  {
    id: '1',
    name: 'Kurt',
    type: 'food',
    remainingQuantity: 15,
    maxQuantity: 50,
    unit: 'kg',
    status: 'low'
  },
  {
    id: '2',
    name: 'Shekla Tibs',
    type: 'food',
    remainingQuantity: 25,
    maxQuantity: 40,
    unit: 'kg',
    status: 'enough'
  },
  {
    id: '3',
    name: 'Dulet',
    type: 'food',
    remainingQuantity: 3,
    maxQuantity: 20,
    unit: 'kg',
    status: 'critical'
  },
  {
    id: '4',
    name: 'Kitfo',
    type: 'food',
    remainingQuantity: 0,
    maxQuantity: 30,
    unit: 'kg',
    status: 'out'
  },
  {
    id: '5',
    name: 'Beef Steak',
    type: 'food',
    remainingQuantity: 35,
    maxQuantity: 45,
    unit: 'kg',
    status: 'enough'
  },
  {
    id: '6',
    name: 'Lamb Chops',
    type: 'food',
    remainingQuantity: 8,
    maxQuantity: 25,
    unit: 'kg',
    status: 'low'
  }
];

const getStatus = (remaining, max) => {
  const percentage = (remaining / max) * 100;
  if (remaining === 0) return 'out';
  if (percentage <= 15) return 'critical';
  if (percentage <= 30) return 'low';
  return 'enough';
};

export const useInventory = () => {
  const [inventory, setInventory] = useState(
    initialInventory.map(item => ({
      ...item,
      status: getStatus(item.remainingQuantity, item.maxQuantity)
    }))
  );

  const updateInventory = (id, newQuantity) => {
    setInventory(prevInventory =>
      prevInventory.map(item =>
        item.id === id
          ? {
              ...item,
              remainingQuantity: newQuantity,
              status: getStatus(newQuantity, item.maxQuantity)
            }
          : item
      )
    );
  };

  const getLowStockItems = () => 
    inventory.filter(item => ['low', 'critical', 'out'].includes(item.status));

  return {
    inventory,
    updateInventory,
    getLowStockItems
  };
};