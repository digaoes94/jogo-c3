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
    this.alcance = alcance; 
    
    this.jaAgiu = false;
    this.dono = null; 
    // O this.elemento será definido no aplicarElemento()
  }

  get ataque() {
    return this.ataqueBase;
  }

  get estaViva() {
    return this.vida > 0;
  }

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
      this.guarda += 2; 
    } else if (elemento === ELEMENTOS.TERRA) {
      this.vida += 2;
      this.vidaMax += 2;
    }
  }

  // GETTER MOVIDO PARA CÁ (Abaixo do aplicarElemento)
  // Assim, quando a imagem for buscada, o this.elemento já estará preenchido.
  get caminhoImagem() {
    const classe = this.constructor.name.toLowerCase();
    const elemento = this.elemento ? this.elemento.toLowerCase() : '';
    return `/img/${classe}-${elemento}.jpeg`; 
  }
}

// --- CLASSES CONCRETAS ---

export class Guerreiro extends Carta {
  constructor(elemento) {
    // Vida 12, Guarda 1, Ataque 4, Alcance 1 (Regra original)
    super(`Guerreiro de ${elemento}`, 12, 1, 4, 1); 
    this.aplicarElemento(elemento);
  }
}

export class Arqueiro extends Carta {
  constructor(elemento) {
    // Vida 10, Guarda 2, Ataque 5, Alcance 3 (Regra original)
    super(`Arqueiro de ${elemento}`, 10, 2, 5, 3); 
    this.aplicarElemento(elemento);
  }
}

export class Mago extends Carta {
  constructor(elemento) {
    // Vida 8, Guarda 0, Ataque 6, Alcance 3 (Regra original)
    super(`Mago de ${elemento}`, 8, 0, 6, 3); 
    this.aplicarElemento(elemento);
  }
}