import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../data/seedData';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';

export default function Floors() {
  const { state, dispatch } = useApp();
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [floorName, setFloorName] = useState('');
  const [tableForm, setTableForm] = useState({ number: '', seats: 2, active: true });

  const handleAddFloor = () => {
    if (!floorName.trim()) {
      toast.error('Please enter a floor name');
      return;
    }
    dispatch({
      type: 'ADD_FLOOR',
      payload: { id: generateId(), name: floorName.trim(), tables: [] },
    });
    toast.success('Floor added!');
    setFloorName('');
    setShowFloorModal(false);
  };

  const openTableModal = (floorId) => {
    setActiveFloorId(floorId);
    setTableForm({ number: '', seats: 2, active: true });
    setShowTableModal(true);
  };

  const handleAddTable = () => {
    if (!tableForm.number) {
      toast.error('Please enter a table number');
      return;
    }
    if (!tableForm.seats || tableForm.seats < 1 || tableForm.seats > 10) {
      toast.error('Number of seats must be between 1 and 10');
      return;
    }
    dispatch({
      type: 'ADD_TABLE',
      payload: {
        floorId: activeFloorId,
        table: {
          id: generateId(),
          number: parseInt(tableForm.number),
          seats: parseInt(tableForm.seats),
          status: 'available',
          active: tableForm.active,
        },
      },
    });
    toast.success('Table added!');
    setShowTableModal(false);
  };

  const handleRemoveFloor = (floor) => {
    if (!window.confirm(`Remove floor "${floor.name}" and all its tables?`)) return;
    dispatch({ type: 'REMOVE_FLOOR', payload: floor.id });
    toast.success('Floor removed!');
  };

  const handleRemoveTable = (floorId, table) => {
    if (!window.confirm(`Remove table T${table.number}?`)) return;
    dispatch({ type: 'REMOVE_TABLE', payload: { floorId, tableId: table.id } });
    toast.success('Table removed!');
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-page-title">Floor Plans</h1>
          <p className="admin-page-subtitle">Manage floors and table arrangements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowFloorModal(true)}>
          <Plus size={18} /> Add Floor
        </button>
      </div>

      {state.floors.map((floor, fi) => (
        <motion.div
          key={floor.id}
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: fi * 0.1 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} style={{ color: 'var(--primary)' }} />
              <span className="card-title">{floor.name}</span>
              <span className="badge badge-primary">{floor.tables.length} tables</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => openTableModal(floor.id)}>
                <Plus size={14} /> Add Table
              </button>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleRemoveFloor(floor)}>
                <Trash2 size={14} /> Remove Floor
              </button>
            </div>
          </div>

          {floor.tables.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">🪑</div>
              <div className="empty-state-title">No tables yet</div>
              <p className="empty-state-text">Add tables to this floor to get started.</p>
            </div>
          ) : (
            <div className="floor-tables">
              {floor.tables.map(table => (
                <motion.div
                  key={table.id}
                  className={`floor-table-card ${table.status}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveTable(floor.id, table); }}
                    style={{
                      position: 'absolute', top: '0.35rem', right: '0.35rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--error)', padding: '0.15rem', borderRadius: '4px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.7, transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                    title="Remove table"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="floor-table-number">T{table.number}</div>
                  <div className="floor-table-seats">{table.seats} seats</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <StatusBadge status={table.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Add Floor Modal */}
      <Modal
        isOpen={showFloorModal}
        onClose={() => setShowFloorModal(false)}
        title="Add Floor"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowFloorModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddFloor}>Add Floor</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Floor Name</label>
          <input
            className="form-input"
            value={floorName}
            onChange={e => setFloorName(e.target.value)}
            placeholder="e.g., Ground Floor, Rooftop, Patio"
          />
        </div>
      </Modal>

      {/* Add Table Modal */}
      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title="Add Table"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowTableModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddTable}>Add Table</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Table Number</label>
          <input className="form-input" type="number" value={tableForm.number} onChange={e => setTableForm({ ...tableForm, number: e.target.value })} placeholder="e.g., 13" />
        </div>
        <div className="form-group">
          <label className="form-label">Number of Seats (Max 10)</label>
          <input className="form-input" type="number" min="1" max="10" value={tableForm.seats} onChange={e => {
            const val = e.target.value;
            if (val === '') {
              setTableForm({ ...tableForm, seats: '' });
              return;
            }
            const num = parseInt(val);
            if (num > 10) setTableForm({ ...tableForm, seats: 10 });
            else setTableForm({ ...tableForm, seats: num });
          }} />
        </div>
        <div className="form-group">
          <label className="form-label">Active</label>
          <label className="toggle-switch">
            <input type="checkbox" checked={tableForm.active} onChange={e => setTableForm({ ...tableForm, active: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>
      </Modal>
    </div>
  );
}
