import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../data';
import { Invoice, InvoiceItem, PaymentMethod } from '../../types';
import {
  FileText,
  Plus,
  DollarSign,
  Printer,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  ShieldCheck,
} from 'lucide-react';

export const AdminInvoices: React.FC = () => {
  const { language, t, formatMoney, formatDate } = useLanguage();
  const { currentStaff } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>(() => repository.getInvoices());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<{ type: 'labor' | 'material'; desc: string; qty: number; price: number }[]>([
    { type: 'labor', desc: 'Electrical diagnostic & fault repair', qty: 1, price: 2000 },
  ]);

  // Record Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Print Preview Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  const refresh = () => {
    setInvoices(repository.getInvoices());
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { type: 'material', desc: '', qty: 1, price: 500 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || isSaving) return;

    const invoiceItems: InvoiceItem[] = items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      itemType: it.type,
      description: it.desc || 'Electrical Service',
      quantity: it.qty,
      unitPrice: it.price,
      lineTotal: it.qty * it.price,
    }));
    const subtotal = invoiceItems.reduce((acc, it) => acc + it.lineTotal, 0);

    setIsSaving(true);
    setActionError(null);
    try {
      await repository.createOnlineInvoice(
        {
          customerId: '',
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          status: 'issued',
          subtotal,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: subtotal,
          amountPaid: 0,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          items: invoiceItems,
          payments: [],
        },
        currentStaff.fullName
      );

      refresh();
      setShowCreateModal(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The invoice could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || isSaving) return;
    const amountNum = parseFloat(paymentAmount) || 0;
    if (amountNum <= 0) {
      setActionError('Enter a payment amount greater than zero.');
      return;
    }

    setIsSaving(true);
    setActionError(null);
    try {
      await repository.recordOnlinePayment(
        selectedInvoice.id,
        {
          invoiceId: selectedInvoice.id,
          amount: amountNum,
          method: paymentMethod,
          recordedBy: currentStaff.fullName,
          notes: paymentNotes,
        },
        currentStaff.fullName
      );

      refresh();
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Payment could not be recorded.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {/* Title & Create CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#15191F]">
            {t.admin.invoices}
          </h1>
          <p className="text-xs text-[#5B6572]">
            {language === 'ur'
              ? 'باضابطہ کوٹیشنز، رسیدوں کا اجراء اور وصول شدہ ادائیگیوں کا انتظام'
              : 'Generate gapless sequential invoices (INV-YYYY-NNNN) with labor and materials breakdown.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.createInvoice}</span>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#D5DBE1] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-neutral-50 border-b border-[#EEF1F4] font-semibold text-[#5B6572]">
              <tr>
                <th className="py-3.5 px-4 text-start">Invoice #</th>
                <th className="py-3.5 px-4 text-start">{t.common.customer}</th>
                <th className="py-3.5 px-4 text-start">{t.common.date}</th>
                <th className="py-3.5 px-4 text-end">Total PKR</th>
                <th className="py-3.5 px-4 text-end">Paid PKR</th>
                <th className="py-3.5 px-4 text-start">{t.common.status}</th>
                <th className="py-3.5 px-4 text-end">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F4]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5B6572]">
                    No invoices recorded yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#15191F]">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#15191F]">{inv.customerName}</div>
                      <div className="text-[11px] text-[#5B6572] font-mono">{inv.customerPhone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#5B6572]">{inv.issueDate}</td>

                    <td className="py-3.5 px-4 text-end font-mono font-bold text-[#15191F]">
                      {formatMoney(inv.total)}
                    </td>

                    <td className="py-3.5 px-4 text-end font-mono font-semibold text-[#1E8E5A]">
                      {formatMoney(inv.amountPaid)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          inv.status === 'paid'
                            ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                            : inv.status === 'partially_paid'
                            ? 'bg-[#FFF4CC] text-[#B26A00]'
                            : 'bg-neutral-100 text-[#5B6572]'
                        }`}
                      >
                        {inv.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentAmount(String(inv.total - inv.amountPaid));
                              setShowPaymentModal(true);
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#1E8E5A] text-white hover:bg-[#167046] transition-colors"
                          >
                            + Pay
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 rounded-md border border-[#D5DBE1] hover:bg-[#EEF1F4] text-[#15191F]"
                          title="Print Official Invoice"
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

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F4] mb-4">
              <h3 className="font-bold text-lg text-[#15191F]">
                {t.admin.createInvoice}
              </h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4 text-[#5B6572]" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#15191F] block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Asim Raza"
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
                    placeholder="+92 300 1234567"
                    className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Customer Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Plot 12-B, DHA Phase 5, Karachi"
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                />
              </div>

              {/* Line Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#15191F]">Itemized Line Items</span>
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
                        <option value="labor">Labor</option>
                        <option value="material">Material</option>
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
                        placeholder="Description (e.g. 32A MCB Breaker)"
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
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#15191F] text-[#FFC928]"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg text-[#15191F] mb-1">
              Record Payment ({selectedInvoice.invoiceNumber})
            </h3>
            <p className="text-xs text-[#5B6572] mb-4">
              Total: {formatMoney(selectedInvoice.total)} · Remaining Balance:{' '}
              {formatMoney(selectedInvoice.total - selectedInvoice.amountPaid)}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Payment Amount (PKR) *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-sm font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs bg-white"
                >
                  <option value="cash">Cash (On Site)</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="other">Other / Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#15191F] block mb-1">
                  Receipt Note (optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received cash by technician Khurram"
                  className="w-full p-2.5 rounded-lg border border-[#D5DBE1] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#EEF1F4] text-[#15191F]"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#1E8E5A] text-white"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE INVOICE MODAL */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-5 end-5 p-2 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5 text-[#5B6572]" />
            </button>

            {/* Printable Content */}
            <div className="space-y-6">
              {/* Header Lockup */}
              <div className="flex items-start justify-between border-b-2 border-[#15191F] pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded bg-[#15191F] text-[#FFC928] font-black flex items-center justify-center text-sm">
                      ABC
                    </div>
                    <span className="font-display font-black text-xl text-[#15191F]">
                      ABC ELECTRICIAN SERVICES
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6572]">
                    Certified Electrical Engineering & Maintenance · Karachi, Pakistan
                  </p>
                  <p className="text-[11px] text-[#5B6572]">
                    Emergency Dispatch: +92 300 1234567 | info@abcelectrician.pk
                  </p>
                </div>

                <div className="text-end">
                  <span className="text-xl font-black text-[#15191F] font-mono block">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <span className="text-xs text-[#5B6572] block">
                    Date: {selectedInvoice.issueDate}
                  </span>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedInvoice.status === 'paid'
                        ? 'bg-[#1E8E5A]/15 text-[#1E8E5A]'
                        : 'bg-[#FFF4CC] text-[#B26A00]'
                    }`}
                  >
                    STATUS: {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-neutral-50 p-4 rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#15191F] uppercase block mb-1">Billed To:</span>
                <div className="font-bold text-sm text-[#15191F]">{selectedInvoice.customerName}</div>
                <div className="font-mono text-[#5B6572]">{selectedInvoice.customerPhone}</div>
                <div className="text-[#5B6572]">{selectedInvoice.customerAddress}</div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-start">
                <thead className="border-b border-[#D5DBE1] text-[#5B6572] uppercase font-bold">
                  <tr>
                    <th className="py-2 text-start">Description</th>
                    <th className="py-2 text-start">Type</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-end">Rate (PKR)</th>
                    <th className="py-2 text-end">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F4]">
                  {selectedInvoice.items.map((it) => (
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
                    <td colSpan={4} className="py-3 text-end text-sm">TOTAL AMOUNT:</td>
                    <td className="py-3 text-end font-mono text-base text-[#15191F]">
                      {formatMoney(selectedInvoice.total)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-1 text-end text-xs text-[#1E8E5A]">AMOUNT PAID:</td>
                    <td className="py-1 text-end font-mono text-xs text-[#1E8E5A]">
                      {formatMoney(selectedInvoice.amountPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Warranty Stamp */}
              <div className="pt-4 border-t border-[#EEF1F4] flex items-center justify-between text-xs text-[#5B6572]">
                <div className="flex items-center gap-2 text-[#1E8E5A] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>30-Day Workmanship Warranty Included</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-lg font-bold bg-[#15191F] text-[#FFC928] hover:bg-[#2A313B] flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
