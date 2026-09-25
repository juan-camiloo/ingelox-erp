-- Migración generada desde SQLite local (3 instrucciones, 33 conceptos)

INSERT INTO shipping_instructions (id, estado, do_number, fecha_creacion, comercial, oferta, cliente, credito, contacto, facturar_a, telefono, correo, incoterm, complemento, modalidad, ruta, via, tipo_de_embarque, comentarios, created_at, updated_at)
VALUES ('inst-1', 'borrador', 'DO', '2026-08-11', 'COMERCIAL', 'OFERTA', 'CLIENTE', 'NO', 'CONTACTO', '', 'TELEFONO', 'CORREO', 'DAP', 'COMPLEMENTO', 'LTL / LTL', 'RUTA', 'MARITIMO', 'IMPORTACION', 'OBSERVACIÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓN', '2026-08-11 16:53:02', '2026-09-08 22:11:43')
ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at;

INSERT INTO shipping_instructions (id, estado, do_number, fecha_creacion, comercial, oferta, cliente, credito, contacto, facturar_a, telefono, correo, incoterm, complemento, modalidad, ruta, via, tipo_de_embarque, comentarios, created_at, updated_at)
VALUES ('inst-2', 'borrador', 'kflanf', '2026-08-13', 'asldkasldkn', 'alkdsnsad', '', '', '', '', '', '', '', '', '', '', '', '', '', '2026-08-13 14:56:33', '2026-09-08 18:09:01')
ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at;

INSERT INTO shipping_instructions (id, estado, do_number, fecha_creacion, comercial, oferta, cliente, credito, contacto, facturar_a, telefono, correo, incoterm, complemento, modalidad, ruta, via, tipo_de_embarque, comentarios, created_at, updated_at)
VALUES ('inst-4', 'borrador', 'X26666', '2026-09-16', 'DANIEL ', 'CS-2609-7', 'ALBAUGH', 'SI-30', 'EDWIN PULIDO', '', '3192154533', '573192154533', 'CFR', 'BOG-GDL', 'Avión de Pasajeros', 'BOG-PTY-GDL', 'AEREO', 'EXPORTACION', 'ADUANA LA HACE DIRECTAMENTE EL CLIENTE CON ASERCOL', '2026-09-16 15:35:08', '2026-09-23 20:46:47')
ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at;

INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3404', 'inst-1', 0, 'Flete', 1, 'Maersk', 'CONTADO', '300', 'USD', '400', 'USD', 'Tejar de Pescadero')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3405', 'inst-1', 1, 'Gastos en destino', 1, 'Maersk', 'CREDITO', '100', 'USD', '200', 'USD', 'Net')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3406', 'inst-1', 2, 's', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3407', 'inst-1', 3, 'sss', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3408', 'inst-1', 4, 's', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3409', 'inst-1', 5, 's', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3410', 'inst-1', 6, 's', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3411', 'inst-1', 7, 's', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3412', 'inst-1', 8, 's', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3413', 'inst-1', 9, 's10', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3414', 'inst-1', 10, 's11', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3415', 'inst-1', 11, 's12', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3416', 'inst-1', 12, 's13', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3417', 'inst-1', 13, 's4', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3418', 'inst-1', 14, 's5', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3419', 'inst-1', 15, 'v6', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3420', 'inst-1', 16, 's7', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3421', 'inst-1', 17, 's8', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3422', 'inst-1', 18, 's9', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3423', 'inst-1', 19, 's0', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3424', 'inst-1', 20, 's1', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3425', 'inst-1', 21, 's2', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3426', 'inst-1', 22, 's3', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3427', 'inst-1', 23, 'GEneración de algo', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-3428', 'inst-1', 24, 's5', 1, '', '', '', 'USD', '', 'USD', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4045', 'inst-4', 0, 'TRANSPORTE TERRESTRE URBANO ', 1, 'DANIEL', 'CREDITO', '20', 'USD', '75', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4046', 'inst-4', 1, 'FLETE AÉREO INTERNACIONAL', 1, 'AEROMEXICO', 'CONTADO', '80', 'USD', '390', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4047', 'inst-4', 2, 'MANEJO AEROLINEA DUE CARRIER', 1, 'AEROMEXICO', 'CONTADO', '60', 'USD', '60', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4048', 'inst-4', 3, 'ELABORACION FORMULARIO DE MERCANCIAS PELIGROSAS', 1, 'PROPIO', 'CONTADO', '0', 'USD', '75', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4049', 'inst-4', 4, 'ELABORACION DE GUIA AEREA', 1, 'PROPIO', 'CONTADO', '0', 'USD', '50', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4050', 'inst-4', 5, 'INSPECCIÓN DE SEGURIDAD ', 1, 'AGUAPANELO', 'CONTADO', '10', 'USD', '120', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4051', 'inst-4', 6, 'RECARGO AEROLINEA POR CARGA PELIGROSA', 1, 'AEROMEXICO', 'CONTADO', '75', 'USD', '150', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
INSERT INTO shipping_instruction_concepts (id, instruction_id, orden, concepto, vendido, proveedor, forma_pago, costo, moneda_costo, venta, moneda_venta, facturar_a)
VALUES ('conc-4052', 'inst-4', 7, 'MANEJO INGELOX', 1, 'PROPIO', 'CONTADO', '0', 'USD', '75', 'USD', 'ALBAUGH')
ON CONFLICT (id) DO NOTHING;
