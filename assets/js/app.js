const ARQUIVO_MUSICAS = 'data/musicas.json';

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
