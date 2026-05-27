import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import './TaskComments.css';

export default function TaskComments({ taskId, readOnly }) {
  const { showSuccess, showError } = useToast();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!open) return;
    setLoading(true);
    api
      .getTaskComments(taskId)
      .then((res) => setComments(res.comments || []))
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [taskId, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.addTaskComment(taskId, text.trim());
      setText('');
      showSuccess('Comment posted');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <div className="task-comments">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide comments' : `Comments (${comments.length || '…'})`}
      </button>
      {open && (
        <div className="comments-panel">
          {loading ? (
            <p className="empty-hint">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="empty-hint">No comments yet.</p>
          ) : (
            <ul className="comments-list">
              {comments.map((c) => (
                <li key={c._id}>
                  <strong>{c.author?.name}</strong>
                  <span className={`comment-role badge badge-${c.author?.role}`}>{c.author?.role}</span>
                  <p>{c.text}</p>
                  <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
          {!readOnly && (
            <form onSubmit={handleSubmit} className="comment-form">
              <textarea
                rows={2}
                placeholder="Write a comment…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Post comment
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
