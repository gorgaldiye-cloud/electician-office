import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { repository } from '../../data';
import { Users, Phone, MapPin, Calendar, Search } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const { language, t, formatDate } = useLanguage();
  const bookings = repository.getBookings();
  const [search, setSearch] = useState('');

  // Group bookings by normalized phone
  const customerMap = new Map<string, { name: string; phone: string; address: string; bookingsCount: number; lastDate: string }>();

  bookings.forEach((b) => {
    const key = b.customerPhone;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: b.customerName,
        phone: b.customerPhone,
        address: `${b.addressLine}, ${b.areaName}, ${b.city}`,
        bookingsCount: 1,
        lastDate: b.createdAt,
      });
    } else {
      const existing = customerMap.get(key)!;
      existing.bookingsCount += 1;
      if (new Date(b.createdAt) > new Date(existing.lastDate)) {
        existing.lastDate = b.createdAt;
      }
    }
  });

  const customersList = Array.from(customerMap.values()).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {t.admin.customers}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'رجسٹرڈ گاہکوں کی فہرست، موبائل نمبر اور اپائنٹمنٹ ہسٹری'
              : 'Customer records generated via booking submissions and phone deduplication.'}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute start-3 top-2.5 text-[#5B6572]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-[#D5DBE1] bg-white text-xs outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-neutral-50 border-b border-[#EEF1F4] text-[#5B6572] font-semibold">
            <tr>
              <th className="py-3.5 px-4 text-start">Customer Name</th>
              <th className="py-3.5 px-4 text-start">Phone (E.164)</th>
              <th className="py-3.5 px-4 text-start">Default Address Area</th>
              <th className="py-3.5 px-4 text-center">Bookings Count</th>
              <th className="py-3.5 px-4 text-end">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F4]">
            {customersList.map((c, i) => (
              <tr key={i} className="hover:bg-neutral-50/50">
                <td className="py-3.5 px-4 font-bold text-[#15191F]">{c.name}</td>
                <td className="py-3.5 px-4 font-mono text-[#5B6572]">{c.phone}</td>
                <td className="py-3.5 px-4 text-[#5B6572] max-w-xs truncate">{c.address}</td>
                <td className="py-3.5 px-4 text-center font-bold font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-[#EEF1F4] text-[#15191F]">
                    {c.bookingsCount}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-end text-[#5B6572]">{formatDate(c.lastDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
