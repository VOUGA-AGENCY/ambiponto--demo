"use client";
import { useState } from "react";
import { ArrowUpRight, Inbox, Download } from "lucide-react";
import {
  Store,
  Request,
  TEAM,
  CATEGORIES,
  CHANNELS,
  metrics,
  isOverdue,
  isUnanswered,
  deadline,
  compareRequests,
  lastActivity,
} from "@/lib/model";
import { StatusBadge, ChannelIcon, PanelHeading, Empty } from "./ui";
export function RequestTable({
  store,
  requests,
  onOpen,
  onUpdate,
}: {
  store: Store;
  requests: Request[];
  onOpen: (id: string) => void;
  onUpdate?: (id: string, p: Partial<Request>) => void;
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="request-table operational-table">
        <thead>
          <tr>
            <th>Pedido / Cliente</th>
            <th>Categoria</th>
            <th>Responsável</th>
            <th>Estado</th>
            <th>Próxima ação</th>
            <th>Prazo</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const c = store.contacts.find((c) => c.id === r.contactId)!;
            return (
              <tr
                key={r.id}
                className="clickable-request"
                tabIndex={0}
                aria-label={`Abrir pedido ${r.id}: ${r.subject}`}
                onClick={(event) => {
                  if (
                    (event.target as HTMLElement).closest(
                      "button, a, select, input, textarea, label",
                    )
                  )
                    return;
                  onOpen(r.id);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(r.id);
                  }
                }}
              >
                <td>
                  <div className="subject-cell">
                    <ChannelIcon channel={r.channel} />
                    <div>
                      <button
                        className="request-title"
                        onClick={() => onOpen(r.id)}
                      >
                        {r.subject}
                      </button>
                      <div className="table-sub">
                        {c.name}
                        {c.company ? " · " + c.company : ""} · {r.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{r.category}</td>
                <td>
                  {onUpdate ? (
                    <select
                      className="quick-assignee"
                      aria-label={`Responsável de ${r.id}`}
                      value={r.assignee}
                      onChange={(e) =>
                        onUpdate(r.id, { assignee: e.target.value })
                      }
                    >
                      {TEAM.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    r.assignee
                  )}
                </td>
                <td>
                  <StatusBadge status={r.status} />
                  {isUnanswered(r, store.interactions) && (
                    <small className="communication-condition">
                      Sem resposta
                    </small>
                  )}
                </td>
                <td>
                  <button
                    className="action-preview"
                    onClick={() => onOpen(r.id)}
                  >
                    {r.nextAction || "Definir próxima ação"}
                    <ArrowUpRight size={12} />
                  </button>
                  {r.priority === "Urgente" && (
                    <small className="communication-condition">
                      Prioridade urgente
                    </small>
                  )}
                </td>
                <td>
                  <span className={isOverdue(r) ? "overdue" : ""}>
                    {r.status === "Concluído" ? "Resolvido" : deadline(r.dueAt)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export default function Dashboard({
  store,
  onOpen,
  onFilter,
  onUpdate,
}: {
  store: Store;
  onOpen: (id: string) => void;
  onFilter: (s: string) => void;
  onUpdate?: (id: string, p: Partial<Request>) => void;
  onDemo?: () => void;
  onReports?: () => void;
}) {
  const m = metrics(store);
  const open = store.requests.filter((r) => r.status !== "Concluído");
  const attention = open
    .filter(
      (r) =>
        isOverdue(r) ||
        isUnanswered(r, store.interactions) ||
        r.assignee === "Por atribuir",
    )
    .sort((a, b) => compareRequests(store, a, b, "urgent"));
  const mine = open
    .filter((r) => r.assignee === "Ana Martins")
    .sort((a, b) => compareRequests(store, a, b, "urgent"));
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Trabalho de hoje</h1>
          <p>Prioridades e acompanhamento · Ana Martins</p>
        </div>
        <button className="button primary" onClick={() => onFilter("mine")}>
          Abrir os meus pedidos <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="operational-counts">
        {[
          {
            id: "unassigned",
            label: "Por atribuir",
            n: open.filter((r) => r.assignee === "Por atribuir").length,
          },
          { id: "unanswered", label: "Por responder", n: m.unanswered },
          { id: "overdue", label: "Em atraso", n: m.overdue },
          { id: "mine", label: "Os meus pedidos", n: mine.length },
        ].map((c) => (
          <button
            key={c.id}
            className={`operational-count ${c.id}`}
            onClick={() => onFilter(c.id)}
          >
            <span>{c.label}</span>
            <strong>{c.n}</strong>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <section className="panel work-panel">
        <PanelHeading
          title="Precisa de atenção"
          subtitle="Pedidos por atribuir, sem resposta ou fora do prazo. Um pedido pode reunir várias condições."
        />
        {attention.length ? (
          <RequestTable
            store={store}
            requests={attention}
            onOpen={onOpen}
            onUpdate={onUpdate}
          />
        ) : (
          <Empty
            icon={Inbox}
            title="Sem pendências de atenção"
            description="Consulte os seus pedidos para continuar o acompanhamento."
          />
        )}
      </section>
      <section className="panel work-panel">
        <PanelHeading
          title="Os meus pedidos"
          subtitle={`${mine.length} pedidos em aberto atribuídos a Ana Martins`}
          action="Ver todos"
          onAction={() => onFilter("mine")}
        />
        {mine.length ? (
          <RequestTable
            store={store}
            requests={mine}
            onOpen={onOpen}
            onUpdate={onUpdate}
          />
        ) : (
          <Empty
            icon={Inbox}
            title="Sem pedidos atribuídos"
            description="Pode assumir um pedido na fila Por atribuir."
          />
        )}
      </section>
    </>
  );
}
export function Reports({
  store,
  onExport,
  onFilter,
}: {
  store: Store;
  onExport: (s: Store) => void;
  onFilter?: (s: string) => void;
}) {
  const [period, setPeriod] = useState("7");
  const filtered = {
    ...store,
    requests: store.requests.filter(
      (r) => period === "7" || r.createdAt.slice(0, 10) === "2026-10-22",
    ),
  };
  const m = metrics(filtered);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Indicadores</h1>
          <p>Estados atuais dos pedidos recebidos no período selecionado.</p>
        </div>
        <div className="heading-actions">
          <select
            aria-label="Período dos indicadores"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="1">Hoje · 22 outubro</option>
          </select>
          <button
            className="button secondary"
            onClick={() => onExport(filtered)}
          >
            <Download size={15} /> Exportar CSV
          </button>
        </div>
      </div>
      <p className="report-scope">
        {filtered.requests.length} pedidos recebidos no período selecionado ·
        referência: 22 out. 2026, 10:30
      </p>
      <section className="panel report-section report-volume">
        <PanelHeading title="Volume operacional" />
        <div className="report-numbers">
          <div>
            <span>Recebidos</span>
            <strong>{filtered.requests.length}</strong>
          </div>
          <div>
            <span>Abertos</span>
            <strong>{m.open}</strong>
          </div>
          <div>
            <span>Concluídos</span>
            <strong>{m.closed}</strong>
          </div>
        </div>
        <div className="distribution-grid">
          {[CATEGORIES, CHANNELS].map((group, i) => (
            <div key={i}>
              <h3>{i ? "Por canal" : "Por categoria"}</h3>
              {group.map((value) => {
                const n = filtered.requests.filter((r) =>
                  i ? r.channel === value : r.category === value,
                ).length;
                return (
                  <div
                    className="distribution-row"
                    data-category={i === 0 ? value : undefined}
                    data-channel={i === 1 ? value : undefined}
                    key={value}
                  >
                    <span>{value}</span>
                    <div>
                      <i
                        style={{
                          width: `${filtered.requests.length ? (n / filtered.requests.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <b>{n}</b>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
      <section className="panel report-section report-followup">
        <PanelHeading title="Tempos e acompanhamento" />
        <div className="report-numbers">
          <div>
            <span>Primeira resposta média</span>
            <strong>
              {m.responseMinutes === null ? "—" : m.responseMinutes + " min"}
            </strong>
            <small>
              {m.responseSample} pedidos com resposta ou chamada atendida
            </small>
          </div>
          <div>
            <span>Sem resposta</span>
            <strong
              className={m.unanswered > 0 ? "metric-attention" : undefined}
            >
              {m.unanswered}
            </strong>
          </div>
          <div>
            <span>Fora do prazo</span>
            <strong className={m.overdue > 0 ? "metric-risk" : undefined}>
              {m.overdue}
            </strong>
          </div>
        </div>
        <p className="metric-note">
          Notas internas não contam como respostas. Responder não altera o
          estado operacional. Prazos exemplificativos da demo.
        </p>
      </section>
      <section className="panel report-section report-team">
        <PanelHeading
          title="Equipa"
          subtitle="Distribuição pelo responsável atual"
        />
        <div className="table-scroll">
          <table className="request-table">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Atribuídos</th>
                <th>Pendentes</th>
                <th>Concluídos</th>
              </tr>
            </thead>
            <tbody>
              {TEAM.map((t) => {
                const rs = filtered.requests.filter((r) => r.assignee === t);
                return (
                  <tr key={t}>
                    <td>{t}</td>
                    <td>{rs.length}</td>
                    <td>{rs.filter((r) => r.status !== "Concluído").length}</td>
                    <td>{rs.filter((r) => r.status === "Concluído").length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="metric-note">
        Telefonia: existem apenas registos fictícios de chamadas atendidas.
        Chamadas perdidas, filas e tempos de espera não são recolhidos nesta
        demo; dependem de uma futura integração com 3CX.
      </p>
    </>
  );
}
