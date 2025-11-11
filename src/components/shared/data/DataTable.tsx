import { Card } from '@/components/shared/ui/Card';
import React from 'react';

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {children}
          </tbody>
        </table>
      </div>
    </Card>
  );
}