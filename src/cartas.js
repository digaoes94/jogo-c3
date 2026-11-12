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
    const base = import.meta.env.BASE_URL; // Pega o '/jogo-c3/' automaticamente
    return `${base}${this.imagem}`; // Retorna ex: '/jogo-c3/img/mago-fogo.jpeg'
  }
}

// --- CLASSES CONCRETAS ---

export class Guerreiro extends Carta {
  constructor(elemento) {
    super(`Guerreiro de ${elemento}`, 12, 1, 4, 1); 
    this.aplicarElemento(elemento);
    this.imagem = `img/guerreiro-${elemento.toLowerCase()}.jpeg`; // Fixa o nome!
  }
}

export class Arqueiro extends Carta {
  constructor(elemento) {
    super(`Arqueiro de ${elemento}`, 10, 2, 5, 3); 
    this.aplicarElemento(elemento);
    this.imagem = `img/arqueiro-${elemento.toLowerCase()}.jpeg`; // Fixa o nome!
  }
}

export class Mago extends Carta {
  constructor(elemento) {
    super(`Mago de ${elemento}`, 8, 0, 6, 3); 
    this.aplicarElemento(elemento);
    this.imagem = `img/mago-${elemento.toLowerCase()}.jpeg`; // Fixa o nome!
  }
}