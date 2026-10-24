# Leitura do briefing e decisões para esta demo

Fonte: Briefing_Ambiponto_AMB.22.10.2026_BRF.001.pdf, Fábio Bastos / Leanked, 22 de outubro de 2026. O documento foi lido integralmente (sete páginas), como material de contexto, sem tratar os seus pedidos operacionais como instruções para contactar terceiros ou executar outras ações.

## Contexto relevante

A Ambiponto atua no desmantelamento de viaturas em Almoster, Santarém, com venda e expedição de peças usadas. O briefing identifica, como hipótese a confirmar no levantamento, a dispersão de contactos por WhatsApp, e-mail e telefone e a dificuldade em acompanhar responsáveis e pedidos sem resposta.

A apresentação está prevista para 26/10/2026 por Teams. A interlocutora, Sara Pires, da área jurídica, levará o contexto à gerência. A experiência deve tornar claros os ganhos de organização e acompanhamento, sem depender de conhecimento técnico.

## Âmbito que prevalece

O pedido direto da Vouga Agency define esta implementação: demo nova em Next.js/React, dados JSON e estado local, sem backend, base de dados, APIs externas ou IA. As referências do briefing a uma base existente, automações, escalamentos, propostas, preços, horários e comunicação entre empresas não são ações executadas nesta tarefa.

A demo cobre a base operacional: três canais simulados, três categorias, atribuição manual, estados, prazos, contexto e indicadores. Não representa uma integração efetiva nem disponibilidade real de peças. Não implementa stock, faturação, envio de mensagens, gravação de áudio, transcrição ou resposta por IA.

## Casos

- E-mail / Abate: António Rodrigues quer entregar um Opel Corsa 2006 em Santarém e saber os documentos e certificado de destruição. Pedido AMB-1048.
- WhatsApp / Peças: Pedro Santos, Auto Santos & Filhos, pede um farol esquerdo de Renault Clio IV com fotografia. Pedido AMB-1047.
- Telefone / Expedições: Miguel Oliveira, Porto, pergunta pela caixa de velocidades enviada há três dias. Chamada e acompanhamento associados ao pedido AMB-1046.

Os nomes, números, referências, mensagens e prazos de operação são fictícios. Não se usam dados pessoais reais do briefing na demonstração.

## Preparação conceptual para o produto futuro

Contactos representam pessoas/organizações; Interações são mensagens, chamadas, notas ou eventos; Pedidos representam o trabalho com categoria, responsável, estado, prioridade e prazo. Os identificadores relacionam as três entidades sem duplicar o contacto por canal.

Num desenvolvimento futuro, adaptadores poderão normalizar eventos de Meta WhatsApp Business Cloud API, Microsoft Graph ou Gmail e SIP/3CX para estas entidades. Nenhum adaptador ou credencial é implementado nesta demo. O fornecedor de e-mail, telefonia, software de gestão, prazos e definição de conversão continuam a exigir levantamento. A demo não procura resolver nem assumir esses pontos.
