import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

export const OrderListSection = ({ activeTab, onTabChange }) => {
  const tabOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="flex flex-col w-full pb-3">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="flex h-auto w-full justify-start gap-8 px-4 bg-transparent border-b border-[#dde0e2]">
          {tabOptions.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`pt-4 pb-[13px] px-0 rounded-none border-b-[3px] border-[#e5e8ea] data-[state=active]:border-[#111416] data-[state=active]:shadow-none ${
                activeTab === tab.value
                  ? 'font-bold text-[#111416]'
                  : 'font-bold text-[#6b7582]'
              } [font-family:'Work_Sans',Helvetica] text-sm leading-[21px]`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};