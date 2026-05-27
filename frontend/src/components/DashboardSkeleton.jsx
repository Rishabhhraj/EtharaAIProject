import './DashboardSkeleton.css';

export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skel-header skel-block" />
      <div className="grid-3">
        <div className="card skel-card" />
        <div className="card skel-card" />
        <div className="card skel-card" />
      </div>
      <div className="dashboard-grid">
        <div className="card skel-panel" />
        <div className="card skel-panel" />
      </div>
      <div className="card skel-table" />
    </div>
  );
}
