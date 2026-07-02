# DiscereNow Studio — instruções para IAs

## Backups antes de alterações

Este projeto mantém snapshots locais em `.bk/`, sincronizados pelo OneDrive e ignorados pelo Git. Cada snapshot deve gerar apenas um arquivo ZIP; as informações do Git e o patch ficam dentro dele.

Antes de qualquer alteração material, execute:

```powershell
npm run backup -- motivo-curto
```

Crie o backup antes de:

- refatorações ou mudanças que afetem vários arquivos;
- alterações no parser DOCX, no contrato `DN-*`, no gerador de lições ou no wrapper SCORM;
- mudanças em build, empacotamento, dependências ou configuração;
- exclusões, movimentações ou reestruturações de arquivos;
- correções arriscadas cuja regressão seja difícil de desfazer.

Não é necessário criar um novo backup para leitura, diagnóstico, testes sem mutação ou edições triviais facilmente reversíveis. Durante uma sequência coesa de alterações, um único backup inicial é suficiente, salvo se uma nova decisão ampliar materialmente o escopo.

Use nomes curtos, em minúsculas e separados por hífen, por exemplo `pre-parser` ou `pre-scorm`. Confirme que o comando terminou com sucesso antes de editar. Nunca apague snapshots nem restaure um deles sem autorização explícita do usuário.

Backups complementam o Git; não substituem commits, branches e tags. A pasta `.bk/` nunca deve ser adicionada ao repositório.

## Contexto do diretório addin

`addin/` é uma cópia local de outro projeto, disponibilizada para consulta e integração. Ela não pertence a este repositório e permanece ignorada pelo Git. Não a modifique sem solicitação explícita.
