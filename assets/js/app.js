const ARQUIVO_MUSICAS = 'data/musicas.json';
const CHAVE_MISSA_ATUAL = 'missaAtualV01';
const CHAVE_DADOS_CELEBRACAO = 'missaDadosV01';

async function carregarMusicas() {
  const resposta = await fetch(ARQUIVO_MUSICAS);
  if (!resposta.ok) throw new Error('Não foi possível carregar o repertório.');
  return resposta.json();
}

const momentosPadrao = [
  'Entrada',
  'Perdão',
  'Glória',
  'Salmo',
  'Aclamação',
  'Oferendas',
  'Santo',
  'Cordeiro',
  'Comunhão',
  'Pós-Comunhão',
  'Final'
];

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function lerObjetoLocal(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave)) || {};
  } catch {
    return {};
  }
}

function formatarDataHome(data) {
  if (!data) return '';
  const partes = data.split('-');
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function iniciarMissaAtualHome() {
  const area = document.querySelector('#missaAtualHome');
  if (!area) return;

  const escolhas = lerObjetoLocal(CHAVE_MISSA_ATUAL);
  const dados = lerObjetoLocal(CHAVE_DADOS_CELEBRACAO);
  const quantidade = momentosPadrao.filter(momento => escolhas[momento]).length;
  const possuiIdentificacao = Boolean(dados.nome || dados.data || dados.horario);

  if (!quantidade && !possuiIdentificacao) return;

  const partes = [];
  if (dados.nome) partes.push(dados.nome);
  if (dados.data) partes.push(formatarDataHome(dados.data));
  if (dados.horario) partes.push(dados.horario);

  partes.push(
    quantidade
      ? `${quantidade} de ${momentosPadrao.length} momentos com música`
      : 'Nenhuma música escolhida ainda'
  );

  const meta = document.querySelector('#missaAtualMeta');
  if (meta) meta.textContent = partes.join(' · ');

  const roteiro = document.querySelector('#abrirRoteiroAtual');
  if (roteiro) roteiro.hidden = quantidade === 0;

  area.hidden = false;
}

function iniciarHome() {
  const area = document.querySelector('#categorias');
  if (!area) return;

  momentosPadrao.forEach(momento => {
    const link = criarElemento('a', 'categoria');
    link.href = `repertorio.html?momento=${encodeURIComponent(momento)}`;

    const titulo = criarElemento('strong', '', momento);
    const quebra = document.createElement('br');
    const meta = criarElemento('span', 'meta', 'Ver músicas');

    link.append(titulo, quebra, meta);
    area.appendChild(link);
  });
}

function criarBlocoMusica(titulo, conteudo, modo) {
  const secao = criarElemento('section', 'bloco-musica');
  if (modo) secao.dataset.modo = modo;

  secao.appendChild(criarElemento('h2', '', titulo));

  const texto = criarElemento(modo === 'cifra' ? 'pre' : 'div', 'texto-musica', conteudo);
  secao.appendChild(texto);

  return secao;
}

function criarUsoNaMissa(musica) {
  const secao = criarElemento('section', 'dados-celebracao');
  secao.setAttribute('aria-labelledby', 'tituloUsarNaMissa');

  const cabecalho = criarElemento('div', 'dados-celebracao-cabecalho');
  const tituloArea = document.createElement('div');
  tituloArea.append(
    criarElemento('p', 'sobrelinha', 'Preparação'),
    criarElemento('h2', '', 'Usar nesta Missa')
  );
  tituloArea.querySelector('h2').id = 'tituloUsarNaMissa';
  cabecalho.appendChild(tituloArea);

  const explicacao = criarElemento(
    'p',
    'momento-meta',
    'Escolha em qual momento da celebração esta música entrará.'
  );

  const acoes = criarElemento('div', 'acoes');
  const status = criarElemento('p', 'momento-meta');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  function atualizarBotoes() {
    const escolhas = lerObjetoLocal(CHAVE_MISSA_ATUAL);
    acoes.innerHTML = '';

    musica.momentos.forEach(momento => {
      const jaEscolhida = escolhas[momento] === musica.id;
      const botao = criarElemento(
        'button',
        jaEscolhida ? 'botao primario' : 'botao',
        jaEscolhida ? `${momento} · escolhida` : `Usar em ${momento}`
      );
      botao.type = 'button';
      botao.setAttribute('aria-pressed', String(jaEscolhida));

      botao.addEventListener('click', () => {
        const atuais = lerObjetoLocal(CHAVE_MISSA_ATUAL);
        const anteriorId = atuais[momento];

        if (anteriorId === musica.id) {
          status.textContent = `${musica.titulo} já está escolhida para ${momento}.`;
          return;
        }

        if (anteriorId) {
          const substituir = window.confirm(
            `Já existe uma música escolhida para ${momento}. Deseja substituí-la por “${musica.titulo}”?`
          );
          if (!substituir) return;
        }

        atuais[momento] = musica.id;
        localStorage.setItem(CHAVE_MISSA_ATUAL, JSON.stringify(atuais));
        status.textContent = `${musica.titulo} foi adicionada ao momento ${momento}.`;
        atualizarBotoes();
      });

      acoes.appendChild(botao);
    });
  }

  const abrirMontagem = criarElemento('a', 'botao', 'Ver montagem da Missa');
  abrirMontagem.href = 'montar-missa.html';
  acoes.appendChild(abrirMontagem);

  atualizarBotoes();

  secao.append(cabecalho, explicacao, acoes, status);
  return secao;
}

function configurarControlesMusica(area, blocoCifra, blocoLetra) {
  const controles = criarElemento('div', 'controles-musica');

  const modos = criarElemento('div', 'controle-segmentado');
  modos.setAttribute('aria-label', 'Modo de leitura');

  const botaoCifra = criarElemento('button', '', 'Letra e cifra');
  botaoCifra.type = 'button';

  const botaoLetra = criarElemento('button', '', 'Somente letra');
  botaoLetra.type = 'button';

  function ativarModo(modo) {
    const cifraAtiva = modo === 'cifra';
    botaoCifra.classList.toggle('ativo', cifraAtiva);
    botaoLetra.classList.toggle('ativo', !cifraAtiva);
    botaoCifra.setAttribute('aria-pressed', String(cifraAtiva));
    botaoLetra.setAttribute('aria-pressed', String(!cifraAtiva));

    if (blocoCifra) blocoCifra.classList.toggle('oculto-modo', !cifraAtiva);
    if (blocoLetra) blocoLetra.classList.toggle('oculto-modo', cifraAtiva);
  }

  botaoCifra.addEventListener('click', () => ativarModo('cifra'));
  botaoLetra.addEventListener('click', () => ativarModo('letra'));

  if (blocoCifra && blocoLetra) {
    modos.append(botaoCifra, botaoLetra);
    controles.appendChild(modos);
    ativarModo('cifra');
  }

  const fonte = criarElemento('div', 'controle-fonte');
  fonte.setAttribute('aria-label', 'Tamanho do texto');

  const diminuir = criarElemento('button', '', 'A−');
  diminuir.type = 'button';
  diminuir.setAttribute('aria-label', 'Diminuir texto');

  const padrao = criarElemento('button', '', 'A');
  padrao.type = 'button';
  padrao.setAttribute('aria-label', 'Tamanho padrão');

  const aumentar = criarElemento('button', '', 'A+');
  aumentar.type = 'button';
  aumentar.setAttribute('aria-label', 'Aumentar texto');

  const tamanhos = [0.9, 1, 1.15, 1.3, 1.5];
  const salvo = Number(localStorage.getItem('musicasMissaTamanhoTexto'));
  let indice = Number.isInteger(salvo) && salvo >= 0 && salvo < tamanhos.length ? salvo : 1;

  function aplicarTamanho() {
    area.style.setProperty('--tamanho-musica', `${tamanhos[indice]}rem`);
    localStorage.setItem('musicasMissaTamanhoTexto', String(indice));
  }

  diminuir.addEventListener('click', () => {
    indice = Math.max(0, indice - 1);
    aplicarTamanho();
  });

  padrao.addEventListener('click', () => {
    indice = 1;
    aplicarTamanho();
  });

  aumentar.addEventListener('click', () => {
    indice = Math.min(tamanhos.length - 1, indice + 1);
    aplicarTamanho();
  });

  fonte.append(diminuir, padrao, aumentar);
  controles.appendChild(fonte);
  aplicarTamanho();

  return controles;
}

async function iniciarMusica() {
  const area = document.querySelector('#detalheMusica');
  if (!area) return;

  const id = new URLSearchParams(location.search).get('id');
  const musicas = await carregarMusicas();
  const musica = musicas.find(item => item.id === id);

  area.innerHTML = '';

  if (!musica) {
    area.append(
      criarElemento('h1', '', 'Música não encontrada'),
      criarElemento('p', '', 'Volte ao repertório e escolha outra música.')
    );
    return;
  }

  document.title = `${musica.titulo} — Músicas para a Missa`;

  area.appendChild(criarElemento('p', 'sobrelinha', musica.momentos.join(' · ')));
  area.appendChild(criarElemento('h1', '', musica.titulo));
  area.appendChild(
    criarElemento(
      'p',
      'meta',
      `Autor: ${musica.autor || '—'} · Tom: ${musica.tom || '—'}`
    )
  );

  if (Array.isArray(musica.momentos) && musica.momentos.length) {
    area.appendChild(criarUsoNaMissa(musica));
  }

  if (musica.youtube) {
    const acoes = criarElemento('div', 'acoes');
    const youtube = criarElemento('a', 'botao', 'Abrir no YouTube');
    youtube.href = musica.youtube;
    youtube.target = '_blank';
    youtube.rel = 'noopener';
    acoes.appendChild(youtube);
    area.appendChild(acoes);
  }

  const blocoCifra = musica.cifra ? criarBlocoMusica('Letra e cifra', musica.cifra, 'cifra') : null;
  const blocoLetra = musica.letra ? criarBlocoMusica('Letra', musica.letra, 'letra') : null;

  if (blocoCifra || blocoLetra) {
    area.appendChild(configurarControlesMusica(area, blocoCifra, blocoLetra));
  }

  if (blocoCifra) area.appendChild(blocoCifra);
  if (blocoLetra) area.appendChild(blocoLetra);

  if (musica.observacoes) {
    area.appendChild(criarBlocoMusica('Observações', musica.observacoes));
  }
}

iniciarMissaAtualHome();
iniciarHome();
iniciarMusica().catch(erro => {
  const area = document.querySelector('#detalheMusica');
  if (!area) return;
  area.innerHTML = '';
  area.append(
    criarElemento('h1', '', 'Não foi possível abrir a música'),
    criarElemento('p', '', erro.message)
  );
});