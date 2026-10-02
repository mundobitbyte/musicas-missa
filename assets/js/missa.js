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

async function iniciarMontagem() {
  const area = document.querySelector('#momentosMissa');
  if (!area) return;

  musicas = await carregarMusicas();
  const escolhas = carregarEscolhas();

  momentosPadrao.forEach(momento => {
    const disponiveis = musicas.filter(m => m.momentos.includes(momento));

    const card = document.createElement('section');
    card.className = 'momento-card';

    const titulo = document.createElement('h2');
    titulo.textContent = momento;

    const select = document.createElement('select');
    select.dataset.momento = momento;
    select.innerHTML = '<option value="">Sem música escolhida</option>';

    disponiveis.forEach(musica => {
      const option = document.createElement('option');
      option.value = musica.id;
      option.textContent = musica.titulo;
      if (escolhas[momento] === musica.id) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      const atual = carregarEscolhas();
      if (select.value) atual[momento] = select.value;
      else delete atual[momento];
      salvarEscolhas(atual);
    });

    card.append(titulo, select);
    area.appendChild(card);
  });

  document.querySelector('#limpar').addEventListener('click', () => {
    localStorage.removeItem(CHAVE);
    document.querySelectorAll('#momentosMissa select').forEach(s => s.value = '');
  });
}

async function iniciarRoteiro() {
  const area = document.querySelector('#roteiro');
  if (!area) return;

  musicas = await carregarMusicas();
  const escolhas = carregarEscolhas();

  const itens = momentosPadrao
    .filter(momento => escolhas[momento])
    .map(momento => {
      const musica = musicas.find(m => m.id === escolhas[momento]);
      return musica ? { momento, musica } : null;
    })
    .filter(Boolean);

  if (!itens.length) {
    area.innerHTML = '<p>Nenhuma música foi escolhida ainda. <a href="montar-missa.html">Montar uma Missa</a>.</p>';
    document.querySelector('#modoCelebracao').disabled = true;
    return;
  }

  itens.forEach(({ momento, musica }) => {
    const item = document.createElement('section');
    item.className = 'roteiro-item';
    item.innerHTML = `
      <p class="sobrelinha">${momento}</p>
      <h2>${musica.titulo}</h2>
      <p class="meta">${musica.autor || ''}${musica.tom ? ` · Tom ${musica.tom}` : ''}</p>
      <a href="musica.html?id=${encodeURIComponent(musica.id)}">Abrir música</a>
    `;
    area.appendChild(item);
  });

  document.querySelector('#imprimir').addEventListener('click', () => window.print());

  let indice = 0;
  const celebracao = document.querySelector('#celebracao');

  function exibir() {
    const item = itens[indice];
    document.querySelector('#celebracaoMomento').textContent = item.momento;
    document.querySelector('#celebracaoTitulo').textContent = item.musica.titulo;
    document.querySelector('#celebracaoTexto').textContent =
      item.musica.cifra || item.musica.letra || 'Sem letra/cifra cadastrada.';
    document.querySelector('#posicaoCelebracao').textContent = `${indice + 1} / ${itens.length}`;
    document.querySelector('#anterior').disabled = indice === 0;
    document.querySelector('#proxima').disabled = indice === itens.length - 1;
  }

  document.querySelector('#modoCelebracao').addEventListener('click', () => {
    indice = 0;
    exibir();
    celebracao.classList.remove('oculto');
  });

  document.querySelector('#sairCelebracao').addEventListener('click', () => {
    celebracao.classList.add('oculto');
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
}

iniciarMontagem().catch(console.error);
iniciarRoteiro().catch(console.error);
