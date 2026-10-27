# Piloto de identificação visual do lado

O piloto está restrito a empresa 102, tipo de livro 6, livro 31. O modelo é experimental. A tela OCR permite escolhê-lo no perfil **Modelo visual do lado — assistido**, separado dos perfis de OCR existentes.

## Método e dados

- Extrator visual pré-treinado DINOv2-small quantizado, executado no servidor com Transformers.js 4.3.1.
- Redimensionamento completo para 224 × 224, sem recorte central. Vetores do token global e das quatro regiões da imagem, normalizados.
- Regressão logística com pesos de classe balanceados e regularização L2 (lambda 0,01), treinada exclusivamente com a revisão humana de 40 imagens: 24 Frente e 16 Verso.
- Número da folha, código, nome do arquivo e lado cadastrado não entram nas características do classificador. A folha cadastrada serve apenas para separar grupos de avaliação.

O desenvolvimento inicial com o vetor global teve 31 acertos em 40. A versão com regiões espaciais e balanceamento teve 40 em 40, em cinco blocos contíguos, cada um com oito imagens reservadas e 32 no treinamento. Como essa amostra participou da escolha do método, **esse resultado não é validação independente nem comprovação de confiabilidade**.

## Modelo congelado e validação

O arquivo `resources/side-models/102-6-31.json` contém a versão `dinov2-102-6-31-v1`, os coeficientes aprendidos, a lista de imagens de treinamento e seus hashes. Os pesos públicos do extrator são baixados e guardados em `tmp/side-vision-models`; nenhuma imagem é enviada para serviço externo de IA. O hash do extrator deve corresponder ao usado no treinamento.

Na tela `/typebooks/6/side-training?book=31`, o botão **Validar modelo com outras 40 imagens** cria uma amostra que exclui os registros e as folhas do desenvolvimento. A versão fica fixa enquanto o usuário revisa essa amostra. A API recusa validar uma imagem ou folha do treinamento, uma cópia exata de uma imagem de treinamento, um arquivo alterado ou um modelo cujas revisões originais mudaram.

Após a revisão, **Avaliar modelo visual nesta amostra** grava as previsões em `indeximage_ocr_checks`, usando `layout_profile` igual à versão do piloto. Elas não se misturam com o diagnóstico de bordas. O campo `side_confidence` permanece nulo: o piloto ainda não tem probabilidades calibradas. O cadastro `bookrecords.side` não é alterado.

Um resultado ruim na amostra independente exige outro ciclo de desenvolvimento e uma nova amostra de teste. A validação existente não deve ser usada repetidamente para ajustar o método e continuar sendo chamada de independente. Não há liberação automática do piloto para produção.

## Resultado independente e conferência assistida

A primeira amostra independente terminou com 40 acertos em 40 imagens, sem erros ou inconclusivos. Três processamentos que inicialmente ficaram pendentes foram repetidos com a mesma versão congelada e também acertaram. Esse resultado descreve essa amostra e não garante a mesma precisão em todas as páginas ou em outros livros.

O botão **Conferir restante do livro 31** abre `/typebooks/6/ocrconference?book=31&sideModel=visual`. O perfil visual mostra Lado, Lado Lido e a divergência com o cadastro. **Conferir lados** processa um lote do único livro selecionado e grava as sugestões sob a versão do modelo, preservando os resultados da regra de bordas. O usuário abre a imagem e altera o lado cadastrado explicitamente quando necessário.

A API exige pelo menos 40 referências independentes completas e sem divergências, com os dados das revisões e imagens ainda correspondentes à versão avaliada. Esse requisito habilita somente o teste assistido; não é uma certificação estatística. Um escopo sem modelo, outro livro, revisões de treinamento alteradas ou uma validação incompleta bloqueiam o perfil.

## Reprodução

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
