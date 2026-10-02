let musicas = [];
let momentoAtivo = '';

async function carregarMusicas() {
  const resposta = await fetch('data/musicas.json');
  if (!resposta.ok) throw new Error('Não foi possível carregar o repertório.');
  return resposta.json();
}

function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function criarFiltros() {
  const area = document.querySelector('#filtrosRapidos');
  const momentos = [...new Set(musicas.flatMap(m => m.momentos))];

  const ordem = [
    'Entrada','Perdão','Glória','Salmo','Aclamação',
    'Oferendas','Santo','Cordeiro','Comunhão','Pós-Comunhão','Final'
  ];

  momentos.sort((a,b) => {
    const ia = ordem.indexOf(a);
    const ib = ordem.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const opcoes = ['Todas', ...momentos];

  opcoes.forEach(rotulo => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'filtro-chip';
    botao.textContent = rotulo;

    const valor = rotulo === 'Todas' ? '' : rotulo;
    if (valor === momentoAtivo) botao.classList.add('ativo');

    botao.addEventListener('click', () => {
      momentoAtivo = valor;
      document.querySelectorAll('.filtro-chip').forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      desenhar();
    });

    area.appendChild(botao);
  });
}

function desenhar() {
  const termo = normalizar(document.querySelector('#pesquisa').value);

  const filtradas = musicas.filter(musica => {
    const texto = normalizar([
      musica.titulo,
      musica.autor,
      musica.momentos.join(' ')
    ].join(' '));

    return (!termo || texto.includes(termo)) &&
           (!momentoAtivo || musica.momentos.includes(momentoAtivo));
  });

  const lista = document.querySelector('#listaMusicas');
  const contador = document.querySelector('#contador');

  contador.textContent = `${filtradas.length} música${filtradas.length === 1 ? '' : 's'}`;
  lista.innerHTML = '';

  if (!filtradas.length) {
    const vazio = document.createElement('div');
    vazio.className = 'estado-vazio';
    vazio.textContent = 'Nenhuma música encontrada.';
    lista.appendChild(vazio);
    return;
  }

  filtradas.forEach(musica => {
    const link = document.createElement('a');
    link.className = 'linha-musica';
    link.href = `musica.html?id=${encodeURIComponent(musica.id)}`;

    const principal = document.createElement('div');
    principal.className = 'linha-musica-principal';

    const titulo = document.createElement('strong');
    titulo.className = 'linha-musica-titulo';
    titulo.textContent = musica.titulo;

    const autor = document.createElement('span');
    autor.className = 'linha-musica-autor';
    autor.textContent = musica.autor || 'Autor não informado';

    principal.append(titulo, autor);

    const momentos = document.createElement('div');
    momentos.className = 'linha-musica-momentos';
    momentos.textContent = musica.momentos.join(' · ');

    const tom = document.createElement('div');
    tom.className = 'linha-musica-tom';
    tom.textContent = musica.tom ? `Tom: ${musica.tom}` : 'Tom: —';

    const seta = document.createElement('span');
    seta.className = 'linha-musica-seta';
    seta.setAttribute('aria-hidden', 'true');
    seta.textContent = '›';

    link.append(principal, momentos, tom, seta);
    lista.appendChild(link);
  });
}

async function iniciar() {
  musicas = await carregarMusicas();

  const inicial = new URLSearchParams(location.search).get('momento');
  if (inicial) momentoAtivo = inicial;

  criarFiltros();
  document.querySelector('#pesquisa').addEventListener('input', desenhar);
  desenhar();
}

iniciar().catch(erro => {
  document.querySelector('#listaMusicas').innerHTML = `<div class="estado-vazio">${erro.message}</div>`;
});
