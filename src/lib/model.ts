export type Channel = "WhatsApp" | "E-mail" | "Telefone";
export type Category = "Abate" | "Peças" | "Expedições";
export type Status = "Novo" | "Em curso" | "A aguardar" | "Concluído";
export type Priority = "Baixa" | "Normal" | "Alta" | "Urgente";
export interface Contact {
  id: string;
  name: string;
  company?: string;
  location: string;
  email: string;
  phone: string;
  type: "Particular" | "Oficina";
}
export interface Request {
  id: string;
  contactId: string;
  subject: string;
  category: Category;
  channel: Channel;
  status: Status;
  priority: Priority;
  assignee: string;
  createdAt: string;
  dueAt: string;
  nextAction: string;
  closedAt?: string;
}
export interface Interaction {
  id: string;
  requestId: string;
  contactId: string;
  channel: Channel;
  kind: "incoming" | "outgoing" | "note" | "event" | "call";
  body: string;
  at: string;
  author: string;
  attachment?: string;
  duration?: number;
  operator?: string;
  callStatus?: "Atendida";
  transcript?: string;
}
export interface Store {
  version: 1;
  contacts: Contact[];
  requests: Request[];
  interactions: Interaction[];
}
export const NOW = "2026-10-22T10:30:00+01:00";
export const TEAM = [
  "Por atribuir",
  "Ana Martins",
  "Ricardo Silva",
  "João Ferreira",
  "Mariana Costa",
];
export const CATEGORIES: Category[] = ["Abate", "Peças", "Expedições"];
export const CHANNELS: Channel[] = ["WhatsApp", "E-mail", "Telefone"];
export const STATUSES: Status[] = [
  "Novo",
  "Em curso",
  "A aguardar",
  "Concluído",
];
export const PRIORITIES: Priority[] = ["Baixa", "Normal", "Alta", "Urgente"];
export const isOverdue = (r: Request) =>
  r.status !== "Concluído" && Date.parse(r.dueAt) < Date.parse(NOW);
export const isUnanswered = (r: Request, interactions: Interaction[]) =>
  r.status !== "Concluído" &&
  !interactions.some(
    (i) => i.requestId === r.id && (i.kind === "outgoing" || i.kind === "call"),
  );
export function metrics(s: Store) {
  const replies = s.requests.flatMap((r) => {
    const first = s.interactions
      .filter(
        (i) =>
          i.requestId === r.id && (i.kind === "outgoing" || i.kind === "call"),
      )
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0];
    return first
      ? [Math.max(0, (Date.parse(first.at) - Date.parse(r.createdAt)) / 60000)]
      : [];
  });
  return {
    open: s.requests.filter((r) => r.status !== "Concluído").length,
    unanswered: s.requests.filter((r) => isUnanswered(r, s.interactions))
      .length,
    overdue: s.requests.filter(isOverdue).length,
    closed: s.requests.filter((r) => r.status === "Concluído").length,
    responseMinutes: replies.length
      ? Math.round(replies.reduce((a, b) => a + b, 0) / replies.length)
      : null,
    responseSample: replies.length,
  };
}
export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
export const time = (date: string) =>
  new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  }).format(new Date(date));
export const shortDate = (date: string) =>
  new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Lisbon",
  }).format(new Date(date));
export function demoTimestamp(interactions: Interaction[]) {
  return new Date(
    Math.max(Date.parse(NOW), ...interactions.map((i) => Date.parse(i.at))) +
      60000,
  ).toISOString();
}
export function updateRequest(
  s: Store,
  id: string,
  patch: Partial<Request>,
): Store {
  const r = s.requests.find((r) => r.id === id);
  if (!r) return s;
  const at = demoTimestamp(s.interactions);
  const changed = Object.entries(patch).filter(
    ([k, v]) => r[k as keyof Request] !== v,
  );
  if (!changed.length) return s;
  const labels: Record<string, string> = {
    status: "Estado",
    assignee: "Responsável",
    category: "Categoria",
    priority: "Prioridade",
    dueAt: "Prazo",
    nextAction: "Próxima ação",
  };
  return {
    ...s,
    requests: s.requests.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            ...(patch.status
              ? { closedAt: patch.status === "Concluído" ? at : undefined }
              : {}),
          }
        : item,
    ),
    interactions: [
      ...s.interactions,
      {
        id: crypto.randomUUID(),
        requestId: id,
        contactId: r.contactId,
        channel: r.channel,
        kind: "event",
        author: "Ana Martins",
        at,
        body: changed
          .map(
            ([k, v]) =>
              `${labels[k] || k}: ${k === "dueAt" ? shortDate(String(v)) + " · " + time(String(v)) : v}`,
          )
          .join(" · "),
      },
    ],
  };
}
export function addInteraction(
  s: Store,
  requestId: string,
  body: string,
  kind: "outgoing" | "note" | "call",
  duration?: number,
  channel?: Channel,
): Store {
  const r = s.requests.find((r) => r.id === requestId);
  if (!r || !body.trim()) return s;
  const at = demoTimestamp(s.interactions);
  return {
    ...s,
    interactions: [
      ...s.interactions,
      {
        id: crypto.randomUUID(),
        requestId,
        contactId: r.contactId,
        channel: kind === "call" ? "Telefone" : channel || r.channel,
        ...(kind === "call"
          ? { operator: "Ana Martins", callStatus: "Atendida" as const }
          : {}),
        kind,
        author: "Ana Martins",
        body: body.trim(),
        at,
        ...(duration !== undefined ? { duration } : {}),
      },
    ],
  };
}
export function validStore(value: unknown): value is Store {
  if (!value || typeof value !== "object") return false;
  const s = value as Store;
  return (
    s.version === 1 &&
    Array.isArray(s.contacts) &&
    s.contacts.length > 0 &&
    Array.isArray(s.requests) &&
    Array.isArray(s.interactions) &&
    s.contacts.every(
      (c) =>
        !!c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        typeof c.email === "string" &&
        typeof c.phone === "string" &&
        typeof c.location === "string",
    ) &&
    s.requests.every(
      (r) =>
        !!r &&
        /^AMB-\d+$/.test(r.id) &&
        typeof r.subject === "string" &&
        typeof r.nextAction === "string" &&
        TEAM.includes(r.assignee) &&
        PRIORITIES.includes(r.priority) &&
        s.contacts.some((c) => c.id === r.contactId) &&
        STATUSES.includes(r.status) &&
        CATEGORIES.includes(r.category) &&
        CHANNELS.includes(r.channel) &&
        !isNaN(Date.parse(r.dueAt)) &&
        !isNaN(Date.parse(r.createdAt)),
    ) &&
    s.interactions.every(
      (i) =>
        !!i &&
        typeof i.id === "string" &&
        typeof i.author === "string" &&
        typeof i.body === "string" &&
        CHANNELS.includes(i.channel) &&
        ["incoming", "outgoing", "call", "note", "event"].includes(i.kind) &&
        !isNaN(Date.parse(i.at)) &&
        s.requests.some(
          (r) => r.id === i.requestId && r.contactId === i.contactId,
        ),
    )
  );
}
// datetime-local has no zone. Interpret deadlines explicitly in Lisbon, including DST.
export function fromLisbonInput(value: string): string {
  const utc = Date.parse(value + "Z");
  const zone =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date(utc))
      .find((p) => p.type === "timeZoneName")?.value || "GMT";
  const match = zone.match(/GMT([+-])(\d+)(?::(\d+))?/);
  const offset = match
    ? (match[1] === "+" ? 1 : -1) *
      (Number(match[2]) * 60 + Number(match[3] || 0))
    : 0;
  return new Date(utc - offset * 60000).toISOString();
}

export function deadline(date: string) {
  const delta = Date.parse(date) - Date.parse(NOW);
  if (delta < 0) {
    const minutes = Math.floor(-delta / 60000);
    return `Atrasado há ${minutes < 60 ? minutes + " min" : Math.floor(minutes / 60) + "h"}`;
  }
  const day = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Lisbon",
  }).format(new Date(date));
  const h = time(date).replace(":00", "h");
  return day === "2026-10-22"
    ? `Hoje, ${h}`
    : day === "2026-10-23"
      ? `Amanhã, ${h}`
      : `${shortDate(date)}, ${h}`;
}
export function lastActivity(s: Store, r: Request) {
  return Math.max(
    Date.parse(r.createdAt),
    ...s.interactions
      .filter((i) => i.requestId === r.id)
      .map((i) => Date.parse(i.at)),
  );
}
export function compareRequests(
  s: Store,
  a: Request,
  b: Request,
  sort: string,
) {
  if (sort === "oldest")
    return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (sort === "activity") return lastActivity(s, b) - lastActivity(s, a);
  if (sort === "due") return Date.parse(a.dueAt) - Date.parse(b.dueAt);
  if (sort === "urgent") {
    const score = (r: Request) =>
      (r.status === "Concluído" ? -100 : 0) +
      (isOverdue(r) ? 20 : 0) +
      { Urgente: 10, Alta: 6, Normal: 2, Baixa: 0 }[r.priority];
    return score(b) - score(a) || Date.parse(a.dueAt) - Date.parse(b.dueAt);
  }
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}
export interface Organization {
  id: string;
  name: string;
}
export function organizations(contacts: Contact[]): Organization[] {
  return [...new Set(contacts.flatMap((c) => (c.company ? [c.company] : [])))]
    .sort()
    .map((name) => ({
      id: name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
      name,
    }));
}
