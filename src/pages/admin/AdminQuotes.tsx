import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Quote, QuoteItem, QuoteStatus } from '../../types';
import {
  FileText,
  Plus,
  ArrowRight,
  Printer,
  CheckCircle2,
  X,
  FileCheck,
  Send,
} from 'lucide-react';

export const AdminQuotes: React.FC = () => {
  const { language, t, formatMoney, formatDate } = useLanguage();
  const { currentStaff } = useAuth();

  const [quotes, setQuotes] = useState<Quote[]>(() => repository.getQuotes());
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [validDays, setValidDays] = useState(14);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ type: 'labor' | 'material'; desc: string; qty: number; price: number }[]>([
    { type: 'material', desc: 'Heavy duty changeover contactor 40A', qty: 1, price: 3500 },
    { type: 'labor', desc: 'Panel busbar installation & testing', qty: 1, price: 2500 },
  ]);

  // Printable Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  const refresh = () => {
    setQuotes(repository.getQuotes());
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { type: 'material', desc: '', qty: 1, price: 500 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    const quoteItems: QuoteItem[] = items.map((it, idx) => ({
      id: `qi-${Date.now()}-${idx}`,
      itemType: it.type,
      description: it.desc || 'Electrical Item',
      quantity: it.qty,
      unitPrice: it.price,
      lineTotal: it.qty * it.price,
    }));

    const subtotal = quoteItems.reduce((acc, it) => acc + it.lineTotal, 0);
    const validUntilDate = new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0];

    repository.createQuote(
      {
        customerId: `cust-${Date.now()}`,
        customerName,
        customerPhone,
        customerAddress,
        status: 'sent',
        subtotal,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        total: subtotal,
        validUntil: validUntilDate,
        notes,
        items: quoteItems,
      },
      currentStaff.fullName
    );

    refresh();
    setShowCreateModal(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setNotes('');
  };

  const handleConvertToInvoice = (quoteId: string) => {
    const inv = repository.convertQuoteToInvoice(quoteId, currentStaff.fullName);
    if (inv) {
      alert(`Successfully generated Invoice ${inv.invoiceNumber} for PKR ${inv.total}!`);
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {language === 'ur' ? 'کوٹیشنز اور تخمینے (Quotes)' : 'Estimates & Commercial Quotations'}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'تجارتی و گھریلو منصوبوں کے لیے باضابطہ کوٹیشنز بنائیں اور ایک کلک پر انوائس میں تبدیل کریں۔'
              : 'Create formal quotes with itemized labor & materials. Convert approved quotes directly to invoices.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ur' ? 'نئی کوٹیشن بنائیں' : 'Create Quotation'}</span>
        </button>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-neutral-50 border-b border-[#EEF1F4] font-semibold text-[#5B6572]">
              <tr>
                <th className="py-3.5 px-4 text-start">Quote #</th>
                <th className="py-3.5 px-4 text-start">{t.common.customer}</th>
                <th className="py-3.5 px-4 text-start">Valid Until</th>
                <th className="py-3.5 px-4 text-end">Total PKR</th>
                <th className="py-3.5 px-4 text-start">{t.common.status}</th>
                <th className="py-3.5 px-4 text-end">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F4]">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5B6572]">
                    No quotations generated yet.
                  </td>
                </tr>
              ) : (
                quotes.map((quo) => (
                  <tr key={quo.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#15191F]">
                      {quo.quoteNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#15191F]">{quo.customerName}</div>
                      <div className="text-[11px] text-[#5B6572] font-mono">{quo.customerPhone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#5B6572]">{quo.validUntil}</td>

                    <td className="py-3.5 px-4 text-end font-mono font-bold text-[#15191F]">
                      {formatMoney(quo.total)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                          quo.status === 'approved'
                            ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                            : quo.status === 'sent'
                            ? 'bg-[#FFF4CC] text-[#B26A00]'
                            : 'bg-neutral-100 text-[#5B6572]'
                        }`}
                      >
                        {quo.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        {quo.status !== 'approved' && (
                          <button
                            onClick={() => handleConvertToInvoice(quo.id)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] transition-colors"
                            title="Convert to Invoice"
                          >
                            Convert to Invoice →
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedQuote(quo);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 rounded-md border border-[#D5DBE1] hover:bg-[#EEF1F4] text-[#15191F]"
                          title="View / Print Quote"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4] mb-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                Create Commercial Quotation
              </h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4 text-[#5B6572]" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    Customer / Company Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Crescent Mills Plaza"
                    className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+92 321 8877665"
                    className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Site Address / Location
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Plot 8, Sector 15, Korangi Industrial Area, Karachi"
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                />
              </div>

              {/* Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#15191F]">Quotation Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#B26A00] hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={it.type}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setItems((prev) => {
                            const copy = [...prev];
                            copy[idx].type = val;
                            return copy;
                          });
                        }}
                        className="p-2 rounded-lg border border-[#D5DBE1] text-xs bg-white"
                      >
                        <option value="material">Material</option>
                        <option value="labor">Labor</option>
                      </select>

                      <input
                        type="text"
                        value={it.desc}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) => {
                            const copy = [...prev];
                            copy[idx].desc = val;
                            return copy;
                          });
                        }}
                        placeholder="Item Description"
                        className="flex-1 p-2 rounded-lg border border-[#D5DBE1] text-xs"
                        required
                      />

                      <input
                        type="number"
                        value={it.price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setItems((prev) => {
                            const copy = [...prev];
                            copy[idx].price = val;
                            return copy;
                          });
                        }}
                        placeholder="Price"
                        className="w-24 p-2 rounded-lg border border-[#D5DBE1] text-xs font-mono"
                        required
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Scope & Validity Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Valid for 14 days. Excludes utility power company approval fees."
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#EEF1F4]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928]"
                >
                  Issue Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE QUOTE MODAL */}
      {showPrintModal && selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-5 end-5 p-2 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5 text-[#5B6572]" />
            </button>

            <div className="space-y-6">
              <div className="flex items-start justify-between border-b-2 border-[#15191F] pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded bg-[#15191F] text-[#FFC928] font-black flex items-center justify-center text-sm">
                      ABC
                    </div>
                    <span className="font-display font-black text-xl text-[#15191F]">
                      OFFICIAL QUOTATION
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6572]">
                    ABC Electrician Services · Engineering & Contracting Division
                  </p>
                </div>

                <div className="text-end">
                  <span className="text-xl font-black text-[#15191F] font-mono block">
                    {selectedQuote.quoteNumber}
                  </span>
                  <span className="text-xs text-[#5B6572] block">
                    Valid Until: {selectedQuote.validUntil}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#15191F] uppercase block mb-1">Prepared For:</span>
                <div className="font-bold text-sm text-[#15191F]">{selectedQuote.customerName}</div>
                <div className="font-mono text-[#5B6572]">{selectedQuote.customerPhone}</div>
                <div className="text-[#5B6572]">{selectedQuote.customerAddress}</div>
              </div>

              <table className="w-full text-xs text-start">
                <thead className="border-b border-[#D5DBE1] text-[#5B6572] uppercase font-bold">
                  <tr>
                    <th className="py-2 text-start">Description</th>
                    <th className="py-2 text-start">Type</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-end">Rate (PKR)</th>
                    <th className="py-2 text-end">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F4]">
                  {selectedQuote.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 font-medium text-[#15191F]">{it.description}</td>
                      <td className="py-2.5 text-[#5B6572] capitalize">{it.itemType}</td>
                      <td className="py-2.5 text-center font-mono">{it.quantity}</td>
                      <td className="py-2.5 text-end font-mono">{formatMoney(it.unitPrice)}</td>
                      <td className="py-2.5 text-end font-mono font-bold">{formatMoney(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#15191F] font-bold">
                  <tr>
                    <td colSpan={4} className="py-3 text-end text-sm">ESTIMATED TOTAL:</td>
                    <td className="py-3 text-end font-mono text-base text-[#15191F]">
                      {formatMoney(selectedQuote.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {selectedQuote.notes && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-[#EEF1F4] text-xs text-[#5B6572]">
                  <strong>Scope Notes:</strong> {selectedQuote.notes}
                </div>
              )}

              <div className="pt-4 border-t border-[#EEF1F4] flex items-center justify-between text-xs">
                <button
                  onClick={() => handleConvertToInvoice(selectedQuote.id)}
                  className="px-4 py-2 rounded-lg font-bold bg-[#1E8E5A] text-white hover:bg-[#167046]"
                >
                  Approve & Convert to Invoice
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg font-bold bg-[#15191F] text-[#FFC928]"
                >
                  Print Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
