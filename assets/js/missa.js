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

const CHAVE = 'missaAtualV01';
const CHAVE_DADOS_CELEBRACAO = 'missaDadosV01';
const CHAVE_MODO_CELEBRACAO = 'missaModoCelebracao';
const CHAVE_FONTE_CELEBRACAO = 'missaFonteCelebracao';
let musicas = [];

async function carregarMusicas() {
  const resposta = await fetch('data/musicas.json');
  if (!resposta.ok) throw new Error('Não foi possível carregar o repertório.');
  return resposta.json();
}

function carregarEscolhas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {};
  } catch {
    return {};
  }
}

function salvarEscolhas(escolhas) {
  localStorage.setItem(CHAVE, JSON.stringify(escolhas));
}

function carregarDadosCelebracao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_DADOS_CELEBRACAO)) || {};
  } catch {
    return {};
  }
}

function salvarDadosCelebracao(dados) {
  const possuiDados = Boolean(dados.nome || dados.data || dados.horario);

  if (possuiDados) {
    localStorage.setItem(CHAVE_DADOS_CELEBRACAO, JSON.stringify(dados));
  } else {
    localStorage.removeItem(CHAVE_DADOS_CELEBRACAO);
  }
}

function formatarData(data) {
  if (!data) return '';
  const partes = data.split('-');
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function partesIdentificacao(dados) {
  const partes = [];
  if (dados.nome) partes.push(dados.nome);
  if (dados.data) partes.push(formatarData(dados.data));
  if (dados.horario) partes.push(dados.horario);
  return partes;
}

function iniciarDadosCelebracao() {
  const campoNome = document.querySelector('#celebracaoNome');
  const campoData = document.querySelector('#celebracaoData');
  const campoHorario = document.querySelector('#celebracaoHorario');
  if (!campoNome || !campoData || !campoHorario) return;

  const dados = carregarDadosCelebracao();
  campoNome.value = dados.nome || '';
  campoData.value = dados.data || '';
  campoHorario.value = dados.horario || '';

  function salvar() {
    salvarDadosCelebracao({
      nome: campoNome.value.trim(),
      data: campoData.value,
      horario: campoHorario.value
    });
  }

  campoNome.addEventListener('input', salvar);
  campoData.addEventListener('change', salvar);
  campoHorario.addEventListener('change', salvar);
}

function atualizarResumoMontagem() {
  const resumo = document.querySelector('#resumoEscolhas');
  if (!resumo) return;

  const escolhas = carregarEscolhas();
  const quantidade = momentosPadrao.filter(momento => escolhas[momento]).length;
  resumo.textContent = `${quantidade} de ${momentosPadrao.length} momentos com música`;
}

async function iniciarMontagem() {
  const area = document.querySelector('#momentosMissa');
  if (!area) return;

  iniciarDadosCelebracao();
  musicas = await carregarMusicas();
  const escolhas = carregarEscolhas();

  momentosPadrao.forEach(momento => {
    const disponiveis = musicas.filter(m => m.momentos.includes(momento));

    const card = document.createElement('section');
    card.className = 'momento-card';

    const info = document.createElement('div');
    info.className = 'momento-info';

    const titulo = document.createElement('h2');
    titulo.textContent = momento;

    const status = document.createElement('span');
    status.className = 'momento-status';

    info.append(titulo, status);

    const escolha = document.createElement('div');
    escolha.className = 'momento-escolha';

    const label = document.createElement('label');
    label.className = 'sr-only';
    label.htmlFor = `momento-${momento}`;
    label.textContent = `Escolher música para ${momento}`;

    const select = document.createElement('select');
    select.id = `momento-${momento}`;
    select.dataset.momento = momento;

    const opcaoVazia = document.createElement('option');
    opcaoVazia.value = '';
    opcaoVazia.textContent = 'Sem música escolhida';
    select.appendChild(opcaoVazia);

    disponiveis.forEach(musica => {
      const option = document.createElement('option');
      option.value = musica.id;
      option.textContent = musica.titulo;
      if (escolhas[momento] === musica.id) option.selected = true;
      select.appendChild(option);
    });

    const meta = document.createElement('p');
    meta.className = 'momento-meta';

    function atualizarCard() {
      const musica = musicas.find(item => item.id === select.value);
      const preenchido = Boolean(musica);

      card.classList.toggle('preenchido', preenchido);
      status.textContent = preenchido ? 'Música escolhida' : 'Sem música';

      if (musica) {
        const partes = [];
        if (musica.autor) partes.push(musica.autor);
        if (musica.tom) partes.push(`Tom ${musica.tom}`);
        meta.textContent = partes.join(' · ') || 'Música selecionada';
      } else {
        meta.textContent = disponiveis.length
          ? `${disponiveis.length} ${disponiveis.length === 1 ? 'opção disponível' : 'opções disponíveis'}`
          : 'Nenhuma música cadastrada para este momento';
      }
    }

    select.addEventListener('change', () => {
      const atual = carregarEscolhas();
      if (select.value) atual[momento] = select.value;
      else delete atual[momento];
      salvarEscolhas(atual);
      atualizarCard();
      atualizarResumoMontagem();
    });

    escolha.append(label, select, meta);
    card.append(info, escolha);
    area.appendChild(card);
    atualizarCard();
  });

  atualizarResumoMontagem();

  document.querySelector('#limpar').addEventListener('click', () => {
    localStorage.removeItem(CHAVE);
    document.querySelectorAll('#momentosMissa select').forEach(select => {
      select.value = '';
      select.dispatchEvent(new Event('change'));
    });
  });
}

function criarItemRoteiro(momento, musica, indice) {
  const item = document.createElement('section');
  item.className = 'roteiro-item';

  const numero = document.createElement('span');
  numero.className = 'roteiro-numero';
  numero.textContent = String(indice + 1).padStart(2, '0');
  numero.setAttribute('aria-hidden', 'true');

  const conteudo = document.createElement('div');
  conteudo.className = 'roteiro-conteudo';

  const sobrelinha = document.createElement('p');
  sobrelinha.className = 'sobrelinha';
  sobrelinha.textContent = momento;

  const titulo = document.createElement('h2');
  titulo.textContent = musica.titulo;

  const meta = document.createElement('p');
  meta.className = 'meta';
  const partes = [];
  if (musica.autor) partes.push(musica.autor);
  if (musica.tom) partes.push(`Tom ${musica.tom}`);
  meta.textContent = partes.join(' · ');

  const link = document.createElement('a');
  link.href = `musica.html?id=${encodeURIComponent(musica.id)}`;
  link.textContent = 'Abrir música';

  conteudo.append(sobrelinha, titulo, meta, link);
  item.append(numero, conteudo);
  return item;
}

function exibirIdentificacaoRoteiro(dados) {
  const area = document.querySelector('#identificacaoRoteiro');
  if (!area) return;

  const partes = partesIdentificacao(dados);
  if (!partes.length) return;

  area.textContent = partes.join(' · ');
  area.classList.remove('oculto');

  if (dados.nome) {
    document.title = `Roteiro — ${dados.nome}`;
  }
}

async function iniciarRoteiro() {
  const area = document.querySelector('#roteiro');
  if (!area) return;

  musicas = await carregarMusicas();
  const escolhas = carregarEscolhas();
  const dadosCelebracao = carregarDadosCelebracao();
  const identificacao = partesIdentificacao(dadosCelebracao).join(' · ');

  exibirIdentificacaoRoteiro(dadosCelebracao);

  const itens = momentosPadrao
    .filter(momento => escolhas[momento])
    .map(momento => {
      const musica = musicas.find(m => m.id === escolhas[momento]);
      return musica ? { momento, musica } : null;
    })
    .filter(Boolean);

  const resumo = document.querySelector('#resumoRoteiro');
  if (resumo) {
    resumo.textContent = itens.length
      ? `${itens.length} ${itens.length === 1 ? 'música escolhida' : 'músicas escolhidas'} em ${momentosPadrao.length} momentos da celebração.`
      : 'Nenhuma música escolhida ainda.';
  }

  document.querySelector('#imprimir').addEventListener('click', () => window.print());

  if (!itens.length) {
    const vazio = document.createElement('div');
    vazio.className = 'estado-vazio roteiro-vazio';
    vazio.append('Nenhuma música foi escolhida ainda. ');

    const link = document.createElement('a');
    link.href = 'montar-missa.html';
    link.textContent = 'Montar uma Missa';
    vazio.appendChild(link);

    area.appendChild(vazio);
    document.querySelector('#modoCelebracao').disabled = true;
    return;
  }

  itens.forEach(({ momento, musica }, indice) => {
    area.appendChild(criarItemRoteiro(momento, musica, indice));
  });

  let indice = 0;
  let modoPreferido = localStorage.getItem(CHAVE_MODO_CELEBRACAO) || 'cifra';
  const tamanhos = [1.05, 1.25, 1.5, 1.8, 2.1];
  let indiceFonte = Number.parseInt(localStorage.getItem(CHAVE_FONTE_CELEBRACAO), 10);
  if (!Number.isInteger(indiceFonte) || indiceFonte < 0 || indiceFonte >= tamanhos.length) indiceFonte = 1;

  const celebracao = document.querySelector('#celebracao');
  const botaoModoCelebracao = document.querySelector('#modoCelebracao');
  const botaoCifra = document.querySelector('#celebracaoCifra');
  const botaoLetra = document.querySelector('#celebracaoLetra');
  const celebracaoIdentificacao = document.querySelector('#celebracaoIdentificacao');

  if (celebracaoIdentificacao && identificacao) {
    celebracaoIdentificacao.textContent = identificacao;
    celebracaoIdentificacao.classList.remove('oculto');
  }

  function aplicarFonte() {
    celebracao.style.setProperty('--tamanho-celebracao', `${tamanhos[indiceFonte]}rem`);
    localStorage.setItem(CHAVE_FONTE_CELEBRACAO, String(indiceFonte));
  }

  function definirModo(modo) {
    modoPreferido = modo;
    localStorage.setItem(CHAVE_MODO_CELEBRACAO, modo);
    exibir();
  }

  function exibir() {
    const item = itens[indice];
    const temCifra = Boolean(item.musica.cifra);
    const temLetra = Boolean(item.musica.letra);

    let modoEfetivo = modoPreferido;
    if (modoEfetivo === 'letra' && !temLetra) modoEfetivo = temCifra ? 'cifra' : 'letra';
    if (modoEfetivo === 'cifra' && !temCifra) modoEfetivo = temLetra ? 'letra' : 'cifra';

    document.querySelector('#celebracaoMomento').textContent = item.momento;
    document.querySelector('#celebracaoTitulo').textContent = item.musica.titulo;

    const partesMeta = [];
    if (item.musica.autor) partesMeta.push(item.musica.autor);
    if (item.musica.tom) partesMeta.push(`Tom ${item.musica.tom}`);
    document.querySelector('#celebracaoMeta').textContent = partesMeta.join(' · ');

    document.querySelector('#celebracaoTexto').textContent =
      modoEfetivo === 'letra'
        ? (item.musica.letra || item.musica.cifra || 'Sem letra/cifra cadastrada.')
        : (item.musica.cifra || item.musica.letra || 'Sem letra/cifra cadastrada.');

    botaoCifra.disabled = !temCifra;
    botaoLetra.disabled = !temLetra;
    botaoCifra.classList.toggle('ativo', modoEfetivo === 'cifra');
    botaoLetra.classList.toggle('ativo', modoEfetivo === 'letra');
    botaoCifra.setAttribute('aria-pressed', String(modoEfetivo === 'cifra'));
    botaoLetra.setAttribute('aria-pressed', String(modoEfetivo === 'letra'));

    document.querySelector('#posicaoCelebracao').textContent = `${indice + 1} / ${itens.length}`;
    document.querySelector('#anterior').disabled = indice === 0;
    document.querySelector('#proxima').disabled = indice === itens.length - 1;
  }

  function sairCelebracao() {
    celebracao.classList.add('oculto');
    document.body.classList.remove('modo-celebracao-aberto');
    botaoModoCelebracao.focus();
  }

  botaoModoCelebracao.addEventListener('click', () => {
    indice = 0;
    aplicarFonte();
    exibir();
    celebracao.classList.remove('oculto');
    document.body.classList.add('modo-celebracao-aberto');
    document.querySelector('#sairCelebracao').focus();
  });

  document.querySelector('#sairCelebracao').addEventListener('click', sairCelebracao);
  botaoCifra.addEventListener('click', () => definirModo('cifra'));
  botaoLetra.addEventListener('click', () => definirModo('letra'));

  document.querySelector('#celebracaoMenor').addEventListener('click', () => {
    if (indiceFonte > 0) indiceFonte--;
    aplicarFonte();
  });

  document.querySelector('#celebracaoNormal').addEventListener('click', () => {
    indiceFonte = 1;
    aplicarFonte();
  });

  document.querySelector('#celebracaoMaior').addEventListener('click', () => {
    if (indiceFonte < tamanhos.length - 1) indiceFonte++;
    aplicarFonte();
  });

  document.querySelector('#anterior').addEventListener('click', () => {
    if (indice > 0) {
      indice--;
      exibir();
    }
  });

  document.querySelector('#proxima').addEventListener('click', () => {
    if (indice < itens.length - 1) {
      indice++;
      exibir();
    }
  });

  document.addEventListener('keydown', evento => {
    if (celebracao.classList.contains('oculto')) return;

    if (evento.key === 'Escape') sairCelebracao();
    if (evento.key === 'ArrowLeft' && indice > 0) {
      indice--;
      exibir();
    }
    if (evento.key === 'ArrowRight' && indice < itens.length - 1) {
      indice++;
      exibir();
    }
  });
}

iniciarMontagem().catch(console.error);
iniciarRoteiro().catch(console.error);
