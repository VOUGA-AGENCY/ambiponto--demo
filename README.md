# Ambiponto · Gestão de contactos e pedidos

Demo funcional em português de Portugal, desenvolvida pela Vouga Agency para o contexto de apresentação com a Leanked. Next.js, React e TypeScript; aplicação exportável como ficheiros estáticos, sem backend, base de dados, IA ou integrações externas.

## Executar

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
```

Abrir **http://localhost:3000**. Se a porta estiver ocupada: `npm run dev -- --port 3001`.

Para uma apresentação com a versão de produção:

```sh
npm run build
npm start
```

O segundo comando serve exclusivamente os ficheiros de `out/`, em `http://localhost:3000`. Não existem endpoints de negócio. `PORT=3001 npm start` permite outra porta.

## Percursos de demonstração

O botão **Explorar a demonstração** dá acesso direto aos três casos:

1. **AMB-1048 · E-mail / Abate** — António Rodrigues, Santarém, Opel Corsa 2006. Atribuir a Ana Martins, responder, adicionar próxima ação e concluir.
2. **AMB-1047 · WhatsApp / Peças** — Auto Santos & Filhos, farol esquerdo de Renault Clio IV. Abrir a fotografia, confirmar responsável, responder e acompanhar.
3. **AMB-1046 · Telefone / Expedições** — Miguel Oliveira, Porto, caixa de velocidades enviada a 19/10. Simular chamada, atender, terminar e guardar o registo no pedido existente.

O dashboard, as filas e os indicadores refletem as mesmas alterações. Notas internas não contam como respostas. Enviar uma resposta ou registar uma chamada não altera o estado operacional. Concluir um pedido retira-o dos pedidos abertos e dos atrasos. Reabrir recupera o acompanhamento.

## Dados e arquitetura

- `src/data/demo.json`: 3 contactos, 3 pedidos e respetivas interações; dados fictícios.
- `src/lib/model.ts`: tipos independentes `Contact`, `Request` e `Interaction`, relações por identificador, regras de estado, histórico e métricas.
- `src/components/workspace.tsx`: navegação, estado partilhado, persistência e fluxos locais.
- `src/components/dashboard.tsx`: dashboard, tabela e indicadores derivados.
- `src/components/request-detail.tsx`: conversa, anexo, notas, responsável, prazos e próximas ações.
- `src/components/ui.tsx`: componentes comuns, modais com gestão de foco e notificações.
- `src/app/globals.css`: estilos e adaptação a diferentes larguras.

As alterações são guardadas no `localStorage`, na chave `ambiponto.demo.v1`. A demo mantém a referência temporal em **22/10/2026, 10:30, Europe/Lisbon** para que os atrasos sejam reproduzíveis. As novas interações recebem uma sequência temporal local a partir dessa referência. Não existe atualização automática de relógio, colaboração entre utilizadores ou autenticação.

**Sobre esta demonstração → Repor demo** recupera os dados iniciais. Pedidos criados e outras alterações locais são descartados após confirmação.

## Indicadores

- Abertos: todos os estados exceto Concluído.
- Por responder: pedidos abertos sem mensagem enviada nem chamada atendida.
- Atrasados: abertos com prazo anterior à referência da demo.
- Primeira resposta: média, em minutos, entre a receção e a primeira mensagem enviada ou chamada atendida. Pedidos ainda sem resposta não entram na média. Notas e eventos não entram no cálculo.
- Os indicadores por responsável usam o responsável atual, sem atribuição histórica de produtividade.
- Os prazos são exemplos da demo, não regras acordadas com o cliente.

## Verificação

```sh
npm run typecheck
npm test
npm run build
```

Os testes cobrem coerência dos dados, respostas, notas, associação de chamadas, conclusão/reabertura, atrasos e persistência. Os testes de componentes exercitam a interface com DOM simulado.

## Recursos locais

A fonte Inter e os ícones Lucide são servidos localmente. A fotografia do anexo também está em `public/`; a aplicação não faz pedidos a serviços de terceiros. Ver `docs/ASSETS.md` para a origem do recurso ilustrativo.

Ver `docs/BRIEFING.md` para as decisões de âmbito e `docs/DEMONSTRACAO.md` para um guião curto de apresentação.
