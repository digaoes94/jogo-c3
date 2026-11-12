// src/main.js
import { Guerreiro, Arqueiro, Mago, ELEMENTOS } from './cartas.js';
import { SLOTS, podeAtacar, calcularDistancia } from './estado.js'; 

console.log("✅ Jogo Iniciado - Modo Invasão 3x3 com Imagens.");

const baralhoHumano = [
  new Guerreiro(ELEMENTOS.FOGO), new Guerreiro(ELEMENTOS.GELO), new Guerreiro(ELEMENTOS.TERRA),
  new Arqueiro(ELEMENTOS.FOGO), new Arqueiro(ELEMENTOS.GELO), new Arqueiro(ELEMENTOS.TERRA),
  new Mago(ELEMENTOS.FOGO), new Mago(ELEMENTOS.GELO), new Mago(ELEMENTOS.TERRA)
];

const baralhoPC = [
  new Guerreiro(ELEMENTOS.FOGO), new Guerreiro(ELEMENTOS.GELO), new Guerreiro(ELEMENTOS.TERRA),
  new Arqueiro(ELEMENTOS.FOGO), new Arqueiro(ELEMENTOS.GELO), new Arqueiro(ELEMENTOS.TERRA),
  new Mago(ELEMENTOS.FOGO), new Mago(ELEMENTOS.GELO), new Mago(ELEMENTOS.TERRA)
];

baralhoHumano.forEach(c => c.dono = 'HU');
baralhoPC.forEach(c => c.dono = 'PC');

let cartaSelecionadaMao = null;
let cartaSelecionadaTabuleiro = null;
const cartasPosicionadasHumano = {};
const cartasPosicionadasPC = {};

const cemiterioHumano = [];
const cemiterioPC = [];

let faseJogo = 'POSICIONAMENTO';
let turnoAtual = null;

const slotsArray = Object.values(SLOTS);

function processarCartasMortas() {
  for (let slotId in cartasPosicionadasHumano) {
    if (!cartasPosicionadasHumano[slotId].estaViva) {
      cemiterioHumano.push(cartasPosicionadasHumano[slotId]);
      delete cartasPosicionadasHumano[slotId]; 
    }
  }
  for (let slotId in cartasPosicionadasPC) {
    if (!cartasPosicionadasPC[slotId].estaViva) {
      cemiterioPC.push(cartasPosicionadasPC[slotId]);
      delete cartasPosicionadasPC[slotId]; 
    }
  }
}

function renderizarTabuleiro() {
  const gridPC = document.getElementById('grid-pc');
  const gridHU = document.getElementById('grid-hu');
  gridPC.innerHTML = '';
  gridHU.innerHTML = '';

  document.getElementById('cemiterio-hu').innerHTML = cemiterioHumano.map(c => `<div class="carta-cemiterio">${c.nome}</div>`).join('');
  document.getElementById('cemiterio-pc').innerHTML = cemiterioPC.map(c => `<div class="carta-cemiterio">${c.nome}</div>`).join('');

  slotsArray.forEach(slotInfo => {
    const divSlot = document.createElement('div');
    divSlot.className = 'slot';
    divSlot.dataset.slotId = slotInfo.id;

    const cartaHU = cartasPosicionadasHumano[slotInfo.id];
    const cartaPC = cartasPosicionadasPC[slotInfo.id];

    // --- DESENHA CARTA DO HUMANO ---
    if (cartaHU) {
      const classeAgiu = cartaHU.jaAgiu ? 'ja-agiu' : '';
      const classeAlvo = (cartaSelecionadaTabuleiro && cartaSelecionadaTabuleiro.carta === cartaHU) ? 'selecionada-no-tabuleiro' : '';
      
      divSlot.innerHTML = `
        <div class="carta ${classeAgiu} ${classeAlvo}" style="background-image: url('${cartaHU.caminhoImagem}');">
          <div class="status-carta">❤️${cartaHU.vida} ⚔️${cartaHU.ataque} 🛡️${cartaHU.guarda}</div>
        </div>`;
      
      if (faseJogo === 'BATALHA' && turnoAtual === 'HU') {
        divSlot.onclick = () => selecionarCartaNoTabuleiro(slotInfo, cartaHU);
      }
    } 
    // --- DESENHA CARTA DO PC ---
    else if (cartaPC) {
      divSlot.innerHTML = `
        <div class="carta pc-card" style="background-image: url('${cartaPC.caminhoImagem}');">
          <div class="status-carta">❤️${cartaPC.vida} ⚔️${cartaPC.ataque} 🛡️${cartaPC.guarda}</div>
        </div>`;
        
      if (faseJogo === 'BATALHA' && turnoAtual === 'HU' && cartaSelecionadaTabuleiro) {
        const pode = podeAtacar(cartaSelecionadaTabuleiro.carta, cartaSelecionadaTabuleiro.slot, cartaPC, slotInfo);
        if (pode) {
          divSlot.classList.add('alvo-valido');
          divSlot.onclick = () => executarAtaqueHumano(slotInfo, cartaPC);
        }
      }
    } 
    // --- SLOTS VAZIOS ---
    else {
      if (faseJogo === 'POSICIONAMENTO') {
        if (slotInfo.lado === 'PC') {
          divSlot.innerText = 'Vazio'; 
        } else {
          if (cartaSelecionadaMao instanceof Guerreiro && slotInfo.linha !== 3) {
            divSlot.innerText = '❌ Bloqueado';
            divSlot.style.opacity = '0.3';
            divSlot.style.cursor = 'not-allowed';
          } else {
            divSlot.innerText = 'Colocar';
            divSlot.onclick = () => tentarPosicionarCarta(slotInfo.id);
          }
        }
      } else if (faseJogo === 'BATALHA' && turnoAtual === 'HU' && cartaSelecionadaTabuleiro) {
        const dist = calcularDistancia(cartaSelecionadaTabuleiro.slot, slotInfo);
        if (dist === 1) {
          divSlot.classList.add('movimento-valido');
          divSlot.onclick = () => executarMovimentoHumano(slotInfo);
        }
      }
    }

    if (slotInfo.lado === 'PC') gridPC.appendChild(divSlot);
    else gridHU.appendChild(divSlot);
  });
}

function renderizarMao() {
  const maoContainer = document.getElementById('cartas-mao');
  maoContainer.innerHTML = '';
  
  if (faseJogo !== 'POSICIONAMENTO') {
    if (turnoAtual === 'HU') {
      maoContainer.innerHTML = `<h3>Sua vez de atacar!</h3>`;
      const btnEncerrar = document.createElement('button');
      btnEncerrar.innerText = 'Encerrar Turno';
      btnEncerrar.style.cssText = 'margin-top: 10px; padding: 10px 20px; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;';
      btnEncerrar.onclick = encerrarTurnoHumano;
      maoContainer.appendChild(btnEncerrar);
    } else {
      maoContainer.innerHTML = `<h3>Vez do PC...</h3>`;
    }
    return;
  }

  baralhoHumano.forEach((carta) => {
    if (Object.values(cartasPosicionadasHumano).some(c => c === carta)) return;
    
    const divCarta = document.createElement('div');
    divCarta.className = 'carta-na-mao';
    divCarta.style.backgroundImage = `url('${carta.caminhoImagem}')`; 
    divCarta.innerHTML = `
      <div class="status-carta-mao">
        <strong>${carta.nome}</strong><br>
        ❤️ ${carta.vida} | 🛡️ ${carta.guarda} | ⚔️ ${carta.ataque}
      </div>
    `;
    
    divCarta.onclick = () => {
      document.querySelectorAll('.carta-na-mao').forEach(el => el.classList.remove('selecionada'));
      divCarta.classList.add('selecionada');
      cartaSelecionadaMao = carta;
      renderizarTabuleiro(); 
    };
    maoContainer.appendChild(divCarta);
  });
}

function tentarPosicionarCarta(slotId) {
  if (!cartaSelecionadaMao) return alert("Selecione uma carta primeiro!");
  const slotInfo = SLOTS[slotId];
  if (cartaSelecionadaMao instanceof Guerreiro && slotInfo.linha !== 3) {
    return alert("Guerreiros só podem ser posicionados na Linha da Frente!");
  }

  cartasPosicionadasHumano[slotId] = cartaSelecionadaMao;
  cartaSelecionadaMao = null; 
  atualizarTela();
}

function selecionarCartaNoTabuleiro(slotInfo, carta) {
  if (carta.jaAgiu) return alert("Esta carta já agiu!");
  if (cartaSelecionadaTabuleiro && cartaSelecionadaTabuleiro.carta === carta) {
    cartaSelecionadaTabuleiro = null;
  } else {
    cartaSelecionadaTabuleiro = { slot: slotInfo, carta: carta };
  }
  atualizarTela();
}

function executarAtaqueHumano(slotAlvoInfo, cartaAlvo) {
  if (!cartaSelecionadaTabuleiro) return;
  const atacante = cartaSelecionadaTabuleiro.carta;
  console.log(`⚔️ Humano: ${atacante.nome} atacou ${cartaAlvo.nome}`);
  atacante.atacar(cartaAlvo);
  
  atacante.jaAgiu = true; 
  cartaSelecionadaTabuleiro = null; 

  processarCartasMortas(); 
  checarFimDeJogo();
  if (faseJogo === 'FIM') return;
  
  atualizarTela();
  verificarFimDoTurnoHumano();
}

function executarMovimentoHumano(destinoSlotInfo) {
  if (!cartaSelecionadaTabuleiro) return;
  const origemSlotId = cartaSelecionadaTabuleiro.slot.id;
  const cartaMovida = cartaSelecionadaTabuleiro.carta;

  delete cartasPosicionadasHumano[origemSlotId];
  cartasPosicionadasHumano[destinoSlotInfo.id] = cartaMovida;

  cartaMovida.jaAgiu = true; 
  cartaSelecionadaTabuleiro = null;
  console.log(`🏃 Humano moveu ${cartaMovida.nome} para ${destinoSlotInfo.id}.`);
  atualizarTela();
  verificarFimDoTurnoHumano();
}

function resetarAcoes(cartas) {
  Object.values(cartas).forEach(c => c.jaAgiu = false);
}

function encerrarTurnoHumano() {
  Object.values(cartasPosicionadasHumano).forEach(c => {
    if (c.estaViva) c.jaAgiu = true;
  });
  cartaSelecionadaTabuleiro = null;
  atualizarTela();
  verificarFimDoTurnoHumano();
}

function verificarFimDoTurnoHumano() {
  const cartasVivas = Object.values(cartasPosicionadasHumano).filter(c => c.estaViva);
  if (cartasVivas.every(c => c.jaAgiu)) {
    turnoAtual = 'PC';
    resetarAcoes(cartasPosicionadasPC);
    atualizarTela();
    setTimeout(turnoPC, 1000); 
  }
}

async function turnoPC() {
  if (faseJogo !== 'BATALHA') return;
  console.log("🤖 Turno do PC iniciado.");
  
  try {
    const cartasPCIds = Object.keys(cartasPosicionadasPC);

    for (let slotId of cartasPCIds) {
      const cartaPC = cartasPosicionadasPC[slotId];
      if (!cartaPC || !cartaPC.estaViva || cartaPC.jaAgiu) continue;

      const slotAtualPC = SLOTS[slotId];
      let alvoEncontrado = null;

      for (let slotHUId of Object.keys(cartasPosicionadasHumano)) {
        const cartaHU = cartasPosicionadasHumano[slotHUId];
        if (!cartaHU.estaViva) continue;
        
        if (podeAtacar(cartaPC, slotAtualPC, cartaHU, SLOTS[slotHUId])) {
          alvoEncontrado = { slotId: slotHUId, carta: cartaHU };
          break; 
        }
      }

      if (alvoEncontrado) {
        console.log(`⚔️ PC: ${cartaPC.nome} atacou ${alvoEncontrado.carta.nome}`);
        cartaPC.atacar(alvoEncontrado.carta);
        processarCartasMortas(); 
      } 
      else {
        const movimentosValidos = [];
        
        Object.values(SLOTS).forEach(slotDestino => {
          const isSlotOcupado = cartasPosicionadasPC[slotDestino.id] || cartasPosicionadasHumano[slotDestino.id];
          
          if (!isSlotOcupado && calcularDistancia(slotAtualPC, slotDestino) === 1) {
            movimentosValidos.push(slotDestino);
          }
        });

        if (movimentosValidos.length > 0) {
          let melhorMovimento = null;
          let menorDistanciaInimigo = 99;

          Object.keys(cartasPosicionadasHumano).forEach(slotHUId => {
            if (!cartasPosicionadasHumano[slotHUId].estaViva) return;
            const dist = calcularDistancia(slotAtualPC, SLOTS[slotHUId]);
            if (dist < menorDistanciaInimigo) menorDistanciaInimigo = dist;
          });

          movimentosValidos.forEach(slotDestino => {
            let minDistDestino = 99;
            Object.keys(cartasPosicionadasHumano).forEach(slotHUId => {
              if (!cartasPosicionadasHumano[slotHUId].estaViva) return;
              const dist = calcularDistancia(slotDestino, SLOTS[slotHUId]);
              if (dist < minDistDestino) minDistDestino = dist;
            });

            if (minDistDestino < menorDistanciaInimigo) {
              menorDistanciaInimigo = minDistDestino;
              melhorMovimento = slotDestino;
            } else if (minDistDestino === menorDistanciaInimigo) {
              const isGuerreiro = cartaPC instanceof Guerreiro;
              if (isGuerreiro) {
                if (melhorMovimento === null || slotDestino.linha > melhorMovimento.linha) {
                  melhorMovimento = slotDestino;
                }
              } else {
                if (melhorMovimento === null || slotDestino.linha < melhorMovimento.linha) {
                  melhorMovimento = slotDestino;
                }
              }
            }
          });

          if (melhorMovimento) {
            console.log(`🏃 PC moveu ${cartaPC.nome} para ${melhorMovimento.id}`);
            delete cartasPosicionadasPC[slotId];
            cartasPosicionadasPC[melhorMovimento.id] = cartaPC;
          }
        } else {
          console.log(`🤖 PC: ${cartaPC.nome} não encontrou alvo nem espaço.`);
        }
      }
      
      cartaPC.jaAgiu = true;
      atualizarTela(); 
      await new Promise(r => setTimeout(r, 800)); 
    }

    processarCartasMortas();
    checarFimDeJogo();
  } catch (error) {
    console.error("Erro no turno do PC:", error);
  } finally {
    // ISSO GARANTE QUE A VEZ VOLTE PARA O HUMANO, MESMO SE DER ERRO
    if (faseJogo !== 'FIM') {
      setTimeout(() => {
        turnoAtual = 'HU';
        resetarAcoes(cartasPosicionadasHumano);
        resetarAcoes(cartasPosicionadasPC); // Reseta o PC também por segurança
        atualizarTela();
        console.log("Sua vez.");
      }, 1000);
    }
  }
}

function checarFimDeJogo() {
  const vivosHU = Object.keys(cartasPosicionadasHumano).length;
  const vivosPC = Object.keys(cartasPosicionadasPC).length;

  if (vivosHU === 0) { 
    faseJogo = 'FIM'; 
    setTimeout(() => mostrarModalFimDeJogo("💀 Você perdeu!"), 500); 
  }
  else if (vivosPC === 0) { 
    faseJogo = 'FIM'; 
    setTimeout(() => mostrarModalFimDeJogo("🏆 Você venceu!"), 500); 
  }
}

function mostrarModalFimDeJogo(mensagem) {
  document.getElementById('modal-mensagem').innerText = mensagem;
  document.getElementById('modal-fim-jogo').classList.remove('hidden');
}

document.getElementById('btn-agora-nao').onclick = () => {
  document.getElementById('modal-fim-jogo').classList.add('hidden');
  
  for (let k in cartasPosicionadasHumano) delete cartasPosicionadasHumano[k];
  for (let k in cartasPosicionadasPC) delete cartasPosicionadasPC[k];
  cemiterioHumano.length = 0;
  cemiterioPC.length = 0;
  
  atualizarTela();
  document.getElementById('btn-nova-partida').classList.remove('hidden');
};

function iniciarNovaPartida() {
  window.location.reload();
}

document.getElementById('btn-jogar-novamente').onclick = iniciarNovaPartida;
document.getElementById('btn-nova-partida').onclick = iniciarNovaPartida;

function atualizarTela() {
  renderizarTabuleiro();
  renderizarMao();

  if (faseJogo === 'POSICIONAMENTO' && Object.keys(cartasPosicionadasHumano).length === 6) {
    pcPosicionarCartas();
    faseJogo = 'BATALHA';
    turnoAtual = Math.random() < 0.5 ? 'HU' : 'PC';
    
    // GARANTA QUE ESTAS DUAS LINHAS ESTEJAM AQUI:
    resetarAcoes(cartasPosicionadasHumano); 
    resetarAcoes(cartasPosicionadasPC);

    alert(`Posicionamento concluído! O ${turnoAtual === 'HU' ? 'VOCÊ' : 'PC'} começa.`);
    
    atualizarTela();
    if (turnoAtual === 'PC') {
      setTimeout(turnoPC, 1000);
    }
  }
}

function pcPosicionarCartas() {
  const slotsFrente = Object.values(SLOTS).filter(s => s.lado === 'PC' && s.linha === 2);
  const slotsOutros = Object.values(SLOTS).filter(s => s.lado === 'PC' && s.linha !== 2);
  
  const guerreiros = baralhoPC.filter(c => c instanceof Guerreiro).sort(() => Math.random() - 0.5);
  const outros = baralhoPC.filter(c => !(c instanceof Guerreiro)).sort(() => Math.random() - 0.5);
  
  const guerreirosEscolhidos = guerreiros.slice(0, 3);
  const outrosEscolhidos = outros.slice(0, 3);
  
  const frenteEmbaralhada = [...slotsFrente].sort(() => Math.random() - 0.5);
  guerreirosEscolhidos.forEach((carta, i) => {
    cartasPosicionadasPC[frenteEmbaralhada[i].id] = carta;
  });
  
  const outrosEmbaralhados = [...slotsOutros].sort(() => Math.random() - 0.5);
  outrosEscolhidos.forEach((carta, i) => {
    cartasPosicionadasPC[outrosEmbaralhados[i].id] = carta;
  });
}

atualizarTela();