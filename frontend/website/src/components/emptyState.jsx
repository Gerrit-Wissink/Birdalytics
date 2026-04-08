import styles from "./EmptyState.module.css";

export default function EmptyState({
  title,
  description,
  actionText,
  onAction,
}) {
  return (
    <div className={styles.emptyState}>
      <h2>{title}</h2>
      <p>{description}</p>

      {actionText && onAction && (
        <button className={styles.button} onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
