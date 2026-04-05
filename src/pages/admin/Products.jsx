import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, Upload, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateId, formatCurrency, PRODUCT_CATEGORIES } from '../../data/seedData';
import Modal from '../../components/shared/Modal';
import toast from 'react-hot-toast';

const emptyProduct = {
  name: '', category: 'Pizza', price: '', tax: 5, unit: 'pcs', emoji: '🍽️', description: '',
  variants: [],
  image: '', // product image URL
};

export default function Products() {
  const { state, dispatch } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const filtered = state.products.filter(p => {
    const matchCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({ ...product, image: product.image || '' });
    setIsModalOpen(true);
  };

  // Upload image to local server
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, image: data.imageUrl }));
        toast.success('Image uploaded!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Could not upload image');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove uploaded image
  const handleRemoveImage = async () => {
    if (!form.image) return;

    // Extract filename from URL path
    const filename = form.image.split('/').pop();
    try {
      await fetch(`/api/upload/${filename}`, { method: 'DELETE' });
    } catch {
      // Ignore delete errors — just remove from form
    }
    setForm(prev => ({ ...prev, image: '' }));
    toast.success('Image removed');
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error('Product name is required');
      return;
    }

    // If product has variants with prices, base price is optional (use lowest variant price)
    // If no variants, base price is required
    const hasVariantPrices = form.variants.length > 0 && form.variants.some(v => v.values.some(val => val.price > 0));

    if (!form.price && !hasVariantPrices) {
      toast.error('Price is required (or add variant sizes with prices)');
      return;
    }

    // Validate variant values have names and prices
    for (const variant of form.variants) {
      if (!variant.attribute) {
        toast.error('Please enter a name for each variant group (e.g., Size)');
        return;
      }
      for (const val of variant.values) {
        if (!val.name) {
          toast.error('Please enter a name for each variant option (e.g., Small, Medium, Large)');
          return;
        }
        if (!val.price && val.price !== 0) {
          toast.error(`Please enter a price for "${val.name}"`);
          return;
        }
      }
    }

    // If base price is not set but variants have prices, use lowest variant price as base
    let finalPrice = parseFloat(form.price) || 0;
    if (!form.price && hasVariantPrices) {
      const allPrices = form.variants.flatMap(v => v.values.map(val => val.price)).filter(p => p > 0);
      finalPrice = Math.min(...allPrices);
    }

    if (editingProduct) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { ...form, price: finalPrice } });
      toast.success('Product updated!');
    } else {
      dispatch({
        type: 'ADD_PRODUCT',
        payload: { ...form, id: generateId(), price: finalPrice },
      });
      toast.success('Product added!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this product?')) {
      // Also delete the image file if present
      const product = state.products.find(p => p.id === id);
      if (product?.image) {
        const filename = product.image.split('/').pop();
        fetch(`/api/upload/${filename}`, { method: 'DELETE' }).catch(() => {});
      }
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      toast.success('Product deleted');
    }
  };

  // Variant management
  const addVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, { attribute: '', values: [{ name: '', price: 0 }] }],
    });
  };

  const updateVariant = (vIdx, field, value) => {
    const newVariants = [...form.variants];
    newVariants[vIdx] = { ...newVariants[vIdx], [field]: value };
    setForm({ ...form, variants: newVariants });
  };

  const addVariantValue = (vIdx) => {
    const newVariants = [...form.variants];
    newVariants[vIdx].values = [...newVariants[vIdx].values, { name: '', price: 0 }];
    setForm({ ...form, variants: newVariants });
  };

  const updateVariantValue = (vIdx, valIdx, field, val) => {
    const newVariants = [...form.variants];
    newVariants[vIdx].values[valIdx] = { ...newVariants[vIdx].values[valIdx], [field]: field === 'price' ? parseFloat(val) || 0 : val };
    setForm({ ...form, variants: newVariants });
  };

  const removeVariant = (vIdx) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== vIdx) });
  };

  const removeVariantValue = (vIdx, valIdx) => {
    const newVariants = [...form.variants];
    newVariants[vIdx].values = newVariants[vIdx].values.filter((_, i) => i !== valIdx);
    // If no values left, remove the entire variant group
    if (newVariants[vIdx].values.length === 0) {
      setForm({ ...form, variants: newVariants.filter((_, i) => i !== vIdx) });
    } else {
      setForm({ ...form, variants: newVariants });
    }
  };

  // Helper to get price display text for a product
  const getProductPriceDisplay = (product) => {
    if (product.variants && product.variants.length > 0) {
      const allPrices = product.variants.flatMap(v => v.values.map(val => val.price)).filter(p => p > 0);
      if (allPrices.length > 0) {
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        if (minPrice === maxPrice) return formatCurrency(minPrice);
        return `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;
      }
    }
    return formatCurrency(product.price);
  };

  const emojiOptions = ['🍕', '🍝', '🍔', '🥗', '🍟', '🥖', '☕', '🍋', '💧', '🍰', '🍫', '🍽️', '🌮', '🥤', '🧁', '🍜'];

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">Manage your menu items and pricing</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="category-tabs">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <AnimatePresence>
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              className="card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              style={{ cursor: 'default' }}
            >
              <div style={{
                textAlign: 'center',
                padding: product.image ? '0' : '1rem 0 0.5rem',
                background: 'var(--bg-cream-dark)',
                margin: '-1.5rem -1.5rem 1rem',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                overflow: 'hidden',
              }}>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '3rem' }}>{product.emoji}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{product.name}</h4>
                  <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>{product.category}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem', textAlign: 'right' }}>
                  {getProductPriceDisplay(product)}
                </span>
              </div>
              {product.variants && product.variants.length > 0 && (
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
                  {product.variants.map((v, vi) => (
                    v.values.map((val, vvi) => (
                      <span key={`${vi}-${vvi}`} style={{
                        fontSize: '0.688rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '999px',
                        background: 'var(--primary-bg)',
                        color: 'var(--primary-dark)',
                        fontWeight: 500,
                      }}>
                        {val.name}: {formatCurrency(val.price)}
                      </span>
                    ))
                  ))}
                </div>
              )}
              <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax: {product.tax}%</span>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(product)}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(product.id)} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <div className="empty-state-title">No products found</div>
          <p className="empty-state-text">Try adjusting your filters or add a new product.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        maxWidth="580px"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={uploading}>
              {editingProduct ? 'Update' : 'Add'} Product
            </button>
          </>
        }
      >
        {/* Product Image Upload */}
        <div className="form-group">
          <label className="form-label">Product Image</label>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
          }}>
            {/* Image Preview */}
            <div style={{
              width: '120px',
              height: '90px',
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: form.image ? 'transparent' : 'var(--bg-cream)',
              flexShrink: 0,
              position: 'relative',
            }}>
              {form.image ? (
                <img
                  src={form.image}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ImageIcon size={24} />
                  <div style={{ fontSize: '0.625rem', marginTop: '0.25rem' }}>No image</div>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div style={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="product-image-upload"
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-sm" style={{
                        width: 14,
                        height: 14,
                        border: '2px solid var(--border)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                        display: 'inline-block',
                      }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      {form.image ? 'Change' : 'Upload'}
                    </>
                  )}
                </button>
                {form.image && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleRemoveImage}
                    style={{ color: 'var(--danger)', border: '1px solid var(--danger-bg, #fef2f2)' }}
                  >
                    <X size={14} /> Remove
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.688rem', color: 'var(--text-muted)', marginTop: '0.375rem', margin: '0.375rem 0 0' }}>
                JPG, PNG, GIF, WebP • Max 5MB
              </p>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Product Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Margherita Pizza" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {PRODUCT_CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Base Price (₹){form.variants.length > 0 ? ' (optional with variants)' : ''}</label>
            <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder={form.variants.length > 0 ? 'Auto from variants' : '9.99'} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <input className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax %</label>
            <input className="form-input" type="number" value={form.tax} onChange={e => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Fallback Icon {form.image ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(shown when no image)</span> : ''}</label>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {emojiOptions.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setForm({ ...form, emoji: e })}
                style={{
                  fontSize: '1.5rem',
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  border: form.emoji === e ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: form.emoji === e ? 'var(--primary-bg)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={2} />
        </div>

        {/* Variants / Sizes */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <label className="form-label" style={{ margin: 0 }}>Sizes / Variants</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Add different sizes with individual prices (e.g., Small ₹199, Medium ₹299, Large ₹399)</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={addVariant} type="button">
              <Plus size={14} /> Add Group
            </button>
          </div>

          {form.variants.map((variant, vIdx) => (
            <div key={vIdx} style={{ background: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.625rem' }}>
                <input
                  className="form-input"
                  placeholder="Group name (e.g., Size, Crust)"
                  value={variant.attribute}
                  onChange={e => updateVariant(vIdx, 'attribute', e.target.value)}
                  style={{ flex: 1, fontWeight: 600 }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => removeVariant(vIdx)} style={{ color: 'var(--danger)' }} title="Remove group">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Column headers */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', paddingLeft: '0.25rem' }}>
                <span style={{ flex: 1, fontSize: '0.688rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Option Name</span>
                <span style={{ width: 110, fontSize: '0.688rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price (₹)</span>
                <span style={{ width: 28 }}></span>
              </div>

              {variant.values.map((val, valIdx) => (
                <div key={valIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    placeholder="e.g., Small / Medium / Large"
                    value={val.name}
                    onChange={e => updateVariantValue(vIdx, valIdx, 'name', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="form-input"
                    placeholder="₹ Price"
                    type="number"
                    step="0.01"
                    value={val.price || ''}
                    onChange={e => updateVariantValue(vIdx, valIdx, 'price', e.target.value)}
                    style={{ width: 110 }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeVariantValue(vIdx, valIdx)}
                    style={{ color: 'var(--danger)', padding: '0.25rem', minWidth: 28 }}
                    title="Remove option"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => addVariantValue(vIdx)} type="button" style={{ marginTop: '0.375rem' }}>
                <Plus size={12} /> Add Option
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
