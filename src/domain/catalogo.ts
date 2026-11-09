import type { Centimos } from './dinero';

export type Categoria = 'despensa' | 'panaderia' | 'fruta' | 'verdura' | 'bolsa';

/** Pestañas del catálogo rápido (la bolsa y la despensa no tienen pestaña). */
export type CategoriaCatalogo = Extract<Categoria, 'panaderia' | 'fruta' | 'verdura'>;

export interface Producto {
  /** Texto, no número: conserva los ceros iniciales. */
  codigo: string;
  nombre: string;
  precio: Centimos;
  categoria: Categoria;
}

/** Catálogo ficticio. Todo se vende por unidad. */
export const CATALOGO: readonly Producto[] = [
  {
    codigo: '841000100001',
    nombre: 'Cerveza lata 33 cl',
    precio: 210,
    categoria: 'despensa',
  },
  {
    codigo: '841000100002',
    nombre: 'Pan de molde familiar',
    precio: 180,
    categoria: 'panaderia',
  },
  {
    codigo: '841000100003',
    nombre: 'Manzanas Golden bolsa',
    precio: 220,
    categoria: 'fruta',
  },
  {
    codigo: '841000100004',
    nombre: 'Arroz grano redondo 1 kg',
    precio: 240,
    categoria: 'despensa',
  },
  {
    codigo: '841000200001',
    nombre: 'Leche entera 1 l',
    precio: 115,
    categoria: 'despensa',
  },
  {
    codigo: '841000200002',
    nombre: 'Huevos camperos · 6 uds',
    precio: 230,
    categoria: 'despensa',
  },
  {
    codigo: '841000200003',
    nombre: 'Café molido natural 250 g',
    precio: 345,
    categoria: 'despensa',
  },
  {
    codigo: '841000200005',
    nombre: 'Pasta espirales 500 g',
    precio: 95,
    categoria: 'despensa',
  },
  {
    codigo: '841000200006',
    nombre: 'Tomate frito 400 g',
    precio: 125,
    categoria: 'despensa',
  },
  {
    codigo: '841000200007',
    nombre: 'Aceite de oliva virgen extra 1 l',
    precio: 699,
    categoria: 'despensa',
  },
  {
    codigo: '841000200008',
    nombre: 'Azúcar blanco 1 kg',
    precio: 135,
    categoria: 'despensa',
  },
  {
    codigo: '841000200009',
    nombre: 'Sal fina 1 kg',
    precio: 65,
    categoria: 'despensa',
  },
  {
    codigo: '841000200010',
    nombre: 'Galletas María 800 g',
    precio: 185,
    categoria: 'despensa',
  },
  {
    codigo: '841000200011',
    nombre: 'Yogur natural pack 4',
    precio: 140,
    categoria: 'despensa',
  },
  {
    codigo: '841000200012',
    nombre: 'Queso curado cuña 250 g',
    precio: 325,
    categoria: 'despensa',
  },
  {
    codigo: '841000200013',
    nombre: 'Agua mineral 1,5 l',
    precio: 60,
    categoria: 'despensa',
  },
  {
    codigo: '841000200014',
    nombre: 'Papel higiénico 12 rollos',
    precio: 395,
    categoria: 'despensa',
  },
  {
    codigo: '841000200015',
    nombre: 'Detergente líquido 1,5 l',
    precio: 550,
    categoria: 'despensa',
  },
  {
    codigo: '841000200016',
    nombre: 'Atún claro en aceite pack 3',
    precio: 275,
    categoria: 'despensa',
  },
  {
    codigo: '841000400001',
    nombre: 'Barra de pan rústica',
    precio: 85,
    categoria: 'panaderia',
  },
  {
    codigo: '841000400002',
    nombre: 'Baguette tradicional',
    precio: 95,
    categoria: 'panaderia',
  },
  {
    codigo: '841000400003',
    nombre: 'Croissant mantequilla',
    precio: 120,
    categoria: 'panaderia',
  },
  {
    codigo: '841000400004',
    nombre: 'Napolitana de chocolate',
    precio: 135,
    categoria: 'panaderia',
  },
  {
    codigo: '841000400005',
    nombre: 'Empanada gallega de atún',
    precio: 350,
    categoria: 'panaderia',
  },
  {
    codigo: '841000500001',
    nombre: 'Plátano de Canarias',
    precio: 199,
    categoria: 'fruta',
  },
  {
    codigo: '841000500002',
    nombre: 'Naranja de mesa 1 kg',
    precio: 175,
    categoria: 'fruta',
  },
  {
    codigo: '841000500003',
    nombre: 'Pera conferencia 1 kg',
    precio: 189,
    categoria: 'fruta',
  },
  {
    codigo: '841000500004',
    nombre: 'Fresón de temporada 500 g',
    precio: 290,
    categoria: 'fruta',
  },
  {
    codigo: '841000600001',
    nombre: 'Tomate de ensalada 1 kg',
    precio: 210,
    categoria: 'verdura',
  },
  {
    codigo: '841000600002',
    nombre: 'Lechuga romana',
    precio: 95,
    categoria: 'verdura',
  },
  {
    codigo: '841000600003',
    nombre: 'Zanahoria bolsa 1 kg',
    precio: 115,
    categoria: 'verdura',
  },
  {
    codigo: '841000600004',
    nombre: 'Calabacín 1 kg',
    precio: 160,
    categoria: 'verdura',
  },
  {
    codigo: '841000600005',
    nombre: 'Patata gallega bolsa 3 kg',
    precio: 380,
    categoria: 'verdura',
  },
  { codigo: '841000300001', nombre: 'Bolsa', precio: 10, categoria: 'bolsa' },
];

export const BOLSA: Producto = CATALOGO.find((p) => p.categoria === 'bolsa')!;

export type ResultadoConsulta =
  | { estado: 'encontrado'; producto: Producto }
  | { estado: 'no-encontrado' }
  | { estado: 'codigo-invalido' };

/**
 * Única puerta de entrada para buscar un producto por código.
 * Hoy lee el catálogo en memoria; mañana puede ser una llamada a la API Java
 * (entonces devolverá una promesa y la interfaz añadirá un estado de carga/fallo).
 */
export function consultarProducto(codigo: string): ResultadoConsulta {
  const limpio = codigo.trim();
  if (!/^\d+$/.test(limpio)) return { estado: 'codigo-invalido' };
  const producto = CATALOGO.find((p) => p.codigo === limpio);
  return producto ? { estado: 'encontrado', producto } : { estado: 'no-encontrado' };
}

/** Orden de cada pestaña del catálogo rápido. El catálogo general conserva su propio orden (lo usa el simulador de escáner). */
const ORDEN_PESTANA: Record<CategoriaCatalogo, readonly string[]> = {
  panaderia: [
    '841000400001',
    '841000400002',
    '841000400003',
    '841000400004',
    '841000100002',
    '841000400005',
  ],
  fruta: ['841000500001', '841000100003', '841000500002', '841000500003', '841000500004'],
  verdura: ['841000600001', '841000600002', '841000600003', '841000600004', '841000600005'],
};

export function productosDe(categoria: CategoriaCatalogo): readonly Producto[] {
  return ORDEN_PESTANA[categoria].map((codigo) => CATALOGO.find((p) => p.codigo === codigo)!);
}
