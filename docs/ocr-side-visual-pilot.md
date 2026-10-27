# Piloto de identificação visual do lado

A tela de revisão permite que cada empresa crie, treine, valide e ative seus modelos por livro. A tela OCR usa a versão ativa no perfil **Modelo visual do lado — assistido**, separado dos perfis de OCR existentes. O piloto original da empresa 102, tipo 6, livro 31 continua compatível.

## Operação pelo usuário

1. Na conferência OCR, selecionar um único livro e abrir **Revisar livro para IA**.
2. Criar uma amostra, revisar pelo menos 40 imagens e marcar Frente, Verso ou Inconclusivo. São necessários pelo menos cinco exemplos de cada lado; imagens inconclusivas não entram no treinamento. O botão **Adicionar 20 imagens para revisar** permite completar ou ampliar a amostra.
3. Clicar em **Treinar modelo deste livro**. A página mostra fila e progresso; o usuário pode fechá-la e voltar depois.
4. Quando o treinamento terminar, abrir a validação com outras imagens e revisar pelo menos 40 referências independentes válidas, incluindo cinco de cada lado.
5. Avaliar o modelo nessa amostra. Pendências podem ser repetidas. Uma referência com falha de processamento pode ser substituída pela tela; uma referência já avaliada não pode ser removida por esse caminho.
6. Com a validação completa e sem erros, clicar em **Ativar modelo para este livro** e depois **Conferir livro**.

Não é necessário criar scripts, copiar modelos ou publicar uma versão da aplicação para cada livro. Os modelos gerados pela tela ficam no banco, com empresa, tipo, livro, autor, versão, estado, amostras e coeficientes. O seletor de versões permite consultar e reativar uma versão anterior que ainda satisfaça a validação.

**Treinar nova versão** usa as revisões disponíveis do livro, incluindo validações anteriores como novos exemplos de treinamento. A nova versão exige outra amostra de validação. A versão ativa permanece disponível enquanto a candidata é treinada e validada. A seleção de novas referências exclui registros e folhas já utilizados; um livro sem imagens suficientes deve permanecer na conferência manual.

## Implantação e fila

Executar a migration `1793000000005_indeximage_side_models` uma vez na implantação. Ela cria somente a tabela de modelos e treinamentos, sem modificar revisões existentes. Modelos, amostras e progresso passam a acompanhar o backup do banco.

O `AppProvider` inicia a fila automaticamente no servidor web. Reservas no banco limitam a execução a um treinamento por vez entre processos. Um treinamento interrompido é retomado com sua amostra congelada após a reserva expirar (até dois minutos), refazendo o preparo das imagens. Não é necessário executar um worker ou comando por livro. O cálculo do classificador roda em `resources/side-training/train.cjs`, em uma worker thread, enquanto a aplicação continua respondendo às requisições.

O arquivo do piloto original continua como fallback. Ao ativá-lo ou iniciar uma nova versão pela tela, ele é registrado no banco, preservando suas referências e resultados existentes. Os novos modelos usam exclusivamente o banco.

## Método e dados

- Extrator visual pré-treinado DINOv2-small quantizado, executado no servidor com Transformers.js 4.3.1.
- Redimensionamento completo para 224 × 224, sem recorte central. Vetores do token global e das quatro regiões da imagem, normalizados.
- Regressão logística com pesos de classe balanceados e regularização L2 (lambda 0,01), treinada exclusivamente com a revisão humana de 40 imagens: 24 Frente e 16 Verso.
- Número da folha, código, nome do arquivo e lado cadastrado não entram nas características do classificador. A folha cadastrada serve apenas para separar grupos de avaliação.

O desenvolvimento inicial com o vetor global teve 31 acertos em 40. A versão com regiões espaciais e balanceamento teve 40 em 40, em cinco blocos contíguos, cada um com oito imagens reservadas e 32 no treinamento. Como essa amostra participou da escolha do método, **esse resultado não é validação independente nem comprovação de confiabilidade**.

## Modelo congelado e validação

O arquivo legado `resources/side-models/102-6-31.json` contém a versão original `dinov2-102-6-31-v1`. Os novos modelos guardam os mesmos dados em `indeximage_side_models.model_data`. Os pesos públicos do extrator são baixados e guardados em `tmp/side-vision-models`; nenhuma imagem é enviada para serviço externo de IA. O hash do extrator deve corresponder ao usado no treinamento.

Na tela `/typebooks/6/side-training?book=31`, o botão **Validar modelo com outras 40 imagens** cria uma amostra que exclui os registros e as folhas do desenvolvimento. A versão fica fixa enquanto o usuário revisa essa amostra. A API recusa validar uma imagem ou folha do treinamento, uma cópia exata de uma imagem de treinamento, um arquivo alterado ou um modelo cujas revisões originais mudaram.

Após a revisão, **Avaliar modelo visual nesta amostra** grava as previsões em `indeximage_ocr_checks`, usando `layout_profile` igual à versão do piloto. Elas não se misturam com o diagnóstico de bordas. O campo `side_confidence` permanece nulo: o piloto ainda não tem probabilidades calibradas. O cadastro `bookrecords.side` não é alterado.

As novas versões vinculam os IDs de validação à versão no banco e registram os hashes das referências processadas. Conteúdos duplicados não contam como referências independentes. Alterações das revisões ou da identidade dos arquivos do treinamento impedem a ativação e o uso até a revisão do modelo.

Um resultado ruim na amostra independente exige outro ciclo de desenvolvimento e uma nova amostra de teste. A validação existente não deve ser usada repetidamente para ajustar o método e continuar sendo chamada de independente. Não há liberação automática do piloto para produção.

## Resultado independente e conferência assistida

A primeira amostra independente terminou com 40 acertos em 40 imagens, sem erros ou inconclusivos. Três processamentos que inicialmente ficaram pendentes foram repetidos com a mesma versão congelada e também acertaram. Esse resultado descreve essa amostra e não garante a mesma precisão em todas as páginas ou em outros livros.

O botão **Conferir restante do livro 31** abre `/typebooks/6/ocrconference?book=31&sideModel=visual`. O perfil visual mostra Lado, Lado Lido e a divergência com o cadastro. **Conferir lados** processa um lote do único livro selecionado e grava as sugestões sob a versão do modelo, preservando os resultados da regra de bordas. O usuário abre a imagem e altera o lado cadastrado explicitamente quando necessário.

A API exige pelo menos 40 referências independentes completas e sem divergências, com os dados das revisões e imagens ainda correspondentes à versão avaliada. Esse requisito habilita somente o teste assistido; não é uma certificação estatística. Um escopo sem modelo, outro livro, revisões de treinamento alteradas ou uma validação incompleta bloqueiam o perfil.

## Reprodução técnica opcional

Esta ferramenta continua disponível para análise técnica; ela não é necessária para o usuário e não substitui a ativação das versões geradas pela tela.

Após instalar as dependências do backend, execute a partir da raiz de `digi3web2`:

```sh
node scripts/train-book-side-visual.js --company=102 --typebook=6 --book=31 --version=dinov2-102-6-31-v2 --output=/tmp/model-v2.json
```

O comando lê as revisões e imagens do Drive e salva um arquivo novo. Quando existe um modelo desse livro, o script limita o treinamento à sua lista original; novas revisões de validação não entram silenciosamente no treinamento. O comando não grava no banco e recusa sobrescrever um arquivo de saída existente. Trocar a versão ativa requer revisar e substituir explicitamente o artefato do modelo, seguido de nova validação independente.

## Verificações realizadas

- Reproduzidos os coeficientes pelo script do projeto, com diferença numérica máxima de aproximadamente 1,1 × 10⁻¹⁶.
- A inferência integrada extraiu exatamente as mesmas características do protótipo.
- Confirmados 40 candidatos novos, sem sobreposição de folhas com o treinamento.
- Testados criação da amostra, inferência e relatório em uma transação com rollback; as 40 revisões originais foram preservadas.
- Builds do frontend e backend executados. O backend utiliza o comando existente com `--ignore-ts-errors`; permanecem erros TypeScript anteriores em outros arquivos.
