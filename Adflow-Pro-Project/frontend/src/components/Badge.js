export default function Badge({ status }) {
  const labels = {
    draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
    approved: 'Approved', active: 'Active', rejected: 'Rejected', archived: 'Archived',
    placed: 'Placed', payment_pending: 'Payment Pending', payment_verified: 'Payment Verified',
    in_progress: 'In Progress', delivered: 'Delivered', revision_requested: 'Revision',
    completed: 'Completed', cancelled: 'Cancelled', pending: 'Pending', verified: 'Verified'
  };
  return (
    <span className={`badge badge-${status}`}>
      {labels[status] || status}
    </span>
  );
}