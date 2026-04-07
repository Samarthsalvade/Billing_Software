import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, FileText, Download, Printer, X, Edit2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const BillingSoftware = () => {
  const [firmName, setFirmName] = useState('Your Firm Name');
  const [firmLogo, setFirmLogo] = useState('');
  const [products, setProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [otherCharges, setOtherCharges] = useState([]);
  const [showOtherCharges, setShowOtherCharges] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [editingFirm, setEditingFirm] = useState(false);
  const [tempFirmName, setTempFirmName] = useState('Your Firm Name');
  const [tempFirmLogo, setTempFirmLogo] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', defaultPrice: '', unit: 'piece' });

  useEffect(() => {
    try {
      const n = localStorage.getItem('firm-name'); if (n) setFirmName(n);
      const l = localStorage.getItem('firm-logo'); if (l) setFirmLogo(l);
      const p = localStorage.getItem('products'); if (p) setProducts(JSON.parse(p));
    } catch (e) {}
  }, []);

  const saveFirmName = (v) => { try { localStorage.setItem('firm-name', v); } catch (e) {} };
  const saveFirmLogo = (v) => { try { localStorage.setItem('firm-logo', v); } catch (e) {} };
  const saveProducts = (v) => { try { localStorage.setItem('products', JSON.stringify(v)); } catch (e) {} };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.defaultPrice) return;
    const p = { id: Date.now(), ...newProduct, defaultPrice: parseFloat(newProduct.defaultPrice) };
    const updated = [...products, p];
    setProducts(updated); saveProducts(updated);
    setNewProduct({ name: '', defaultPrice: '', unit: 'piece' });
  };

  const deleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated); saveProducts(updated);
  };

  // FIX: Match by productId + unit so changing unit on one row
  // doesn't cause a new product to merge into the wrong row.
  const addBillItem = (product) => {
    const ex = billItems.find(
      i => i.productId === product.id && i.unit === product.unit
    );
    if (ex) {
      setBillItems(billItems.map(i =>
        i.id === ex.id ? { ...i, quantity: parseFloat(i.quantity) + 1 } : i
      ));
    } else {
      setBillItems([...billItems, {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        unit: product.unit,
        price: product.defaultPrice,
        quantity: 1
      }]);
    }
  };

  const updateBillItem = (id, field, value) =>
    setBillItems(billItems.map(i => i.id === id ? { ...i, [field]: value } : i));

  const removeBillItem = (id) => setBillItems(billItems.filter(i => i.id !== id));

  // Other charges helpers
  const addOtherCharge = () => {
    setOtherCharges([...otherCharges, { id: Date.now(), label: '', amount: '' }]);
    setShowOtherCharges(true);
  };

  const updateOtherCharge = (id, field, value) =>
    setOtherCharges(otherCharges.map(c => c.id === id ? { ...c, [field]: value } : c));

  const removeOtherCharge = (id) =>
    setOtherCharges(otherCharges.filter(c => c.id !== id));

  const calcItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return item.unit === 'dozen' ? qty * 12 * price : qty * price;
  };

  const calcSubtotal = () => billItems.reduce((s, i) => s + calcItemTotal(i), 0);

  const calcOtherChargesTotal = () =>
    otherCharges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

  const calcTotal = () => calcSubtotal() + calcOtherChargesTotal();

  const buildHTML = (billNumber) => {
    const date = new Date().toLocaleDateString('en-IN');
    const subtotal = calcSubtotal();
    const otherTotal = calcOtherChargesTotal();
    const total = calcTotal();
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${billNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;padding:32px;color:#333}
    .header{text-align:center;margin-bottom:24px;border-bottom:2px solid #333;padding-bottom:16px}
    .logo{max-width:120px;max-height:70px;object-fit:contain;margin-bottom:12px}
    .firm-name{font-size:26px;font-weight:bold;color:#1a1a1a}
    .meta{display:flex;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:8px}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th,td{border:1px solid #ddd;padding:10px;text-align:left}
    th{background:#f8f9fa;font-weight:bold}
    .tr{text-align:right}
    .total-row{font-weight:bold;background:#f8f9fa}
    .grand-total{font-weight:bold;background:#e8f4e8;font-size:16px}
    .footer{margin-top:40px;text-align:center;font-size:12px;color:#888}
    @media print{body{padding:16px}}
  </style>
</head>
<body>
  <div class="header">
    ${firmLogo ? `<img src="${firmLogo}" alt="Logo" class="logo"><br>` : ''}
    <div class="firm-name">${firmName}</div>
  </div>
  <div class="meta">
    <div><strong>Invoice:</strong> ${billNumber}<br><strong>Date:</strong> ${date}</div>
    ${buyerName ? `<div><strong>Bill To:</strong><br>${buyerName}</div>` : ''}
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th>Unit</th><th class="tr">Qty</th><th class="tr">Rate</th><th class="tr">Amount</th></tr>
    </thead>
    <tbody>
      ${billItems.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.unit === 'piece' ? 'Piece' : item.unit === 'dozen' ? 'Dozen' : 'Kg'}</td>
        <td class="tr">${item.quantity}</td>
        <td class="tr">&#8377;${parseFloat(item.price).toFixed(2)}${item.unit === 'dozen' ? '/pc' : ''}</td>
        <td class="tr">&#8377;${calcItemTotal(item).toFixed(2)}</td>
      </tr>`).join('')}
      ${otherCharges.length > 0 ? `
      <tr><td colspan="5" style="background:#f8f9fa;font-weight:bold;padding:8px 10px;">Subtotal</td></tr>
      <tr class="total-row">
        <td colspan="4" class="tr">Items Subtotal</td>
        <td class="tr">&#8377;${subtotal.toFixed(2)}</td>
      </tr>
      ${otherCharges.filter(c => c.label || c.amount).map(c => `
      <tr>
        <td colspan="4">${c.label || 'Other Charge'}</td>
        <td class="tr">&#8377;${(parseFloat(c.amount) || 0).toFixed(2)}</td>
      </tr>`).join('')}
      <tr class="grand-total">
        <td colspan="4" class="tr">Total Amount</td>
        <td class="tr">&#8377;${total.toFixed(2)}</td>
      </tr>
      ` : `
      <tr class="total-row">
        <td colspan="4" class="tr">Total Amount</td>
        <td class="tr">&#8377;${total.toFixed(2)}</td>
      </tr>`}
    </tbody>
  </table>
  <div class="footer">Thank you for your business!</div>
</body>
</html>`;
  };

  const shareInvoice = async () => {
    const billNumber = `INV-${Date.now()}`;
    const html = buildHTML(billNumber);
    const fileName = `Invoice-${billNumber}.html`;

    try {
      const encoded = btoa(
        encodeURIComponent(html).replace(/%([0-9A-F]{2})/g,
          (_, p1) => String.fromCharCode(parseInt(p1, 16)))
      );
      const result = await Filesystem.writeFile({
        path: fileName,
        data: encoded,
        directory: Directory.Cache,
      });
      await Share.share({
        title: `Invoice ${billNumber}`,
        url: result.uri,
        dialogTitle: 'Save or Share Invoice',
      });
    } catch (err) {
      // UNIMPLEMENTED = Simulator, use blob download fallback
      if (err?.code === 'UNIMPLEMENTED') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        alert(`Share failed: ${err?.message || JSON.stringify(err)}`);
      }
    }
  };

  const clearBill = () => {
    setBillItems([]);
    setOtherCharges([]);
    setBuyerName('');
    setShowOtherCharges(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Header with safe area fix */}
      <div
        className="bg-white shadow-md sticky top-0 z-40"
        style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {firmLogo && <img src={firmLogo} alt="Logo" className="h-10 w-10 object-contain" />}
            {editingFirm ? (
              <div className="flex items-center gap-2">
                <input
                  type="text" value={tempFirmName}
                  onChange={(e) => setTempFirmName(e.target.value)}
                  className="text-2xl font-bold border-b-2 border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => { setFirmName(tempFirmName); saveFirmName(tempFirmName); setEditingFirm(false); }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                >
                  <Save size={20} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-800">{firmName}</h1>
                <button
                  onClick={() => { setTempFirmName(firmName); setEditingFirm(true); }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit2 size={18} />
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProducts(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <FileText size={18} />
              Products
            </button>
            <button
              onClick={() => { setShowSettings(true); setTempFirmName(firmName); setTempFirmLogo(firmLogo); }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="max-w-7xl mx-auto px-4 py-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Products Panel */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Products</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(product => (
                <button
                  key={product.id} onClick={() => addBillItem(product)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition border border-gray-200 hover:border-indigo-300"
                >
                  <div className="font-medium text-gray-800">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    ₹{product.defaultPrice} / {product.unit === 'piece' ? 'piece' : product.unit === 'dozen' ? 'dozen' : 'kg'}
                  </div>
                </button>
              ))}
              {products.length === 0 && (
                <p className="text-gray-500 text-center py-8">No products added yet</p>
              )}
            </div>
          </div>

          {/* Billing Panel */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Bill</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Name (Optional)</label>
              <input
                type="text" value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Enter buyer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Bill Items Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {billItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-gray-800">{item.name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.unit}
                          onChange={(e) => updateBillItem(item.id, 'unit', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="piece">Piece</option>
                          <option value="dozen">Dozen</option>
                          <option value="kg">Kg</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" step={item.unit === 'kg' ? '0.01' : '1'} min="0"
                          value={item.quantity}
                          onChange={(e) => updateBillItem(item.id, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" step="0.01" value={item.price}
                          onChange={(e) => updateBillItem(item.id, 'price', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        ₹{calcItemTotal(item).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeBillItem(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {billItems.length === 0 && (
                <p className="text-gray-500 text-center py-8">Add items from the products list</p>
              )}
            </div>

            {/* Other Charges Section */}
            <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
              <button
                onClick={() => setShowOtherCharges(!showOtherCharges)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Other Charges</span>
                  {otherCharges.length > 0 && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {otherCharges.length} added
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {otherCharges.length > 0 && (
                    <span className="text-sm font-semibold text-gray-700">
                      ₹{calcOtherChargesTotal().toFixed(2)}
                    </span>
                  )}
                  {showOtherCharges ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </div>
              </button>

              {showOtherCharges && (
                <div className="p-4 space-y-3">
                  {otherCharges.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No charges added yet. Click below to add one.</p>
                  )}
                  {otherCharges.map((charge) => (
                    <div key={charge.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Charge name (e.g. Delivery, Tax)"
                        value={charge.label}
                        onChange={(e) => updateOtherCharge(charge.id, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          value={charge.amount}
                          onChange={(e) => updateOtherCharge(charge.id, 'amount', e.target.value)}
                          className="w-28 pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => removeOtherCharge(charge.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addOtherCharge}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-dashed border-indigo-300 w-full justify-center"
                  >
                    <Plus size={16} />
                    Add Charge
                  </button>
                </div>
              )}

              {!showOtherCharges && otherCharges.length === 0 && (
                <button
                  onClick={() => { addOtherCharge(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition"
                >
                  <Plus size={16} />
                  Add Other Charges
                </button>
              )}
            </div>

            {/* Totals + Actions */}
            {billItems.length > 0 && (
              <>
                <div className="border-t pt-4 mb-4 space-y-2">
                  {otherCharges.length > 0 && (
                    <>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Items Subtotal</span>
                        <span>₹{calcSubtotal().toFixed(2)}</span>
                      </div>
                      {otherCharges.filter(c => c.label || c.amount).map(c => (
                        <div key={c.id} className="flex justify-between items-center text-gray-600">
                          <span>{c.label || 'Other Charge'}</span>
                          <span>₹{(parseFloat(c.amount) || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2" />
                    </>
                  )}
                  <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                    <span>Total Amount:</span>
                    <span>₹{calcTotal().toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={shareInvoice}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    <Download size={20} />
                    Download Bill
                  </button>
                  <button
                    onClick={shareInvoice}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    <Printer size={20} />
                    Print / Share
                  </button>
                  <button onClick={clearBill} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium">
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Products Management Modal */}
      {showProducts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Manage Products</h2>
              <button onClick={() => setShowProducts(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-800">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text" placeholder="Product name" value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number" step="0.01" placeholder="Default price" value={newProduct.defaultPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, defaultPrice: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="piece">Per Piece</option>
                    <option value="dozen">Per Dozen</option>
                    <option value="kg">Per Kg</option>
                  </select>
                  <button onClick={addProduct} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    <Plus size={20} /> Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold mb-3 text-gray-800">Existing Products</h3>
                {products.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        ₹{product.defaultPrice} / {product.unit === 'piece' ? 'piece' : product.unit === 'dozen' ? 'dozen' : 'kg'}
                      </div>
                    </div>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Firm Name</label>
                <input
                  type="text" value={tempFirmName}
                  onChange={(e) => setTempFirmName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Firm Logo (Optional)</label>
                <div className="space-y-3">
                  {tempFirmLogo && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={tempFirmLogo} alt="Logo preview" className="h-16 w-16 object-contain border border-gray-200 rounded" />
                      <button onClick={() => setTempFirmLogo('')} className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Remove Logo
                      </button>
                    </div>
                  )}
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setTempFirmLogo(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <p className="text-xs text-gray-500">Upload an image file (PNG, JPG, etc.)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFirmName(tempFirmName); setFirmLogo(tempFirmLogo);
                  saveFirmName(tempFirmName); saveFirmLogo(tempFirmLogo);
                  setShowSettings(false);
                }}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSoftware;