if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(erro => {
      console.warn('Não foi possível preparar o uso offline.', erro);
    });
  });
}

let eventoInstalacao = null;
const botaoInstalar = document.querySelector('#instalarApp');

window.addEventListener('beforeinstallprompt', evento => {
  evento.preventDefault();
  eventoInstalacao = evento;
  if (botaoInstalar) botaoInstalar.hidden = false;
});

if (botaoInstalar) {
  botaoInstalar.addEventListener('click', async () => {
    if (!eventoInstalacao) return;
    eventoInstalacao.prompt();
    await eventoInstalacao.userChoice;
    eventoInstalacao = null;
    botaoInstalar.hidden = true;
  });
}

window.addEventListener('appinstalled', () => {
  eventoInstalacao = null;
  if (botaoInstalar) botaoInstalar.hidden = true;
});
