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

async function iniciarHome() {
  const area = document.querySelector('#categorias');
  if (!area) return;

  momentosPadrao.forEach(momento => {
    const link = document.createElement('a');
    link.className = 'categoria';
    link.href = `repertorio.html?momento=${encodeURIComponent(momento)}`;
    link.innerHTML = `<strong>${momento}</strong><br><span class="meta">Ver músicas</span>`;
    area.appendChild(link);
  });
}

async function iniciarMusica() {
  const area = document.querySelector('#detalheMusica');
  if (!area) return;

  const id = new URLSearchParams(location.search).get('id');
  const musicas = await carregarMusicas();
  const musica = musicas.find(item => item.id === id);

  if (!musica) {
    area.innerHTML = '<h1>Música não encontrada</h1><p>Volte ao repertório e escolha outra música.</p>';
    return;
  }

  document.title = `${musica.titulo} — Músicas para a Missa`;

  const youtube = musica.youtube
    ? `<a class="botao" href="${musica.youtube}" target="_blank" rel="noopener">Abrir no YouTube</a>`
    : '';

  area.innerHTML = `
    <p class="sobrelinha">${musica.momentos.join(' · ')}</p>
    <h1>${musica.titulo}</h1>
    <p class="meta"><strong>Autor:</strong> ${musica.autor || '—'} &nbsp; <strong>Tom:</strong> ${musica.tom || '—'}</p>
    <div class="acoes">${youtube}</div>

    ${musica.cifra ? `
      <section class="bloco-musica">
        <h2>Letra e cifra</h2>
        <pre class="texto-musica">${musica.cifra}</pre>
      </section>` : ''}

    ${musica.letra ? `
      <section class="bloco-musica">
        <h2>Letra</h2>
        <div class="texto-musica">${musica.letra}</div>
      </section>` : ''}

    ${musica.observacoes ? `
      <section class="bloco-musica">
        <h2>Observações</h2>
        <p>${musica.observacoes}</p>
      </section>` : ''}
  `;
}

iniciarHome();
iniciarMusica();
