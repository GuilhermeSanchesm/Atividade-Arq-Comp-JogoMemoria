/*
  Jogo da Memória - Arquitetura Computacional
  Regras e restrições: usar apenas estruturas básicas de JS, loops, condicionais, arrays/objetos, DOM e Math.random().
  Este arquivo contém toda a lógica do jogo.
*/

(function(){
  // ---------- Dados obrigatórios (12 termos) ----------
  // Cada objeto contém: pairId (identificador do par), term (nome) e definition (definição)
  var dadosTermos = [
    {pairId:1, term:"CPU", definition:"Unidade Central de Processamento: executa instruções e coordena as operações do computador."},
    {pairId:2, term:"ULA", definition:"Unidade Lógica e Aritmética: realiza operações aritméticas e lógicas."},
    {pairId:3, term:"UC", definition:"Unidade de Controle: interpreta instruções e gera sinais de controle para os demais blocos."},
    {pairId:4, term:"Registradores", definition:"Pequenas memórias ultrarrápidas dentro da CPU usadas para operações imediatas."},
    {pairId:5, term:"RAM", definition:"Memória volátil de acesso aleatório usada para armazenar dados e instruções em execução."},
    {pairId:6, term:"ROM", definition:"Memória somente leitura, normalmente usada para firmware que não muda em execução."},
    {pairId:7, term:"EEPROM", definition:"Memória não volátil regravável eletricamente, usada para armazenar dados que devem persistir."},
    {pairId:8, term:"Flash", definition:"Memória não volátil regravável em blocos, comum em dispositivos e armazenamento embutido."},
    {pairId:9, term:"Cache", definition:"Memória rápida usada para reduzir a latência de acesso aos dados mais usados pela CPU."},
    {pairId:10, term:"Memória de massa", definition:"Armazenamento permanente de grande capacidade, como HDs e SSDs."},
    {pairId:11, term:"DMA", definition:"Acesso Direto à Memória: mecanismo que permite periféricos transferir dados sem usar a CPU."},
    {pairId:12, term:"Address Bus", definition:"Barramento de endereço: linhas que transportam o endereço de memória para leitura/escrita."}
  ];

  // ---------- Estado do jogo (variáveis que controlam o fluxo) ----------
  var baralho = []; // vetor que representa as cartas em jogo
  var primeiraCarta = null; // guarda a primeira carta selecionada na tentativa
  var segundaCarta = null; // guarda a segunda carta selecionada
  var bloqueioTabuleiro = false; // flag para bloquear interações enquanto avalia pares
  var contadorAcertos = 0; // número de pares corretos encontrados
  var contadorErros = 0; // número de tentativas incorretas
  var intervaloTempo = null; // id do setInterval do temporizador
  var segundos = 0; // tempo decorrido em segundos
  var temporizadorAtivo = false; // se o temporizador já foi iniciado

  // ---------- Elementos DOM (referências para atualizar interface) ----------
  var telaInicio = document.getElementById('tela-inicio');
  var botaoIniciar = document.getElementById('botao-iniciar');
  var hud = document.getElementById('painel-hud');
  var telaTabuleiro = document.getElementById('tela-tabuleiro');
  var tabuleiro = document.getElementById('tabuleiro');
  var elementoTempo = document.getElementById('tempo');
  var elementoAcertos = document.getElementById('acertos');
  var elementoErros = document.getElementById('erros');
  var botaoReiniciar = document.getElementById('botao-reiniciar');
  var telaFim = document.getElementById('tela-fim');
  var elementoTempoFinal = document.getElementById('tempo-final');
  var elementoAcertosFinais = document.getElementById('acertos-finais');
  var elementoErrosFinais = document.getElementById('erros-finais');
  var elementoExplicacoes = document.getElementById('explicacoes');
  var botaoJogarNovamente = document.getElementById('botao-jogar-novamente');
  var botaoVoltarInicio = document.getElementById('botao-voltar-inicio');

  // ---------- Funções utilitárias ----------
  // Converte segundos em string MM:SS
  function formatarTempo(totalSegundos){
    var minutos = Math.floor(totalSegundos/60);
    var segundosRestantes = totalSegundos - minutos*60;
    function pad(num){ return (num < 10 ? '0' + num : '' + num); }
    return pad(minutos) + ':' + pad(segundosRestantes);
  }

  // Fisher-Yates shuffle usando Math.random()
  // Embaralha um array in-place usando Fisher-Yates e Math.random()
  function embaralharArray(arr){
    for(var i = arr.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  // ---------- Construção do deck ----------
  // Constrói o baralho a partir dos dadosTermos: para cada termo cria-se
  // duas cartas (uma com o nome e outra com a definição) compartilhando pairId
  function construirBaralho(){
    baralho = [];
    var contadorIds = 1;
    for(var i = 0; i < dadosTermos.length; i++){
      var item = dadosTermos[i];
      // carta do termo (tipo 'term')
      baralho.push({ id: contadorIds++, pairId: item.pairId, tipo: 'term', conteudo: item.term, combinada: false });
      // carta da definição (tipo 'definition')
      baralho.push({ id: contadorIds++, pairId: item.pairId, tipo: 'definition', conteudo: item.definition, combinada: false });
    }
  }

  // ---------- Renderização do tabuleiro ----------
  // Renderiza o tabuleiro (DOM) a partir do baralho atual
  function renderizarTabuleiro(){
    // limpar conteúdo anterior do tabuleiro
    while(tabuleiro.firstChild){ tabuleiro.removeChild(tabuleiro.firstChild); }

    for(var i = 0; i < baralho.length; i++){
      var carta = baralho[i];
    var elementoCarta = document.createElement('div');
      elementoCarta.className = 'carta';
      elementoCarta.setAttribute('data-id', carta.id);
      elementoCarta.setAttribute('data-pairid', carta.pairId);
      elementoCarta.setAttribute('data-type', carta.tipo);
      elementoCarta.setAttribute('tabindex', '0');
      elementoCarta.setAttribute('role', 'button');
    elementoCarta.setAttribute('aria-label', (carta.tipo === 'term' ? 'Termo: ' : 'Definição: ') + carta.conteudo);

      var inner = document.createElement('div'); inner.className = 'carta-interna';
      var verso = document.createElement('div'); verso.className = 'carta-verso';
      var textoVerso = document.createElement('div'); textoVerso.className = 'text'; textoVerso.textContent = 'Virar';
      verso.appendChild(textoVerso);

      var frente = document.createElement('div'); frente.className = 'carta-frente';
      var textoFrente = document.createElement('div'); textoFrente.className = 'text'; textoFrente.textContent = carta.conteudo;
      frente.appendChild(textoFrente);

      inner.appendChild(verso);
      inner.appendChild(frente);
      elementoCarta.appendChild(inner);
      tabuleiro.appendChild(elementoCarta);
    }
  }

  // ---------- Lógica de jogo ao virar cartas ----------
  // Lógica executada quando uma carta é ativada (clicada ou acionada por teclado)
  function aoAtivarCarta(elementoCarta){
    // se o tabuleiro está bloqueado (avaliação em curso), ignorar entrada
    if(bloqueioTabuleiro) return;
    var id = parseInt(elementoCarta.getAttribute('data-id'), 10);

    // localizar o objeto de carta no baralho pelo id
    var objetoCarta = null;
    for(var i = 0; i < baralho.length; i++){
      if(baralho[i].id === id){ objetoCarta = baralho[i]; break; }
    }
    if(!objetoCarta) return;
    if(objetoCarta.combinada) return; // se já foi emparelhada, ignorar
    // evitar selecionar a mesma carta duas vezes seguidas
    if(primeiraCarta && primeiraCarta.obj.id === objetoCarta.id) return;

    // revelar visualmente a carta
    elementoCarta.classList.add('virada');

    // iniciar temporizador no primeiro movimento
    if(!temporizadorAtivo){ iniciarTemporizador(); }

    // se não existe primeiraCarta selecionada, atribuí-la e aguardar a segunda
    if(!primeiraCarta){
      primeiraCarta = { obj: objetoCarta, el: elementoCarta };
      return;
    }

    // segunda carta selecionada
    segundaCarta = { obj: objetoCarta, el: elementoCarta };
    bloqueioTabuleiro = true; // bloquear novas interações até avaliar

    // checar correspondência: mesmos pairId e tipos diferentes (term vs definition)
    if(primeiraCarta.obj.pairId === segundaCarta.obj.pairId && primeiraCarta.obj.tipo !== segundaCarta.obj.tipo){
      // acerto: marcar ambas cartas como emparelhadas
      primeiraCarta.obj.combinada = true;
      segundaCarta.obj.combinada = true;
      primeiraCarta.el.classList.add('combinada');
      segundaCarta.el.classList.add('combinada');
      contadorAcertos += 1;
      atualizarHUD();
      // limpar seleção e desbloquear
      primeiraCarta = null; segundaCarta = null; bloqueioTabuleiro = false;

      // verificar se o jogo terminou (acertou todos os pares)
      if(contadorAcertos === dadosTermos.length){
        finalizarJogo();
      }
    } else {
      // erro: incrementar contador e virar as cartas de volta após pequeno delay
      contadorErros += 1;
      atualizarHUD();
      window.setTimeout(function(){
        // esconder visualmente as cartas novamente
        primeiraCarta.el.classList.remove('virada');
        segundaCarta.el.classList.remove('virada');
        primeiraCarta = null; segundaCarta = null; bloqueioTabuleiro = false;
      }, 800);
    }
  }

  // ---------- HUD e timer ----------
  // Atualiza os elementos visíveis do HUD (tempo, acertos e erros)
  function atualizarHUD(){
    elementoTempo.textContent = formatarTempo(segundos);
    elementoAcertos.textContent = contadorAcertos.toString();
    elementoErros.textContent = contadorErros.toString();
  }

  // Inicia o temporizador (incrementa segundos e atualiza o HUD a cada segundo)
  function iniciarTemporizador(){
    temporizadorAtivo = true;
    if(intervaloTempo) return;
    intervaloTempo = window.setInterval(function(){
      segundos += 1;
      elementoTempo.textContent = formatarTempo(segundos);
    }, 1000);
  }

  // Para o temporizador e limpa o intervalo
  function pararTemporizador(){
    temporizadorAtivo = false;
    if(intervaloTempo){ window.clearInterval(intervaloTempo); intervaloTempo = null; }
  }

  // ---------- Fim do jogo ----------
  // Finaliza o jogo: para o timer, monta a tela de resultados e exibe as explicações
  function finalizarJogo(){
    pararTemporizador();
    // mostrar estatísticas finais
    elementoTempoFinal.textContent = formatarTempo(segundos);
    elementoAcertosFinais.textContent = contadorAcertos.toString();
    elementoErrosFinais.textContent = contadorErros.toString();

    // preencher seção de explicações com todos os termos (requisito obrigatório)
    while(elementoExplicacoes.firstChild){ elementoExplicacoes.removeChild(elementoExplicacoes.firstChild); }
    for(var i = 0; i < dadosTermos.length; i++){
      var it = dadosTermos[i];
    var caixa = document.createElement('div'); caixa.className = 'explicacao';
      var titulo = document.createElement('div'); titulo.style.fontWeight = '700'; titulo.textContent = it.term;
      var descricao = document.createElement('div'); descricao.textContent = it.definition;
      caixa.appendChild(titulo); caixa.appendChild(descricao);
      elementoExplicacoes.appendChild(caixa);
    }

    // alterna visibilidade das telas
    telaTabuleiro.classList.add('oculto');
    hud.classList.add('oculto');
    telaFim.classList.remove('oculto');
  }

  // ---------- Inicialização e eventos ----------
  // Inicia uma nova partida: reseta estado, constrói e embaralha o baralho e renderiza
  function iniciarJogo(){
    // reset do estado do jogo
    pararTemporizador();
    segundos = 0; elementoTempo.textContent = formatarTempo(0);
    contadorAcertos = 0; contadorErros = 0; atualizarHUD();
    primeiraCarta = null; segundaCarta = null; bloqueioTabuleiro = false;

    construirBaralho();
    embaralharArray(baralho);
    renderizarTabuleiro();

    // alternar telas: esconder início/fim e mostrar HUD/tabuleiro
    telaInicio.classList.add('oculto');
    telaFim.classList.add('oculto');
    hud.classList.remove('oculto');
    telaTabuleiro.classList.remove('oculto');
  }

  function reiniciarJogo(){
    iniciarJogo();
  }

  // eventos de clique no tabuleiro (event delegation)
  // Delegação de eventos: captura clique em qualquer carta dentro do tabuleiro
  tabuleiro.addEventListener('click', function(e){
    var el = e.target;
    // sobe na árvore DOM até encontrar o elemento com a classe 'carta'
    while(el && !el.classList.contains('carta')){
      el = el.parentElement;
    }
    if(!el) return;
    aoAtivarCarta(el);
  });

  // suporte a teclado: Enter ou Space ativa o card
  // Suporte a teclado: Enter ou Space ativam a carta focada
  tabuleiro.addEventListener('keydown', function(e){
    var el = e.target;
    if(!el || !el.classList.contains('carta')) return;
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
      e.preventDefault();
      aoAtivarCarta(el);
    }
  });

  // Botões de controle: iniciar, reiniciar, jogar novamente e voltar ao início
  botaoIniciar.addEventListener('click', function(){ iniciarJogo(); });
  botaoReiniciar.addEventListener('click', function(){ reiniciarJogo(); });
  botaoJogarNovamente.addEventListener('click', function(){ iniciarJogo(); });
  botaoVoltarInicio.addEventListener('click', function(){
    // parar temporizador e retornar para a tela inicial
    pararTemporizador();
    telaTabuleiro.classList.add('oculto');
    hud.classList.add('oculto');
    telaFim.classList.add('oculto');
    telaInicio.classList.remove('oculto');
  });

  // atualização contínua do HUD (tempo já atualizado pela função startTimer)
  // Inicialização da interface: mostra a tela inicial e esconde elementos de jogo
  function iniciarApp(){
    telaInicio.classList.remove('oculto');
    hud.classList.add('oculto');
    telaTabuleiro.classList.add('oculto');
    telaFim.classList.add('oculto');
    atualizarHUD();
  }

  // executa inicialização
  iniciarApp();

})();
