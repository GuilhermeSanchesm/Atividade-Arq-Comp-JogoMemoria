
/*
  Jogo da Memória - Arquitetura Computacional
  Regras e restrições: estruturas básicas de JS, loops,
  condicionais, arrays/objetos, DOM e Math.random().
*/

(function(){

    // ---------- Dados dos termos ----------

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

    // Controle da dica
    var temporizadorDica = null;
    var dicaEmAndamento = false;

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
    var botaoDica = document.getElementById('botao-dica');

    var telaFim = document.getElementById('tela-fim');
    var elementoTempoFinal = document.getElementById('tempo-final');
    var elementoAcertosFinais = document.getElementById('acertos-finais');
    var elementoErrosFinais = document.getElementById('erros-finais');
    var elementoExplicacoes = document.getElementById('explicacoes');

    var botaoJogarNovamente = document.getElementById('botao-jogar-novamente');
    var botaoVoltarInicio = document.getElementById('botao-voltar-inicio');

    // Efeitos sonoros
    var somAcerto = document.getElementById('som-acerto');
    var somErro = document.getElementById('som-erro');
    var somConclusao = document.getElementById('som-conclusao');

    // ---------- Funções utilitárias ----------

    function formatarTempo(totalSegundos){

        var minutos = Math.floor(totalSegundos / 60);
        var segundosRestantes = totalSegundos - minutos * 60;

        function pad(num){
            return (num < 10 ? '0' + num : '' + num);
        }

        return pad(minutos) + ':' + pad(segundosRestantes);
    }

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

            baralho.push({
                id: contadorIds++,
                pairId: item.pairId,
                tipo: 'term',
                conteudo: item.term,
                combinada: false
            });

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

    // ---------- Sistema de dica ----------

    function pedirDica(){

        // Impedir dica durante outra jogada ou outra dica
        if(bloqueioTabuleiro || dicaEmAndamento){
            return;
        }

        // Não permitir dica se já existe uma carta selecionada
        if(primeiraCarta){
            alert('Finalize sua jogada antes de pedir uma dica!');
            return;
        }

        // Procurar os pares que ainda não foram encontrados
        var paresDisponiveis = [];

        for(var i = 0; i < dadosTermos.length; i++){

            var parEncontrado = false;

            for(var j = 0; j < baralho.length; j++){

                if(
                    baralho[j].pairId === dadosTermos[i].pairId &&
                    baralho[j].combinada
                ){
                    parEncontrado = true;
                    break;
                }
            }

            if(!parEncontrado){
                paresDisponiveis.push(dadosTermos[i].pairId);
            }
        }

        // Verificar se existem pares disponíveis
        if(paresDisponiveis.length === 0){
            return;
        }

        // Escolher aleatoriamente um par ainda não encontrado
        var indiceAleatorio = Math.floor(
            Math.random() * paresDisponiveis.length
        );

        var parEscolhido = paresDisponiveis[indiceAleatorio];

        var cartaTermo = null;
        var cartaDefinicao = null;

        // Localizar os dois elementos do par escolhido
        var cartasElementos = tabuleiro.querySelectorAll('.carta');

        for(var k = 0; k < cartasElementos.length; k++){

            var elemento = cartasElementos[k];

            var pairId = parseInt(
                elemento.getAttribute('data-pairid'),
                10
            );

            var tipo = elemento.getAttribute('data-type');

            if(pairId === parEscolhido){

                if(tipo === 'term'){
                    cartaTermo = elemento;
                }

                if(tipo === 'definition'){
                    cartaDefinicao = elemento;
                }
            }
        }

        if(!cartaTermo || !cartaDefinicao){
            return;
        }

        // Iniciar o cronômetro caso seja a primeira ação
        if(!temporizadorAtivo){
            iniciarTemporizador();
        }

        // Bloquear o tabuleiro durante a demonstração
        bloqueioTabuleiro = true;
        dicaEmAndamento = true;

        // Revelar as duas cartas
        cartaTermo.classList.add('virada');
        cartaDefinicao.classList.add('virada');

        // Ocultar novamente depois de 1,5 segundo
        temporizadorDica = window.setTimeout(function(){

            cartaTermo.classList.remove('virada');
            cartaDefinicao.classList.remove('virada');

            dicaEmAndamento = false;
            bloqueioTabuleiro = false;
            temporizadorDica = null;

        }, 1500);
    }

    // ---------- Lógica de virar cartas ----------

    function aoAtivarCarta(elementoCarta){

        if(bloqueioTabuleiro) return;

        var id = parseInt(elementoCarta.getAttribute('data-id'), 10);

        var objetoCarta = null;

        for(var i = 0; i < baralho.length; i++){

            if(baralho[i].id === id){
                objetoCarta = baralho[i];
                break;
            }
        }

        if(!objetoCarta) return;

        if(objetoCarta.combinada) return;

        if(primeiraCarta && primeiraCarta.obj.id === objetoCarta.id){
            return;
        }

        elementoCarta.classList.add('virada');

        if(!temporizadorAtivo){
            iniciarTemporizador();
        }

        if(!primeiraCarta){

            primeiraCarta = {
                obj: objetoCarta,
                el: elementoCarta
            };

            return;
        }

        segundaCarta = {
            obj: objetoCarta,
            el: elementoCarta
        };

        bloqueioTabuleiro = true;

        // Verificar se as cartas formam um par
        if(
            primeiraCarta.obj.pairId === segundaCarta.obj.pairId &&
            primeiraCarta.obj.tipo !== segundaCarta.obj.tipo
        ){

            reproduzirSom(somAcerto);

            primeiraCarta.obj.combinada = true;
            segundaCarta.obj.combinada = true;

            primeiraCarta.el.classList.add('combinada');
            segundaCarta.el.classList.add('combinada');

            contadorAcertos += 1;

            atualizarHUD();

            primeiraCarta = null;
            segundaCarta = null;
            bloqueioTabuleiro = false;

            if(contadorAcertos === dadosTermos.length){
                finalizarJogo();
            }

        } else {

            reproduzirSom(somErro);

            contadorErros += 1;

            atualizarHUD();

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

    function iniciarTemporizador(){

        temporizadorAtivo = true;

        if(intervaloTempo) return;

        intervaloTempo = window.setInterval(function(){

            segundos += 1;

            elementoTempo.textContent = formatarTempo(segundos);

        }, 1000);
    }

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

        reproduzirSom(somConclusao);

        elementoTempoFinal.textContent = formatarTempo(segundos);
        elementoAcertosFinais.textContent = contadorAcertos.toString();
        elementoErrosFinais.textContent = contadorErros.toString();

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

        telaTabuleiro.classList.add('oculto');
        hud.classList.add('oculto');
        telaFim.classList.remove('oculto');
    }

    // ---------- Controle da dica ao reiniciar ----------

    function cancelarDica(){

        if(temporizadorDica){

            window.clearTimeout(temporizadorDica);
            temporizadorDica = null;
        }

        dicaEmAndamento = false;
        bloqueioTabuleiro = false;
    }

    // ---------- Inicialização do jogo ----------

    function iniciarJogo(){

        pararTemporizador();
        cancelarDica();

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

        segundos = 0;
        elementoTempo.textContent = formatarTempo(0);

        contadorAcertos = 0;
        contadorErros = 0;

        atualizarHUD();

        primeiraCarta = null;
        segundaCarta = null;

        bloqueioTabuleiro = false;

        construirBaralho();
        embaralharArray(baralho);

        renderizarTabuleiro();

        telaInicio.classList.add('oculto');
        telaFim.classList.add('oculto');

        hud.classList.remove('oculto');
        telaTabuleiro.classList.remove('oculto');
    }

    function reiniciarJogo(){

        iniciarJogo();
    }

    // ---------- Eventos do tabuleiro ----------

    tabuleiro.addEventListener('click', function(e){

        var el = e.target;

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

    // ---------- Eventos dos botões ----------

    botaoIniciar.addEventListener('click', function(){
        iniciarJogo();
    });

    botaoReiniciar.addEventListener('click', function(){
        reiniciarJogo();
    });

    botaoJogarNovamente.addEventListener('click', function(){
        iniciarJogo();
    });

    // Botão de pedir dica
    botaoDica.addEventListener('click', function(){
        pedirDica();
    });

    botaoVoltarInicio.addEventListener('click', function(){

        pararTemporizador();
        cancelarDica();

        if(somAcerto) somAcerto.pause();
        if(somErro) somErro.pause();
        if(somConclusao) somConclusao.pause();

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

    iniciarApp();

})();
