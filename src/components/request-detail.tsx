"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  Clock3,
  FileImage,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  StickyNote,
  UserRound,
  CalendarDays,
  Flag,
  ExternalLink,
  History,
  Plus,
} from "lucide-react";
import {
  Store,
  Channel,
  deadline,
  isUnanswered,
  Request,
  Interaction,
  TEAM,
  CATEGORIES,
  STATUSES,
  PRIORITIES,
  isOverdue,
  time,
  shortDate,
  fromLisbonInput,
} from "@/lib/model";
import {
  Avatar,
  CategoryBadge,
  ChannelIcon,
  StatusBadge,
  Modal,
  Empty,
} from "./ui";
export default function RequestDetail({
  store,
  request,
  onBack,
  onUpdate,
  onSend,
  onCall,
  onOpen,
}: {
  store: Store;
  request: Request;
  onBack: () => void;
  onUpdate: (id: string, p: Partial<Request>) => void;
  onSend: (
    id: string,
    body: string,
    kind: "outgoing" | "note",
    channel?: Channel,
  ) => void;
  onCall: () => void;
  onOpen: (id: string) => void;
}) {
  const contact = store.contacts.find((c) => c.id === request.contactId)!;
  const interactions = store.interactions
    .filter((i) => i.requestId === request.id)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const [tab, setTab] = useState("all"),
    [mode, setMode] = useState<"outgoing" | "note">("outgoing"),
    [drafts, setDrafts] = useState({ outgoing: "", note: "" }),
    [replyChannel, setReplyChannel] = useState<Channel>(request.channel),
    [image, setImage] = useState(false),
    [action, setAction] = useState(request.nextAction),
    [history, setHistory] = useState(false);
  const text = drafts[mode];
  const setText = (value: string) =>
    setDrafts((d) => ({ ...d, [mode]: value }));
  const related = store.requests.filter(
    (r) => r.contactId === contact.id && r.id !== request.id,
  );
  const send = () => {
    if (!text.trim()) return;
    onSend(request.id, text, mode, replyChannel);
    setTab(mode === "note" ? "notes" : "all");
    setText("");
  };
  const canRespond = request.status !== "Concluído";
  const conversationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = conversationRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [interactions.length, tab]);
  return (
    <>
      <div className="detail-breadcrumb">
        <button onClick={onBack}>
          <ArrowLeft size={16} /> Caixa de entrada
        </button>
        <span>/</span>
        <span>{request.id}</span>
        <span className="detail-origin">
          <ChannelIcon channel={request.channel} size={14} />
          {request.channel}
        </span>
      </div>
      <div className="detail-heading">
        <div>
          <h1>{request.subject}</h1>
          <p>
            Recebido a {shortDate(request.createdAt)} de 2026, às{" "}
            {time(request.createdAt)} <i>·</i> {request.id}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() =>
            onUpdate(request.id, {
              status: canRespond ? "Concluído" : "Em curso",
            })
          }
        >
          <CheckCheck size={17} />
          {canRespond ? "Concluir pedido" : "Reabrir pedido"}
        </button>
      </div>
      <div className="operational-summary">
        <span>
          Estado <b>{request.status}</b>
        </span>
        <span>
          Responsável <b>{request.assignee}</b>
        </span>
        <span>
          Próxima ação <b>{request.nextAction || "Por definir"}</b>
        </span>
        <span>
          Prazo{" "}
          <b className={isOverdue(request) ? "overdue" : ""}>
            {request.status === "Concluído"
              ? "Resolvido"
              : deadline(request.dueAt)}
          </b>
        </span>
        <span>
          Comunicação{" "}
          <b>
            {!store.interactions.some(
              (i) =>
                i.requestId === request.id &&
                (i.kind === "outgoing" || i.kind === "call"),
            )
              ? "Sem resposta"
              : "Com resposta / chamada"}
          </b>
        </span>
      </div>
      <div className="detail-grid">
        <section
          className={`panel conversation-panel channel-${request.channel === "WhatsApp" ? "whatsapp" : request.channel === "E-mail" ? "email" : "phone"}`}
        >
          <div className="conversation-tabs">
            <button
              className={tab === "all" ? "active" : ""}
              onClick={() => setTab("all")}
            >
              <MessageSquare size={16} /> Conversa{" "}
              <span>
                {interactions.filter((i) => i.kind !== "event").length}
              </span>
            </button>
            <button
              className={tab === "notes" ? "active" : ""}
              onClick={() => {
                setTab("notes");
                setMode("note");
              }}
            >
              <StickyNote size={16} /> Notas internas{" "}
              <span>
                {interactions.filter((i) => i.kind === "note").length}
              </span>
            </button>
            <span className="conversation-channel">
              <ChannelIcon channel={request.channel} size={14} />
              {request.channel}
            </span>
          </div>
          <div className="conversation-body" ref={conversationRef}>
            <div className="timeline-date">
              <span>{shortDate(request.createdAt)} de 2026</span>
            </div>
            {interactions
              .filter((i) =>
                tab === "notes" ? i.kind === "note" : i.kind !== "note",
              )
              .map((i) => (
                <InteractionItem
                  key={i.id}
                  interaction={i}
                  contactName={contact.name}
                  contactPhone={contact.phone}
                  onImage={() => setImage(true)}
                />
              ))}
            {tab === "notes" &&
              !interactions.some((i) => i.kind === "note") && (
                <Empty
                  icon={StickyNote}
                  title="O contexto também conta"
                  description="Adicione uma nota para manter a equipa a par deste pedido."
                />
              )}
          </div>
          <div className="composer">
            <div className="composer-modes">
              <button
                className={mode === "outgoing" ? "active" : ""}
                onClick={() => {
                  setMode("outgoing");
                  setTab("all");
                }}
              >
                <Send size={14} />
                {request.channel === "Telefone"
                  ? "Seguimento da chamada"
                  : "Responder"}
              </button>
              <button
                className={mode === "note" ? "active note" : ""}
                onClick={() => {
                  setMode("note");
                  setTab("notes");
                }}
              >
                <StickyNote size={14} /> Nota interna
              </button>
            </div>
            {mode === "outgoing" && (
              <label className="reply-channel">
                Responder via
                <select
                  aria-label="Canal da resposta"
                  value={replyChannel}
                  onChange={(e) => setReplyChannel(e.target.value as Channel)}
                >
                  <option>E-mail</option>
                  <option>WhatsApp</option>
                  <option>Telefone</option>
                </select>
              </label>
            )}
            {mode === "outgoing" && replyChannel === "Telefone" ? (
              <div className="phone-followup">
                <div>
                  <Phone size={20} />
                  <span>
                    <b>Continuar a conversa</b>
                    <small>
                      Registe uma chamada de acompanhamento a{" "}
                      {contact.name.split(" ")[0]}.
                    </small>
                  </span>
                </div>
                <button
                  className="button primary"
                  disabled={!canRespond}
                  onClick={onCall}
                >
                  <Phone size={15} /> Simular chamada
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    const next = "Devolver chamada a " + contact.name;
                    setAction(next);
                    onUpdate(request.id, { nextAction: next });
                  }}
                >
                  Registar chamada a devolver
                </button>
              </div>
            ) : (
              <>
                <label className="sr-only" htmlFor="reply">
                  {mode === "note"
                    ? "Escrever nota interna"
                    : "Escrever resposta"}
                </label>
                <textarea
                  id="reply"
                  value={text}
                  disabled={mode === "outgoing" && !canRespond}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    mode === "note"
                      ? "Partilhe contexto com a equipa. Só é visível internamente."
                      : !canRespond
                        ? "Reabra o pedido para continuar a conversa."
                        : `Escreva uma resposta a ${contact.name.split(" ")[0]}…`
                  }
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
                  }}
                />
                <div className="composer-footer">
                  <span>
                    {mode === "note" ? (
                      <>
                        <span className="tiny-dot amber" /> Apenas a equipa pode
                        ver esta nota
                      </>
                    ) : (
                      <>
                        <span className="tiny-dot" /> Resposta simulada · sem
                        envio real
                      </>
                    )}
                  </span>
                  <button
                    className={`button ${mode === "note" ? "note-button" : "primary"}`}
                    disabled={
                      !text.trim() || (mode === "outgoing" && !canRespond)
                    }
                    onClick={send}
                  >
                    {mode === "note" ? <Plus size={15} /> : <Send size={15} />}{" "}
                    {mode === "note" ? "Guardar nota" : "Enviar resposta"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
        <aside className="detail-sidebar">
          <section className="panel contact-card">
            <div className="small-section-title">
              CONTACTO <UserRound size={15} />
            </div>
            <div className="contact-identity">
              <Avatar name={contact.name} />
              <div>
                <h3>{contact.name}</h3>
                <span>{contact.company || contact.type}</span>
              </div>
            </div>
            <div className="contact-info">
              <span>
                <MapPin size={14} />
                {contact.location}
              </span>
              <span>
                <Mail size={14} />
                {contact.email}
              </span>
              <span>
                <Phone size={14} />
                {contact.phone}
              </span>
            </div>
            <button
              className="contact-history"
              onClick={() => setHistory(true)}
            >
              <History size={14} /> Histórico do contacto{" "}
              <span>
                {related.length + 1} pedido{related.length ? "s" : ""}
              </span>
              <ArrowUpRight size={14} />
            </button>
          </section>
          <section className="panel management-card">
            <div className="small-section-title">
              GESTÃO DO PEDIDO <Flag size={15} />
            </div>
            <label>
              Estado
              <select
                aria-label="Estado do pedido"
                value={request.status}
                onChange={(e) =>
                  onUpdate(request.id, {
                    status: e.target.value as Request["status"],
                  })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Categoria
              <select
                aria-label="Categoria do pedido"
                value={request.category}
                onChange={(e) =>
                  onUpdate(request.id, {
                    category: e.target.value as Request["category"],
                  })
                }
              >
                {CATEGORIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>

            <label>
              Prioridade
              <select
                aria-label="Prioridade do pedido"
                value={request.priority}
                onChange={(e) =>
                  onUpdate(request.id, {
                    priority: e.target.value as Request["priority"],
                  })
                }
              >
                {PRIORITIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </section>
          <section className="panel next-action">
            <div className="small-section-title">
              PRÓXIMA AÇÃO <CalendarDays size={15} />
            </div>
            <textarea
              aria-label="Próxima ação"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <label>
              Responsável
              <select
                aria-label="Responsável do pedido"
                value={request.assignee}
                onChange={(e) =>
                  onUpdate(request.id, { assignee: e.target.value })
                }
              >
                {TEAM.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>{" "}
            <label>
              Prazo de acompanhamento
              <input
                type="datetime-local"
                aria-label="Prazo de acompanhamento"
                value={new Intl.DateTimeFormat("sv-SE", {
                  timeZone: "Europe/Lisbon",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                  .format(new Date(request.dueAt))
                  .replace(" ", "T")}
                onChange={(e) => {
                  if (e.target.value)
                    onUpdate(request.id, {
                      dueAt: fromLisbonInput(e.target.value),
                    });
                }}
              />
              {isOverdue(request) && (
                <small className="overdue">
                  Este pedido precisa de acompanhamento.
                </small>
              )}
            </label>{" "}
            <button
              className="text-button"
              disabled={action === request.nextAction}
              onClick={() => onUpdate(request.id, { nextAction: action })}
            >
              Guardar ação <CheckCheck size={14} />
            </button>
          </section>
        </aside>
      </div>
      {image && (
        <Modal
          title="Fotografia anexada"
          subtitle="Enviada por Pedro Santos · Renault Clio IV"
          onClose={() => setImage(false)}
        >
          <div className="image-preview">
            <img
              src="/farol-clio.jpg"
              alt="Fotografia de um farol esquerdo para Renault Clio IV"
            />
            <span>
              <FileImage size={16} /> farol-clio-iv.jpg · Imagem de demonstração
            </span>
            <a
              className="text-button"
              href="/farol-clio.jpg"
              download="farol-clio-iv.jpg"
            >
              Descarregar fotografia <ArrowUpRight size={14} />
            </a>
          </div>
        </Modal>
      )}
      {history && (
        <Modal
          title="Histórico do contacto"
          subtitle={`${contact.name} · ${related.length + 1} pedidos`}
          onClose={() => setHistory(false)}
        >
          <div className="history-list">
            {[request, ...related].map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setHistory(false);
                  onOpen(r.id);
                }}
              >
                <ChannelIcon channel={r.channel} />
                <span>
                  <b>{r.subject}</b>
                  <small>
                    {r.id} · {shortDate(r.createdAt)}
                  </small>
                </span>
                <StatusBadge status={r.status} />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
function InteractionItem({
  interaction: i,
  contactName,
  contactPhone,
  onImage,
}: {
  interaction: Interaction;
  contactName: string;
  contactPhone: string;
  onImage: () => void;
}) {
  if (i.kind === "event")
    return (
      <div className="timeline-event">
        <span>
          <CheckCheck size={13} />
        </span>
        <p>{i.body}</p>
        <time>{time(i.at)}</time>
      </div>
    );
  if (i.kind === "call")
    return (
      <div className="call-record">
        <div>
          <span className="call-record-icon">
            <Phone size={19} />
          </span>
          <span>
            <b>Chamada atendida</b>
            <small>
              {shortDate(i.at)} · {time(i.at)} ·{" "}
              {Math.floor((i.duration || 0) / 60)}m{" "}
              {String((i.duration || 0) % 60).padStart(2, "0")}s
            </small>
          </span>
          <span className="simulation-tag">Simulada</span>
        </div>
        <div className="call-summary">
          <span>REGISTO MANUAL DA CHAMADA</span>
          <dl className="call-metadata">
            <div>
              <dt>Número</dt>
              <dd>{contactPhone}</dd>
            </div>
            <div>
              <dt>Operador</dt>
              <dd>{i.operator || "Não registado"}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{i.callStatus || "Atendida"}</dd>
            </div>
          </dl>
          <p>{i.body}</p>
        </div>
        <div className="call-record-footer">
          <CheckCheck size={13} /> Associada ao contacto e ao pedido
        </div>
      </div>
    );
  return (
    <div
      className={`message ${i.kind === "outgoing" ? "outgoing" : i.kind === "note" ? "internal" : "incoming"}`}
    >
      <div className="message-author">
        {i.kind === "note" ? (
          <StickyNote size={15} />
        ) : (
          <Avatar name={i.kind === "incoming" ? contactName : i.author} small />
        )}
        <b>{i.kind === "incoming" ? contactName : i.author}</b>
        {i.kind !== "note" && (
          <span className="interaction-channel">
            <ChannelIcon channel={i.channel} size={13} />
            {i.channel}
          </span>
        )}
        {i.kind === "note" && <span>Nota interna</span>}
        <time>
          {shortDate(i.at)} · {time(i.at)}
        </time>
      </div>
      <div className="message-bubble">
        <p>{i.body}</p>
        {i.attachment && (
          <button className="attachment" onClick={onImage}>
            <img
              src={i.attachment}
              alt="Fotografia do farol esquerdo do Renault Clio IV"
            />
            <span>
              <FileImage size={15} />
              <b>farol-clio-iv.jpg</b>
              <ExternalLink size={14} />
            </span>
          </button>
        )}
      </div>
      {i.kind === "outgoing" && (
        <div className="message-delivered">
          <CheckCheck size={13} /> Resposta guardada · envio simulado
        </div>
      )}
    </div>
  );
}
