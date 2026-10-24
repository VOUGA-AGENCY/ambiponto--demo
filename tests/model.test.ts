import { test } from "node:test";
import assert from "node:assert/strict";
import seed from "../src/data/demo.json";
import {
  Store,
  metrics,
  isUnanswered,
  updateRequest,
  addInteraction,
  validStore,
  fromLisbonInput,
} from "../src/lib/model";
const fresh = () => structuredClone(seed) as Store;
test("fixtures preserve contact/request/interaction relationships", () => {
  const s = fresh();
  assert.equal(validStore(s), true);
  assert.equal(s.requests.length, 3);
  assert.equal(s.contacts.length, 3);
  for (const i of s.interactions) {
    const r = s.requests.find((r) => r.id === i.requestId)!;
    assert.equal(i.contactId, r.contactId);
  }
  assert.equal(new Set(s.requests.map((r) => r.id)).size, 3);
});
test("dashboard totals match the shared fixtures", () => {
  const m = metrics(fresh());
  assert.deepEqual(
    {
      open: m.open,
      unanswered: m.unanswered,
      overdue: m.overdue,
      closed: m.closed,
    },
    { open: 3, unanswered: 2, overdue: 0, closed: 0 },
  );
  assert.equal(m.open + m.closed, 3);
  // The phone call was answered immediately; email and WhatsApp have no reply yet.
  assert.equal(m.responseMinutes, 0);
});
test("email: assign, reply and conclude update metrics and audit trail", () => {
  let s = fresh();
  s = updateRequest(s, "AMB-1048", {
    assignee: "Ana Martins",
    category: "Abate",
  });
  assert.equal(s.interactions.at(-1)?.kind, "event");
  s = addInteraction(
    s,
    "AMB-1048",
    "Bom dia, vamos confirmar a documentação.",
    "outgoing",
  );
  assert.equal(s.requests[0].status, "Novo");
  assert.equal(metrics(s).unanswered, 1);
  s = updateRequest(s, "AMB-1048", { status: "Concluído" });
  assert.equal(metrics(s).closed, 1);
  assert.equal(metrics(s).open, 2);
  assert.ok(s.requests[0].closedAt);
  s = updateRequest(s, "AMB-1048", { status: "Em curso" });
  assert.equal(s.requests[0].closedAt, undefined);
});
test("WhatsApp: attachment and internal notes do not count as a response", () => {
  let s = fresh();
  assert.equal(
    s.interactions.find((i) => i.requestId === "AMB-1047")?.attachment,
    "/farol-clio.jpg",
  );
  s = addInteraction(
    s,
    "AMB-1047",
    "Verificar referência com a equipa de peças.",
    "note",
  );
  assert.equal(metrics(s).unanswered, 2);
  s = addInteraction(
    s,
    "AMB-1047",
    "Bom dia Pedro. Recebemos a fotografia.",
    "outgoing",
  );
  assert.equal(metrics(s).unanswered, 1);
  assert.equal(s.interactions.at(-1)?.contactId, "c2");
  assert.equal(s.interactions.at(-1)?.channel, "WhatsApp");
});
test("phone: follow-up is associated with existing contact and request", () => {
  const s = addInteraction(
    fresh(),
    "AMB-1046",
    "Transportadora contactada. Retornar ao cliente.",
    "call",
    73,
  );
  const i = s.interactions.at(-1)!;
  assert.equal(i.duration, 73);
  assert.equal(i.contactId, "c3");
  assert.equal(i.requestId, "AMB-1046");
  assert.equal(s.requests.length, 3);
  assert.equal(
    isUnanswered(
      s.requests.find((r) => r.id === i.requestId)!,
      s.interactions,
    ),
    false,
  );
});
test("closing an overdue request removes it from attention; reopening restores it", () => {
  let s = updateRequest(fresh(), "AMB-1046", {
    dueAt: "2026-10-22T09:00:00+01:00",
  });
  assert.equal(metrics(s).overdue, 1);
  s = updateRequest(s, "AMB-1046", { status: "Concluído" });
  assert.equal(metrics(s).overdue, 0);
  s = updateRequest(s, "AMB-1046", { status: "Em curso" });
  assert.equal(metrics(s).overdue, 1);
  s = updateRequest(s, "AMB-1046", { dueAt: "2026-10-23T14:00:00+01:00" });
  assert.equal(metrics(s).overdue, 0);
});
test("local persistence round-trip retains updates and rejects damaged relationships", () => {
  let s = updateRequest(fresh(), "AMB-1048", { priority: "Urgente" });
  assert.equal(validStore(JSON.parse(JSON.stringify(s))), true);
  s.requests[0].contactId = "missing";
  assert.equal(validStore(s), false);
  assert.equal(validStore({ version: 2 }), false);
});
test("blank replies, unknown ids and unchanged edits are no-ops", () => {
  const s = fresh();
  assert.equal(addInteraction(s, "AMB-1048", "  ", "outgoing"), s);
  assert.equal(updateRequest(s, "missing", { status: "Concluído" }), s);
  assert.equal(updateRequest(s, "AMB-1048", { status: "Novo" }), s);
});

test("deadlines use Lisbon time before and after the winter clock change", () => {
  assert.equal(fromLisbonInput("2026-10-22T12:00"), "2026-10-22T11:00:00.000Z");
  assert.equal(fromLisbonInput("2026-10-26T12:00"), "2026-10-26T12:00:00.000Z");
});
