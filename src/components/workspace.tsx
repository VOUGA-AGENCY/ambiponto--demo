"use client";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Users,
  Search,
  Plus,
  Bell,
  ArrowUpRight,
  Leaf,
  Settings2,
  PanelLeftOpen,
  HelpCircle,
  X,
  Filter,
  RotateCcw,
  CheckCheck,
  Phone,
  Mail,
  PhoneOff,
  Clock3,
  MapPin,
  Check,
} from "lucide-react";
import GlassHeader from "./glass-header";
import seed from "@/data/demo.json";
import {
  Store,
  Request,
  Channel,
  Category,
  Contact,
  metrics,
  isOverdue,
  isUnanswered,
  TEAM,
  CATEGORIES,
  CHANNELS,
  STATUSES,
  updateRequest,
  addInteraction,
  validStore,
  demoTimestamp,
  shortDate,
  fromLisbonInput,
  compareRequests,
  organizations,
} from "@/lib/model";
import Dashboard, { Reports, RequestTable } from "./dashboard";
import RequestDetail from "./request-detail";
import { Avatar, ChannelIcon, StatusBadge, Modal, Empty, Toast } from "./ui";
const initial = seed as Store;
const STORAGE = "ambiponto.demo.three-cases.v1";
type Page = "dashboard" | "inbox" | "reports" | "contacts";
type ModalType = "demo" | "new" | "settings" | "call" | null;
export default function Workspace() {
  const [store, setStore] = useState<Store>(initial),
    [ready, setReady] = useState(false),
    [page, setPage] = useState<Page>("dashboard"),
    [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState<ModalType>(null),
    [toast, setToast] = useState(""),
    [notifications, setNotifications] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false),
    [contact, setContact] = useState<Contact | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [headerNow, setHeaderNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setHeaderNow(new Date());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  const hour = headerNow
    ? Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Lisbon",
          hour: "2-digit",
          hourCycle: "h23",
        }).format(headerNow),
      )
    : null;
  const greeting =
    hour === null
      ? "Olá"
      : hour < 12
        ? "Bom dia"
        : hour < 20
          ? "Boa tarde"
          : "Boa noite";
  const headerDate = headerNow
    ? new Intl.DateTimeFormat("pt-PT", {
        timeZone: "Europe/Lisbon",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(headerNow)
    : "\u00a0";
  const notify = (s: string) => {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (validStore(parsed)) setStore(parsed);
        else
          notify(
            "Os dados locais foram repostos para manter a demo consistente.",
          );
      }
    } catch {
      notify(
        "Não foi possível recuperar os dados locais. Demo inicial carregada.",
      );
    }
    setReady(true);
    const route = () => {
      const hash = location.hash.slice(1);
      if (hash.startsWith("pedido/")) {
        setSelected(hash.slice(7));
        setPage("inbox");
      } else {
        setSelected(null);
        setPage(
          ["inbox", "reports", "contacts"].includes(hash)
            ? (hash as Page)
            : "dashboard",
        );
      }
    };
    route();
    window.addEventListener("hashchange", route);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifications(false);
        setMobileMenu(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", route);
      window.removeEventListener("keydown", key);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(STORAGE, JSON.stringify(store));
      } catch {
        notify(
          "As alterações mantêm-se nesta sessão, mas o navegador não permite guardá-las.",
        );
      }
  }, [store, ready]);
  const nav = (p: Page) => {
    setPage(p);
    setSelected(null);
    setMobileMenu(false);
    setNotifications(false);
    location.hash = p;
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const open = (id: string) => {
    setSelected(id);
    setPage("inbox");
    setNotifications(false);
    setModal(null);
    location.hash = "pedido/" + id;
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const filterNav = (f: string) => {
    setFilter(f);
    setSearch("");
    nav("inbox");
  };
  const patch = (id: string, p: Partial<Request>) => {
    setStore((s) => updateRequest(s, id, p));
    notify(
      p.status === "Concluído"
        ? "Pedido concluído. Indicadores atualizados."
        : "Pedido atualizado.",
    );
  };
  const send = (
    id: string,
    body: string,
    kind: "outgoing" | "note",
    channel?: Channel,
  ) => {
    setStore((s) => addInteraction(s, id, body, kind, undefined, channel));
    notify(
      kind === "note"
        ? "Nota interna guardada."
        : "Resposta simulada guardada no histórico.",
    );
  };
  const m = metrics(store);
  const current = store.requests.find((r) => r.id === selected);
  const exportCSV = (s: Store) => {
    const escape = (v: unknown) => {
      const raw = String(v ?? "");
      const safe = /^[=+@\-]/.test(raw) ? "'" + raw : raw;
      return '"' + safe.replace(/"/g, '""') + '"';
    };
    const rows = [
      [
        "Pedido",
        "Assunto",
        "Contacto",
        "Canal",
        "Categoria",
        "Estado",
        "Responsável",
        "Prioridade",
        "Recebido",
        "Prazo",
      ],
      ...s.requests.map((r) => [
        r.id,
        r.subject,
        s.contacts.find((c) => c.id === r.contactId)?.name,
        r.channel,
        r.category,
        r.status,
        r.assignee,
        r.priority,
        r.createdAt,
        r.dueAt,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map((r) => r.map(escape).join(";")).join("\r\n")],
        { type: "text/csv;charset=utf-8;" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ambiponto-pedidos-22-10-2026.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Relatório exportado.");
  };
  return (
    <div className={`app-shell ${selected ? "detail-workspace" : ""}`}>
      <a className="skip-link" href="#main-content">
        Saltar para o conteúdo
      </a>
      <div className="main-shell">
        <header className="glass-header">
          <GlassHeader />
          <div className="topbar">
            <div className="topbar-actions">
              <div className="notification-wrap">
                <button
                  className={`icon-button notifications ${notifications ? "selected" : ""}`}
                  aria-label="Ver pedidos que exigem atenção"
                  aria-expanded={notifications}
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell size={19} />
                  {m.overdue > 0 && <i />}
                </button>
                {notifications && (
                  <div className="notification-popover">
                    <div>
                      <h3>Precisam de atenção</h3>
                      <span>{m.overdue} pedidos em atraso</span>
                    </div>
                    {store.requests.filter(isOverdue).map((r) => (
                      <button key={r.id} onClick={() => open(r.id)}>
                        <Clock3 size={15} />
                        <span>
                          <b>{r.subject}</b>
                          <small>
                            {r.assignee} · {r.id}
                          </small>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    ))}
                    {!m.overdue && <p>Todos os prazos estão em dia.</p>}
                  </div>
                )}
              </div>
              <span className="topbar-divider" />
              <Avatar name="Ana Martins" small />
            </div>
            <button
              className="icon-button glass-help"
              aria-label="Sobre esta demonstração"
              onClick={() => setModal("settings")}
            >
              <Settings2 size={18} />
            </button>
          </div>
          <div className="hero-copy personal-header">
            <img
              className="header-brand"
              src="/ambiponto.png"
              alt="Ambiponto"
              width={2000}
              height={757}
            />
            <h2>
              {greeting},<br />
              <em>Ana Martins</em>
            </h2>
            <p className="header-date">{headerDate}</p>
            <div className="glass-priorities">
              <button
                className="glass-priority late"
                onClick={() => filterNav("overdue")}
                aria-label={`${m.overdue} pedidos em atraso`}
              >
                <Clock3 size={17} />
                <span>
                  Em atraso<strong>{m.overdue}</strong>
                </span>
                <ArrowUpRight size={15} />
              </button>
              <button
                className="glass-priority pending"
                onClick={() => filterNav("unanswered")}
                aria-label={`${m.unanswered} pedidos por responder`}
              >
                <Mail size={17} />
                <span>
                  Por responder<strong>{m.unanswered}</strong>
                </span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
          <div className="hero-navigation">
            <nav aria-label="Navegação principal">
              {[
                { id: "dashboard", label: "Visão geral" },
                { id: "inbox", label: "Caixa de entrada" },
                { id: "contacts", label: "Contactos" },
                { id: "reports", label: "Indicadores" },
              ].map((n) => (
                <button
                  key={n.id}
                  className={page === n.id ? "active" : ""}
                  onClick={() => {
                    if (n.id === "inbox") setFilter("all");
                    nav(n.id as Page);
                  }}
                >
                  {n.label}
                  {n.id === "inbox" && <span>{m.open}</span>}
                </button>
              ))}
            </nav>
            <div className="header-work-tools">
              <select
                className="glass-queue-filter"
                aria-label="Fila de pedidos"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  nav("inbox");
                }}
              >
                <option value="all">Todos os pedidos</option>
                <option value="mine">Os meus pedidos</option>
                <option value="unassigned">Por atribuir</option>
                <option value="unanswered">Por responder</option>
                <option value="overdue">Em atraso</option>
                <option value="open">Em aberto</option>
                <option value="closed">Concluídos</option>
                {CATEGORIES.includes(filter as Category) && (
                  <option value={filter}>{filter}</option>
                )}
              </select>
              <div className="header-request-search" role="search">
                <input
                  aria-label="Pesquisar na caixa de entrada"
                  placeholder="Pesquisar pedidos…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (page !== "inbox" || selected) nav("inbox");
                  }}
                />
                {search ? (
                  <button
                    aria-label="Limpar pesquisa"
                    onClick={() => setSearch("")}
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <Search size={17} aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        </header>
        <main
          id="main-content"
          className={`main-content ${selected ? "detail-content" : ""}`}
        >
          <div className="page-topline">
            <span>
              {selected
                ? "ACOMPANHAMENTO DE PEDIDO"
                : page === "dashboard"
                  ? "VISÃO GERAL"
                  : page === "inbox"
                    ? "GESTÃO DE PEDIDOS"
                    : page === "reports"
                      ? "DESEMPENHO OPERACIONAL"
                      : "RELAÇÕES E HISTÓRICO"}
            </span>
            <span>
              <span className="date-dot" /> Quinta-feira, 22 de outubro de 2026
            </span>
          </div>
          {selected ? (
            current ? (
              <RequestDetail
                key={current.id}
                store={store}
                request={current}
                onBack={() => nav("inbox")}
                onUpdate={patch}
                onSend={send}
                onCall={() => setModal("call")}
                onOpen={open}
              />
            ) : (
              <div>
                <Empty
                  icon={Inbox}
                  title="Pedido não encontrado"
                  description="Este pedido não existe no ambiente de demonstração."
                />
                <button
                  className="button secondary"
                  onClick={() => nav("inbox")}
                >
                  Voltar à caixa de entrada
                </button>
              </div>
            )
          ) : page === "dashboard" ? (
            <Dashboard
              store={store}
              onOpen={open}
              onFilter={filterNav}
              onDemo={() => setModal("demo")}
              onReports={() => nav("reports")}
              onUpdate={patch}
            />
          ) : page === "inbox" ? (
            <InboxView
              key={filter}
              store={store}
              search={search}
              onSearch={setSearch}
              filter={filter}
              onFilter={setFilter}
              onOpen={open}
              onNew={() => setModal("new")}
              onUpdate={patch}
            />
          ) : page === "reports" ? (
            <Reports store={store} onExport={exportCSV} />
          ) : (
            <ContactsView store={store} onContact={setContact} />
          )}
        </main>
      </div>
      {toast && <Toast message={toast} />}
      <div className="sr-only" aria-live="polite">
        {ready ? "Demonstração pronta" : ""}
      </div>
      {modal === "demo" && (
        <Modal
          title="Três canais. Uma operação."
          subtitle="Percursos prontos a apresentar, com dados inteiramente fictícios."
          onClose={() => setModal(null)}
          wide
        >
          <div className="demo-scenarios">
            {[
              {
                id: "AMB-1048",
                channel: "E-mail",
                category: "Abate",
                title: "Entrega de viatura para abate",
                text: "António, de Santarém, quer entregar um Opel Corsa de 2006. Classifique, atribua e acompanhe o pedido.",
                steps: "Receber → Atribuir → Responder",
                number: "01",
              },
              {
                id: "AMB-1047",
                channel: "WhatsApp",
                category: "Peças",
                title: "Pedido de farol com fotografia",
                text: "A Auto Santos procura um farol esquerdo de Clio IV. Veja a fotografia e responda à oficina.",
                steps: "Consultar anexo → Responder → Concluir",
                number: "02",
              },
              {
                id: "AMB-1046",
                channel: "Telefone",
                category: "Expedições",
                title: "Acompanhamento de expedição",
                text: "Miguel, do Porto, procura a caixa de velocidades enviada há três dias. Simule a chamada e registe o acompanhamento.",
                steps: "Atender → Registar → Acompanhar",
                number: "03",
              },
            ].map((c) => (
              <button
                className="scenario"
                key={c.id}
                onClick={() => open(c.id)}
              >
                <div>
                  <ChannelIcon channel={c.channel as Channel} size={21} />
                  <span>{c.number}</span>
                </div>
                <small>
                  {c.channel} <i>·</i> {c.category}
                </small>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <footer>
                  <span>{c.steps}</span>
                  <ArrowUpRight size={18} />
                </footer>
              </button>
            ))}
          </div>
          <div className="modal-info">
            <span className="tiny-dot" /> As alterações ficam neste navegador.
            Pode repor a demonstração a qualquer momento.
          </div>
        </Modal>
      )}
      {modal === "new" && (
        <NewRequest
          store={store}
          onClose={() => setModal(null)}
          onCreate={(r, body, c) => {
            setStore((s) => ({
              ...s,
              contacts: c ? [...s.contacts, c] : s.contacts,
              requests: [r, ...s.requests],
              interactions: [
                ...s.interactions,
                {
                  id: crypto.randomUUID(),
                  requestId: r.id,
                  contactId: r.contactId,
                  channel: r.channel,
                  kind: r.channel === "Telefone" ? "call" : "incoming",
                  author:
                    c?.name ||
                    s.contacts.find((c) => c.id === r.contactId)!.name,
                  body,
                  at: r.createdAt,
                  ...(r.channel === "Telefone" ? { duration: 0 } : {}),
                },
              ],
            }));
            open(r.id);
            notify("Novo pedido criado e associado ao contacto.");
          }}
        />
      )}
      {modal === "settings" && (
        <Settings
          onClose={() => setModal(null)}
          onReset={() => {
            setStore(structuredClone(initial));
            setModal(null);
            setSearch("");
            setFilter("all");
            nav("dashboard");
            notify("Demonstração reposta. Os três percursos estão prontos.");
          }}
        />
      )}
      {modal === "call" && current && (
        <CallSimulator
          contact={store.contacts.find((c) => c.id === current.contactId)!}
          request={current}
          onClose={() => setModal(null)}
          onSave={(body, duration) => {
            setStore((s) =>
              addInteraction(s, current.id, body, "call", duration),
            );
            setModal(null);
            notify("Chamada associada ao contacto e ao pedido.");
          }}
        />
      )}
      {contact && (
        <Modal
          title={contact.name}
          subtitle={`${contact.company || contact.type} · ${contact.location}`}
          onClose={() => setContact(null)}
          wide
        >
          {contact.company && (
            <p className="organization-context">
              Empresa: <strong>{contact.company}</strong> ·{" "}
              {
                store.contacts.filter((c) => c.company === contact.company)
                  .length
              }{" "}
              contacto(s) associado(s)
            </p>
          )}
          <div className="contact-modal-info">
            <span>
              <Mail size={15} />
              {contact.email}
            </span>
            <span>
              <Phone size={15} />
              {contact.phone}
            </span>
          </div>
          <div className="history-list">
            {store.requests
              .filter((r) => r.contactId === contact.id)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setContact(null);
                    open(r.id);
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
    </div>
  );
}
function InboxView({
  store,
  search,
  onSearch,
  filter,
  onFilter,
  onOpen,
  onNew,
  onUpdate,
}: {
  store: Store;
  search: string;
  onSearch: (s: string) => void;
  filter: string;
  onFilter: (s: string) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onUpdate: (id: string, p: Partial<Request>) => void;
}) {
  const [channel, setChannel] = useState("all"),
    [category, setCategory] = useState(
      CATEGORIES.includes(filter as Category) ? filter : "all",
    ),
    [assignee, setAssignee] = useState("all"),
    [status, setStatus] = useState("all"),
    [sort, setSort] = useState("urgent");
  const rows = store.requests
    .filter((r) => {
      const c = store.contacts.find((c) => c.id === r.contactId)!;
      return (
        (filter !== "mine" ||
          (r.assignee === "Ana Martins" && r.status !== "Concluído")) &&
        (filter !== "unassigned" ||
          (r.assignee === "Por atribuir" && r.status !== "Concluído")) &&
        (filter !== "open" || r.status !== "Concluído") &&
        (filter !== "closed" || r.status === "Concluído") &&
        (filter !== "unanswered" || isUnanswered(r, store.interactions)) &&
        (filter !== "overdue" || isOverdue(r)) &&
        (channel === "all" || r.channel === channel) &&
        (category === "all" || r.category === category) &&
        (assignee === "all" || r.assignee === assignee) &&
        (status === "all" || r.status === status) &&
        `${r.id} ${r.subject} ${c.name} ${c.company || ""} ${c.email} ${c.phone}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(
            search
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, ""),
          )
      );
    })
    .sort((a, b) => compareRequests(store, a, b, sort));
  const counts = metrics(store);
  const clear = () => {
    setChannel("all");
    setCategory("all");
    setAssignee("all");
    setStatus("all");
    onSearch("");
    onFilter("all");
  };
  const active =
    search ||
    channel !== "all" ||
    category !== "all" ||
    assignee !== "all" ||
    status !== "all" ||
    filter !== "all";
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            Caixa de entrada{" "}
            <span className="heading-count">{store.requests.length}</span>
          </h1>
          <p>Atribua responsáveis e acompanhe as próximas ações e os prazos.</p>
        </div>
        <button className="button primary" onClick={onNew}>
          <Plus size={17} /> Novo pedido
        </button>
      </div>
      <section className="panel inbox-panel">
        <div className="inbox-tabs">
          {[
            {
              key: "all",
              label: "Todos",
              count: store.requests.length,
            },
            {
              key: "mine",
              label: "Os meus pedidos",
              count: store.requests.filter(
                (r) => r.assignee === "Ana Martins" && r.status !== "Concluído",
              ).length,
            },
            {
              key: "unassigned",
              label: "Por atribuir",
              count: store.requests.filter(
                (r) =>
                  r.assignee === "Por atribuir" && r.status !== "Concluído",
              ).length,
            },
            {
              key: "unanswered",
              label: "Por responder",
              count: counts.unanswered,
            },
            { key: "overdue", label: "Em atraso", count: counts.overdue },
          ].map((t) => (
            <button
              key={t.key}
              className={
                filter === t.key ||
                (t.key === "all" && CATEGORIES.includes(filter as Category))
                  ? "active"
                  : ""
              }
              onClick={() => onFilter(t.key)}
            >
              {t.label}
              <span>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="filter-bar">
          <div className="filter-selects">
            <span className="filter-label">
              <Filter size={14} /> Filtrar
            </span>
            <select
              aria-label="Filtrar por canal"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="all">Todos os canais</option>
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar por categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar por responsável"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="all">Responsáveis</option>
              {TEAM.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Estados</option>
              {STATUSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label>
              Ordenar por{" "}
              <select
                aria-label="Ordenar pedidos"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="urgent">Urgência</option>
                <option value="oldest">Mais antigos</option>
                <option value="activity">Última atividade</option>
                <option value="recent">Mais recentes</option>
                <option value="due">Prazo mais próximo</option>
              </select>
            </label>{" "}
            {active && (
              <button className="text-button" onClick={clear}>
                Limpar <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="table-meta">
          <span>
            {rows.length} pedido{rows.length !== 1 ? "s" : ""}
            {active ? " encontrado" + (rows.length !== 1 ? "s" : "") : ""}
          </span>
        </div>
        {rows.length ? (
          <RequestTable
            store={store}
            requests={rows}
            onOpen={onOpen}
            onUpdate={onUpdate}
          />
        ) : (
          <Empty
            icon={Search}
            title="Não encontrámos pedidos"
            description="Experimente outra pesquisa ou limpe os filtros para ver todos os pedidos."
          />
        )}
        <div className="table-bottom">
          <span>
            {rows.length
              ? `A mostrar ${rows.length} de ${store.requests.length} pedidos`
              : "Nenhum resultado"}
          </span>
          <span>
            <span className="tiny-dot" /> Atualizado com as alterações desta
            sessão
          </span>
        </div>
      </section>
    </>
  );
}
function ContactsView({
  store,
  onContact,
}: {
  store: Store;
  onContact: (c: Contact) => void;
}) {
  const [query, setQuery] = useState("");
  const contacts = store.contacts.filter((c) =>
    `${c.name} ${c.company || ""} ${c.location} ${c.email} ${c.phone}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            Contactos{" "}
            <span className="heading-count">{store.contacts.length}</span>
          </h1>
          <p>Pessoas, empresas e histórico de contactos.</p>
        </div>
      </div>
      <section className="panel">
        <div className="contacts-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              aria-label="Pesquisar contactos"
              placeholder="Pesquisar nome, oficina ou localidade…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <span>
            {contacts.length} contactos · {organizations(store.contacts).length}{" "}
            empresas
          </span>
        </div>
        <div className="table-scroll">
          <table className="request-table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Empresa</th>
                <th>Telefone / E-mail</th>
                <th>Pedidos em aberto</th>
                <th>Última interação</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => {
                const rs = store.requests.filter((r) => r.contactId === c.id);
                const last = store.interactions
                  .filter((i) => i.contactId === c.id)
                  .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
                return (
                  <tr
                    key={c.id}
                    className="clickable-contact"
                    tabIndex={0}
                    aria-label={`Abrir contacto ${c.name}`}
                    onClick={(event) => {
                      if (
                        (event.target as HTMLElement).closest(
                          "button, a, select, input, textarea",
                        )
                      )
                        return;
                      onContact(c);
                    }}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onContact(c);
                      }
                    }}
                  >
                    <td>
                      <button
                        className="request-title"
                        onClick={() => onContact(c)}
                      >
                        {c.name}
                      </button>
                      <div className="table-sub">{c.location}</div>
                    </td>
                    <td>{c.company || "—"}</td>
                    <td>
                      {c.phone}
                      <div className="table-sub">{c.email}</div>
                    </td>
                    <td>{rs.filter((r) => r.status !== "Concluído").length}</td>
                    <td>
                      {last
                        ? shortDate(last.at) +
                          " · " +
                          new Intl.DateTimeFormat("pt-PT", {
                            timeZone: "Europe/Lisbon",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(last.at))
                        : "Sem interações"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!contacts.length && (
          <Empty
            icon={Users}
            title="Nenhum contacto encontrado"
            description="Experimente outro nome ou localidade."
          />
        )}
      </section>
    </>
  );
}
function NewRequest({
  store,
  onClose,
  onCreate,
}: {
  store: Store;
  onClose: () => void;
  onCreate: (r: Request, body: string, c?: Contact) => void;
}) {
  const [contactId, setContactId] = useState(store.contacts[0].id);
  return (
    <Modal
      title="Novo pedido"
      subtitle="Registe um contacto recebido e dê início ao acompanhamento."
      onClose={onClose}
    >
      <form
        className="request-form"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          const bodyInput = e.currentTarget.elements.namedItem(
            "body",
          ) as HTMLTextAreaElement;
          if (!String(d.get("body")).trim()) {
            bodyInput.setCustomValidity("Descreva o pedido recebido.");
            bodyInput.reportValidity();
            return;
          }
          const at = demoTimestamp(store.interactions);
          const id =
            "AMB-" +
            (Math.max(
              ...store.requests.map((r) => Number(r.id.replace("AMB-", ""))),
              1048,
            ) +
              1);
          const c: Contact | undefined =
            contactId === "new"
              ? {
                  id: crypto.randomUUID(),
                  name: String(d.get("name")).trim(),
                  email: String(d.get("email")).trim(),
                  phone: String(d.get("phone")).trim(),
                  location: String(d.get("location")).trim(),
                  type: "Particular",
                  company: String(d.get("company") || "") || undefined,
                }
              : undefined;
          onCreate(
            {
              id,
              contactId: c?.id || contactId,
              subject: String(d.get("subject")).trim(),
              channel: String(d.get("channel")) as Channel,
              category: String(d.get("category")) as Category,
              assignee: String(d.get("assignee")),
              priority: "Normal",
              status: "Novo",
              createdAt: at,
              dueAt: fromLisbonInput(String(d.get("dueAt"))),
              nextAction: "Analisar o pedido e dar uma primeira resposta.",
            },
            String(d.get("body")).trim(),
            c,
          );
        }}
      >
        <label>
          Contacto
          <select
            name="contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
          >
            {store.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? " · " + c.company : ""}
              </option>
            ))}
            <option value="new">+ Criar novo contacto</option>
          </select>
        </label>
        {contactId === "new" && (
          <div className="new-contact-fields">
            <label>
              Empresa associada
              <select name="company">
                <option value="">Sem empresa</option>
                {organizations(store.contacts).map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome
              <input
                name="name"
                required
                pattern=".*\S.*"
                placeholder="Nome completo"
              />
            </label>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                placeholder="nome@example.com"
              />
            </label>
            <div className="form-row">
              <label>
                Telefone
                <input name="phone" required placeholder="+351…" />
              </label>
              <label>
                Localidade
                <input name="location" required placeholder="Santarém" />
              </label>
            </div>
          </div>
        )}
        <label>
          Assunto
          <input
            name="subject"
            required
            pattern=".*\S.*"
            maxLength={120}
            placeholder="Ex.: Pedido de informação sobre uma peça"
          />
        </label>
        <div className="form-row">
          <label>
            Canal
            <select name="channel">
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select name="category">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Responsável
            <select name="assignee">
              {TEAM.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Prazo
            <input
              name="dueAt"
              type="datetime-local"
              required
              defaultValue="2026-10-23T12:00"
            />
          </label>
        </div>
        <label>
          Mensagem ou registo do contacto
          <textarea
            name="body"
            required
            minLength={3}
            onChange={(e) => e.target.setCustomValidity("")}
            placeholder="Descreva o pedido recebido…"
          />
        </label>
        <div className="modal-form-footer">
          <span>Registo local · dados de demonstração</span>
          <button className="button primary" type="submit">
            <Plus size={15} /> Criar pedido
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Settings({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal
      title="Um espaço para experimentar"
      subtitle="Ambiente de demonstração · Ambiponto"
      onClose={onClose}
    >
      <div className="settings-body">
        <div className="settings-highlight">
          <Leaf size={26} />
          <p>
            Uma visão do que a operação pode ser: contactos organizados, pedidos
            acompanhados e uma equipa com contexto.
          </p>
        </div>
        <dl>
          <div>
            <dt>Dados e alterações</dt>
            <dd>
              Fictícios, guardados apenas neste navegador. Não são enviados para
              qualquer serviço.
            </dd>
          </div>
          <div>
            <dt>Canais de comunicação</dt>
            <dd>
              WhatsApp, e-mail e telefone são simulados. As respostas e chamadas
              ficam no histórico local.
            </dd>
          </div>
          <div>
            <dt>Data da demonstração</dt>
            <dd>
              22 de outubro de 2026, às 10:30. Os prazos usam este relógio fixo
              para manter os percursos consistentes.
            </dd>
          </div>
          <div>
            <dt>Preparado por</dt>
            <dd>Vouga Agency, em parceria com a Leanked.</dd>
          </div>
        </dl>
        <div className="reset-zone">
          <div>
            <h3>Recomeçar a demonstração</h3>
            <p>
              {confirm
                ? "Esta ação remove as alterações locais e recupera os 18 pedidos iniciais."
                : "Recupere os pedidos e conversas originais para uma nova apresentação."}
            </p>
          </div>
          {confirm ? (
            <div className="heading-actions">
              <button
                className="button secondary"
                onClick={() => setConfirm(false)}
              >
                Cancelar
              </button>
              <button className="button danger" onClick={onReset}>
                Sim, repor dados
              </button>
            </div>
          ) : (
            <button
              className="button secondary"
              onClick={() => setConfirm(true)}
            >
              <RotateCcw size={15} /> Repor demo
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
function CallSimulator({
  contact,
  request,
  onClose,
  onSave,
}: {
  contact: Contact;
  request: Request;
  onClose: () => void;
  onSave: (body: string, duration: number) => void;
}) {
  const [step, setStep] = useState<"ringing" | "active" | "ended">("ringing"),
    [seconds, setSeconds] = useState(0),
    [summary, setSummary] = useState(
      request.id === "AMB-1046"
        ? "Cliente pede uma atualização da caixa de velocidades enviada há três dias. Confirmar o estado da expedição EXP-2026-0831 com a transportadora e voltar ao contacto."
        : "Chamada de acompanhamento sobre: " +
            request.subject +
            ". " +
            request.nextAction,
    );
  useEffect(() => {
    if (step !== "active") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [step]);
  return (
    <Modal
      title={
        step === "ringing"
          ? "Chamada recebida"
          : step === "active"
            ? "Chamada em curso"
            : "Registar acompanhamento"
      }
      subtitle="Simulação de telefone · sem ligação real"
      onClose={onClose}
    >
      <div className="call-simulator">
        <div className={`caller-avatar ${step === "ringing" ? "ringing" : ""}`}>
          <Avatar name={contact.name} />
        </div>
        <h2>{contact.name}</h2>
        <p>
          {contact.phone} <span>·</span> {contact.location}
        </p>
        <div className="identified">
          <Check size={13} /> Contacto identificado
        </div>
        <div className="linked-request">
          <span>PEDIDO ASSOCIADO</span>
          <b>{request.subject}</b>
          <small>
            {request.id} · {request.category} · {request.assignee}
          </small>
        </div>
        {step === "ringing" ? (
          <>
            <p className="call-instruction">
              O histórico do cliente está disponível antes de atender.
            </p>
            <button
              className="button primary call-answer"
              onClick={() => setStep("active")}
            >
              <Phone size={19} /> Atender chamada
            </button>
          </>
        ) : step === "active" ? (
          <>
            <div className="call-timer">
              <span className="live-dot" />
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </div>
            <div className="call-wave">
              {[12, 24, 37, 18, 30, 45, 27, 16, 35, 23, 42, 16, 28].map(
                (h, i) => (
                  <i
                    key={i}
                    style={{ height: h, animationDelay: `${i * 0.1}s` }}
                  />
                ),
              )}
            </div>
            <button
              className="button danger call-answer"
              onClick={() => setStep("ended")}
            >
              <PhoneOff size={18} /> Terminar chamada
            </button>
          </>
        ) : (
          <div className="call-notes">
            <label>
              Registo manual da chamada
              <textarea
                aria-label="Registo manual da chamada"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </label>
            <div>
              <span>
                Duração · {Math.floor(seconds / 60)}m {seconds % 60}s
              </span>
              <button
                className="button primary"
                disabled={!summary.trim()}
                onClick={() => onSave(summary, seconds)}
              >
                <CheckCheck size={16} /> Guardar no pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
