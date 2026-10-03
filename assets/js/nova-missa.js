const CHAVE_MISSA_ATUAL_NOVA = 'missaAtualV01';
const CHAVE_DADOS_CELEBRACAO_NOVA = 'missaDadosV01';

function iniciarNovaMissa() {
  const botoes = document.querySelectorAll('[data-nova-missa]');
  if (!botoes.length) return;

  botoes.forEach(botao => {
    botao.addEventListener('click', () => {
      const confirmar = window.confirm(
        'Começar uma nova Missa? Os dados da celebração e todas as músicas escolhidas serão apagados deste aparelho.'
      );

      if (!confirmar) return;

      localStorage.removeItem(CHAVE_MISSA_ATUAL_NOVA);
      localStorage.removeItem(CHAVE_DADOS_CELEBRACAO_NOVA);
      window.location.href = 'montar-missa.html';
    });
  });
}

iniciarNovaMissa();
