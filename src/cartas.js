// src/cartas.js

export const ELEMENTOS = {
  FOGO: 'Fogo',
  GELO: 'Gelo',
  TERRA: 'Terra'
};

// Classe Abstrata Base
export class Carta {
  constructor(nome, vida, guarda, ataque, alcance) {
    this.nome = nome;
    this.vidaMax = vida;
    this.vida = vida;
    this.guarda = guarda;
    this.ataqueBase = ataque;
    this.alcance = alcance; // 1 para corpo a corpo, 3 para distância
    
    // Controle de turno (para a futura regra de movimento)
    this.jaAgiu = false;
    this.dono = null; 
  }

  get ataque() {
    return this.ataqueBase;
  }

  get estaViva() {
    return this.vida > 0;
  }

  // A regra da guarda: ela reduz o dano bruto de cada ataque
  receberDano(danoBruto) {
    const danoReal = Math.max(0, danoBruto - this.guarda);
    this.vida = Math.max(0, this.vida - danoReal);
    
    console.log(`⚔️ ${this.nome} sofreu um ataque de ${danoBruto}. A guarda (${this.guarda}) bloqueou ${danoBruto - danoReal}. Dano na vida: ${danoReal}. ❤️ Vida restante: ${this.vida}`);
    return danoReal;
  }

  atacar(alvo) {
    alvo.receberDano(this.ataque);
  }

  aplicarElemento(elemento) {
    this.elemento = elemento;
    if (elemento === ELEMENTOS.FOGO) {
      this.ataqueBase += 2;
    } else if (elemento === ELEMENTOS.GELO) {
      this.guarda += 2; // CORRIGIDO: Agora o Gelo dá +2 de guarda conforme a regra original
    } else if (elemento === ELEMENTOS.TERRA) {
      this.vida += 2;
      this.vidaMax += 2;
    }
  }
}

// --- CLASSES CONCRETAS COM ATRIBUTOS ATUALIZADOS ---

export class Guerreiro extends Carta {
  constructor(elemento) {
    // Vida 12, Guarda 1, ATAQUE 5, Alcance 1
    super(`Guerreiro de ${elemento}`, 12, 1, 5, 1); 
    this.aplicarElemento(elemento);
  }
}

export class Arqueiro extends Carta {
  constructor(elemento) {
    // Vida 10, Guarda 2, ATAQUE 6, Alcance 3
    super(`Arqueiro de ${elemento}`, 10, 2, 6, 3); 
    this.aplicarElemento(elemento);
  }
}

export class Mago extends Carta {
  constructor(elemento) {
    // Vida 8, Guarda 0, ATAQUE 7, Alcance 3
    super(`Mago de ${elemento}`, 8, 0, 7, 3); 
    this.aplicarElemento(elemento);
  }
}