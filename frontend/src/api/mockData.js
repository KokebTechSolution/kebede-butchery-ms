// Mock data for standalone frontend deployment
export const mockUsers = [
  {
    id: 1,
    username: 'waiter1',
    first_name: 'John',
    last_name: 'Doe',
    role: 'waiter',
    phone_number: '+1234567890',
    branch: { id: 1, name: 'Main Branch' }
  },
  {
    id: 2,
    username: 'bartender1',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'bartender',
    phone_number: '+1234567891',
    branch: { id: 1, name: 'Main Branch' }
  },
  {
    id: 3,
    username: 'meat1',
    first_name: 'Mike',
    last_name: 'Johnson',
    role: 'meat',
    phone_number: '+1234567892',
    branch: { id: 1, name: 'Main Branch' }
  },
  {
    id: 4,
    username: 'cashier1',
    first_name: 'Sarah',
    last_name: 'Wilson',
    role: 'cashier',
    phone_number: '+1234567893',
    branch: { id: 1, name: 'Main Branch' }
  },
  {
    id: 5,
    username: 'manager1',
    first_name: 'David',
    last_name: 'Brown',
    role: 'manager',
    phone_number: '+1234567894',
    branch: { id: 1, name: 'Main Branch' }
  },
  {
    id: 6,
    username: 'owner1',
    first_name: 'Lisa',
    last_name: 'Davis',
    role: 'owner',
    phone_number: '+1234567895',
    branch: { id: 1, name: 'Main Branch' }
  }
];

export const mockOrders = [
  {
    id: 1,
    order_number: '20250730-01',
    table_number: 1,
    created_by: 1,
    waiterName: 'John Doe',
    status: 'pending',
    cashier_status: 'pending',
    food_status: 'pending',
    beverage_status: 'pending',
    total_money: 600.00,
    created_at: '2025-07-30T10:00:00Z',
    items: [
      { id: 1, name: 'Burger', quantity: 2, price: 15.00, status: 'pending' },
      { id: 2, name: 'Fries', quantity: 1, price: 8.00, status: 'pending' }
    ]
  },
  {
    id: 2,
    order_number: '20250730-02',
    table_number: 2,
    created_by: 1,
    waiterName: 'John Doe',
    status: 'completed',
    cashier_status: 'printed',
    food_status: 'completed',
    beverage_status: 'completed',
    total_money: 1200.00,
    created_at: '2025-07-30T09:30:00Z',
    items: [
      { id: 3, name: 'Pizza', quantity: 1, price: 25.00, status: 'accepted' },
      { id: 4, name: 'Coke', quantity: 2, price: 3.00, status: 'accepted' }
    ]
  }
];

export const mockProducts = [
  { id: 1, name: 'Burger', price: 15.00, category: 'food', stock: 50 },
  { id: 2, name: 'Pizza', price: 25.00, category: 'food', stock: 30 },
  { id: 3, name: 'Fries', price: 8.00, category: 'food', stock: 100 },
  { id: 4, name: 'Coke', price: 3.00, category: 'beverage', stock: 200 },
  { id: 5, name: 'Beer', price: 5.00, category: 'beverage', stock: 150 }
];

export const mockTables = [
  { id: 1, number: 1, status: 'occupied' },
  { id: 2, number: 2, status: 'available' },
  { id: 3, number: 3, status: 'available' },
  { id: 4, number: 4, status: 'available' }
];

export const mockBranches = [
  { id: 1, name: 'Main Branch', address: '123 Main St' },
  { id: 2, name: 'Downtown Branch', address: '456 Downtown Ave' }
];

// Mock API functions
export const mockApi = {
  // Auth
  login: async (credentials) => {
    const user = mockUsers.find(u => u.username === credentials.username);
    if (user && credentials.password === '12345678') {
      return { user, token: 'mock-token-123' };
    }
    throw new Error('Invalid credentials');
  },

  // Orders
  getOrders: async (params = {}) => {
    let filteredOrders = [...mockOrders];
    
    if (params.waiter) {
      filteredOrders = filteredOrders.filter(order => order.created_by == params.waiter);
    }
    
    if (params.cashier_status) {
      filteredOrders = filteredOrders.filter(order => order.cashier_status === params.cashier_status);
    }
    
    if (params.date) {
      filteredOrders = filteredOrders.filter(order => 
        order.created_at.startsWith(params.date)
      );
    }
    
    return filteredOrders;
  },

  updateOrderItemStatus: async (itemId, status) => {
    const order = mockOrders.find(o => o.items.some(item => item.id == itemId));
    if (order) {
      const item = order.items.find(item => item.id == itemId);
      if (item) {
        item.status = status;
        return item;
      }
    }
    throw new Error('Item not found');
  },

  // Tables
  getTables: async () => mockTables,
  addTable: async (tableData) => {
    const newTable = {
      id: mockTables.length + 1,
      number: tableData.number,
      status: 'available'
    };
    mockTables.push(newTable);
    return newTable;
  },

  // Products
  getProducts: async () => mockProducts,

  // Users
  getUsers: async () => mockUsers,
  updateUser: async (userId, userData) => {
    const user = mockUsers.find(u => u.id == userId);
    if (user) {
      Object.assign(user, userData);
      return user;
    }
    throw new Error('User not found');
  },

  // Stats
  getWaiterStats: async (waiterId) => ({
    total_orders: 15,
    total_sales: 2500.00,
    average_rating: 4.5,
    active_tables: 3
  }),

  // Branches
  getBranches: async () => mockBranches
}; 