
/*

  Jogo da Memória - Arquitetura Computacional

  Regras e restrições: usar apenas estruturas básicas de JS, loops,
  condicionais, arrays/objetos, DOM e Math.random().

*/

// Função principal do jogo
(function(){

    // ---------- Dados obrigatórios (12 termos) ----------

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


    // ---------- Estado do jogo ----------

    var baralho = [];
    var primeiraCarta = null;
    var segundaCarta = null;
    var bloqueioTabuleiro = false;
    var contadorAcertos = 0;
    var contadorErros = 0;
    var intervaloTempo = null;
    var segundos = 0;
    var temporizadorAtivo = false;


    // ---------- Elementos DOM ----------

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

    // Referências dos três efeitos sonoros
    var somAcerto = document.getElementById('som-acerto');
    var somErro = document.getElementById('som-erro');
    var somConclusao = document.getElementById('som-conclusao');


    // ---------- Funções utilitárias ----------

    // Converte segundos em string MM:SS
    function formatarTempo(totalSegundos){

        var minutos = Math.floor(totalSegundos / 60);
        var segundosRestantes = totalSegundos - minutos * 60;

        function pad(num){
            return (num < 10 ? '0' + num : '' + num);
        }

        return pad(minutos) + ':' + pad(segundosRestantes);
    }


    // Embaralha um array usando Fisher-Yates e Math.random()
    function embaralharArray(arr){

        for(var i = arr.length - 1; i > 0; i--){

            var j = Math.floor(Math.random() * (i + 1));

            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
    }


    // ---------- Construção do baralho ----------

    function construirBaralho(){

        baralho = [];

        var contadorIds = 1;

        for(var i = 0; i < dadosTermos.length; i++){

            var item = dadosTermos[i];

            // Carta do termo
            baralho.push({
                id: contadorIds++,
                pairId: item.pairId,
                tipo: 'term',
                conteudo: item.term,
                combinada: false
            });

            // Carta da definição
            baralho.push({
                id: contadorIds++,
                pairId: item.pairId,
                tipo: 'definition',
                conteudo: item.definition,
                combinada: false
            });
        }
    }


    // ---------- Renderização do tabuleiro ----------

    function renderizarTabuleiro(){

        // Limpar conteúdo anterior
        while(tabuleiro.firstChild){
            tabuleiro.removeChild(tabuleiro.firstChild);
        }

        for(var i = 0; i < baralho.length; i++){

            var carta = baralho[i];

            var elementoCarta = document.createElement('div');

            elementoCarta.className = 'carta';

            elementoCarta.setAttribute('data-id', carta.id);
            elementoCarta.setAttribute('data-pairid', carta.pairId);
            elementoCarta.setAttribute('data-type', carta.tipo);
            elementoCarta.setAttribute('tabindex', '0');
            elementoCarta.setAttribute('role', 'button');

            elementoCarta.setAttribute(
                'aria-label',
                (carta.tipo === 'term' ? 'Termo: ' : 'Definição: ') + carta.conteudo
            );

            var inner = document.createElement('div');
            inner.className = 'carta-interna';

            var verso = document.createElement('div');
            verso.className = 'carta-verso';

            var textoVerso = document.createElement('div');
            textoVerso.className = 'text';
            textoVerso.textContent = 'Virar';

            verso.appendChild(textoVerso);

            var frente = document.createElement('div');
            frente.className = 'carta-frente';

            var textoFrente = document.createElement('div');
            textoFrente.className = 'text';
            textoFrente.textContent = carta.conteudo;

            frente.appendChild(textoFrente);

            inner.appendChild(verso);
            inner.appendChild(frente);

            elementoCarta.appendChild(inner);

            tabuleiro.appendChild(elementoCarta);
        }
    }


    // ---------- Reprodução dos áudios ----------

    function reproduzirSom(som){

        if(som){

            som.currentTime = 0;

            var reproducao = som.play();

            if(reproducao && reproducao.catch){
                reproducao.catch(function(erro){
                    console.log('Não foi possível reproduzir o áudio:', erro);
                });
            }
        }
    }


    // ---------- Lógica de jogo ao virar cartas ----------

    function aoAtivarCarta(elementoCarta){

        // Se o tabuleiro está bloqueado, ignorar entrada
        if(bloqueioTabuleiro) return;

        var id = parseInt(elementoCarta.getAttribute('data-id'), 10);

        // Localizar o objeto da carta no baralho
        var objetoCarta = null;

        for(var i = 0; i < baralho.length; i++){

            if(baralho[i].id === id){
                objetoCarta = baralho[i];
                break;
            }
        }

        if(!objetoCarta) return;

        // Se a carta já foi combinada, ignorar
        if(objetoCarta.combinada) return;

        // Evitar selecionar a mesma carta duas vezes
        if(primeiraCarta && primeiraCarta.obj.id === objetoCarta.id) return;

        // Revelar visualmente a carta
        elementoCarta.classList.add('virada');

        // Iniciar temporizador no primeiro movimento
        if(!temporizadorAtivo){
            iniciarTemporizador();
        }

        // Selecionar a primeira carta
        if(!primeiraCarta){

            primeiraCarta = {
                obj: objetoCarta,
                el: elementoCarta
            };

            return;
        }

        // Selecionar a segunda carta
        segundaCarta = {
            obj: objetoCarta,
            el: elementoCarta
        };

        bloqueioTabuleiro = true;

        // Verificar se as cartas formam um par correto
        if(
            primeiraCarta.obj.pairId === segundaCarta.obj.pairId &&
            primeiraCarta.obj.tipo !== segundaCarta.obj.tipo
        ){

            // Reproduzir som de acerto
            reproduzirSom(somAcerto);

            // Marcar as cartas como combinadas
            primeiraCarta.obj.combinada = true;
            segundaCarta.obj.combinada = true;

            primeiraCarta.el.classList.add('combinada');
            segundaCarta.el.classList.add('combinada');

            contadorAcertos += 1;

            atualizarHUD();

            // Limpar seleção e desbloquear tabuleiro
            primeiraCarta = null;
            segundaCarta = null;
            bloqueioTabuleiro = false;

            // Verificar se todos os pares foram encontrados
            if(contadorAcertos === dadosTermos.length){
                finalizarJogo();
            }

        } else {

            // Reproduzir som de erro
            reproduzirSom(somErro);

            // Incrementar contador de erros
            contadorErros += 1;

            atualizarHUD();

            // Virar as cartas novamente após 800 milissegundos
            window.setTimeout(function(){

                primeiraCarta.el.classList.remove('virada');
                segundaCarta.el.classList.remove('virada');

                primeiraCarta = null;
                segundaCarta = null;
                bloqueioTabuleiro = false;

            }, 800);
        }
    }


    // ---------- HUD e temporizador ----------

    function atualizarHUD(){

        elementoTempo.textContent = formatarTempo(segundos);
        elementoAcertos.textContent = contadorAcertos.toString();
        elementoErros.textContent = contadorErros.toString();
    }


    // Iniciar temporizador
    function iniciarTemporizador(){

        temporizadorAtivo = true;

        if(intervaloTempo) return;

        intervaloTempo = window.setInterval(function(){

            segundos += 1;

            elementoTempo.textContent = formatarTempo(segundos);

        }, 1000);
    }


    // Parar temporizador
    function pararTemporizador(){

        temporizadorAtivo = false;

        if(intervaloTempo){

            window.clearInterval(intervaloTempo);
            intervaloTempo = null;
        }
    }


    // ---------- Fim do jogo ----------

    function finalizarJogo(){

        pararTemporizador();

        // Reproduzir som de conclusão
        reproduzirSom(somConclusao);

        // Mostrar estatísticas finais
        elementoTempoFinal.textContent = formatarTempo(segundos);
        elementoAcertosFinais.textContent = contadorAcertos.toString();
        elementoErrosFinais.textContent = contadorErros.toString();

        // Preencher seção de explicações
        while(elementoExplicacoes.firstChild){
            elementoExplicacoes.removeChild(elementoExplicacoes.firstChild);
        }

        for(var i = 0; i < dadosTermos.length; i++){

            var it = dadosTermos[i];

            var caixa = document.createElement('div');
            caixa.className = 'explicacao';

            var titulo = document.createElement('div');
            titulo.style.fontWeight = '700';
            titulo.textContent = it.term;

            var descricao = document.createElement('div');
            descricao.textContent = it.definition;

            caixa.appendChild(titulo);
            caixa.appendChild(descricao);

            elementoExplicacoes.appendChild(caixa);
        }

        // Alternar visibilidade das telas
        telaTabuleiro.classList.add('oculto');
        hud.classList.add('oculto');
        telaFim.classList.remove('oculto');
    }


    // ---------- Inicialização e eventos ----------

    function iniciarJogo(){

        // Parar temporizador
        pararTemporizador();

        // Parar e reiniciar os três áudios
        if(somAcerto){
            somAcerto.pause();
            somAcerto.currentTime = 0;
        }

        if(somErro){
            somErro.pause();
            somErro.currentTime = 0;
        }

        if(somConclusao){
            somConclusao.pause();
            somConclusao.currentTime = 0;
        }

        // Reiniciar estado do jogo
        segundos = 0;
        elementoTempo.textContent = formatarTempo(0);

        contadorAcertos = 0;
        contadorErros = 0;

        atualizarHUD();

        primeiraCarta = null;
        segundaCarta = null;
        bloqueioTabuleiro = false;

        // Construir e embaralhar baralho
        construirBaralho();
        embaralharArray(baralho);

        // Renderizar cartas
        renderizarTabuleiro();

        // Alternar telas
        telaInicio.classList.add('oculto');
        telaFim.classList.add('oculto');

        hud.classList.remove('oculto');
        telaTabuleiro.classList.remove('oculto');
    }


    function reiniciarJogo(){

        iniciarJogo();
    }


    // ---------- Eventos de clique no tabuleiro ----------

    tabuleiro.addEventListener('click', function(e){

        var el = e.target;

        // Subir na árvore DOM até encontrar a carta
        while(el && !el.classList.contains('carta')){
            el = el.parentElement;
        }

        if(!el) return;

        aoAtivarCarta(el);
    });


    // ---------- Suporte ao teclado ----------

    tabuleiro.addEventListener('keydown', function(e){

        var el = e.target;

        if(!el || !el.classList.contains('carta')) return;

        if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){

            e.preventDefault();

            aoAtivarCarta(el);
        }
    });


    // ---------- Botões de controle ----------

    botaoIniciar.addEventListener('click', function(){

        iniciarJogo();
    });


    botaoReiniciar.addEventListener('click', function(){

        reiniciarJogo();
    });


    botaoJogarNovamente.addEventListener('click', function(){

        iniciarJogo();
    });


    botaoVoltarInicio.addEventListener('click', function(){

        // Parar temporizador
        pararTemporizador();

        // Parar os áudios
        if(somAcerto) somAcerto.pause();
        if(somErro) somErro.pause();
        if(somConclusao) somConclusao.pause();

        // Voltar para a tela inicial
        telaTabuleiro.classList.add('oculto');
        hud.classList.add('oculto');
        telaFim.classList.add('oculto');

        telaInicio.classList.remove('oculto');
    });


    // ---------- Inicialização da interface ----------

    function iniciarApp(){

        telaInicio.classList.remove('oculto');

        hud.classList.add('oculto');
        telaTabuleiro.classList.add('oculto');
        telaFim.classList.add('oculto');

        atualizarHUD();
    }


    // Executar inicialização
    iniciarApp();

})();
