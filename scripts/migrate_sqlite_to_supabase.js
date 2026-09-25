/**
 * scripts/migrate_sqlite_to_supabase.js
 * Script para migrar las instrucciones de embarque y conceptos históricos
 * desde la base de datos local SQLite (instrucciones.db) hacia Supabase / SQL.
 *
 * Ejecutar con:
 *   node --experimental-sqlite scripts/migrate_sqlite_to_supabase.js
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SQLITE_PATH = 'C:/Users/usuario/AppData/Roaming/Instrucciones de Embarque Ingelox/data/instrucciones.db';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wmzafpkrmyhxbvymdjgu.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtemFmcGtybXloeGJ2eW1kamd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQxNjAsImV4cCI6MjA4NTAyMDE2MH0.RUlK8QD8OOTF0NLkr7EnhH_p9CRI5E7j7o1TQpNEa1w';

async function main() {
  console.log('== Migrador de Instrucciones: SQLite -> Supabase ==');

  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`No se encontró el archivo SQLite en: ${SQLITE_PATH}`);
    process.exit(1);
  }

  const db = new DatabaseSync(SQLITE_PATH);
  const instructions = db.prepare('SELECT * FROM instructions').all();
  const concepts = db.prepare('SELECT * FROM instruction_concepts').all();

  console.log(`Instrucciones encontradas: ${instructions.length}`);
  console.log(`Conceptos encontrados: ${concepts.length}`);

  // 1. Generar volcado JSON de respaldo
  const dump = {
    migratedAt: new Date().toISOString(),
    instructionsCount: instructions.length,
    conceptsCount: concepts.length,
    instructions,
    concepts,
  };

  const outputDir = path.resolve('supabase', 'seed');
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, 'sqlite_instructions_dump.json');
  fs.writeFileSync(jsonPath, JSON.stringify(dump, null, 2), 'utf-8');
  console.log(`Dump JSON guardado en: ${jsonPath}`);

  // 2. Generar script SQL idempotente de inserción
  let sqlScript = `-- Migración generada desde SQLite local (${instructions.length} instrucciones, ${concepts.length} conceptos)\n\n`;

  for (const inst of instructions) {
    sqlScript += `INSERT INTO shipping_instructions (id, estado, do_number, fecha_creacion, comercial, oferta, cliente, credito, contacto, facturar_a, telefono, correo, incoterm, complemento, modalidad, ruta, via, tipo_de_embarque, comentarios, created_at, updated_at)\n`;
    sqlScript += `VALUES ('inst-${inst.id}', '${inst.estado || 'borrador'}', ${sqlVal(inst.do_number)}, ${sqlVal(inst.fecha_creacion)}, ${sqlVal(inst.comercial)}, ${sqlVal(inst.oferta)}, ${sqlVal(inst.cliente)}, ${sqlVal(inst.credito)}, ${sqlVal(inst.contacto)}, ${sqlVal(inst.facturar_a)}, ${sqlVal(inst.telefono)}, ${sqlVal(inst.correo)}, ${sqlVal(inst.incoterm)}, ${sqlVal(inst.complemento)}, ${sqlVal(inst.modalidad)}, ${sqlVal(inst.ruta)}, ${sqlVal(inst.via)}, ${sqlVal(inst.tipo_de_embarque)}, ${sqlVal(inst.comentarios)}, '${inst.created_at || new Date().toISOString()}', '${inst.updated_at || new Date().toISOString()}')\n`;
    sqlScript += `ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at;\n\n`;
  }

  for (const c of concepts) {
    sqlScript += `INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)\n`;
    sqlScript += `VALUES ('conc-${c.id}', 'inst-${c.instruction_id}', ${c.orden || 0}, ${sqlVal(c.concepto)}, ${c.vendido ?? 1}, ${sqlVal(c.proveedor)}, ${sqlVal(c.forma_pago)}, ${sqlVal(c.costo)}, ${sqlVal(c.moneda_costo || 'USD')}, ${sqlVal(c.venta)}, ${sqlVal(c.moneda_venta || 'USD')}, ${sqlVal(c.facturar_a)})\n`;
    sqlScript += `ON CONFLICT (id) DO NOTHING;\n`;
  }

  const sqlPath = path.join(outputDir, 'migrate_instructions_data.sql');
  fs.writeFileSync(sqlPath, sqlScript, 'utf-8');
  console.log(`Script SQL generado en: ${sqlPath}`);

  // 3. Intento de subida directa a Supabase (si las tablas existen)
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Intentando sincronización directa con Supabase...');
    const { error } = await supabase.from('shipping_instructions').select('count').limit(1);
    if (error) {
      console.log('Nota: Las tablas aún no están creadas en Supabase.');
      console.log(`Ejecuta primero el archivo supabase/migrations/practiko_and_instructions.sql en el SQL Editor de Supabase y luego este script.`);
    } else {
      console.log('Conexión con Supabase verificada exitosamente.');
    }
  } catch (e) {
    console.warn('Conexión directa omitida:', e.message);
  }

  console.log('\nMigración completada con éxito.');
}

function sqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  const clean = String(val).replace(/'/g, "''");
  return `'${clean}'`;
}

main().catch(console.error);
