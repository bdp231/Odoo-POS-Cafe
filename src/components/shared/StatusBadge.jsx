export default function StatusBadge({ status }) {
  const config = {
    available: { className: 'badge-success', label: 'Available' },
    occupied: { className: 'badge-accent', label: 'Occupied' },
    reserved: { className: 'badge-danger', label: 'Reserved' },
    pending: { className: 'badge-warning', label: 'Pending' },
    sent_to_kitchen: { className: 'badge-info', label: 'Sent to Kitchen' },
    preparing: { className: 'badge-accent', label: 'Preparing' },
    completed: { className: 'badge-success', label: 'Completed' },
    paid: { className: 'badge-success', label: 'Paid' },
    unpaid: { className: 'badge-danger', label: 'Unpaid' },
    open: { className: 'badge-success', label: 'Open' },
    closed: { className: 'badge-danger', label: 'Closed' },
    declined: { className: 'badge-danger', label: 'Declined'},
  };

  const c = config[status] || { className: 'badge-primary', label: status };

  return <span className={`badge ${c.className}`}>{c.label}</span>;
}
