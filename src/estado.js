// src/estado.js
export const SLOTS = {
  // Lado do PC (Linhas 0, 1, 2)
  PC_0_0: { id: 'PC_0_0', linha: 0, coluna: 0, lado: 'PC' }, PC_0_1: { id: 'PC_0_1', linha: 0, coluna: 1, lado: 'PC' }, PC_0_2: { id: 'PC_0_2', linha: 0, coluna: 2, lado: 'PC' },
  PC_1_0: { id: 'PC_1_0', linha: 1, coluna: 0, lado: 'PC' }, PC_1_1: { id: 'PC_1_1', linha: 1, coluna: 1, lado: 'PC' }, PC_1_2: { id: 'PC_1_2', linha: 1, coluna: 2, lado: 'PC' },
  PC_2_0: { id: 'PC_2_0', linha: 2, coluna: 0, lado: 'PC' }, PC_2_1: { id: 'PC_2_1', linha: 2, coluna: 1, lado: 'PC' }, PC_2_2: { id: 'PC_2_2', linha: 2, coluna: 2, lado: 'PC' },

  // Lado do Humano (Linhas 3, 4, 5)
  HU_3_0: { id: 'HU_3_0', linha: 3, coluna: 0, lado: 'HU' }, HU_3_1: { id: 'HU_3_1', linha: 3, coluna: 1, lado: 'HU' }, HU_3_2: { id: 'HU_3_2', linha: 3, coluna: 2, lado: 'HU' },
  HU_4_0: { id: 'HU_4_0', linha: 4, coluna: 0, lado: 'HU' }, HU_4_1: { id: 'HU_4_1', linha: 4, coluna: 1, lado: 'HU' }, HU_4_2: { id: 'HU_4_2', linha: 4, coluna: 2, lado: 'HU' },
  HU_5_0: { id: 'HU_5_0', linha: 5, coluna: 0, lado: 'HU' }, HU_5_1: { id: 'HU_5_1', linha: 5, coluna: 1, lado: 'HU' }, HU_5_2: { id: 'HU_5_2', linha: 5, coluna: 2, lado: 'HU' }
};

// calcularDistancia e podeAtacar continuam EXATAMENTE iguais
export function calcularDistancia(slotAtacante, slotAlvo) {
  const dx = Math.abs(slotAtacante.linha - slotAlvo.linha);
  const dy = Math.abs(slotAtacante.coluna - slotAlvo.coluna);
  return Math.max(dx, dy);
}

export function podeAtacar(cartaAtacante, slotAtacante, cartaAlvo, slotAlvo) {
  if (!cartaAtacante.estaViva || !cartaAlvo.estaViva) return false;
  
  // NOVO: Não atacar cartas do mesmo dono (mesmo que estejam no lado inimigo)
  if (cartaAtacante.dono === cartaAlvo.dono) return false;
  
  const distancia = calcularDistancia(slotAtacante, slotAlvo);
  return distancia <= cartaAtacante.alcance;
}