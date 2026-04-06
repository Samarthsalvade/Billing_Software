import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, FileText, Download, Printer, X, Edit2, Save } from 'lucide-react';

const BillingSoftware = () => {
  const [firmName, setFirmName] = useState('Your Firm Name');
  const [firmLogo, setFirmLogo] = useState('');
  const [products, setProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [editingFirm, setEditingFirm] = useState(false);
  const [tempFirmName, setTempFirmName] = useState(firmName);
  const [tempFirmLogo, setTempFirmLogo] = useState(firmLogo);
  
  // Product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    defaultPrice: '',
    unit: 'piece'
  });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const storedFirmName = localStorage.getItem('firm-name');
        if (storedFirmName) setFirmName(storedFirmName);
        
        const storedLogo = localStorage.getItem('firm-logo');
        if (storedLogo) setFirmLogo(storedLogo);
        
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) setProducts(JSON.parse(storedProducts));
      } catch (error) {
        console.log('No stored data found');
      }
    };
    loadData();
  }, []);

  const saveFirmName = (name) => {
    try {
      localStorage.setItem('firm-name', name);
    } catch (error) {
      console.error('Error saving firm name:', error);
    }
  };

  const saveFirmLogo = (logo) => {
    try {
      localStorage.setItem('firm-logo', logo);
    } catch (error) {
      console.error('Error saving firm logo:', error);
    }
  };

  const saveProducts = (prods) => {
    try {
      localStorage.setItem('products', JSON.stringify(prods));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.defaultPrice) {
      const product = {
        id: Date.now(),
        ...newProduct,
        defaultPrice: parseFloat(newProduct.defaultPrice)
      };
      const updated = [...products, product];
      setProducts(updated);
      saveProducts(updated);
      setNewProduct({ name: '', defaultPrice: '', unit: 'piece' });
    }
  };

  const deleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveProducts(updated);
  };

  const addBillItem = (product) => {
    // Check if item already exists in bill
    const existingItem = billItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Increase quantity by 1 if item exists
      setBillItems(billItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: parseFloat(item.quantity) + 1 }
          : item
      ));
    } else {
      // Add new item if it doesn't exist
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

  const updateBillItem = (id, field, value) => {
    setBillItems(billItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeBillItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const calculateItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    
    if (item.unit === 'dozen') {
      return qty * 12 * price;
    }
    return qty * price;
  };

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const generateBillNumber = () => {
    return `INV-${Date.now()}`;
  };

  const generatePDF = () => {
    const billNumber = generateBillNumber();
    const date = new Date().toLocaleDateString();
    const total = calculateTotal();

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${billNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 40px; 
      background: white;
      color: #333;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      border-bottom: 2px solid #333; 
      padding-bottom: 20px; 
    }
    .logo-container {
      margin-bottom: 15px;
    }
    .logo {
      max-width: 150px;
      max-height: 80px;
      object-fit: contain;
    }
    .firm-name { 
      font-size: 28px; 
      font-weight: bold; 
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .invoice-info { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .invoice-info > div {
      min-width: 200px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 30px; 
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
    }
    th { 
      background-color: #f8f9fa; 
      font-weight: bold; 
    }
    .text-right { text-align: right; }
    .total-row { 
      font-weight: bold; 
      background-color: #f8f9fa; 
      font-size: 16px;
    }
    .footer { 
      margin-top: 50px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${firmLogo ? `<div class="logo-container"><img src="${firmLogo}" alt="Logo" class="logo"></div>` : ''}
    <div class="firm-name">${firmName}</div>
  </div>
  
  <div class="invoice-info">
    <div>
      <strong>Invoice Number:</strong> ${billNumber}<br>
      <strong>Date:</strong> ${date}
    </div>
    ${buyerName ? `<div><strong>Bill To:</strong><br>${buyerName}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Unit</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${billItems.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.unit === 'piece' ? 'Piece' : item.unit === 'dozen' ? 'Dozen' : 'Kg'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${parseFloat(item.price).toFixed(2)}${item.unit === 'dozen' ? '/pc' : ''}</td>
          <td class="text-right">₹${calculateItemTotal(item).toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4" class="text-right">Total Amount</td>
        <td class="text-right">₹${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Thank you for your business!
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${billNumber}.html`;
    link.setAttribute('download', `Invoice-${billNumber}.html`);
    
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        alert('Please allow pop-ups to download the invoice. You can then save it to Files app.');
      }
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const printBill = () => {
    const billNumber = generateBillNumber();
    const date = new Date().toLocaleDateString();
    const total = calculateTotal();

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${billNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 40px; 
      background: white;
      color: #333;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      border-bottom: 2px solid #333; 
      padding-bottom: 20px; 
    }
    .logo-container {
      margin-bottom: 15px;
    }
    .logo {
      max-width: 150px;
      max-height: 80px;
      object-fit: contain;
    }
    .firm-name { 
      font-size: 28px; 
      font-weight: bold; 
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .invoice-info { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .invoice-info > div {
      min-width: 200px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 30px; 
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
    }
    th { 
      background-color: #f8f9fa; 
      font-weight: bold; 
    }
    .text-right { text-align: right; }
    .total-row { 
      font-weight: bold; 
      background-color: #f8f9fa; 
      font-size: 16px;
    }
    .footer { 
      margin-top: 50px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${firmLogo ? `<div class="logo-container"><img src="${firmLogo}" alt="Logo" class="logo"></div>` : ''}
    <div class="firm-name">${firmName}</div>
  </div>
  
  <div class="invoice-info">
    <div>
      <strong>Invoice Number:</strong> ${billNumber}<br>
      <strong>Date:</strong> ${date}
    </div>
    ${buyerName ? `<div><strong>Bill To:</strong><br>${buyerName}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Unit</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${billItems.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.unit === 'piece' ? 'Piece' : item.unit === 'dozen' ? 'Dozen' : 'Kg'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${parseFloat(item.price).toFixed(2)}${item.unit === 'dozen' ? '/pc' : ''}</td>
          <td class="text-right">₹${calculateItemTotal(item).toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4" class="text-right">Total Amount</td>
        <td class="text-right">₹${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Thank you for your business!
  </div>
</body>
</html>`;

    const blob = new Blob([printContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    const printWindow = window.open(blobUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(blobUrl);
        }, 500);
      };
    } else {
      alert('Please allow pop-ups to print the invoice');
      URL.revokeObjectURL(blobUrl);
    }
  };

  const clearBill = () => {
    setBillItems([]);
    setBuyerName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {firmLogo && (
              <img src={firmLogo} alt="Logo" className="h-10 w-10 object-contain" />
            )}
            {editingFirm ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempFirmName}
                  onChange={(e) => setTempFirmName(e.target.value)}
                  className="text-2xl font-bold border-b-2 border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setFirmName(tempFirmName);
                    saveFirmName(tempFirmName);
                    setEditingFirm(false);
                  }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                >
                  <Save size={20} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-800">{firmName}</h1>
                <button
                  onClick={() => {
                    setTempFirmName(firmName);
                    setEditingFirm(true);
                  }}
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
              Manage Products
            </button>
            <button
              onClick={() => {
                setShowSettings(true);
                setTempFirmName(firmName);
                setTempFirmLogo(firmLogo);
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Products</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => addBillItem(product)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buyer Name (Optional)
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Enter buyer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

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
                          type="number"
                          step={item.unit === 'kg' ? '0.01' : '1'}
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateBillItem(item.id, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateBillItem(item.id, 'price', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        ₹{calculateItemTotal(item).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeBillItem(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
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

            {billItems.length > 0 && (
              <>
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                    <span>Total Amount:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={generatePDF}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    <Download size={20} />
                    Download Bill
                  </button>
                  <button
                    onClick={printBill}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    <Printer size={20} />
                    Print Bill
                  </button>
                  <button
                    onClick={clearBill}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
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
              <button
                onClick={() => setShowProducts(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3 text-gray-800">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Default price"
                    value={newProduct.defaultPrice}
                    onChange={(e) => setNewProduct({...newProduct, defaultPrice: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="piece">Per Piece</option>
                    <option value="dozen">Per Dozen</option>
                    <option value="kg">Per Kg</option>
                  </select>
                  <button
                    onClick={addProduct}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus size={20} />
                    Add
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
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
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
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name
                </label>
                <input
                  type="text"
                  value={tempFirmName}
                  onChange={(e) => setTempFirmName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Logo (Optional)
                </label>
                <div className="space-y-3">
                  {tempFirmLogo && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={tempFirmLogo} alt="Logo preview" className="h-16 w-16 object-contain border border-gray-200 rounded" />
                      <button
                        onClick={() => setTempFirmLogo('')}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTempFirmLogo(reader.result);
                        };
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
                  setFirmName(tempFirmName);
                  setFirmLogo(tempFirmLogo);
                  saveFirmName(tempFirmName);
                  saveFirmLogo(tempFirmLogo);
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