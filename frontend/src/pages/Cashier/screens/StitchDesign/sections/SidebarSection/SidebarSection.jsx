import React, { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";

export const SidebarSection = () => {
  // Initial order data for the table with detailed items
  const initialOrders = [
    {
      waiterId: "W001",
      waiterName: "John Smith",
      table: "Table 5",
      items: [
        { name: "Cappuccino", quantity: 1, price: "$4.50" },
        { name: "Croissant", quantity: 1, price: "$3.50" }
      ],
      paymentOption: "Online"
    },
    {
      waiterId: "W002",
      waiterName: "Sarah Johnson",
      table: "Table 2",
      items: [
        { name: "Espresso", quantity: 2, price: "$3.00" },
        { name: "Latte", quantity: 1, price: "$4.00" },
        { name: "Chocolate Cake", quantity: 1, price: "$6.00" }
      ],
      paymentOption: "Cash"
    },
    {
      waiterId: "W003",
      waiterName: "Mike Davis",
      table: "Table 8",
      items: [
        { name: "Americano", quantity: 1, price: "$3.50" }
      ],
      paymentOption: "Online"
    },
    {
      waiterId: "W004",
      waiterName: "Emma Wilson",
      table: "Table 3",
      items: [
        { name: "Mocha", quantity: 2, price: "$5.00" },
        { name: "Blueberry Muffin", quantity: 1, price: "$4.50" },
        { name: "Tea", quantity: 1, price: "$3.00" },
        { name: "Sandwich", quantity: 1, price: "$8.50" }
      ],
      paymentOption: "Cash"
    },
    {
      waiterId: "W005",
      waiterName: "Alex Brown",
      table: "Table 1",
      items: [
        { name: "Cappuccino", quantity: 1, price: "$4.50" },
        { name: "Danish Pastry", quantity: 1, price: "$4.00" }
      ],
      paymentOption: "Online"
    },
  ];

  // State to manage orders and button click state
  const [orders, setOrders] = useState(initialOrders);
  const [clickedIndex, setClickedIndex] = useState(null);

  // Calculate the total amount for an order based on its items
  const calculateTotal = (items) => {
    return items
      .reduce((sum, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ""));
        return sum + item.quantity * price;
      }, 0)
      .toFixed(2);
  };

  // Handle Print Receipt click
  const handlePrintReceipt = (index, paymentOption) => {
    setClickedIndex(index);
    setTimeout(() => {
      setClickedIndex(null);
      setOrders((prev) => prev.filter((_, i) => i !== index));
    }, 300); // Button color change duration
  };

  return (
    <div className="max-w-[960px] flex-1 grow flex flex-col items-start">
      <div className="flex flex-col items-start pt-5 pb-3 px-4 w-full">
        <h2 className="font-bold text-[#161111] text-[22px] leading-7 [font-family:'Work_Sans',Helvetica]">
          Pending Orders
        </h2>
      </div>

      <div className="px-4 py-3 w-full">
        <Card className="border border-solid border-[#e2dddd] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-[160px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Waiter
                  </TableHead>
                  <TableHead className="w-[100px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Table
                  </TableHead>
                  <TableHead className="w-40 px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Items
                  </TableHead>
                  <TableHead className="w-[100px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Total
                  </TableHead>
                  <TableHead className="w-[120px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                    Payment Option
                  </TableHead>
                  <TableHead className="w-32 px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#82686b] text-sm">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow
                    key={order.waiterId}
                    className="border-t border-[#e5e8ea]"
                  >
                    <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#161111] text-sm align-top">
                      {order.waiterName}
                    </TableCell>
                    <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm align-top">
                      {order.table}
                    </TableCell>
                    <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm align-top">
                      <ul className="space-y-1">
                        {order.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm">
                            <span className="font-medium">{item.quantity}x</span> {item.name}
                            <span className="text-[#876363] ml-2">({item.price})</span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm align-top">
                      {`$${calculateTotal(order.items)}`}
                    </TableCell>
                    <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-xl align-top">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        order.paymentOption === 'Online' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {order.paymentOption}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top">
                      <button
                        className={`w-full rounded-lg px-4 py-2 font-bold text-sm transition-colors duration-200 [font-family:'Work_Sans',Helvetica] 
                          ${clickedIndex === index
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'}
                        `}
                        onClick={() => handlePrintReceipt(index, order.paymentOption)}
                      >
                        Print Receipt
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
