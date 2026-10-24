"use client";
import { useEffect, useRef } from "react";
import {
  Mail,
  Phone,
  X,
  ArrowUpRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Channel, Status, initials } from "@/lib/model";
export function ChannelIcon({
  channel,
  size = 16,
}: {
  channel: Channel;
  size?: number;
}) {
  const Icon = channel === "E-mail" ? Mail : Phone;
  return (
    <span
      className={`channel-icon ${channel === "WhatsApp" ? "whatsapp" : channel === "E-mail" ? "email" : "phone"}`}
      title={channel}
    >
      {channel === "WhatsApp" ? (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.93 11.93 0 0 0 5.77 1.47h.01C18.63 23.83 24 18.48 24 11.9c0-3.19-1.24-6.18-3.48-8.42ZM12.05 21.82a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.72.98.99-3.63-.24-.37a9.9 9.9 0 0 1-1.52-5.28c0-5.47 4.46-9.92 9.94-9.92a9.85 9.85 0 0 1 7.02 2.91 9.86 9.86 0 0 1 2.91 7.02c0 5.47-4.46 9.92-9.97 9.92Zm5.45-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.34Z" />
        </svg>
      ) : (
        <Icon size={size} aria-hidden="true" />
      )}
    </span>
  );
}
export function Avatar({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  const color =
    name === "Por atribuir"
      ? "neutral"
      : ["green", "purple", "blue", "amber"][name.charCodeAt(0) % 4];
  return (
    <span className={`avatar ${color} ${small ? "small" : ""}`} title={name}>
      {name === "Por atribuir" ? "—" : initials(name)}
    </span>
  );
}
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`status status-${status === "Novo" ? "new" : status === "Em curso" ? "progress" : status === "A aguardar" ? "waiting" : "closed"}`}
    >
      <i />
      {status}
    </span>
  );
}
export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`category category-${category === "Abate" ? "abate" : category === "Peças" ? "parts" : "shipping"}`}
    >
      {category}
    </span>
  );
}
export function Empty({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="empty">
      <span>
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const el = ref.current;
    const selector = 'button, [href], input, select, textarea, [tabindex="0"]';
    (el?.querySelector(selector) as HTMLElement)?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const items = Array.from(
          el?.querySelectorAll<HTMLElement>(selector) || [],
        ).filter((e) => !e.hasAttribute("disabled"));
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Fechar janela"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function PanelHeading({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
export function Toast({ message }: { message: string }) {
  return (
    <div className="toast" role="status">
      <span>
        <Check size={16} />
      </span>
      {message}
    </div>
  );
}
