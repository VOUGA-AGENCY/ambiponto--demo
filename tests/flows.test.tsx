import "./dom-setup";
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import Workspace from "../src/components/workspace";
import { Store, metrics } from "../src/lib/model";
const stored = () =>
  JSON.parse(localStorage.getItem("ambiponto.demo.three-cases.v1")!) as Store;
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});
afterEach(() => cleanup());
async function detail(id: string, title: string) {
  window.history.replaceState(null, "", "/#pedido/" + id);
  render(<Workspace />);
  await screen.findByRole("heading", { name: title });
}
test("email UI: assignment, reply, notes, next action, conclusion and persistence", async () => {
  await detail("AMB-1048", "Entrega de Opel Corsa de 2006 para abate");
  fireEvent.change(screen.getByLabelText("Responsável do pedido"), {
    target: { value: "Ana Martins" },
  });
  fireEvent.change(screen.getByLabelText("Escrever resposta"), {
    target: {
      value:
        "Bom dia António. Recebemos o pedido e vamos confirmar os documentos.",
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));
  await screen.findByText(
    "Bom dia António. Recebemos o pedido e vamos confirmar os documentos.",
  );
  assert.equal(metrics(stored()).unanswered, 1);
  fireEvent.click(screen.getByRole("button", { name: "Nota interna" }));
  fireEvent.change(screen.getByLabelText("Escrever nota interna"), {
    target: { value: "Combinar entrega com o António." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar nota" }));
  await screen.findByText("Combinar entrega com o António.");
  fireEvent.change(screen.getByLabelText("Próxima ação"), {
    target: { value: "Confirmar entrega para sexta-feira." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar ação" }));
  fireEvent.click(screen.getByRole("button", { name: "Concluir pedido" }));
  await screen.findByRole("button", { name: "Reabrir pedido" });
  assert.equal(metrics(stored()).closed, 1);
  assert.equal(
    stored().requests[0].nextAction,
    "Confirmar entrega para sexta-feira.",
  );
  cleanup();
  render(<Workspace />);
  await screen.findByRole("button", { name: "Reabrir pedido" });
  assert.equal(
    (screen.getByLabelText("Responsável do pedido") as HTMLSelectElement).value,
    "Ana Martins",
  );
});
test("WhatsApp UI: inspect attachment, close modal, change owner and reply", async () => {
  await detail("AMB-1047", "Farol esquerdo · Renault Clio IV");
  fireEvent.click(screen.getByRole("button", { name: /farol-clio-iv.jpg/ }));
  const modal = await screen.findByRole("dialog", {
    name: "Fotografia anexada",
  });
  assert.equal(
    within(modal).getByRole("img").getAttribute("src"),
    "/farol-clio.jpg",
  );
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(screen.queryByRole("dialog"), null);
  fireEvent.change(screen.getByLabelText("Responsável do pedido"), {
    target: { value: "Ricardo Silva" },
  });
  fireEvent.change(screen.getByLabelText("Escrever resposta"), {
    target: {
      value:
        "Bom dia Pedro. Obrigado pela fotografia, vamos confirmar a referência.",
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));
  await screen.findByText(
    "Bom dia Pedro. Obrigado pela fotografia, vamos confirmar a referência.",
  );
  assert.equal(
    stored().requests.find((r) => r.id === "AMB-1047")?.status,
    "Novo",
  );
  assert.equal(stored().interactions.at(-1)?.channel, "WhatsApp");
});
test("phone UI: answer, end, edit record and save to existing request", async () => {
  await detail("AMB-1046", "Acompanhamento de caixa de velocidades");
  fireEvent.click(screen.getByRole("button", { name: "Simular chamada" }));
  await screen.findByRole("dialog", { name: "Chamada recebida" });
  fireEvent.click(screen.getByRole("button", { name: "Atender chamada" }));
  await screen.findByRole("dialog", { name: "Chamada em curso" });
  fireEvent.click(screen.getByRole("button", { name: "Terminar chamada" }));
  await screen.findByRole("dialog", { name: "Registar acompanhamento" });
  fireEvent.change(screen.getByLabelText("Registo manual da chamada"), {
    target: {
      value:
        "Contacto do Porto identificado. Confirmar entrega com a transportadora.",
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar no pedido" }));
  await screen.findByText(
    "Contacto do Porto identificado. Confirmar entrega com a transportadora.",
  );
  assert.equal(stored().interactions.at(-1)?.requestId, "AMB-1046");
  assert.equal(stored().interactions.at(-1)?.contactId, "c3");
  assert.equal(stored().requests.length, 3);
});
test("inbox UI: search, filters, empty state and clear", async () => {
  window.history.replaceState(null, "", "/#inbox");
  render(<Workspace />);
  await screen.findByRole("heading", { name: /Caixa de entrada/ });
  fireEvent.change(screen.getByLabelText("Filtrar por canal"), {
    target: { value: "WhatsApp" },
  });
  assert.equal(screen.getAllByRole("row").length, 2);
  fireEvent.change(screen.getByLabelText("Filtrar por categoria"), {
    target: { value: "Peças" },
  });
  assert.equal(screen.getAllByRole("row").length, 2);
  fireEvent.change(screen.getByLabelText("Pesquisar na caixa de entrada"), {
    target: { value: "inexistente" },
  });
  await screen.findByRole("heading", { name: "Não encontrámos pedidos" });
  fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
  assert.equal(screen.getAllByRole("row").length, 4);
});
test("new request UI: create contact and keep references consistent", async () => {
  window.history.replaceState(null, "", "/#inbox");
  render(<Workspace />);
  fireEvent.click(await screen.findByRole("button", { name: "Novo pedido" }));
  fireEvent.change(screen.getByLabelText("Contacto"), {
    target: { value: "new" },
  });
  for (const [label, value] of [
    ["Nome", "Marta Teste"],
    ["E-mail", "marta@example.com"],
    ["Telefone", "+351 910 000 999"],
    ["Localidade", "Santarém"],
    ["Assunto", "Pedido de teste da interface"],
    [
      "Mensagem ou registo do contacto",
      "Pretendo informações sobre entrega de viatura.",
    ],
  ])
    fireEvent.change(screen.getByLabelText(label, { exact: true }), {
      target: { value },
    });
  fireEvent.change(screen.getByLabelText("Empresa associada"), {
    target: { value: "Auto Santos & Filhos" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Criar pedido" }));
  await screen.findByRole("heading", { name: "Pedido de teste da interface" });
  assert.equal(stored().contacts.length, 4);
  assert.equal(stored().requests.length, 4);
  assert.equal(stored().requests[0].contactId, stored().contacts.at(-1)?.id);
});
test("reports UI: period filter changes metrics and reset restores original data", async () => {
  render(<Workspace />);
  fireEvent.click(screen.getByRole("button", { name: "Indicadores" }));
  await screen.findByRole("heading", { name: "Indicadores" });
  fireEvent.change(screen.getByLabelText("Período dos indicadores"), {
    target: { value: "1" },
  });
  await screen.findByText(/3 pedidos recebidos no período selecionado/);
  fireEvent.click(
    screen.getByRole("button", { name: "Sobre esta demonstração" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Repor demo" }));
  fireEvent.click(screen.getByRole("button", { name: "Sim, repor dados" }));
  await screen.findByRole("heading", { name: /Trabalho de hoje/ });
  assert.equal(stored().requests.length, 3);
  assert.equal(metrics(stored()).unanswered, 2);
});

test("quick assignment updates the unassigned queue and personal queue", async () => {
  window.history.replaceState(null, "", "/#inbox");
  render(<Workspace />);
  fireEvent.click(await screen.findByRole("button", { name: /Por atribuir/ }));
  fireEvent.change(screen.getByLabelText("Responsável de AMB-1048"), {
    target: { value: "Ana Martins" },
  });
  await screen.findByRole("heading", { name: "Não encontrámos pedidos" });
  fireEvent.click(screen.getByRole("button", { name: /Os meus pedidos/ }));
  await screen.findByRole("button", {
    name: "Entrega de Opel Corsa de 2006 para abate",
  });
  assert.equal(
    stored().requests.find((r) => r.id === "AMB-1048")?.assignee,
    "Ana Martins",
  );
});
test("mixed-channel reply stays in same request and preserves operational state", async () => {
  await detail("AMB-1047", "Farol esquerdo · Renault Clio IV");
  fireEvent.change(screen.getByLabelText("Canal da resposta"), {
    target: { value: "E-mail" },
  });
  fireEvent.change(screen.getByLabelText("Escrever resposta"), {
    target: { value: "Referência enviada por e-mail." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));
  await screen.findByText("Referência enviada por e-mail.");
  assert.equal(stored().interactions.at(-1)?.channel, "E-mail");
  assert.equal(
    stored().requests.find((r) => r.id === "AMB-1047")?.status,
    "Novo",
  );
});
test("callback records a next action without closing the request", async () => {
  await detail("AMB-1046", "Acompanhamento de caixa de velocidades");
  fireEvent.click(
    screen.getByRole("button", { name: "Registar chamada a devolver" }),
  );
  assert.equal(
    stored().requests.find((r) => r.id === "AMB-1046")?.nextAction,
    "Devolver chamada a Miguel Oliveira",
  );
  assert.equal(
    stored().requests.find((r) => r.id === "AMB-1046")?.status,
    "Em curso",
  );
});

test("legacy browser data cannot restore the removed demonstration scenarios", async () => {
  localStorage.setItem(
    "ambiponto.demo.v1",
    JSON.stringify({
      version: 1,
      contacts: [],
      requests: [],
      interactions: [],
    }),
  );
  render(<Workspace />);
  await screen.findByRole("heading", { name: /Trabalho de hoje/ });
  assert.deepEqual(
    stored().requests.map((r) => r.id),
    ["AMB-1048", "AMB-1047", "AMB-1046"],
  );
  assert.equal(stored().contacts.length, 3);
});

test("request rows open from the full row and keyboard without hijacking assignment", async () => {
  window.history.replaceState(null, "", "/#inbox");
  render(<Workspace />);
  const row = await screen.findByRole("row", {
    name: /Abrir pedido AMB-1047:/,
  });
  fireEvent.click(within(row).getByLabelText("Responsável de AMB-1047"));
  assert.equal(window.location.hash, "#inbox");
  fireEvent.click(within(row).getByText("Peças"));
  await screen.findByRole("heading", {
    name: "Farol esquerdo · Renault Clio IV",
  });
  cleanup();
  window.history.replaceState(null, "", "/#inbox");
  render(<Workspace />);
  fireEvent.keyDown(
    await screen.findByRole("row", { name: /Abrir pedido AMB-1048:/ }),
    { key: "Enter" },
  );
  await screen.findByRole("heading", {
    name: "Entrega de Opel Corsa de 2006 para abate",
  });
});
